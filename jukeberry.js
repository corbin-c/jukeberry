const { readFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const websocket = require("websocket-driver");
const Utils = require("./utils.js")
const FilesHandler = require("./files.js");
const MediaPlayer = require("./media.js");
const PlayListManager = require("./playlist.js");
const server = require("./server.js");
const CONFIG = require("./config.js");

class Jukeberry {
  constructor(config) {
    this._status = {
      ready: false,
      playing: false
    };
    this.config = config;
    this.utils = new Utils(this);
    this.files = new FilesHandler(this);
    this.media = new MediaPlayer(this);
    this.playlist = new PlayListManager(this);
    this.server = server;
    const routes = require("./router/router.js")(this);
    routes.map(e => {
      this.server.route = {
        path: "/api"+e.path,
        handler: e.hdl
      }
    });
    this.server.server.on("upgrade", (request,socket,body) => { //socket to pass current logs
      if (!websocket.isWebSocket(request)) return;
      let driver = websocket.http(request);
      driver.io.write(body);
      socket.pipe(driver.io).pipe(socket);
      driver.start();
      this.setSocket(driver);
    });
    this.init();
  }
  setSocket(ws) {
    if (typeof this.config.sockets !== "undefined") {
      this.config.sockets.push(ws);
    } else {
      this.config.sockets = [ws];
    }
  }
  parseLog() {
    let log = readFileSync("raw.log","utf8");
    let metadata = {};
    log.split("\n").filter(e => e !== "").map(e => {
      if (e.indexOf("ANS_") == 0) {
        e = e.split("=");
        if (isNaN(parseFloat(e[1]))) {
          e[1] = e[1].slice(1,-1);
        }
        if (e[1] != "") {
          let key = e[0].split("ANS_")[1].toLowerCase();
          key = (key.includes("meta_"))
            ? key.split("meta_")[1]
            : key
          metadata[key] = e[1];
        }
      }
    });
    /* parsed log example:
{
  filename: "04 - Mr. Barnum's Junior's Magnificent And Fabulous City.mp3",
  length: '334.00',
  meta_title: "Mr. Barnum's Junior's Magnific",
  meta_artist: 'Alquin',
  meta_album: 'Marks',
  meta_year: '1972',
  meta_track: '4',
  meta_genre: 'Unknown'
}
  */
    if (Object.keys(metadata).length !== 0) {
      //~ this.sendLog(metadata);
      this.status = {
        playing: {
          metadata
        }
      };
    }
    return metadata;
  }
  sendLog() {
    if (typeof this.config.sockets !== "undefined") {
      this.config.sockets.map(socket => {
        try {
          socket.text(JSON.stringify(this.status));
        } catch {
          console.warn("Problem writing to socket");
        }
      });
    }
  }
  generateTrees() {
    const files = this.files.generateTrees();
    this.globalList = this.utils.makeGlobalLists(files);
  }
  async init() {
    setInterval(() => { this.sendLog() },5000);
    try {
      execSync("mkfifo ./mplayer_master");
    } catch { /* NoOp, named pipe should already exist */ }
    await this.server.enableStaticDir();
    try {
      this.globalList = this.utils.makeGlobalLists();
      console.info("success !");
    } catch(e) {
      console.warn(e.message);
      console.info("Building lists from scratch...");
      this.generateTrees();
    }
    console.log("starting server...");
    try {
      this.server.start();
      console.log("Server listening");
    } catch (e) {
      console.error(e);
      await utils.wait(5000);
      this.server.start();
    }
    if (typeof this.config.startupSound === "string") {
      try {
        writeFileSync("./playlist",this.config.startupSound);
        this.media.play("./playlist");
      } catch {
        console.error("Couldn't play startup sound");
      }
    } else {
      console.log("no startup sound configured");
    }
    this.status = {
      ready: true
    }
  }
  set status(options) {
    if (typeof options.ready !== "undefined") {
      this._status.ready = options.ready;
    }
    if (typeof options.playing !== "undefined") {
      if (options.playing === false) {
        this._status.playing = false;
      } else {
        if (typeof this._status.playing === "boolean") {
          this._status.playing = {};
        }
        Object.keys(options.playing).forEach(k => {
          this._status.playing[k] = options.playing[k];
        });
      }
    }
    this.sendLog();
  }
  get status() {
    return this._status;
  }
}

const jb = new Jukeberry(CONFIG);

module.exports = jb;
