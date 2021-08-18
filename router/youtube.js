const { exec } = require("child_process");

module.exports = (requirements) => {
  const youtubeRoutes = [
    {
      path: "/youtube/play",
      hdl: async (req,res) => {
        if (config.youtube !== false) {
          await parent.media.stop();
          await utils.wait(1000);
          const options = await parent.server.getRequestBody(req);
          if (!options.id) {
            server.failure(res,500,"no youtube video ID provided");
            return;
          }
          console.log("Playing youtube video ID #"+options.id);
          const url = await ((id) => {
            return new Promise((resolve, reject) => {
              exec("./node_modules/ytdl/bin/ytdl.js --print-url https://www.youtube.com/watch?v="+id,
                (error, stdout, stderr) => {
                if (error) {
                  server.failure(res,404,"error fetching video"+error+stderr)
                }
                resolve(stdout.split("\n")[0]);
              });
          })})(options.id);
          parent.utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -novideo -msglevel all=-1 "+url);
          parent.status = {
            playing: {
              mode: "youtube",
              paused: false,
              metadata: options
            }
          };
          res.writeHead(200);
          res.end()
        } else {
          server.failure(res,500,"no youtube API key provided");
        }
      }
    }
  ];
  return youtubeRoutes;
}
