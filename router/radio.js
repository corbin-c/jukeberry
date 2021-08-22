module.exports = (parent) => {
  const radioRoutes = [
    {
      path: "/radio/list",
      hdl: (req,res) => {
        parent.server.json(parent.radios.list)(req,res);
      }
    },
    {
      path: "/radio/toggle-favorite",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.url === "undefined") {
          parent.server.failure(res,500,"no radio url provided");
          return;
        }
        parent.radios.toggleFavorite(options.url);
        parent.server.json(parent.radios.list)(req,res);
      }
    },
    {
      path: "/radio/create",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.url === "undefined") {
          parent.server.failure(res,500,"no radio url provided");
          return;
        }
        if (typeof options.name === "undefined") {
          parent.server.failure(res,500,"no radio name provided");
          return;
        }
        parent.radios.create(options.name,options.url,options.favorite);
        parent.server.json(parent.radios.list)(req,res);
      }
    },
    {
      path: "/radio/delete",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.url === "undefined") {
          parent.server.failure(res,500,"no radio url provided");
          return;
        }
        parent.radios.removeRadio(options.url);
        parent.server.json(parent.radios.list)(req,res);
      }
    },
    {
      path: "/radio/play",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (!options.url) {
          parent.server.failure(res,500,"no radio url provided");
          return;
        }
        const radio = config.radioStreams
          .find(e => e.url == options.radio);
        if (typeof radio !== "undefined") {
          await parent.media.stop();
          await utils.wait(1000);
          parent.utils.spawnAndDetach("mplayer -slave -input file=./mplayer_master -msglevel all=4 "+options.url);
          parent.status = {
            playing: {
              mode: "radio",
              metadata: {
                title: radio.name
              },
              paused: false
            }
          };
          res.writeHead(200);
          res.end();
        } else {
          parent.server.failure(res,500,"no radio found");
        }
      }
    },
  ];
  return radioRoutes;
}
