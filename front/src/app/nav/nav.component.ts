import { Component, OnInit } from '@angular/core';
import { JukeberryService } from '../services/jukeberry.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  constructor(private jukeberryService: JukeberryService) { }

  ngOnInit(): void {
  }
  public random(): void {
      this.jukeberryService.query("/player/random")();
  }
  public regenerate(): void {
      this.jukeberryService.query("/files/regenerate")();
  }
  public halt(): void {
    if (confirm(`Ceci va éteindre le dispositif et couper la connexion.
Êtes-vous sûr ?`)) {
      this.jukeberryService.query("/player/halt")();
    }
  }
}
