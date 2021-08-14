const formidable = require("formidable");
const fs = require("fs");

module.exports = (requirements) => {
  const {
    config,
    server,
    utils,
    files
  } = requirements;
  const filesRoutes = [
    {
      path: "/files/upload",
      hdl: (req,res) => {
        if (req.method == "POST") {
          let form = new formidable.IncomingForm(); //TODO: implement progress meter
          /*form.on("progress", function(bytesReceived, bytesExpected) {
            logger("log","upload processing: "+bytesReceived+" / "+bytesExpected);
          });
          form.on("fileBegin", function(name, file) {
            logger("log","begin file upload: "+name+" "+file);
          });
          form.on("file", function(name, file) {
            logger("log","file upload end: "+name+" "+file);
          });*/
          form.uploadDir = config.musicDirectory;
          form.keepExtensions = true;
          form.multiples = true;
          form.parse(req, (err, fields, files) => {
            let destination = fields.destination;
            destination += (destination[destination.length-1] == "/")
              ? ""
              : "/";
            let fsdestination = destination.replace("./",config.musicDirectory);
            if (!fs.existsSync(fsdestination)) {
              fs.mkdirSync(fsdestination);
            }
            for (let file of Object.values(files)) {
              console.log("Uploading file: "+fsdestination+file.name);
              fs.rename(file.path, fsdestination+file.name, (err) => { 
                console.error("Error while moving file",file.name);
              });
            }
            files.generateTrees();
          });
        }
      }
    },
    {
      path: "/files/list",
      hdl: (req,res,type="music") => {
        let path = req.page.searchParams.get("options");
        let tree = files.getTree(type);
        try {
          tree = files.getBranch(tree,path);
          tree = files.cleanBranch(tree);
          if (type == "video") {
            tree = tree.filter(e => ["srt","sub"].indexOf(e.name.split(".").reverse()[0]) < 0)
          }
          let parentpath = files.getParentFolder(path);
          if (parentpath) {
            tree.unshift({type:"parentdir",name:parentpath});
          }
          server.json(tree)(req,res);
        } catch(e) {
          server.failure(res,400,"Bad request :\n"+e);
        }
      }
    },
    {
      path: "/files/list/music",
      hdl: (req,res) => {
        filesRoutes.find(e => e.path == "/files/list").hdl(req,res,"music");
      }
    },
    {
      path: "/files/list/video",
      hdl: (req,res) => {
        filesRoutes.find(e => e.path == "/files/list").hdl(req,res,"video");
      }
    },
    {
      path: "/files/regenerate",
      hdl: (req,res) => {
        try {
          res.writeHead(200);
          files.generateTrees();
          res.end();
        } catch {
          server.failure(res,500,"Internal server error while generating files tree");
        }
      }
    }
  ];
  return filesRoutes;
}
