import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class JukeberryService {
  constructor(private httpClient: HttpClient) {
    
  }
// testing:
  private endpoint = "http://localhost:5000";
  private status = webSocket("ws://localhost:5000");
// deployment:
//  private endpoint = "";
//  private status = webSocket("ws://"+document.location.host);
  private requests = [
    {path:"/files/search",defaultValue:""},
    {path:"/files/videoList",defaultValue:"./"},
    {path:"/files/list",defaultValue:"./"},
    {path:"/files/regenerate"},
    {path:"/radio/list"},
    {path:"/radio/play"},
    {path:"/youtube/play"},
    {path:"/youtube/search"},
    {path:"/player/commands"},
    {path:"/player/play",defaultValue:"./"},
    {path:"/player/video",defaultValue:"./"},
    {path:"/player/shuffle",defaultValue:"./"},
    {path:"/player/recursivePlay",defaultValue:"./"},
    {path:"/player/stop"},
    {path:"/player/halt"},
    {path:"/player/random"}
  ];
  public query(path:string,options?) {
    let request = [...this.requests].find(r => r.path == path);
    if ((typeof options === "undefined")
      && (typeof request.defaultValue !== "undefined")) {
      path += "?options="+request.defaultValue;
    } else if (options) {
      path += "?options="+options;
    }
    return (...callback) => {
      return this.httpClient
        .get<any[]>(this.endpoint+path)
        .subscribe(...callback);
    }
  }  
  public getStatus(...callback) {
    return this.status.subscribe(...callback);
  }
}
