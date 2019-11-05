const fs = require("fs");
const { execSync } = require("child_process");
const http = require("http");

const DIRECTORY = fs.readFileSync("config","utf8").split("\n")[0];

let getFile = (path) => {
  return new Promise((resolve,reject) => {
    fs.readFile(path,"utf-8",(error,data) => {
      if (error) { reject(error); }
      resolve(data);
    });
  });
}
let failure = (response,error) => {
  response.writeHead(400);
  response.write("Bad request :(\n"+error);
  response.end();
};

let commands = [
  {query:"tree",func:"serveBranch"},
  {query:"regenerate",func:"generateTrees"}
];
let servedFiles = [
  {pathname:"/",mime:"text/html"},
  {pathname:"/index.html",mime:"text/html"},
  {pathname:"/main.js",mime:"application/javascript"},
  {pathname:"/style.css",mime:"text/css"}
];

let Tree = {
  generateTrees: () => {
    let files = [];
    files.push({
      name:"tree.json",
      data:execSync("tree -Jif --noreport", {cwd:DIRECTORY})
    });
    files.push({
      name:"liste",
      data:execSync("tree -Fif --noreport | grep -v '/$'", {cwd:DIRECTORY})
    });
    for (i of files) {
      fs.writeFileSync(i.name,i.data);
    }
    return JSON.stringify({done:true})
  },
  getBranch: (tree,path,backpath="") => {
    let firstPath = path;
    path = path.split("/");
    tree = tree.find(e => e.name == backpath+path[0]).contents;
    if (path.length > 1) {
      path.shift();
      path = path.join("/");
      backpath += firstPath.slice(0,firstPath.length-path.length)
      return Tree.getBranch(tree,path,backpath);
    } else {
      return tree;
    }
  },
  cleanBranch: (tree) => {
    return tree.map(e => ({type:e.type,name:e.name}));
  },
  serveBranch: async (path) => {
    path = (path[path.length-1] == "/") ? path.slice(0,-1):path;
    let tree = await getFile("./tree.json");
    tree = JSON.parse(tree);
    tree = Tree.getBranch(tree,path);
    tree = Tree.cleanBranch(tree);
    return JSON.stringify(tree);
  }
}

let server = http.createServer(async function(req, res) {
  let page = new URL("http://dummy.com"+req.url);
  let served = servedFiles.filter(e => e.pathname == page.pathname)
  if (served.length > 0) {
    served = served[0];
    res.writeHead(200, {"Content-Type": served.mime});
    served = (page.pathname == "/") ? "/index.html":page.pathname;
    served = served.slice(1);
    served = await getFile(served);
    res.write(served);
    res.end();
  } else if (page.pathname == "/api") {
    try {
      res.writeHead(200, {"Content-Type": "application/json"});
      let cmd = commands
        .find(q => q.query == page.searchParams.get("query"))
        .func;
      cmd = await Tree[cmd](page.searchParams.get("options"));
      res.write(cmd);
      res.end();
    } catch(e) {
      failure(res,e);
    }
  } else {
    res.writeHead(404);
    res.write("Not found :(");
    res.end();
  }
});
server.listen(80);
