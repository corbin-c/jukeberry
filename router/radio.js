module.exports = (requirements) => {
  const {
    config,
    server,
    utils,
    media
  } = requirements;
  const radioRoutes = [
    {
      path: "/radio/list",
      hdl: (req,res) => {
        server.json(config.radioStreams.map(e => e.name))(req,res);
      }
    },
    {
      path: "/radio/play",
      hdl: async (req,res) => {
        let radio = config.radioStreams
          .find(e => e.name == req.page.searchParams.get("options"));
        if (typeof radio !== "undefined") {
          await media.stop();
          await utils.wait(1000);
          utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -msglevel all=4 "+radio.url);
          utils.sendLog({radio_name:req.page.searchParams.get("options")});
          res.writeHead(200);
          res.end();
        }
      }
    },
  ];
  return radioRoutes;
}
