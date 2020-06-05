import { Component, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-radio-view',
  templateUrl: './radio-view.component.html',
  styleUrls: ['./radio-view.component.css']
})
export class RadioViewComponent implements OnInit {

  constructor(private jukeberryService: JukeberryService) {

  }
  public radioList = [];
  ngOnInit(): void {
    this.jukeberryService.getRadioList().subscribe(
      (response) => {
        this.radioList = response;
      },
      (error) => {
        console.error(error);
      });
  }

}
