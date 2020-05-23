const fs = require("fs");
const { exec, execSync, spawn } = require("child_process");
const http = require("http");
const formidable = require("formidable");
const YouTube = require("youtube-node");
const minimalServer = require("@corbin-c/minimal-server");
const TreeMaker = require("@corbin-c/minimal-server/tree.js");
const CONFIG = (() => {
  let conf = fs.readFileSync("config.json","utf8");
  conf = JSON.parse(conf);
  conf.musicDirectory = (conf.musicDirectory[conf.musicDirectory.length-1] == "/")
    ? conf.musicDirectory:conf.musicDirectory+"/";
  if (typeof conf["youtube-api-key"] !== "undefined") {
    conf.youtube = new YouTube();
    conf.youtube.setKey(conf["youtube-api-key"]);
  } else {
    conf.youtube = false;
  }
  conf.log = (typeof conf.log === "boolean") ? conf.log : false;
  return conf;
})();
require("./logger.js")(CONFIG.log);
const utils = require("./utils.js")
utils.setConf(CONFIG);

let globalList;
//API queries to handle
let routes = [
  {
    path: "/youtube/search",
    hdl: async (req,res) => {
      if (CONFIG.youtube !== false) {
        let searchString = req.page.searchParams.get("options");
        console.log("Searching youtube for: "+searchString);
        CONFIG.youtube.search(searchString, 15, (error, result) => {
          if (error) {
            server.failure(res,500,error);
          } else {
            server.json(result.items.map(e => ({
              id:e.id.videoId,
              channel:e.snippet.channelTitle,
              title:e.snippet.title,
              description:e.snippet.description
            })).filter(e => typeof e.id !== "undefined"))(req,res);
          }
        })
      } else {
        server.failure(res,500,"no youtube API key provided");
      }
    }
  },
  {
    path: "/youtube/play",
    hdl: async (req,res) => {
      if (CONFIG.youtube !== false) {
        await media.stop();
        await utils.wait(1000);
        let youtubeId = req.page.searchParams.get("options");
        console.log("Playing youtube video ID #"+youtubeId);
        let url = await ((id) => {
          return new Promise((resolve, reject) => {
            exec("ytdl --print-url https://www.youtube.com/watch?v="+id,
              (error, stdout, stderr) => {
              if (error) {
                server.failure(res,404,"error fetching video"+error+stderr)
              }
              resolve(stdout.split("\n")[0]);
            });
        })})(youtubeId);
        utils.spawnAndDetach("mplayer -novideo -msglevel all=-1 "+url);
        res.writeHead(200);
        res.end()
      } else {
        server.failure(res,500,"no youtube API key provided");
      }
    }
  },
  {
    path: "/radio/list",
    hdl: () => {}
  },
  {
    path: "/radio/play",
    hdl: () => {}
  },
  {
    path: "/streaming/prepare",
    hdl: () => {}
  },
  {
    path: "/streaming/play",
    hdl: () => {}
  },
  {
    path: "/player/play",
    hdl: () => {}
  },
  {
    path: "/player/getLog",
    hdl: () => {}
  },
  {
    path: "/player/stop",
    hdl: (req,res) => {
      res.writeHead(200);
      media.stop();
      res.end();
    }
  },
  {
    path: "/player/shuffle",
    hdl: () => {}
  },
  {
    path: "/player/random",
    hdl: () => {}
  },
  {
    path: "/player/halt",
    hdl: async (req,res) => {
      res.writeHead(200);
      res.end("Goodbye");
      await media.stop();
      console.warn("shutdown triggered");
      await utils.wait(1000);
      execSync("sudo shutdown now");
    }
  },
  {
    path: "/files/upload",
    hdl: () => {}
  },
  {
    path: "/files/getList",
    hdl: () => {}
  },
  {
    path: "/files/search",
    hdl: (req,res) => {
      server.json(
        utils.search(req.page.searchParams.get("options"),globalList.list)
      )(req,res);
    }
  },
  {
    path: "/files/regenerate",
    hdl: () => {}
  },
]

//Audio file streamer
let streamAudioFile = (req,res,file) => {
  return new Promise(async (resolve,reject) => {
    let fileSize = fs.statSync(file).size;
    let range = req.headers.range;
    let readStream = {};
    let head = {};
    head["Content-Length"] = fileSize;
    readStream = fs.createReadStream(file);
    let type = file.split(".").reverse()[0];
    res.writeHead(200, head);
    readStream.on("open",() => {
      readStream.pipe(res);
    });
    readStream.on("close",() => {
      resolve();
    });
    readStream.on("error", (err) => {
      reject(err);
    });
  });
};

//Main object
let media = {
  generateTrees: (response,data=false) => {
    let files = (data) ? data : [];
    if (!data) {
      let tree = TreeMaker(CONFIG.musicDirectory);
      files.push({
        name:"tree.json",
        data:JSON.stringify(tree.tree)
      });
      console.log("json tree successfully built");
      files.push({
        name:"liste",
        data:tree.list.map(e => e.replace("./",CONFIG.musicDirectory))
          .join("\n")
      });
      console.log("raw list successfully built");
    }
    for (i of files) {
      fs.writeFileSync(i.name,i.data);
    }
    globalList = utils.makeGlobalLists(files);
    console.log("tree files written");
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
  stop: () => {
    try {
      execSync("killall -s SIGKILL mplayer");
    } catch {
      console.log("killall: nothing to stop");
    }
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
  streamAudioFile: async (response,path,request) => {
    await streamAudioFile(request,response,path.replace("./",DIRECTORY));
  },
  prepareAndPlay: async (response,path) => {
    await Tree.generatePlaylist(path);
    Tree.play("./playlist");  
  },
  shuffleAndPlay: async (response,path) => {
    await Tree.generatePlaylist(path);
    Tree.play("./playlist",true);  
  },
  shuffleRecursiveDir: (response,path) => {
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
let server = new minimalServer();
server.failure = (response,code,error) => {
  console.error(code,error);
  response.writeHead(code);
  response.write(error);
  response.end();
}
routes.map(e => {
  server.route = {
    path: e.path,
    handler: e.hdl
  }
});
let startServer = async () => {
  await server.enableStaticDir();
  try {
    globalList = makeGlobalLists();
  } catch {
    media.generateTrees(false);
  }
  console.log("starting server...");
  try {
    server.start();
    console.log("server listening");
  } catch (e) {
    console.error(e);
    await wait(5000);
    server.start();
  }
}
startServer();
/*let server = http.createServer(async function(req, res) {
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
      let form = new formidable.IncomingForm(); //TODO: implement progress meter
      /*form.on("progress", function(bytesReceived, bytesExpected) {
        logger("log","upload processing: "+bytesReceived+" / "+bytesExpected);
      });
      form.on("fileBegin", function(name, file) {
        logger("log","begin file upload: "+name+" "+file);
      });
      form.on("file", function(name, file) {
        logger("log","file upload end: "+name+" "+file);
      });*/
/*      form.uploadDir = DIRECTORY;
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
        await Tree[cmd](res,page.searchParams.get("options"),req);
      } catch(e) {
        failure(res,e.code,e.text);
      }
    }
  } else {
    failure(res,404,"Not found :(");
  }
  res.end();
});*/
