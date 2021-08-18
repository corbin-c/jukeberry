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
        const options = await parent.server.getRequestBody(req);
        if (!options.radio) {
          server.failure(res,500,"no radio name provided");
          return;
        }
        const radio = config.radioStreams
          .find(e => e.name == options.radio);
        if (typeof radio !== "undefined") {
          await parent.media.stop();
          await utils.wait(1000);
          parent.utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -msglevel all=4 "+radio.url);
          parent.status = {
            playing: {
              mode: "radio",
              metadata: {
                title: options.radio
              },
              paused: false
            }
          };
          res.writeHead(200);
          res.end();
        } else {
          server.failure(res,500,"no radio found");
        }
      }
    },
  ];
  return radioRoutes;
}
