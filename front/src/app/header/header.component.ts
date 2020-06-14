import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor() { }
  private navShown = false;
  ngOnInit(): void {
  }
  public get isNavShown(): boolean {
    return this.navShown;
  }
  public navIconStatus(): string {
    return (this.navShown) ? "×":"≡";
  }
  public toggleNav(): void {
    this.navShown = !this.navShown;
  }
}
