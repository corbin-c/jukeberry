module.exports = (requirements) => {
  const {
    config,
    server,
    utils,
    globalList
  } = requirements;
  const searchRoutes = [
    {
      path: "/search/youtube",
      hdl: async (req,res) => {
        if (config.youtube !== false) {
          let searchString = req.page.searchParams.get("options");
          console.log("Searching youtube for: "+searchString);
          config.youtube.search(searchString, 15, (error, result) => {
            if (error) {
              server.failure(res,500,error);
            } else {
              server.json(result.items.map(e => ({
                id:e.id.videoId,
                channel:e.snippet.channelTitle,
                title:e.snippet.title,
                description:e.snippet.description
              })).filter(e => typeof e.id !== "undefined"))(req,res);
            }
          })
        } else {
          server.failure(res,500,"no youtube API key provided");
        }
      }
    },
    {
      path: "/search/files",
      hdl: (req,res,type) => {
        type = (type !== "music") ? "video":type;
        server.json(
          utils.search(req.page.searchParams.get("options"),globalList[type+"Directory_list"])
        )(req,res);
      }
    },
    {
      path: "/search/files/music",
      hdl: (req,res) => {
        searchRoutes.find(e => e.path == "/search/files").hdl(req,res,"music");
      }
    },
    {
      path: "/search/files/video",
      hdl: (req,res) => {
        searchRoutes.find(e => e.path == "/search/files").hdl(req,res,"video");
      }
    }
  ]
  return searchRoutes;
};
