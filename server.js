const fs = require("fs");
const { execSync, spawn } = require("child_process");
const http = require("http");
const DIRECTORY = (() => {
  let dir = fs.readFileSync("config","utf8").split("\n")[0];
  dir = (dir[dir.length-1] == "/") ? dir:dir+"/";
  return dir;
})();
//API queries to handle
let commands = [
  {query:"getTree",func:"serveBranch"},
  {query:"makeTree",func:"generateTrees"},
  {query:"playFile",func:"prepareAndPlay"},
  {query:"playRandom",func:"suffleRecursiveDir"},
  {query:"playAllRandom",func:"playAllRandom"},
  {query:"getCurrentSong",func:"serveLog"},
  {query:"stop",func:"killPlayer"},
  {query:"halt",func:"killJukeberry"}
];
//Files to be served
let servedFiles = [
  {pathname:"/",mime:"text/html"},
  {pathname:"/index.html",mime:"text/html"},
  {pathname:"/main.js",mime:"application/javascript"},
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
let getFile = (path,bin=false) => {
  return new Promise((resolve,reject) => {
    fs.readFile(path,(bin)?null:"utf8",(error,data) => {
      if (error) { reject(error); }
      resolve(data);
    });
  });
}
let exec = (command) => {
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
}
let failure = (response,code,error) => {
  response.writeHead(code);
  response.write(error);
};
let parseLog = async (log) => {
  let ret = false;
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
//Main object
let Tree = {
  generateTrees: (response) => {
    response.writeHead(200);
    let files = [];
    files.push({
      name:"tree.json",
      data:execSync("tree -Jif --noreport", {cwd:DIRECTORY})
    });
    files.push({
      name:"liste",
      data:execSync("tree -Fif --noreport | grep -v '/$'", {cwd:DIRECTORY,encoding:"utf8"})
        .replace(/\*\n/g,"\n")
        .split("\n")
        .map(e => e.replace("./",DIRECTORY))
        .join("\n")
    });
    for (i of files) {
      fs.writeFileSync(i.name,i.data);
    }
  },
  getTree: async () => {
    try {
      let tree = await getFile("./tree.json");
      tree = JSON.parse(tree);
      return tree;
    } catch {
      throw {code:404,text:"No tree :(\nTree couldn't be found.\nIn order to generate tree:\n\n\tcd "+DIRECTORY+"\n\ttree -Jif --noreport > ./tree.json\n\ttree -Fif --noreport | grep -v '/$' > ./liste"};
    }
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
  serveBranch: async (response,path) => {
    try {
      let tree = await Tree.getTree();
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
    } catch(e) {
      throw e;
    }
  },
  killPlayer: () => {
    try {
      execSync("killall -s SIGKILL mplayer");
    } catch {
      console.log("nothing to stop");
    }
  },
  killJukeberry: async (response) => {
    response.writeHead(200);
    response.end("Goodbye");
    await Tree.killPlayer();
    try {
      execSync("sudo umount "+DIRECTORY);
    } catch {
      console.log("couldn't unmount device"); 
    }
    await wait(1000);
    execSync("sudo halt");
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
  suffleRecursiveDir: async (response,path) => {
    path = path.replace("./",DIRECTORY);
    let playlist = await getFile("./liste");
    playlist = playlist.split("\n");
    playlist = playlist.filter(e => e.indexOf(path) == 0);
    playlist = playlist.join("\n");
    fs.writeFileSync("playlist",playlist);
    Tree.play("./playlist",true);
  },
  playAllRandom: async (response,path) => {
    Tree.play("./liste",true);
  },
  serveLog: (response) => {
    response.writeHead(200, {"Content-Type":"application/json"});
    let currentLog = fs.readFileSync("current.log","utf8");
    currentLog = JSON.parse(currentLog);
    let log = {};
    for (let v of Object.keys(currentLog)) {
      if (["raw","clip_info"].indexOf(v) < 0) {
        log[v] = currentLog[v];
      }
    }
    response.write(JSON.stringify(log));
  }
}
//Exposed server
let server = http.createServer(async function(req, res) {
  let page = new URL("http://dummy.com"+req.url);
  let served = servedFiles.filter(e => e.pathname == page.pathname)
  if (served.length > 0) {
    served = served[0];
    let type = served.mime;
    res.writeHead(200, {"Content-Type": type});
    served = (page.pathname == "/") ? "/index.html":page.pathname;
    served = served.slice(1);
    served = await getFile(served,(type.indexOf("image") >= 0));
    res.write(served);
  } else if (page.pathname == "/api") {
    try {
      let cmd = commands
        .find(q => q.query == page.searchParams.get("action"))
        .func;
      await Tree[cmd](res,page.searchParams.get("options"));
    } catch(e) {
      console.log(e);
      failure(res,e.code,e.text);
    }
  } else {
    failure(res,404,"Not found :(");
  }
  res.end();
});
server.listen(3000);
