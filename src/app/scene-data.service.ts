import { Injectable } from '@angular/core'

import * as TH from 'three'
import { Material } from './material'
import { TextureService } from './texture.service'
import { MaterialService } from './material.service'
import { SBRenderer } from './renderer/renderer'

interface IEnvironment {
  ambientOcclusion: number
  exposure: number
}

@Injectable()
export class SceneDataService {

  blocks: THREE.Mesh[]
  materials: Material[]

  environment: IEnvironment = {
    ambientOcclusion: 0,
    exposure: 1
  }

  constructor(private textureService: TextureService, private materialService: MaterialService) {
    this.materials = [
      this.materialService.create('#ff0000'),
      this.materialService.create('#00ff00'),
      this.materialService.create('#0000ff'),
      this.materialService.create('#ffffff', 'wall.png')
    ]
    this.blocks = []
  }

  importSandblox (data, renderer: SBRenderer) {
    this.materials = data.materials.map(m => this.materialService.create(m.color, m.texture))
    this.blocks = []

    renderer.setExposure(data.environment.exposure)
    renderer.setAmbientOcclusion(data.environment.ambientOcclusion)

    return Promise.all(data.blocks.map(info => renderer.addBlock(info.block).then(block => [block, info])))
      .then((blocks: [TH.Mesh, any][]) => {
        for (const [block, info] of blocks) {
          block.position.fromArray(info.position)
          block.rotation.set(0, TH.Math.degToRad(info.rotation), 0)
          block.material = this.materials[info.material]
            ? this.materials[info.material].glMaterial
            : renderer.getDefaultMaterial()
        }
      })
      .catch(err => alert(err))
  }

  exportSandblox () {
    return {
      materials: this.materials.map(m => m.export()),
      blocks: this.blocks.map(block => ({
        material: this.materials.findIndex(m => m.glMaterial === block.material),
        position: block.position.toArray(),
        rotation: TH.Math.radToDeg(block.rotation.y),
        block: block.userData.block
      })),
      environment: this.environment
    }
  }
}
