const fs = require("fs");
const { execSync, spawn } = require("child_process");
const http = require("http");
const formidable = require("formidable");
const DIRECTORY = (() => {
  let dir = fs.readFileSync("config","utf8").split("\n")[0];
  dir = (dir[dir.length-1] == "/") ? dir:dir+"/";
  return dir;
})();
const LOG = true;
let globalList;
//API queries to handle
let commands = [
  {query:"getTree",func:"serveBranch"},
  {query:"makeTree",func:"generateTrees"},
  {query:"playFile",func:"prepareAndPlay"},
  {query:"playRandom",func:"suffleRecursiveDir"},
  {query:"playAllRandom",func:"playAllRandom"},
  {query:"getCurrentSong",func:"serveLog"},
  {query:"upload",func:"importFiles"},
  {query:"search",func:"search"},
  {query:"stop",func:"killPlayer"},
  {query:"halt",func:"killJukeberry"}
];
//Files to be served
let servedFiles = [
  {pathname:"/",mime:"text/html"},
  {pathname:"/index.html",mime:"text/html"},
  {pathname:"/main.js",mime:"application/javascript"},
  {pathname:"/utils.js",mime:"application/javascript"},
  {pathname:"/icons/32.png",mime:"image/png"},
  {pathname:"/icons/192.png",mime:"image/png"},
  {pathname:"/icons/512.png",mime:"image/png"},
  {pathname:"/style.css",mime:"text/css"}
];
//Utilities functions
let wait = (t) => {
  return new Promise((resolve,reject) => {
    setTimeout(() => { resolve(); },t)
  })
};
let normalize = (str) => { return str
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/_/g," ")
  .toLowerCase();
};
let getFile = (path,bin=false) => {
  return new Promise((resolve,reject) => {
    fs.readFile(path,(bin)?null:"utf8",(error,data) => {
      if (error) { reject(error); }
      resolve(data);
    });
  });
};
let logger = (level,message) => {
  if (LOG) {
    console[level]((new Date()).toISOString()+" | "+message);
  }
};
let failure = (response,code,error) => {
  logger("error",code+" "+error);
  response.writeHead(code);
  response.write(error);
};
let exec = (command) => {
  logger("info","detached subprocess: "+command);
  command = command.split(" ");
  let subprocess = spawn(command[0], command.slice(1), {
    detached: true,
    stdio: [ "ignore" ]
  });
  subprocess.stdout.setEncoding("utf8");
  subprocess.stdout.on("data", (e) => {
    parseLog(e);
  });
  subprocess.unref();
};
let parseLog = async (log) => {
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
}
let updateGlobalList = (file,update=false) => {
  logger("log","making globalList");
  list = (update) ? update:fs.readFileSync(file,"utf8");
  list = (file == "liste") ? list.split("\n"):JSON.parse(list);
  return list;
}
let makeGlobalLists = () => {
  let files = ["tree.json","liste"];
  let output = {};
  files.map(e => {
    output[e.slice(0,4)] = updateGlobalList(e);
  });
  return output;
}
let search = (str) => {
  let list = globalList.list;
  str = normalize(str);
  output = [];
  return list.filter(e => normalize(e).indexOf(str) >= 0)
    .map(e => e.replace(DIRECTORY,"./"))
    .filter(e => normalize(e).indexOf(str) >= 0)
    .map(e => {
      e = {name:e,type:"file"};
      let norm = normalize(e.name).split("/");
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
//Main object
let Tree = {
  generateTrees: () => {
    let files = [];
    files.push({
      name:"tree.json",
      data:execSync("tree -Jif --noreport", {cwd:DIRECTORY})
    });
    logger("log","json tree successfully built");
    files.push({
      name:"liste",
      data:execSync("tree -Fif --noreport | grep -v '/$'", {cwd:DIRECTORY,encoding:"utf8"})
        .replace(/\*\n/g,"\n")
        .split("\n")
        .filter(e => ((e != "") && (e != ".")))
        .map(e => e.replace("./",DIRECTORY))
        .join("\n")
    });
    logger("log","raw list successfully built");
    for (i of files) {
      fs.writeFileSync(i.name,i.data);
    }
    globalList = makeGlobalLists();
    logger("log","tree files written");
  },
  getTree: () => {
    return globalList.tree;
  },
  getParentFolder: (path) => {
    path = path.split("/");
    if (path.length > 1) {
      path.pop();
      path = path.join("/");
      return path;
    } else {
      return false;
    }
  },
  getBranch: (tree,path,backpath="") => {
    path = (path[path.length-1] == "/") ? path.slice(0,-1):path;
    let firstPath = path;
    path = path.split("/");
    tree = tree.find(e => e.name == backpath+path[0]).contents;
    if (typeof tree === "undefined") {
      throw new Error("no content found for query");
    }
    if (path.length > 1) {
      path.shift();
      path = path.join("/");
      backpath += firstPath.slice(0,firstPath.length-path.length)
      return Tree.getBranch(tree,path,backpath);
    } else {
      return tree;
    }
  },
  cleanBranch: (tree) => {
    return tree.map(e => ({type:e.type,name:e.name}));
  },
  serveBranch: (response,path) => {
    let tree = Tree.getTree();
    try {
      tree = Tree.getBranch(tree,path);
      tree = Tree.cleanBranch(tree);
      response.writeHead(200, {"Content-Type": "application/json"});
      let parentpath = Tree.getParentFolder(path);
      if (parentpath) {
        tree.unshift({type:"parentdir",name:parentpath});
      }
      response.write(JSON.stringify(tree));
    } catch(e) {
      throw {code:400,text:"Bad request :\n"+e};
    }
  },
  importFiles: (response) => {
    
  },
  search: (response,str) => {
    response.writeHead(200, {"Content-Type": "application/json"});
    response.write(JSON.stringify(search(str)));
  },
  killPlayer: () => {
    try {
      execSync("killall -s SIGKILL mplayer");
    } catch {
      logger("log","killall: nothing to stop");
    }
  },
  killJukeberry: async (response) => {
    response.writeHead(200);
    response.end("Goodbye");
    await Tree.killPlayer();
    /*try { //this should be handled by OS on shutdown
      execSync("sudo umount "+DIRECTORY);
    } catch {
      console.log("couldn't unmount device"); 
    }*/
    logger("warn","shutdown triggered");
    await wait(1000);
    execSync("sudo shutdown -h now");
  },
  play: async (path,random=false) => {
    random = (random) ? "-shuffle ":"";
    await Tree.killPlayer();
    await wait(1000);
    exec("mplayer -msglevel all=4 "+random+"-playlist "+path);
  },
  generatePlaylist: async (path) => { 
    try {
      let tree = await Tree.getTree();
      let branch;
      let playlist = "";
      try {
        branch = Tree.getBranch(tree,path);
      } catch {
        branch = Tree.getBranch(tree,Tree.getParentFolder(path));
        path = branch.indexOf(branch.find(e => (e.name == path)));
        branch = branch.filter((e,i) => (i >= path));
      }
      branch.filter(e => e.type == "file")
        .map(e => playlist += e.name.replace("./",DIRECTORY)+"\n");
      fs.writeFileSync("playlist",playlist);
    } catch(e) {
      throw e;
    }
  },
  prepareAndPlay: async (response,path) => {
    await Tree.generatePlaylist(path);
    Tree.play("./playlist");  
  },
  suffleAndPlay: async (response,path) => {
    await Tree.generatePlaylist(path);
    Tree.play("./playlist",true);  
  },
  suffleRecursiveDir: (response,path) => {
    path = path.replace("./",DIRECTORY);
    let playlist = globalList.list;
    playlist = playlist.filter(e => e.indexOf(path) == 0);
    playlist = playlist.join("\n");
    fs.writeFileSync("playlist",playlist);
    Tree.play("./playlist",true);
  },
  playAllRandom: (response,path) => {
    Tree.play("./liste",true);
  },
  serveLog: (response) => {
    response.writeHead(200, {"Content-Type":"application/json"});
    try {
      let currentLog = fs.readFileSync("current.log","utf8");
      currentLog = JSON.parse(currentLog);
      let log = {};
      for (let v of Object.keys(currentLog)) {
        if (["raw","clip_info"].indexOf(v) < 0) {
          log[v] = currentLog[v];
        }
      }
      response.write(JSON.stringify(log));
    } catch {
      failure(response,404,"no current log");
    }
  }
}
//Exposed server
let server = http.createServer(async function(req, res) {
  let page = new URL("http://dummy.com"+req.url);
  let served = servedFiles.filter(e => e.pathname == page.pathname)
  if (served.length > 0) {
    served = served[0];
    logger("log","File served:\t["+served.mime+"]\t"+served.pathname);
    let type = served.mime;
    res.writeHead(200, {"Content-Type": type});
    served = (page.pathname == "/") ? "/index.html":page.pathname;
    served = served.slice(1);
    served = await getFile(served,(type.indexOf("image") >= 0));
    res.write(served);
  } else if (page.pathname == "/api") {
    if (req.method == "POST") {
      let form = new formidable.IncomingForm();
      form.uploadDir = DIRECTORY;
      form.keepExtensions = true;
      form.multiples = true;
      form.parse(req, (err, fields, files) => {
        destination = fields.destination;
        destination += (destination[destination.length-1] == "/")
          ? ""
          : "/";
        destination = destination.replace("./",DIRECTORY);
        for (let file of Object.values(files)) {
          logger("log","Uploaded file: destination+file.name");
          fs.rename(file.path, destination+file.name, (err) => {});
        }
      });
    } else {
      try {
        let cmd = commands
          .find(q => q.query == page.searchParams.get("action"))
          .func;
        await Tree[cmd](res,page.searchParams.get("options"));
      } catch(e) {
        console.log(e);
        failure(res,e.code,e.text);
      }
    }
  } else {
    failure(res,404,"Not found :(");
  }
  res.end();
});
let startServer = async () => {
  try {
    globalList = makeGlobalLists();
  } catch {
    Tree.generateTrees();
  }
  logger("log","starting server...");
  try {
    server.listen(3000);
    logger("log","server listening");
  } catch (e) {
    logger("error",e);
    await wait(5000);
    startServer();
  }
}
startServer();
