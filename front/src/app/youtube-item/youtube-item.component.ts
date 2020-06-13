import { Component, Input, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-youtube-item',
  templateUrl: './youtube-item.component.html',
  styleUrls: ['./youtube-item.component.css']
})
export class YoutubeItemComponent implements OnInit {

  constructor(private jukeberryService: JukeberryService) {
  }
  @Input() title: string;
  @Input() id: string;
  @Input() channel: string;
  @Input() description: string;

  private status: boolean = false; 
  private play() {
    this.jukeberryService.query("/youtube/play",this.id)();
  }
  private pause() {
    this.jukeberryService.query("/player/stop")();
  }
  public getStatus() {
    return (this.status) ? "⏹️️":"▶️"
  }
  public toggleStatus() {
    if (this.status) {
      this.pause();
    } else {
      this.play();
    }
  }
  ngOnInit(): void {
    this.jukeberryService.getStatus((response) => {
      if (typeof response.youtube !== "undefined") {
        this.status = (response.youtube == this.id);
      } else {
        this.status = false;
      }
    });
  }
}
