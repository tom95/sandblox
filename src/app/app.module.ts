import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

import { BloxService } from './blox.service';
import { BuilderComponent } from './builder/builder.component';
import { BlockComponent } from './block/block.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    ToolbarComponent,
    BuilderComponent,
    BlockComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [
    BloxService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
