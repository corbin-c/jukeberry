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
    } else if (request.urlonly) {
      reqFunc = (param) => makeRequestURL(request.action,param);
    }else {
      reqFunc = (param) => { fetch(makeRequestURL(request.action,param)); };
    }
  }
  return reqFunc;
}
class Jukebox {
  constructor() {
    this.isStreaming = false;
    this.requests = [
      {name:"search",json:true,defaultValue:""},
      {name:"getTree",json:true,defaultValue:"./"},
      {name:"getRadios",json:true},
      {name:"playLive"},      //play live stream, eg. webradios
      {name:"ytp"},           //youtube player
      {name:"yts",json:true}, //youtube search
      {name:"currentSong",json:true,action:"getCurrentSong"},
      {name:"play",action:"playFile",defaultValue:"./"},
      {name:"streamPlay",defaultValue:"./",urlonly:true},
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
  set stream(bool) {
    this.isStreaming = (bool === true);
  }
  get stream() {
    return this.isStreaming;
  }
}
let Jukeberry = new Jukebox();
export { Jukeberry };
