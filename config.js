const YouTube = require("youtube-node");
const jsonConf = require("./config.json");
const CONFIG = (() => { // INIT CONFIG
  let conf = jsonConf;
  conf.directories = {};
  ["musicDirectory","videoDirectory"].map(e => {
    if (typeof conf[e] === "undefined") {
      conf.directories[e] = false;
    } else {
      conf.directories[e] = (conf[e][conf[e].length-1] == "/")
    ? conf[e]:conf[e]+"/";
    }
  });
  if (typeof conf["youtube-api-key"] === "undefined") {
    conf.youtube = false;
  } else {
    conf.youtube = new YouTube();
    conf.youtube.setKey(conf["youtube-api-key"]);
  }
  conf.log = (typeof conf.log === "boolean") ? conf.log : false;
  conf.files = ((dirs) => {
    let files = [];
    dirs.map(e => {
      if (conf.directories[e] !== false) {
        files.push(e+"_tree.json");
        files.push(e+"_list");
      }
    });
    return files;
  })(Object.keys(conf.directories));
  return conf;
})();
module.exports = CONFIG;
