const fs = require("fs");
const { exec, execSync, spawn } = require("child_process");
const http = require("http");
const formidable = require("formidable");
const YouTube = require("youtube-node");
const TreeMaker = require("./tree.js").TreeMaker;
const DIRECTORY = (() => {
  let dir = fs.readFileSync("config","utf8").split("\n")[0];
  dir = (dir[dir.length-1] == "/") ? dir:dir+"/";
  return dir;
})();
const LOG = true;
let globalList;
const youTube = new YouTube();
youTube.setKey(fs.readFileSync("youtube-api-key","utf8").split("\n")[0]);
//API queries to handle
let commands = [
  {query:"ytp",func:"youtubePlay"},
  {query:"yts",func:"youtubeSearch"},
  {query:"getTree",func:"serveBranch"},
  {query:"getRadios",func:"serveStreams"},
  {query:"makeTree",func:"generateTrees"},
  {query:"playFile",func:"prepareAndPlay"},
  {query:"playRandom",func:"suffleRecursiveDir"},
  {query:"playAllRandom",func:"playAllRandom"},
  {query:"playLive",func:"stream"},
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
let streams = [
  {name:"Zinzine",url:"http://91.121.65.189:8000/zinzine-aix"},
  {name:"Grenouille",url:"http://live.radiogrenouille.com/live"},
  {name:"France Info",url:"http://icecast.radiofrance.fr/franceinfo-midfi.mp3"},
  {name:"FIP",url:"http://icecast.radiofrance.fr/fip-midfi.mp3"},
  {name:"France Inter",url:"http://icecast.radiofrance.fr/franceinter-midfi.mp3"},
  {name:"France Culture",url:"http://icecast.radiofrance.fr/franceculture-midfi.mp3"}
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
let spawnAndDetach = (command) => {
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
  subprocess.stderr.on("data", (e) => {
    //console.error("player error "+e);
  });
  subprocess.on("close", (code) => {
    console.log("process exited with code "+code); 
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
let makeGlobalLists = (update=false) => {
  let files = ["tree.json","liste"];
  let output = {};
  files.map(e => {
    output[e.slice(0,4)] = (update)
      ? updateGlobalList(e,update.find(f => f.name == e).data)
      : updateGlobalList(e);
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
  youtubeSearch: async (response,searchString) => {
    logger("log","Searching youtube for: "+searchString);
    return new Promise((resolve,reject) => {
      youTube.search(searchString, 15, (error, result) => {
      if (error) {
        logger("error",error);
        reject(error);
      } else {
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(result.items.map(e => ({
          id:e.id.videoId,
          channel:e.snippet.channelTitle,
          title:e.snippet.title,
          description:e.snippet.description
        })).filter(e => typeof e.id !== "undefined")));
        resolve(true);
      }
    })
    });
  },
  youtubePlay: async (response,youtubeId) => {
    await Tree.killPlayer();
    await wait(1000);
    logger("log","Playing youtube video ID #"+youtubeId);
    let ytplay = (id) => {
      return new Promise((resolve, reject) => {
        exec("ytdl --print-url https://www.youtube.com/watch?v="
          +id,(error, stdout, stderr) => {
          if (error) { failure(response,404,"error fetching video") }
          logger("error",stderr);
          resolve(stdout.split("\n")[0]);
        });
    })};
    let url = await ytplay(youtubeId);
    spawnAndDetach("mplayer -novideo -msglevel all=-1 "+url);
  },
  generateTrees: (response,data=false) => {
    let files = (data) ? data : [];
    if (!data) {
      let tree = TreeMaker(DIRECTORY);
      files.push({
        name:"tree.json",
        data:JSON.stringify(tree.tree)
      });
      logger("log","json tree successfully built");
      files.push({
        name:"liste",
        data:tree.list.map(e => e.replace("./",DIRECTORY))
          .join("\n")
      });
      logger("log","raw list successfully built");
    }
    for (i of files) {
      fs.writeFileSync(i.name,i.data);
    }
    globalList = makeGlobalLists(files);
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
  getPath: (tree,path,output="") => {
    let localPath = path.split("/");
    localPath = localPath.slice(0,output.split("contents").length);
    localPath = localPath.join("/");
    let newTree = tree.find(e => e.name==localPath);
    let index = tree.indexOf(newTree);
    output += "["+index+"].contents";
    if (output.split("contents").length == path.split("/").length+1) {
      return output;
    } else {
      return Tree.getPath(newTree.contents,path,output);
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
  serveStreams: (response) => {
    response.writeHead(200, {"Content-Type": "application/json"});
    response.write(JSON.stringify(streams.map(e => e.name)));
  },
/*  importFiles: (branch,list) => {
    list = [...globalList.list,...list];
    let tree = Tree.getTree();
    let jsonpath = "tree";
//console.log(branch);
    let path = branch[0].name.split("/");
    path.pop();
    jsonpath += Tree.getPath(tree,path.join("/"));
    jsonpath += ".push("+JSON.stringify(...branch)+")";
    eval(jsonpath);
    Tree.generateTrees(false,[
      {name:"tree.json",data:JSON.stringify(tree)},
      {name:"liste",data:list.join("\n")}
    ]);
    return path;
  },*/
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
    execSync("sudo shutdown now");
  },
  stream: async (response,stream_name) => {
    let radio = streams.find(e => e.name == stream_name);
    if (typeof radio !== "undefined") {
      await Tree.killPlayer();
      await wait(1000);
      spawnAndDetach("mplayer -msglevel all=4 "+radio.url);
    }
  },
  play: async (path,random=false) => {
    random = (random) ? "-shuffle ":"";
    await Tree.killPlayer();
    await wait(1000);
    spawnAndDetach("mplayer -msglevel all=4 "+random+"-playlist "+path);
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
      /*form.on("progress", function(bytesReceived, bytesExpected) {
        logger("log","upload processing: "+bytesReceived+" / "+bytesExpected);
      });
      form.on("fileBegin", function(name, file) {
        logger("log","begin file upload: "+name+" "+file);
      });
      form.on("file", function(name, file) {
        logger("log","file upload end: "+name+" "+file);
      });*/
      form.uploadDir = DIRECTORY;
      form.keepExtensions = true;
      form.multiples = true;
      form.parse(req, (err, fields, files) => {
        let destination = fields.destination;
        destination += (destination[destination.length-1] == "/")
          ? ""
          : "/";
        let fsdestination = destination.replace("./",DIRECTORY);
        if (!fs.existsSync(fsdestination)) {
          fs.mkdirSync(fsdestination);
        }for (let file of Object.values(files)) {
          logger("log","Uploading file: "+fsdestination+file.name);
          fs.rename(file.path, fsdestination+file.name, (err) => {  });
        }
        Tree.generateTrees();
      });
    } else {
      try {
        let cmd = commands
          .find(q => q.query == page.searchParams.get("action"))
          .func;
        await Tree[cmd](res,page.searchParams.get("options"));
      } catch(e) {
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
    Tree.generateTrees(false);
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
