module.exports = (parent) => {
  const podcastRoutes = [
    {
      path: "/podcast/list",
      hdl: (req,res) => {
        parent.server.json(parent.podcasts.list.map(e => ({ url: e.url, name: e.name })))(req,res);
      }
    },
    {
      path: "/podcast/create",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.url === "undefined") {
          parent.server.failure(res,500,"no podcast url provided");
          return;
        }
        await parent.podcasts.create(options.url);
        parent.server.json(parent.podcasts.list.map(e => ({ url: e.url, name: e.name })))(req,res);
      }
    },
    {
      path: "/podcast/update",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.url === "undefined") {
          parent.server.failure(res,500,"no podcast url provided");
          return;
        }
        await parent.podcasts.update(options.url);
        parent.server.json(parent.podcasts.list.find(e => e.url === options.url))(req,res);
      }
    },
    {
      path: "/podcast/delete",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.url === "undefined") {
          parent.server.failure(res,500,"no podcast url provided");
          return;
        }
        parent.podcasts.removeRadio(options.url);
        parent.server.json(parent.podcasts.list.map(e => ({ url: e.url, name: e.name })))(req,res);
      }
    },
    {
      path: "/podcast/play",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (!options.feedUrl) {
          parent.server.failure(res,500,"no podcast feed url provided");
          return;
        }
        if (!options.url) {
          parent.server.failure(res,500,"no podcast url provided");
          return;
        }
        const podcast = parent.podcasts.list
          .find(e => e.url === options.feedUrl)
          .episodes.find(e => e.url === options.url);
        if (typeof podcast !== "undefined") {
          parent.media.playRadio(podcast.name, options.url);
          res.writeHead(200);
          res.end();
        } else {
          parent.server.failure(res,500,"no podcast found");
        }
      }
    },
  ];
  return podcastRoutes;
}
