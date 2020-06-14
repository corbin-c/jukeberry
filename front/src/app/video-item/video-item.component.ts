import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-video-item',
  templateUrl: './video-item.component.html',
  styleUrls: ['./video-item.component.css']
})
export class VideoItemComponent implements OnInit {
  constructor(private jukeberryService: JukeberryService) {
  }
  @Input() name: string;
  @Input() type: string;
  @Output() action = new EventEmitter<string>();
  ngOnInit(): void {
  }
  public setAction(value) {
    this.action.emit(value);
  }
}
