import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-music-item',
  templateUrl: './music-item.component.html',
  styleUrls: ['./music-item.component.css']
})
export class MusicItemComponent implements OnInit {
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
