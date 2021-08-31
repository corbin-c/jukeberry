const { execSync, exec } = require("child_process");
const { writeFileSync } = require("fs");

module.exports = class {
  constructor(parent) {
    this.parent = parent;
    this.parent.gpio["btn-push-yellow"].onPush(() => {
      if (this.parent.status.playing) {
        this.master(
          {
            name: "togglePlay",
            audio: "key_down_event 32",
            video: "pause",
            status: {
              playing: {
                paused: !this.parent.status.playing.paused
              }
            }
          }
        );
      } else {
        this.play("./musicDirectory_list",true);
      }
    });
    this.parent.gpio["btn-push-green"].onPush(() => {
      if (this.parent.status.playing && this.parent.status.playing.mode === "radio") {
        this.changeRadio(1);
      } else {
        this.master(
          {
            name: "next",
            audio: "key_down_event 62",
            video: "togglesubtitles"
          }
        );
      }
    });
    this.parent.gpio["btn-push-red"].onPush(() => {
      if (this.parent.status.playing && this.parent.status.playing.mode === "radio") {
        this.changeRadio(-1);
      } else {
        this.master(
          {
            name: "prev",
            cmd: "key_down_event 60"
          }
        );
      }
    });
    this.parent.gpio["btn-switch-t-red"].onPush(() => {
      this.stop()
    });
    this.parent.gpio["btn-switch-t-green"].onPush(() => {
      const radio = this.parent.radios.list.filter(e => e.favorite)[0];
      this.playRadio(radio.name,radio.url);
    });
  }
  changeRadio(n) {
    if (this.parent.status.playing && this.parent.status.playing.mode === "radio") {
      const radioList = this.parent.radios.list.filter(e => e.favorite);
      const currentRadio = radioList
        .findIndex(e => e.url === this.parent.status.playing.metadata.url);
      let newRadio = currentRadio+n;
      if (newRadio < 0) {
        newRadio = radioList.length-1;
      }
      if (newRadio == radioList.length) {
        newRadio = 0;
      }
      newRadio = radioList[newRadio];
      this.playRadio(newRadio.name, newRadio.url);
    }
  }
  stop() {
    let audio = !(this.parent.status.ready
      && this.parent.status.playing
      && this.parent.status.playing.mode === "video")
    this.parent.status = {
      playing: false
    };
    if (audio) {
      try {
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
    let audio = !(this.parent.status.ready
      && this.parent.status.playing
      && this.parent.status.playing.mode === "video")
    if (command.status) {
      this.parent.status = command.status;
    }
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
    await this.parent.utils.wait(1000);
    console.log("starting mplayer");
    this.parent.utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -msglevel all=4 -quiet "+random+"-playlist "+path);
    this.parent.status = {
      playing: {
        mode: "music",
        paused: false,
        metadata: {}
      }
    };
  }
  async playRadio(name,url) {
    await this.stop();
    await this.parent.utils.wait(1000);
    this.parent.utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -msglevel all=4 "+url);
    this.parent.status = {
      playing: {
        mode: "radio",
        metadata: {
          title: name,
          url
        },
        paused: false
      }
    };
  }
  async generatePlaylist(path) { 
    try {
      let tree = await this.parent.files.getTree("music");
      let branch;
      let playlist = "";
      try {
        branch = this.parent.files.getBranch(tree,path);
      } catch {
        branch = this.parent.files.getBranch(tree,this.parent.files.getParentFolder(path));
        path = branch.indexOf(branch.find(e => (e.name == path)));
        branch = branch.filter((e,i) => (i >= path));
      }
      branch.filter(e => e.type == "file")
        .map(e => playlist += e.name.replace("./",this.parent.config.directories["musicDirectory"])+"\n");
      writeFileSync("playlist",playlist);
    } catch(e) {
      throw e;
    }
  }
}
