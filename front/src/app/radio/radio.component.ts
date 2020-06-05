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
  ngOnInit(): void {
    this.jukeberryService.getStatus((response) => {
      if (typeof response.radio_name !== "undefined") {
        this.status = (response.radio_name == this.radioName);
      }
      return true;
    });
  }
  getStatus() {
    return (this.status) ? "⏸️":"▶️"
  }
}
