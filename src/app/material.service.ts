import { Injectable } from '@angular/core'

import { TextureService } from './texture.service'
import { Material } from './material'

@Injectable()
export class MaterialService {

  constructor (private textureService: TextureService) { }

  create (color, texture = null) {
    return new Material(this.textureService, color, texture)
  }

}
