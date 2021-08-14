const { exec } = require("child_process");

module.exports = (requirements) => {
  const {
    config,
    server,
    utils,
    media
  } = requirements;
  const youtubeRoutes = [
    {
      path: "/youtube/play",
      hdl: async (req,res) => {
        if (config.youtube !== false) {
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
    }
  ];
  return youtubeRoutes;
}
