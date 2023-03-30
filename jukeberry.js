const { readFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const websocket = require("websocket-driver");
const Utils = require("./utils.js");
const FilesHandler = require("./files.js");
const MediaPlayer = require("./media.js");
const PlayListManager = require("./playlist.js");
const RadioManager = require("./radios.js");
const PodcastManager = require("./podcasts.js");
const GpioControls = require("./gpio/gpio.js");
const Metadata = require("./metadata/metadata.js");
const server = require("./server.js");
const CONFIG = require("./config.js");

class Jukeberry {
  constructor(config) {
    this.gpio = GpioControls;
    this.gpio["led-red"].on();
    this._status = {
      ready: false,
      playing: false,
    };
    this.config = config;
    this.utils = new Utils(this);
    this.files = new FilesHandler(this);
    this.media = new MediaPlayer(this);
    this.playlist = new PlayListManager(this);
    this.radios = new RadioManager(this);
    this.podcasts = new PodcastManager(this);
    this.metadata = new Metadata(this);
    this.server = server;
    const routes = require("./router/router.js")(this);
    routes.map((e) => {
      this.server.route = {
        path: "/api" + e.path,
        handler: e.hdl,
      };
    });
    this.server.server.on("upgrade", (request, socket, body) => {
      //socket to pass current logs
      if (!websocket.isWebSocket(request)) return;
      let driver = websocket.http(request);
      driver.io.write(body);
      socket.pipe(driver.io).pipe(socket);
      driver.start();
      this.setSocket(driver);
    });
    this.init();
    this.gpio.combinations.push({
      buttons: ["switch-b-green", "switch-b-yellow", "switch-b-red"],
      callback: async () => {
        await this.media.stop();
        await this.gpio.stop();
        console.warn("shutdown triggered");
        await this.utils.wait(1000);
        execSync("sudo shutdown -h now");
      },
      lastButton: {},
    });
  }
  setSocket(ws) {
    if (typeof this.config.sockets !== "undefined") {
      this.config.sockets.push(ws);
    } else {
      this.config.sockets = [ws];
    }
  }
  async parseLog() {
    const updateStatus = (metadata) => {
      if (Object.keys(metadata).length !== 0 && this.status.playing) {
        this.status = {
          playing: {
            metadata,
          },
        };
      }
    };
    let log = readFileSync("raw.log", "utf8");
    let path = "";
    let metadata = {};
    log
      .split("\n")
      .filter((e) => e !== "")
      .map((e) => {
        if (e.indexOf("ANS_") == 0) {
          path = e.split("=")[1];
        } else if (e.indexOf("Playing ") == 0) {
          path = e.split("Playing ")[1].slice(0, -1);
        }
      });
    if (this.status.playing.mode === "music" && path) {
      // 1\ use https://github.com/Borewit/music-metadata to get metadata
      // 1.1\if no metadata: try to deduce from file structure:
      //      parent folder is likely album, its parent being artist
      metadata = await this.metadata.getMetadata(path);
      updateStatus(metadata);
      // 2\ consolidate metadata using wikidata & discogs
      //~ metadata = await this.metadata.consolidate(metadata);
      //~ this is now made on demand: see route /media/metadata
      //~ updateStatus(metadata);
    } else {
      this.metadata.resetPath();
      //metadata query is only performed on path change so we reset path
      //in case of mode switching
    }
    updateStatus(metadata);
    return metadata;
  }
  sendLog() {
    const prepareStatusToSend = (input, excludedKeys) => {
      let output = {};
      Object.keys(input).map((k) => {
        if (!excludedKeys.includes(k)) {
          if (typeof input[k] === "object") {
            if (typeof input[k].length === "undefined") {
              output[k] = prepareStatusToSend(input[k], excludedKeys);
            } else {
              output[k] = [
                ...input[k].map((e) => {
                  if (
                    typeof e === "object" &&
                    typeof e.length === "undefined"
                  ) {
                    return prepareStatusToSend(e, excludedKeys);
                  } else {
                    return e;
                  }
                }),
              ];
            }
          } else {
            output[k] = input[k];
          }
        }
      });
      return output;
    };
    if (typeof this.config.sockets !== "undefined") {
      let status = JSON.stringify(
        prepareStatusToSend(this.status, [
          "artistDetails",
          "albumDetails",
          "picture",
        ])
      );
      this.config.sockets.map((socket) => {
        try {
          socket.text(status);
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
    setInterval(() => {
      this.sendLog();
    }, 5000);
    try {
      execSync("mkfifo ./mplayer_master");
    } catch {
      /* NoOp, named pipe should already exist */
    }
    await this.server.enableStaticDir();
    try {
      this.globalList = this.utils.makeGlobalLists();
      console.info("success !");
    } catch (e) {
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
        writeFileSync("./playlist", this.config.startupSound);
        this.media.play("./playlist");
      } catch {
        console.error("Couldn't play startup sound");
      }
    } else {
      console.log("no startup sound configured");
    }
    this.status = {
      ready: true,
    };
  }
  set status(options) {
    if (typeof options.ready !== "undefined") {
      this._status.ready = options.ready;
      this.gpio.stopAllBlinks();
      if (options.ready === true) {
        this.gpio["led-green"].on(true);
      } else {
        this.gpio["led-red"].on(true);
      }
    }
    if (typeof options.playing !== "undefined") {
      if (options.playing === false) {
        this._status.playing = false;
        this.gpio.stopAllBlinks();
        this.gpio["led-green"].on(true);
      } else {
        if (typeof this._status.playing === "boolean") {
          this._status.playing = {};
        }
        Object.keys(options.playing).forEach((k) => {
          this._status.playing[k] = options.playing[k];
        });
        if (typeof options.playing.paused !== "undefined") {
          if (options.playing.paused === true) {
            this.gpio.stopAllBlinks();
            (async () => {
              this.gpio["led-yellow"].blink(250);
            })();
          } else {
            this.gpio.stopAllBlinks();
            this.gpio.niceBlink();
          }
        }
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
