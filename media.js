const { execSync } = require("child_process");
const { writeFileSync } = require("fs");

module.exports = class {
  constructor(config, utils, files) {
    this.config = config;
    this.utils = utils;
    this.files = files;
  }
  stop() {
    let audio = !Object.keys(this.utils.parseLog()).some(e => e == "video_file");
    if (audio) {
      try {
        this.utils.sendLog({filename:" "});
        execSync("killall -s SIGKILL mplayer");
      } catch {
        console.warn("killall: nothing to stop");
      }
    } else {
      this.master({cmd:"stop"}).catch(e => { console.error(e) });
      writeFileSync("raw.log","");
      try {
        execSync("killall -s SIGKILL omxplayer.bin");
      } catch {
        console.warn("killall: nothing to stop");
      }
    }
  }
  master(command) {
    let audio = !Object.keys(this.utils.parseLog()).some(e => e == "video_file");
    if (audio) {
      command = (command.cmd || command.audio)
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
    } else {
      command = (command.cmd || command.video)
      return new Promise((resolve,reject) => {
        exec("./omx_dbus.sh "+command,(error,stdout,stderr) => {
          if (error) {
            reject(stderr);
          } else {
            resolve();
          }
        });
      });
    }
  }
  async play(path,random=false) {
    random = (random) ? "-shuffle ":"";
    await this.stop();
    await this.utils.wait(1000);
    console.log("starting mplayer");
    this.utils.spawnAndDetach("mplayer -idle -slave -input file=./mplayer_master -msglevel all=4 -quiet "+random+"-playlist "+path);
  }
  async generatePlaylist(path) { 
    try {
      let tree = await this.files.getTree("music");
      let branch;
      let playlist = "";
      try {
        branch = this.files.getBranch(tree,path);
      } catch {
        branch = this.files.getBranch(tree,files.getParentFolder(path));
        path = branch.indexOf(branch.find(e => (e.name == path)));
        branch = branch.filter((e,i) => (i >= path));
      }
      branch.filter(e => e.type == "file")
        .map(e => playlist += e.name.replace("./",config.directories["musicDirectory"])+"\n");
      writeFileSync("playlist",playlist);
    } catch(e) {
      throw e;
    }
  }
}
