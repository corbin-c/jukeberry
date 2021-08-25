import { Component, Input, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.css']
})
export class RadioComponent implements OnInit {
  constructor(private jukeberryService: JukeberryService) {
  }
  @Input() radioName: string;
  private status: boolean = false; 
  private play() {
    this.jukeberryService.query("/radio/play",this.radioName)();
  }
  private pause() {
    this.jukeberryService.query("/player/stop")();
  }
  public getStatus() {
    return (this.status) ? "⏹️️":"▶️️"
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
      if (typeof response.radio_name !== "undefined") {
        this.status = (response.radio_name == this.radioName);
      } else {
        this.status = false;
      }
    });
  }
}
