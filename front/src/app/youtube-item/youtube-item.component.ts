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

  ngOnInit(): void {
  }

}
