import { Component, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-music-view',
  templateUrl: './music-view.component.html',
  styleUrls: ['./music-view.component.css']
})
export class MusicViewComponent implements OnInit {

  constructor(private jukeberryService: JukeberryService) {
  }

  public currentPath: string = "./";
  public currentFolder;
  private parentFolder: string;
  private getDirectory(path) {
    path = (path === ".") ? "./":path;
    this.jukeberryService.query("/files/list",path)((response) => {
      this.currentPath = path;
      this.parentFolder = response.find(item => item.type === "parentdir").name;
      this.currentFolder = response.filter(item => item.type !== "parentdir");
    });
  }
  private playDirectory(path) {
    this.jukeberryService.query("/player/recursivePlay",path)();
  }
  private shuffleDirectory(path) {
    this.jukeberryService.query("/player/shuffle",path)();
  }
  private playFile(path) {
    this.jukeberryService.query("/player/play",path)();
  }
  private addToPlaylist(path) {
    
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
