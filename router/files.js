const formidable = require("formidable");
const fs = require("fs");

module.exports = (parent) => {
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
          form.uploadDir = parent.config.musicDirectory;
          form.keepExtensions = true;
          form.multiples = true;
          form.parse(req, (err, fields, files) => {
            let destination = fields.destination;
            destination += (destination[destination.length-1] == "/")
              ? ""
              : "/";
            let fsdestination = destination.replace("./",parent.config.musicDirectory);
            if (!fs.existsSync(fsdestination)) {
              fs.mkdirSync(fsdestination);
            }
            for (let file of Object.values(files)) {
              console.log("Uploading file: "+fsdestination+file.name);
              fs.rename(file.path, fsdestination+file.name, (err) => { 
                console.error("Error while moving file",file.name);
              });
            }
            parent.files.generateTrees();
          });
        }
      }
    },
    {
      path: "/files/list",
      hdl: async (req,res,type) => {
        const options = await parent.server.getRequestBody(req);
        type = type || ((options.type) ? options.type:"music");
        if (!options.path) {
          server.failure(res,500,"no path provided");
          return;
        }
        let tree = parent.files.getTree(type);
        try {
          tree = parent.files.getBranch(tree,options.path);
          tree = parent.files.cleanBranch(tree);
          if (type == "video") {
            tree = tree.filter(e => ["srt","sub"].indexOf(e.name.split(".").reverse()[0]) < 0)
          }
          let parentpath = parent.files.getParentFolder(options.path);
          if (parentpath) {
            tree.unshift({type:"parentdir",name:parentpath});
          }
          parent.server.json(tree)(req,res);
        } catch(e) {
          parent.server.failure(res,400,"Bad request :\n"+e);
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
          parent.files.generateTrees();
          res.writeHead(200);
          res.end();
        } catch {
          parent.server.failure(res,500,"Internal server error while generating files tree");
        }
      }
    }
  ];
  return filesRoutes;
}
