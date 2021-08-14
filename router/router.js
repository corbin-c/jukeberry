const subRoutes = [
  "./files.js",
  "./youtube.js",
  "./search.js",
  "./radio.js",
  "./media.js"
];

const routes = (requirements) => {
  let routes = [];
  subRoutes.map(r => {
    r = require(r)(requirements);
    routes.push(...r);
  })
  return routes;
}

module.exports = (req) => {
  return routes(req);
}
