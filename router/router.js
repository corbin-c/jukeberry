const subRoutes = [
  "./files.js",
  "./youtube.js",
  "./search.js",
  "./playlist.js",
  "./radio.js",
  "./media.js"
];

const routes = (parent) => {
  let routes = [
    {
      path: "/status",
      hdl: (req,res) => {
        parent.server.json(parent.status)(req,res);
      }
    }
  ];
  subRoutes.map(r => {
    r = require(r)(parent);
    routes.push(...r);
  })
  return routes;
}

module.exports = (p) => {
  return routes(p);
}
