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
let failure = (response,code,error) => {
  response.writeHead(code);
  response.write(error);
};

let commands = [
  {query:"getTree",func:"serveBranch"},
  {query:"makeTree",func:"generateTrees"}
];
let servedFiles = [
  {pathname:"/",mime:"text/html"},
  {pathname:"/index.html",mime:"text/html"},
  {pathname:"/main.js",mime:"application/javascript"},
  {pathname:"/style.css",mime:"text/css"}
];

let Tree = {
  generateTrees: (response) => {
    response.writeHead(200);
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
  },
  getBranch: (tree,path,backpath="") => {
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
      return Tree.getBranch(tree,path,backpath);
    } else {
      return tree;
    }
  },
  cleanBranch: (tree) => {
    return tree.map(e => ({type:e.type,name:e.name}));
  },
  serveBranch: async (response,path) => {
    path = (path[path.length-1] == "/") ? path.slice(0,-1):path;
    let tree;
    try {
      tree = await getFile("./tree.json");
      tree = JSON.parse(tree);
    } catch {
      throw {code:404,text:"No tree :(\nTree couldn't be found.\nIn order to generate tree:\n\n\tcd "+DIRECTORY+"\n\ttree -Jif --noreport > ./tree.json\n\ttree -Fif --noreport | grep -v '/$' > ./liste"};
    }
    try {
      tree = Tree.getBranch(tree,path);
      tree = Tree.cleanBranch(tree);        
      response.writeHead(200, {"Content-Type": "application/json"});
      response.write(JSON.stringify(tree));
    } catch(e) {
      throw {code:400,text:"Bad request :\n"+e};
    }
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
  } else if (page.pathname == "/api") {
    try {
      let cmd = commands
        .find(q => q.query == page.searchParams.get("action"))
        .func;
      await Tree[cmd](res,page.searchParams.get("options"));
    } catch(e) {
      failure(res,e.code,e.text);
    }
  } else {
    failure(res,404,"Not found :(");
  }
  res.end();
});
server.listen(80);
