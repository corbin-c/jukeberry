import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MusicViewComponent } from './music-view/music-view.component';
import { VideoViewComponent } from './video-view/video-view.component';
import { RadioViewComponent } from './radio-view/radio-view.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { NavComponent } from './nav/nav.component';
import { JukeberryService } from './services/jukeberry.service';
import { RadioComponent } from './radio/radio.component';

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
    NavComponent,
    RadioComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    JukeberryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
