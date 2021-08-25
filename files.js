const { writeFileSync } = require("fs");
const TreeMaker = require("@corbin-c/minimal-server/tree.js");

module.exports = class {
  constructor(parent) {
    this.parent = parent;
  }
  generateTrees() {
    let files = [];
    this.parent.config.files.map(e => {
      let dir = this.parent.config.directories[e.split("_")[0]];
      let tree = TreeMaker(dir);
      let json = e.split(".")[1] === "json";
      files.push({
        name:e,
        data: (json) ?
          JSON.stringify(tree.tree)
          : tree.list.map(e => e.replace("./",dir)).join("\n")
      });
      console.log(e,"successfully built");
    });
    for (let i of files) {
      writeFileSync(i.name,i.data);
    }
    return files;
    console.log("tree files written");
  }
  getTree(type="music") {
    type += "Directory_tree.json";
    return this.parent.globalList[type];
  }
  getParentFolder(path) {
    path = path.split("/");
    if (path.length > 1) {
      path.pop();
      path = path.join("/");
      return path;
    } else {
      return false;
    }
  }
  getBranch(tree,path,backpath="") {
    path = (path[path.length-1] == "/") ? path.slice(0,-1):path;
    let firstPath = path;
    path = path.split("/");
    tree = tree.find(e => e.name == backpath+path[0]).contents;
    if (typeof tree === "undefined") {
      throw new Error("no content found for query");
    }
    if (path.length > 1) {
      path.shift();
      path = path.join("/");
      backpath += firstPath.slice(0,firstPath.length-path.length)
      return this.getBranch(tree,path,backpath);
    } else {
      return tree;
    }
  }
  getPath(tree,path,output="") {
    let localPath = path.split("/");
    localPath = localPath.slice(0,output.split("contents").length);
    localPath = localPath.join("/");
    let newTree = tree.find(e => e.name==localPath);
    let index = tree.indexOf(newTree);
    output += "["+index+"].contents";
    if (output.split("contents").length == path.split("/").length+1) {
      return output;
    } else {
      return this.getPath(newTree.contents,path,output);
    }
  }
  cleanBranch(tree) {
    return tree.map(e => ({type:e.type,name:e.name}));
  }  
}
