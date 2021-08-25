module.exports = (parent) => {
  const searchRoutes = [
    {
      path: "/search/youtube",
      hdl: async (req,res) => {
        if (config.youtube !== false) {
          const options = await parent.server.getRequestBody(req);
          if (!options.query) {
            parent.server.failure(res,500,"no query provided");
            return;
          }
          console.log("Searching youtube for: "+options.query);
          parent.config.youtube.search(options.query, 15, (error, result) => {
            if (error) {
              parent.server.failure(res,500,error);
            } else {
              parent.server.json(result.items.map(e => ({
                id:e.id.videoId,
                channel:e.snippet.channelTitle,
                title:e.snippet.title,
                description:e.snippet.description
              })).filter(e => typeof e.id !== "undefined"))(req,res);
            }
          })
        } else {
          parent.server.failure(res,500,"no youtube API key provided");
        }
      }
    },
    {
      path: "/search/files",
      hdl: async (req,res,type) => {
        const options = await parent.server.getRequestBody(req);
        if (!options.query) {
          parent.server.failure(res,500,"no query provided");
          return;
        }
        type = type || ((options.type) ? options.type:"music");
        let list = parent.globalList[type+"Directory_list"];
        parent.server.json(
          parent.utils.search(options.query,type,list)
        )(req,res);
      }
    },
    {
      path: "/search/music",
      hdl: (req,res) => {
        searchRoutes.find(e => e.path == "/search/files").hdl(req,res,"music");
      }
    },
    {
      path: "/search/video",
      hdl: (req,res) => {
        searchRoutes.find(e => e.path == "/search/files").hdl(req,res,"video");
      }
    }
  ]
  return searchRoutes;
};
