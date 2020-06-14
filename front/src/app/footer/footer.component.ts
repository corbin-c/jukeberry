import { Component, Input, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  constructor(private jukeberryService: JukeberryService) {
  }

  private status = { filename:"" }; 
  public getStatus() {
    let status = [];
    ["year","artist","album","title"].forEach(key => {
      if (typeof this.status["meta_"+key] !== "undefined") {
        status.push(this.status["meta_"+key]);
      }
    });
    if (status.length == 0) {
      return this.status.filename;
    } else {
      return status.join(" | ");
    }
  }
  public stop() {
    this.jukeberryService.query("/player/stop")();
  }
  public control(action) {
    this.jukeberryService.query("/player/commands",action)();
  }
  ngOnInit(): void {
    this.jukeberryService.getStatus((response) => {
      if (typeof response.filename !== "undefined") {
        this.status = response;
      } else {
        this.status = { filename:"" };
      }
    });
  }
}
