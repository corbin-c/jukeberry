const minimalServer = require("@corbin-c/minimal-server");

//Exposed server
const server = new minimalServer();

server.getRequestBody = (req) => {
  return new Promise((resolve,reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data);
      }
    });
  });
}

server.failure = (response,code,error) => {
  console.error(code,error);
  response.writeHead(code);
  response.write(error);
  response.end();
}

module.exports = server;
