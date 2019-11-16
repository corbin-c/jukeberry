let makeRequestURL = (action,parameters=false) => {
  let request = "./api?action="+action;
  request += (parameters) ? "&options="+parameters:"";
  return request
};
let makeRequestFunc = (request) => {
  let reqFunc;
  if (request.json) {
    reqFunc = async (param=(request.defaultValue || false)) => {
      let req = await fetch(makeRequestURL(request.action,param));
      req = await req.json();
      return req;
    }
  } else {
    if (request.await) {
      reqFunc = async (param) => {
        await fetch(makeRequestURL(request.action,param));
      };
    } else {
      reqFunc = (param) => { fetch(makeRequestURL(request.action,param)); };
    }
  }
  return reqFunc;
}
class Jukebox {
  constructor() {
    this.requests = [
      {name:"search",json:true,defaultValue:""},
      {name:"getTree",json:true,defaultValue:"./"},
      {name:"currentSong",json:true,action:"getCurrentSong"},
      {name:"play",action:"playFile",defaultValue:"./"},
      {name:"playRandom",action:"playRandom",defaultValue:"./"},
      {name:"stop"},
      {name:"halt"},
      {name:"allRandom",action:"playAllRandom"},
      {name:"regenerate",action:"makeTree",await:true},
    ];
    this.requests.map(e => {
      e.action = (typeof e.action === "undefined")?e.name:e.action;
      this[e.name] = makeRequestFunc(e);
    });
  }
  async upload(files) {
    await fetch("./api", {method: "POST", body: files});
  }
}
let Jukeberry = new Jukebox();
export { Jukeberry };
