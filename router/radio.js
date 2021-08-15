module.exports = (requirements) => {
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
          await parent.media.stop();
          await utils.wait(1000);
          parent.utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -msglevel all=4 "+radio.url);
          parent.status = {
            playing: {
              mode: "radio",
              metadata: {
                title: req.page.searchParams.get("options")
              },
              paused: false
            }
          };
          res.writeHead(200);
          res.end();
        }
      }
    },
  ];
  return radioRoutes;
}
