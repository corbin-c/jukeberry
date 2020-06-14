import { Component, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-video-view',
  templateUrl: './video-view.component.html',
  styleUrls: ['./video-view.component.css']
})
export class VideoViewComponent implements OnInit {

  constructor(private jukeberryService: JukeberryService) {
  }

  public currentPath: string = "./";
  public currentFolder;
  private parentFolder: string;
  private getDirectory(path) {
    path = (path === ".") ? "./":path;
    this.jukeberryService.query("/files/videoList",path)((response) => {
      this.currentPath = path;
      this.parentFolder = response.find(item => item.type === "parentdir").name;
      this.currentFolder = response.filter(item => item.type !== "parentdir");
    });
  }
  private playFile(path) {
    this.jukeberryService.query("/player/video",path)();
  }
  public goToParent() {
    this.getDirectory(this.parentFolder)
  }
  public onAction(event,source) {
    this[event](source);
  }
  ngOnInit(): void {
    this.getDirectory("./");
  }
}
