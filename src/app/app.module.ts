import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgModule } from '@angular/core'
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component'
import { SidebarComponent } from './sidebar/sidebar.component'
import { ToolbarComponent } from './toolbar/toolbar.component'

import { BloxService } from './blox.service'
import { TextureService } from './texture.service'
import { MaterialService } from './material.service'
import { SceneDataService } from './scene-data.service'

import { BuilderComponent } from './builder/builder.component'
import { BlockComponent } from './block/block.component'
import { MaterialComponent } from './material/material.component'
import { MaterialEditorComponent } from './material-editor/material-editor.component'

import { MatGridListModule } from '@angular/material'
import { MatTabsModule } from '@angular/material'
import { MatMenuModule } from '@angular/material'
import { MatButtonModule } from '@angular/material'
import { MatSliderModule } from '@angular/material'

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    ToolbarComponent,
    BuilderComponent,
    BlockComponent,
    MaterialComponent,
    MaterialEditorComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatGridListModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonModule,
    MatSliderModule
  ],
  providers: [
    BloxService,
    TextureService,
    MaterialService,
    SceneDataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
