import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { MusicViewComponent } from './music-view/music-view.component';
import { VideoViewComponent } from './video-view/video-view.component';
import { RadioViewComponent } from './radio-view/radio-view.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { NavComponent } from './nav/nav.component';

const appRoutes: Routes = [
  { path: 'music', component: MusicViewComponent },
  { path: 'video', component: VideoViewComponent },
  { path: 'radio', component: RadioViewComponent },
  { path: '', component: MusicViewComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    MusicViewComponent,
    VideoViewComponent,
    RadioViewComponent,
    FooterComponent,
    HeaderComponent,
    NavComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
