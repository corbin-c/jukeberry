import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { JukeberryService } from './services/jukeberry.service';
import { NormalizeNamePipe } from './normalize-name.pipe';

import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { NavComponent } from './nav/nav.component';
import { MusicViewComponent } from './music-view/music-view.component';
import { MusicItemComponent } from './music-item/music-item.component';
import { VideoViewComponent } from './video-view/video-view.component';
import { RadioViewComponent } from './radio-view/radio-view.component';
import { RadioComponent } from './radio/radio.component';
import { YoutubeViewComponent } from './youtube-view/youtube-view.component';
import { YoutubeItemComponent } from './youtube-item/youtube-item.component';
import { VideoItemComponent } from './video-item/video-item.component';

const appRoutes: Routes = [
  { path: 'youtube', component: YoutubeViewComponent },
  { path: 'music', component: MusicViewComponent },
  { path: 'video', component: VideoViewComponent },
  { path: 'radio', component: RadioViewComponent },
  { path: '', component: MusicViewComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    NormalizeNamePipe,
    MusicViewComponent,
    VideoViewComponent,
    RadioViewComponent,
    FooterComponent,
    HeaderComponent,
    NavComponent,
    RadioComponent,
    YoutubeViewComponent,
    YoutubeItemComponent,
    MusicItemComponent,
    VideoItemComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    JukeberryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
