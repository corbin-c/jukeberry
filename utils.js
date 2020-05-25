const fs = require("fs");
const { spawn } = require("child_process");
let CONFIG = {};
module.exports = {
  setConf: (conf) => {
    CONFIG = conf;
  },
  wait: (t) => {
    return new Promise((resolve,reject) => {
      setTimeout(() => { resolve(); },t)
    })
  },
  normalize: (str) => { return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g," ")
    .toLowerCase();
  },
  getFile: (path,bin=false) => {
    return new Promise((resolve,reject) => {
      fs.readFile(path,(bin)?null:"utf8",(error,data) => {
        if (error) { reject(error); }
        resolve(data);
      });
    });
  },
  parseLog: async (log) => {
    let ret = false;
    if (log.indexOf("Playing") >= 0) {
      fs.writeFileSync("raw.log","");
    }
    log = fs.readFileSync("raw.log","utf8")+log;
    fs.writeFileSync("raw.log",log);
    log = {raw:log};
    if (log.raw.indexOf("Playing") >= 0) {
      log.filename = log.raw.split("\n");
      log.filename = log.filename.filter(e => e != "")[0].slice(0,-1);
      log.filename = log.filename.split("/");
      log.filename = log.filename.pop();
      log.filename = log.filename.split(".");
      log.filename.pop();
      log.filename = log.filename.join(" ");
      ret = true;
      currentLog = log;
    } 
    if (log.raw.indexOf("Clip info") >= 0) {
      log.clip_info = log.raw.split("Clip info:\n");
      log.clip_info = log.clip_info.pop();
      log.clip_info = log.clip_info.split("Load subtitles in")[0];
      log.clip_info = log.clip_info.split("\n");
      log.clip_info.filter(e => e != "").map(e => {
        e = e.split(": ")
        e[1] = e[1].replace(/\s+/g," ");
        e[0] = e[0].slice(1).toLowerCase();
        log[e[0]] = e[1];
      });
      ret = true;
    }
    if (ret) {
      log = JSON.stringify(log);
      fs.writeFileSync("current.log",log);
    }
  },
  spawnAndDetach: (command) => {
    console.info("detached subprocess: "+command);
    command = command.split(" ");
    let subprocess = spawn(command[0], command.slice(1), {
      detached: true,
      stdio: [ "ignore" ]
    });
    subprocess.stdout.setEncoding("utf8");
    subprocess.stdout.on("data", (e) => {
      module.exports.parseLog(e);
    });
    subprocess.stderr.on("data", (e) => {
      //console.error("player error "+e);
    });
    subprocess.on("close", (code) => {
      console.log("process exited with code "+code); 
    });
    subprocess.unref();
  },
  updateGlobalList: (file,update=false) => {
    if (!update) {
      console.info("Trying to read from file",file);
    }
    list = (update) ? update:fs.readFileSync(file,"utf8");
    list = (file.indexOf("_list") > 0) ? list.split("\n"):JSON.parse(list);
    return list;
  },
  makeGlobalLists: (update=false) => {
    let output = {};
    console.log("acquiring directories descriptions...");
    CONFIG.files.map(e => {
      output[e] = (update)
        ? module.exports.updateGlobalList(e,update.find(f => f.name == e).data)
        : module.exports.updateGlobalList(e);
    });
    return output;
  },
  search: (str,list) => {
    str = module.exports.normalize(str);
    output = [];
    return list.filter(e => module.exports.normalize(e).indexOf(str) >= 0)
      .map(e => e.replace(CONFIG.musicDirectory,"./"))
      .filter(e => module.exports.normalize(e).indexOf(str) >= 0)
      .map(e => {
        e = {name:e,type:"file"};
        let norm = module.exports.normalize(e.name).split("/");
        let rank = norm.indexOf(norm.find(f => (f.indexOf(str) >= 0)));
        if (rank != norm.length-1) {
          e.type = "directory";
          e.name = e.name.split("/").slice(0,rank+1).join("/");
        }
        return e;
      })
      .filter((e,i,a) =>
        (a.lastIndexOf([...a].reverse().find(f => f.name == e.name)) == i))
      .sort(() => Math.random() - 0.5)
      .slice(0,20);
  }
}
