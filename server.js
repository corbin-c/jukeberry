const minimalServer = require("@corbin-c/minimal-server");

//Exposed server
const server = new minimalServer();

server.failure = (response,code,error) => {
  console.error(code,error);
  response.writeHead(code);
  response.write(error);
  response.end();
}

module.exports = server;
