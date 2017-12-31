import { Component } from '@angular/core'

import { SceneDataService } from './scene-data.service'

@Component({
  selector: 'sb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(private sceneDataService: SceneDataService) {}

  getUsers() {
    return this.sceneDataService.users
  }

  getUserIds() {
    return Object.keys(this.sceneDataService.users)
  }
}
