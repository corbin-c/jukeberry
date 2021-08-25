const fs = require("fs");
const { spawn, execSync } = require("child_process");
module.exports = class {
  constructor(parent) {
    this.parent = parent;
  }
  wait(t) {
    return new Promise((resolve,reject) => {
      setTimeout(() => { resolve(); },t)
    })
  }
  normalize(str) { return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g," ")
    .toLowerCase();
  }
  getFile(path,bin=false) {
    return new Promise((resolve,reject) => {
      fs.readFile(path,(bin)?null:"utf8",(error,data) => {
        if (error) { reject(error); }
        resolve(data);
      });
    });
  }
  spawnAndDetach(command) {
    console.info("detached subprocess: "+command);
    fs.writeFileSync("raw.log","");
    command = command.split(" ");
    let subprocess = spawn(command[0], command.slice(1), {
      detached: true,
      stdio: [ "ignore" ]
    });
    subprocess.stdout.setEncoding("utf8");
    subprocess.stdout.on("data", (e) => {
      if (e.indexOf("Playing") >= 0) {
        fs.writeFileSync("raw.log","");
        execSync(`echo "get_file_name
get_time_length
get_meta_title
get_meta_artist
get_meta_album
get_meta_year
get_meta_track
get_meta_genre" >> ./mplayer_master`);
      }
      try {
        fs.writeFileSync("raw.log",fs.readFileSync("raw.log","utf8")+"\n"+e);
      } catch(error) {
        console.warn(error.message);
        fs.writeFileSync("raw.log",e);
      }
      this.parent.parseLog();
    });
    subprocess.stderr.on("data", (e) => {
      //console.error("player error "+e);
    });       
    subprocess.on("close", (code) => {
      console.log("process exited with code "+code);
      this.parent.status = {
        playing: false
      }
    });
    subprocess.unref();
  }
  updateGlobalList(file,update=false) {
    if (!update) {
      console.info("Trying to read from file",file);
    }
    let list = (update) ? update:fs.readFileSync(file,"utf8");
    list = (file.indexOf("_list") > 0) ? list.split("\n"):JSON.parse(list);
    return list;
  }
  makeGlobalLists(update=false) {
    let output = {};
    console.log("acquiring directories descriptions...");
    this.parent.config.files.map(e => {
      output[e] = (update)
        ? this.updateGlobalList(e,update.find(f => f.name == e).data)
        : this.updateGlobalList(e);
    });
    return output;
  }
  search(str,type,list) {
    str = this.normalize(str);
    let output = [];
    return list.filter(e => this.normalize(e).indexOf(str) >= 0)
      .map(e => e.replace(this.parent.config.directories[type+"Directory"],"./"))
      .filter(e => this.normalize(e).indexOf(str) >= 0)
      .map(e => {
        e = {name:e,type:"file"};
        let norm = this.normalize(e.name).split("/");
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
