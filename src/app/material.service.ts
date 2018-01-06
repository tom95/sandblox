import { Injectable } from '@angular/core'

import { TextureService } from './texture.service'
import { Material } from './material'

@Injectable()
export class MaterialService {

  constructor (private textureService: TextureService) { }

  create (color = null, texture = null) {
    return new Material(this.textureService, color || '#ffffff', texture)
  }

  fromExisting (id, color, texture) {
    const mat = new Material(this.textureService, color, texture)
    mat.updateId(id)
    return mat
  }

  createDefault () {
    return this.create('#ffffff', null)
  }

}
