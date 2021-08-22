const { execSync, exec } = require("child_process");
const { writeFileSync } = require("fs");

module.exports = (parent) => {
  const mediaRoutes = [
    {
      path: "/media/play/playlist",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.id === "undefined") {
          parent.server.failure(res,500,"no playlist ID provided");
          return;
        }
        const random = options.random || false;
        const from = options.from || 0;
        const playlist = parent.playlist.getPlaylist(options.id)
          .map(e => e.replace("./",parent.config.directories["musicDirectory"]))
          .slice(from)
          .join("\n");
        writeFileSync("./playlist",playlist);
        parent.media.play("./playlist",random);
        res.writeHead(200);
        res.end();
      }
    },
    {
      path: "/media/play/music",
      hdl: async (req,res) => {
        try {
          const options = await parent.server.getRequestBody(req);
          const playlistPath = options.path ? "./playlist" : "./musicDirectory_list";
          const random = options.random || false;
          if (options.recursive) {
            const path = options.path
              .replace("./",parent.config.directories["musicDirectory"]);
            const playlist = parent.globalList.musicDirectory_list
              .filter(e => e.indexOf(path) == 0)
              .join("\n");
            writeFileSync("playlist",playlist);
          } else if (options.path) {
            await parent.media.generatePlaylist(options.path);
          }
          parent.media.play(playlistPath,random);
          res.writeHead(200);
          res.end();
        } catch (e) {
          parent.server.failure(res,500,"Something went wrong while generating playlist\n"+e);
        }
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
      path: "/media/command",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
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
        ].find(e => e.name == options.command);
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
