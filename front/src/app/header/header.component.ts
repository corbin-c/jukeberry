import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor() { }
  private navShown = false;
  private navReady = false;
  ngOnInit(): void {
  }
  public get isNavReady(): boolean {
    return this.navReady;
  }
  public get isNavShown(): boolean {
    return this.navShown;
  }
  public navIconStatus(): string {
    return (this.navShown) ? "×":"≡";
  }
  public toggleNav(): void {
    if (this.navShown) {
      this.navReady = !this.navReady;
    }
    setTimeout(() => { this.navShown = !this.navShown; },
      (this.navShown) ? 400:0);
    if (!this.navShown) {
      setTimeout(() => { this.navReady = !this.navReady; },50);
    }
  }
}
