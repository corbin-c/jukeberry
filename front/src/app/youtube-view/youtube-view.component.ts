import { Component, Input, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-youtube-view',
  templateUrl: './youtube-view.component.html',
  styleUrls: ['./youtube-view.component.css']
})
export class YoutubeViewComponent implements OnInit {

  constructor(private jukeberryService: JukeberryService) {

  }
  ngOnInit(): void {

  }
  public searchInput:string = "";
  public searchResults:array<any> = [];
  public search(value) {
    this.jukeberryService.query("/youtube/search",this.searchInput)((response) => {
      this.searchResults = response;
      console.log(this.searchResults);
    });
  }
}
