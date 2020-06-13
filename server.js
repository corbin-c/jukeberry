const fs = require("fs");
const { exec, execSync, spawn } = require("child_process");
const http = require("http");
const websocket = require("websocket-driver");
const formidable = require("formidable");
const YouTube = require("youtube-node");
const minimalServer = require("@corbin-c/minimal-server");
const TreeMaker = require("@corbin-c/minimal-server/tree.js");

const CONFIG = (() => { // INIT CONFIG
  let conf = fs.readFileSync("config.json","utf8");
  conf = JSON.parse(conf);
  conf.directories = {};
  ["musicDirectory","videoDirectory"].map(e => {
    if (typeof conf[e] === "undefined") {
      conf.directories[e] = false;
    } else {
      conf.directories[e] = (conf[e][conf[e].length-1] == "/")
    ? conf[e]:conf[e]+"/";
    }
  });
  if (typeof conf["youtube-api-key"] === "undefined") {
    conf.youtube = false;
  } else {
    conf.youtube = new YouTube();
    conf.youtube.setKey(conf["youtube-api-key"]);
  }
  conf.log = (typeof conf.log === "boolean") ? conf.log : false;
  conf.files = ((dirs) => {
    let files = [];
    dirs.map(e => {
      if (conf.directories[e] !== false) {
        files.push(e+"_tree.json");
        files.push(e+"_list");
      }
    });
    return files;
  })(Object.keys(conf.directories));
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
            exec("./node_modules/ytdl/bin/ytdl.js --print-url https://www.youtube.com/watch?v="+id,
              (error, stdout, stderr) => {
              if (error) {
                server.failure(res,404,"error fetching video"+error+stderr)
              }
              resolve(stdout.split("\n")[0]);
            });
        })})(youtubeId);
        utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -novideo -msglevel all=-1 "+url);
        utils.sendLog({youtube:youtubeId});
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
        utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -msglevel all=4 "+radio.url);
        utils.sendLog({radio_name:req.page.searchParams.get("options")});
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
    path: "/player/video",
    hdl: (req,res) => {
      let path = req.page.searchParams.get("options");
      path = path.replace("./",CONFIG.directories["videoDirectory"]);
      let subs = globalList.videoDirectory_list
        .filter(e => e.indexOf(path.split(".").slice(0,-1).join(".")) >= 0)
        .find(e => ["srt","sub"].includes(e.split(".").reverse[0]));
      if (typeof subs !== "undefined") {
        subs = "--subtitles "+subs+" ";
      } else {
        subs = "";
      }
      utils.spawnAndDetach("omxplayer --no-ghost-box "+subs+path);
      res.writeHead(200);
      res.end();
    }
  },
  {
    path: "/player/commands",
    hdl: (req,res) => {
      let command = [
        {
          name: "togglePlay",
          cmd: "key_down_event 32"
        },
        {
          name: "forward",
          cmd: "seek 10"
        },
        {
          name: "rewind",
          cmd: "seek -10"
        },
        {
          name: "next",
          cmd: "key_down_event 62"
        },
        {
          name: "prev",
          cmd: "key_down_event 60"
        }
      ].find(e => e.name == req.page.searchParams.get("options"));
      if (typeof command === "undefined") {
        server.failure(res,404,"media player command not found");
      } else {
        media.master(command.cmd);
        res.writeHead(200);
        res.end();
      }
    }
  },
  {
    path: "/player/stop",
    hdl: (req,res) => {
      media.stop();
      res.writeHead(200);
      res.end();
    }
  },
  {
    path: "/player/shuffle", //recursively shuffles a directory
    hdl: (req,res) => {
      let path = req.page.searchParams.get("options");
      path = path.replace("./",CONFIG.directories["musicDirectory"]);
      let playlist = globalList.musicDirectory_list;
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
      media.play("./musicDirectory_list",true);
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
    hdl: (req,res) => {
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
        form.uploadDir = CONFIG.musicDirectory;
        form.keepExtensions = true;
        form.multiples = true;
        form.parse(req, (err, fields, files) => {
          let destination = fields.destination;
          destination += (destination[destination.length-1] == "/")
            ? ""
            : "/";
          let fsdestination = destination.replace("./",CONFIG.musicDirectory);
          if (!fs.existsSync(fsdestination)) {
            fs.mkdirSync(fsdestination);
          }
          for (let file of Object.values(files)) {
            console.log("Uploading file: "+fsdestination+file.name);
            fs.rename(file.path, fsdestination+file.name, (err) => { 
              console.error("Error while moving file",file.name);
            });
          }
          files.generateTrees();
        });
      }
    }
  },
  {
    path: "/files/list",
    hdl: (req,res,type="music") => {
      let path = req.page.searchParams.get("options");
      let tree = files.getTree(type);
      try {
        tree = files.getBranch(tree,path);
        tree = files.cleanBranch(tree);
        if (type == "video") {
          tree = tree.filter(e => ["srt","sub"].indexOf(e.name.split(".").reverse()[0]) < 0)
        }
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
    path: "/files/videoList",
    hdl: (req,res) => {
      routes.find(e => e.path == "/files/list").hdl(req,res,"video");
    }
  },
  {
    path: "/files/search",
    hdl: (req,res,type="music") => {
      type = (type !== "music") ? "video":type;
      server.json(
        utils.search(req.page.searchParams.get("options"),globalList[type+"Directory_list"])
      )(req,res);
    }
  },
  {
    path: "/files/videoSearch",
    hdl: (req,res) => {
      routes.find(e => e.path == "/files/search").hdl(req,res,"video");
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
  generateTrees: () => {
    let files = [];
    CONFIG.files.map(e => {
      let dir = CONFIG.directories[e.split("_")[0]];
      let tree = TreeMaker(dir);
      let json = e.split(".")[1] === "json";
      files.push({
        name:e,
        data: (json) ?
          JSON.stringify(tree.tree)
          : tree.list.map(e => e.replace("./",dir)).join("\n")
      });
      console.log(e,"successfully built");
    });
    for (i of files) {
      fs.writeFileSync(i.name,i.data);
    }
    globalList = utils.makeGlobalLists(files);
    console.log("tree files written");
  },
  getTree: (type="music") => {
    type += "Directory_tree.json";
    return globalList[type];
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
      utils.sendLog({filename:" "});
      execSync("killall -s SIGKILL mplayer");
    } catch {
      console.warn("killall: nothing to stop");
    }
  },
  master: (command) => {
    console.log("echoing '"+command+"' to fifo");
    return new Promise((resolve,reject) => {
      exec("echo "+command+" >> ./mplayer_master",(error,stdout,stderr) => {
        if (error) {
          reject(stderr);
        } else {
          resolve();
        }
      });
    });
  },
  play: async (path,random=false) => {
    random = (random) ? "-shuffle ":"";
    await media.stop();
    await utils.wait(1000);
    console.log("starting mplayer");
    utils.spawnAndDetach("mplayer -idle -slave -input file=./mplayer_master -msglevel all=4 -quiet "+random+"-playlist "+path);
  },
  generatePlaylist: async (path) => { 
    try {
      let tree = await files.getTree("music");
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
        .map(e => playlist += e.name.replace("./",CONFIG.directories["musicDirectory"])+"\n");
      fs.writeFileSync("playlist",playlist);
    } catch(e) {
      throw e;
    }
  }
}

//Exposed server
let server = new minimalServer();
server.server.on("upgrade", (request,socket,body) => { //socket to pass current logs
  if (!websocket.isWebSocket(request)) return;
  let driver = websocket.http(request);
  driver.io.write(body);
  socket.pipe(driver.io).pipe(socket);
  driver.start();
  utils.setSocket(driver);
});
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
(async () => {
  try {
    execSync("mkfifo ./mplayer_master");
  } catch { /* NoOp, named pipe should already exist */ }
  await server.enableStaticDir();
  try {
    globalList = utils.makeGlobalLists();
    console.info("success !");
  } catch(e) {
    console.warn(e.message);
    console.info("Building lists from scratch...");
    files.generateTrees();
  }
  console.log("starting server...");
  try {
    server.start();
    console.log("Server listening");
  } catch (e) {
    console.error(e);
    await utils.wait(5000);
    server.start();
  }
  if (typeof CONFIG.startupSound === "string") {
    try {
      fs.writeFileSync("./playlist",CONFIG.startupSound);
      media.play("./playlist");
    } catch {
      console.error("Couldn't play startup sound");
    }
  } else {
    console.log("no startup sound configured");
  }
})();
