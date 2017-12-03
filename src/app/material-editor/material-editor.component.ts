import { EventEmitter, Output, Input, Component, OnInit } from '@angular/core'

import { Material } from '../material'

import { TextureService } from '../texture.service'

@Component({
  selector: 'sb-material-editor',
  templateUrl: './material-editor.component.html',
  styleUrls: ['./material-editor.component.css']
})
export class MaterialEditorComponent implements OnInit {

  @Input() material: Material
  @Output() change = new EventEmitter<void>()

  constructor(private textureService: TextureService) { }

  ngOnInit() {
  }

  listTextures () {
    return this.textureService.defaultTextureNames()
  }

  updateColor (color) {
    this.material.setColor(color.target.value)
    this.change.emit()
  }

}
