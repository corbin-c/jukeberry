import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class JukeberryService {
  constructor(private httpClient: HttpClient) { }
  private status = webSocket("ws://localhost:5000");
  private root = "http://localhost:5000";
  private requests = [
    {path:"/files/search",defaultValue:""},
    {path:"/files/videoList",defaultValue:"./"},
    {path:"/files/list",defaultValue:"./"},
    {path:"/radio/list"},
    {path:"/radio/play"},
    {path:"/youtube/play"},
    {path:"/youtube/search"},
    {path:"/player/play",defaultValue:"./"},
    {path:"/player/video",defaultValue:"./"},
    {path:"/player/shuffle",defaultValue:"./"},
    {path:"/player/stop"},
    {path:"/player/halt"},
    {path:"/player/random"},
    {path:"/files/regenerate"},
  ];

  private requestMaker(path:string,options=false):Observable<any[]> {
    let request = this.requests.find(r => r.path == path);
    if (!options && typeof request.defaultValue !== "undefined") {
      request.path += "?options="+request.defaultValue;
    } else if (options) {
      request.path += "?options="+options;
    }
    return this.httpClient.get<any[]>(this.root+request.path)
  }

  public getRadioList():Observable<any[]> {
    return this.requestMaker("/radio/list");
  }
  public getStatus(...callback) {
    return this.status.subscribe(...callback);
  }
}
