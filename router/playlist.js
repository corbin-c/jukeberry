module.exports = (parent) => {
  const playlistRoutes = [
    {
      path: "/playlist/all",
      hdl: (req,res) => {
        parent.server.json(parent.playlist.list)(req,res);
      }
    },
    {
      path: "/playlist/get",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.id === "undefined") {
          parent.server.failure(res,500,"no playlist id provided");
          return;
        }
        parent.server.json(parent.playlist.getPlaylist(options.id))(req,res);
      }
    },
    {
      path: "/playlist/create",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (!options.name) {
          parent.server.failure(res,500,"no playlist name provided");
          return;
        }
        const playlistid = parent.playlist.create(options.name);
        if (options.song) {
          parent.playlist.add(playlistid,options.song)
        }
        parent.server.json(parent.playlist.list)(req,res);
      }
    },
    {
      path: "/playlist/add",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.id === "undefined") {
          parent.server.failure(res,500,"no playlist id provided");
          return;
        }
        if (!options.song) {
          server.failure(res,500,"no song path provided");
          return;
        }
        try {
          parent.playlist.add(options.id,options.song);
          parent.server.json(parent.playlist.getPlaylist(options.id))(req,res);
        } catch(e) {
          parent.server.failure(res,500,e.message);
        }
      }
    },
    {
      path: "/playlist/remove",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.id === "undefined") {
          parent.server.failure(res,500,"no playlist id provided");
          return;
        }
        if (!options.song) {
          parent.server.failure(res,500,"no song path provided");
          return;
        }
        parent.playlist.removeSong(options.id,options.song);
        parent.server.json(parent.playlist.getPlaylist(options.id))(req,res);
      }
    },
    {
      path: "/playlist/organize",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.id === "undefined") {
          parent.server.failure(res,500,"no playlist id provided");
          return;
        }
        if (!options.song) {
          parent.server.failure(res,500,"no song path provided");
          return;
        }
        if (typeof options.position === "undefined") {
          parent.server.failure(res,500,"no song position provided");
          return;
        }
        parent.playlist.organize(options.id,options.song,options.position);
        parent.server.json(parent.playlist.getPlaylist(options.id))(req,res);
      }
    },
    {
      path: "/playlist/delete",
      hdl: async (req,res) => {
        const options = await parent.server.getRequestBody(req);
        if (typeof options.id === "undefined") {
          server.failure(res,500,"no playlist id provided");
          return;
        }
        parent.playlist.removePlaylist(options.id);
        parent.server.json(parent.playlist.list)(req,res);
      }
    }
  ]
  return playlistRoutes;
};
