const websocket = require("websocket-driver");
const Utils = require("./utils.js")
const FilesHandler = require("./files.js");
const MediaPlayer = require("./media.js");
const server = require("./server.js");
const CONFIG = require("./config.js");

class Jukeberry {
  constructor(config) {
    this.config = config;
    this.utils = new Utils(this.config);
    this.files = new FilesHandler(this.config);
    this.media = new MediaPlayer(
      this.config,
      this.utils,
      this.files
    );
    this.server = server;
    const routes = require("./router/router.js")(this);
    routes.map(e => {
      this.server.route = {
        path: e.path,
        handler: e.hdl
      }
    });
    this.server.server.on("upgrade", (request,socket,body) => { //socket to pass current logs
      if (!websocket.isWebSocket(request)) return;
      let driver = websocket.http(request);
      driver.io.write(body);
      socket.pipe(driver.io).pipe(socket);
      driver.start();
      this.utils.setSocket(driver);
    });
  }
  generateTrees() {
    const files = this.files.generateTrees();
    this.globalList = this.utils.makeGlobalLists(files);
  }
}

const jb = new Jukeberry(CONFIG);

module.exports = jb;
