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
            exec("./node-modules/ytdl/bin/ytdl.js ytdl --print-url https://www.youtube.com/watch?v="+id,
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
    hdl: (req,res) => {
      server.json(CONFIG.radioStreams.map(e => e.name))(req,res);
    }
  },
  {
    path: "/radio/play",
    hdl: async (req,res) => {
      let radio = CONFIG.radioStreams
        .find(e => e.name == req.page.searchParams.get("options"));
      if (typeof radio !== "undefined") {
        await media.stop();
        await utils.wait(1000);
        utils.spawnAndDetach("mplayer -msglevel all=4 "+radio.url);
      }
    }
  },
  {
    path: "/player/play",
    hdl: async (req,res) => {
      try {
        let path = req.page.searchParams.get("options");
        await media.generatePlaylist(path);
        media.play("./playlist");
        res.writeHead(200);
        res.end();
      } catch (e) {
        server.failure(res,500,"Something went wrong while generating playlist"+e);
      }
    }
  },
  {
    path: "/player/log",
    hdl: (req,res) => {
      try {
        let currentLog = fs.readFileSync("current.log","utf8");
        currentLog = JSON.parse(currentLog);
        let log = {};
        for (let v of Object.keys(currentLog)) {
          if (["raw","clip_info"].indexOf(v) < 0) {
            log[v] = currentLog[v];
          }
        }
        server.json(log)(req,res);
      } catch {
        server.failure(res,404,"no current log");
      }
    }
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
    path: "/player/shuffle", //recursively shuffles a directory
    hdl: (req,res) => {
      let path = req.page.searchParams.get("options");
      path = path.replace("./",CONFIG.musicDirectory);
      let playlist = globalList.list;
      playlist = playlist.filter(e => e.indexOf(path) == 0);
      playlist = playlist.join("\n");
      fs.writeFileSync("playlist",playlist);
      media.play("./playlist",true);
      res.writeHead(200);
      res.end();
    }
  },
  {
    path: "/player/random", //random on all musicDir root
    hdl: (req,res) => {
      res.writeHead(200);
      media.play("./liste",true);
      res.end();
    }
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
    path: "/files/list",
    hdl: (req,res) => {
      let path = req.page.searchParams.get("options");
      let tree = files.getTree();
      try {
        tree = files.getBranch(tree,path);
        tree = files.cleanBranch(tree);
        let parentpath = files.getParentFolder(path);
        if (parentpath) {
          tree.unshift({type:"parentdir",name:parentpath});
        }
        server.json(tree)(req,res);
      } catch(e) {
        server.failure(res,400,"Bad request :\n"+e);
      }
    }
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
    hdl: (req,res) => {
      try {
        files.generateTrees();
      } catch {
        server.failure(res,500,"Internal server error while generating files tree");
      }
    }
  },
]

//FS handling
let files = {
  generateTrees: (data=false) => {
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
      return files.getBranch(tree,path,backpath);
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
      return files.getPath(newTree.contents,path,output);
    }
  },
  cleanBranch: (tree) => {
    return tree.map(e => ({type:e.type,name:e.name}));
  }  
}

//Media interactions object
let media = {
  stop: () => {
    try {
      execSync("killall -s SIGKILL mplayer");
    } catch {
      console.log("killall: nothing to stop");
    }
  },
  play: async (path,random=false) => {
    random = (random) ? "-shuffle ":"";
    await media.stop();
    await utils.wait(1000);
    utils.spawnAndDetach("mplayer -msglevel all=4 "+random+"-playlist "+path);
  },
  generatePlaylist: async (path) => { 
    try {
      let tree = await files.getTree();
      let branch;
      let playlist = "";
      try {
        branch = files.getBranch(tree,path);
      } catch {
        branch = files.getBranch(tree,files.getParentFolder(path));
        path = branch.indexOf(branch.find(e => (e.name == path)));
        branch = branch.filter((e,i) => (i >= path));
      }
      branch.filter(e => e.type == "file")
        .map(e => playlist += e.name.replace("./",CONFIG.musicDirectory)+"\n");
      fs.writeFileSync("playlist",playlist);
    } catch(e) {
      throw e;
    }
  },
  shuffleAndPlay: async (path) => { //useless / should be removed
    await media.generatePlaylist(path);
    media.play("./playlist",true);  
  },
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
    files.generateTrees(false);
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
