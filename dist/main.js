let makeRequestURL = (request,parameters=false) => {
  request += (parameters) ? "?options="+parameters:"";
  return request
};
let makeRequestFunc = (request) => {
  let reqFunc;
  if (request.json) {
    reqFunc = async (param=(request.defaultValue || false)) => {
      let req = await fetch(makeRequestURL(request.name,param));
      req = await req.json();
      return req;
    }
  } else {
    if (request.await) {
      reqFunc = async (param) => {
        await fetch(makeRequestURL(request.name,param));
      };
    } else if (request.urlonly) {
      reqFunc = (param) => makeRequestURL(request.name,param);
    } else {
      reqFunc = (param) => { fetch(makeRequestURL(request.name,param)); };
    }
  }
  return reqFunc;
}
class Jukebox {
  constructor() {
    this.isVideo = false;
    this.requests = [
      {name:"/files/search",json:true,defaultValue:""},
      {name:"/files/videoList",json:true,defaultValue:"./"},
      {name:"/files/list",json:true,defaultValue:"./"},
      {name:"/radio/list",json:true},
      {name:"/radio/play"},
      {name:"/youtube/play"},
      {name:"/youtube/search",json:true},
      {name:"/player/log",json:true},
      {name:"/player/play",defaultValue:"./"},
      {name:"/player/video",defaultValue:"./"},
      //{name:"streamPlay",defaultValue:"./",urlonly:true},
      {name:"/player/shuffle",defaultValue:"./"},
      {name:"/player/stop"},
      {name:"/player/halt"},
      {name:"/player/random"},
      {name:"/files/regenerate",await:true},
    ];
    this.requests.map(e => {
      let functionName = e.name.split("/").map((e,i) => {
        if (i > 1) {
          e = e[0].toUpperCase()+e.slice(1);
        }
        return e;
      }).join("");
      this[functionName] = makeRequestFunc(e);
    });
  }
  async upload(files) {
    await fetch("/files/upload", {method: "POST", body: files});
  }
  set video(bool) {
    this.isVideo = (bool === true);
  }
  get video() {
    return this.isVideo;
  }
}
let Jukeberry = new Jukebox();
export { Jukeberry };
