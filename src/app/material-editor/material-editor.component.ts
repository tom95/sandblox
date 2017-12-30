import { EventEmitter, Output, Input, Component, OnInit } from '@angular/core'

import { Material } from '../material'

import { TextureService } from '../texture.service'
import { SceneDataService } from '../scene-data.service'

@Component({
  selector: 'sb-material-editor',
  templateUrl: './material-editor.component.html',
  styleUrls: ['./material-editor.component.css']
})
export class MaterialEditorComponent implements OnInit {

  @Input() material: Material
  @Output() change = new EventEmitter<void>()

  constructor(private sceneDataService: SceneDataService,
              private textureService: TextureService) { }

  ngOnInit() {
  }

  listTextures () {
    return this.textureService.defaultTextureNames()
  }

  updateColor (color) {
    this.sceneDataService.setColor(this.material.id, color.target.value)
    this.change.emit()
  }

  updateTexture (texture) {
    this.sceneDataService.setTexture(this.material.id, texture)
    this.change.emit()
  }

}
