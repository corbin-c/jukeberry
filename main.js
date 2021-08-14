const { writeFileSync } = require("fs");
const jb = require("./jukeberry.js");
require("./logger.js")(jb.config.log);

(async () => {
  try {
    execSync("mkfifo ./mplayer_master");
  } catch { /* NoOp, named pipe should already exist */ }
  await jb.server.enableStaticDir();
  try {
    jb.globalList = jb.utils.makeGlobalLists();
    console.info("success !");
  } catch(e) {
    console.warn(e.message);
    console.info("Building lists from scratch...");
    jb.generateTrees();
  }
  console.log("starting server...");
  try {
    jb.server.start();
    console.log("Server listening");
  } catch (e) {
    console.error(e);
    await utils.wait(5000);
    jb.server.start();
  }
  if (typeof jb.config.startupSound === "string") {
    try {
      writeFileSync("./playlist",jb.config.startupSound);
      jb.media.play("./playlist");
    } catch {
      console.error("Couldn't play startup sound");
    }
  } else {
    console.log("no startup sound configured");
  }
})();
