const http = require("http");
const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.on("error", (e) => {
      reject(false);
      server.close();
    });
    server.on("listening", () => {
      resolve(true);
      server.close();
    });
    server.listen(port);
  });
}
(async () => {
  try {
    await checkPort(5000);
    const jb = require("./jukeberry.js");
    require("./logger.js")(jb.config.log);
  } catch(e) {
    console.error("port already in use. aborting",e);
    process.exit();
  }
})();

process.on("uncaughtException", function (err) {
  console.error(err);
});
