const { execSync, exec } = require("child_process");
const { writeFileSync } = require("fs");

module.exports = (parent) => {
  const mediaRoutes = [
    {
      path: "/media/play/music",
      hdl: async (req,res) => {
        try {
          let path = req.page.searchParams.get("options");
          await parent.media.generatePlaylist(path);
          parent.media.play("./playlist");
          res.writeHead(200);
          res.end();
        } catch (e) {
          parent.server.failure(res,500,"Something went wrong while generating playlist\n"+e);
        }
      }
    },
    {
      path: "/media/play/music/recursive", //recursively plays a directory
      hdl: (req,res,random=false) => {
        let path = req.page.searchParams.get("options");
        path = path.replace("./",parent.config.directories["musicDirectory"]);
        let playlist = parent.globalList.musicDirectory_list;
        playlist = playlist.filter(e => e.indexOf(path) == 0);
        playlist = playlist.join("\n");
        writeFileSync("playlist",playlist);
        parent.media.play("./playlist",random);
        res.writeHead(200);
        res.end();
      }
    },
    {
      path: "/media/play/music/random", //recursively shuffles a directory
      hdl: (req,res) => {
        mediaRoutes.find(e => e.path == "/media/play/music/recursive").hdl(req,res,true);
      }
    },
    {
      path: "/media/play/music/random/all", //random on all musicDir root
      hdl: (req,res) => {
        res.writeHead(200);
        parent.media.play("./musicDirectory_list",true);
        res.end();
      }
    },
    {
      path: "/media/play/video",
      hdl: (req,res) => { /* should be moved outside routes, inside media module */
        let path = req.page.searchParams.get("options");
        path = path.replace("./",parent.config.directories["videoDirectory"]);
        let subs = parent.globalList.videoDirectory_list
          .filter(e => e.indexOf(path.split(".").slice(0,-1).join(".")) >= 0)
          .filter(e => ["srt","sub"].includes(e.split(".").reverse()[0]));
        if (subs.length === 0) {
          subs = parent.globalList.videoDirectory_list
            .filter(e => e.indexOf(path.split("/").slice(0,-1).join("/")) >= 0)
            .filter(e => ["srt","sub"].includes(e.split(".").reverse()[0]));
        }
        if (subs.length > 1) {
          let subs_en = subs.find(e =>
            (e.toLowerCase().indexOf("english") > 0)
            || (e.toLowerCase().indexOf("_en") > 0));
          if (typeof subs_en !== "undefined") {
            subs = subs_en;
          } else {
            subs = subs[0];
          }
        }
        if (typeof subs !== "undefined") {
          subs = "--subtitles \""+subs+"\" ";
        } else {
          subs = "";
        }
        parent.media.master("stop");
        exec("omxplayer --no-ghost-box "+subs+"\""+path+"\"",
          (error,stdout,stderr) => {});
        parent.status = {
          playing: {
            mode: "video",
            paused: false,
            metadata: {}
          }
        }
        writeFileSync("raw.log","ANS_VIDEO_FILE="+path);
        res.writeHead(200);
        res.end();
      }
    },
    {
      path: "/media/commands",
      hdl: (req,res) => {
        let paused = false;
        if ((typeof parent.status.playing !== "boolean")
        && (typeof parent.status.playing.paused !== "undefined")) {
          paused = !parent.status.playing.paused;
        }
        let command = [
          {
            name: "togglePlay",
            audio: "key_down_event 32",
            video: "pause",
            status: {
              playing: {
                paused
              }
            }
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
            audio: "key_down_event 62",
            video: "togglesubtitles"
          },
          {
            name: "prev",
            cmd: "key_down_event 60"
          }
        ].find(e => e.name == req.page.searchParams.get("options"));
        if (typeof command === "undefined") {
          parent.server.failure(res,404,"media player command not found");
        } else {
          parent.media.master(command);
          res.writeHead(200);
          res.end();
        }
      }
    },
    {
      path: "/media/stop",
      hdl: (req,res) => {
        parent.media.stop();
        res.writeHead(200);
        res.end();
      }
    },
    {
      path: "/media/halt",
      hdl: async (req,res) => {
        res.writeHead(200);
        res.end("Goodbye");
        await parent.media.stop();
        console.warn("shutdown triggered");
        await parent.utils.wait(1000);
        execSync("sudo shutdown -h now");
      }
    },
  ];
  return mediaRoutes;
};
