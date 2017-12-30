import { Injectable } from '@angular/core'

import * as TH from 'three'
import { Material } from './material'
import { TextureService } from './texture.service'
import { MaterialService } from './material.service'
import { SBRenderer } from './renderer/renderer'

declare var io: any

interface IEnvironment {
  ambientOcclusion: number
  exposure: number
}

@Injectable()
export class SceneDataService {

  selectedBlock: TH.Mesh

  blocks: TH.Mesh[] = []
  blockMap: {[id: string]: TH.Mesh} = {}

  materials: Material[] = []
  materialMap: {[id: string]: Material} = {}

  renderer: SBRenderer

  ownUpdate = false

  myUserId: string = null

  environment: IEnvironment = {
    ambientOcclusion: 0,
    exposure: 1
  }

  socket: any

  constructor(private textureService: TextureService, private materialService: MaterialService) {
    this.socket = io()

    this.blocks = []

    this.socket.on('setScene', scene => this.importSandblox(scene, this.renderer))

    for (const message of [
      'moveBlock',
      'setExposure',
      'setAmbientOcclusion',
      'rotateBlock',
      'deleteBlock',
      'selectBlock',
      'setColor',
      'setMaterial',
      'setTexture',
      'addMaterial',
      'addBlock',
      'addUser',
      'removeUser'
    ]) {
      this.socket.on(message, data => {
        console.log('Received ', message)
        this.ownUpdate = true
        this[message](...data)
        this.ownUpdate = false
      })
    }
  }

  broadcast (message: string, data: any) {
    if (!this.ownUpdate) {
      console.log('Emitting', message)
      this.socket.emit(message, data)
    }
  }

  addUser(userId: string, color: string, isSelf: boolean) {
    if (isSelf) {
      this.myUserId = userId
    }
    this.renderer.addUser(userId, color, isSelf)
  }

  removeUser (userId) {
    this.renderer.removeUser(userId)
  }

  setExposure (exposure) {
    this.environment.exposure = exposure
    this.renderer.setExposure(exposure)
    this.broadcast('setExposure', [exposure])
  }

  setAmbientOcclusion (ambientOcclusion) {
    this.environment.ambientOcclusion = ambientOcclusion
    this.renderer.setAmbientOcclusion(ambientOcclusion)
    this.broadcast('setAmbientOcclusion', [ambientOcclusion])
  }

  moveBlock (id: string, position: THREE.Vector3) {
    this.blockMap[id].position.copy(position)
    this.renderer.setDirty()
    this.broadcast('moveBlock', [id, position])
  }

  rotateBlock (id: string, rotation: number) {
    this.blockMap[id].rotation.set(0, TH.Math.degToRad(rotation), 0)
    this.renderer.setDirty()
    this.broadcast('rotateBlock', [id, rotation])
  }

  rotateSelectedBlock () {
    this.rotateBlock(this.selectedBlock.userData.blockId,
                     TH.Math.radToDeg(this.selectedBlock.rotation.y + Math.PI / 2))
  }

  deleteBlock (id: string) {
    this.renderer.deleteBlock(this.blockMap[id])
    delete this.blockMap[id]
    this.blocks.splice(this.blocks.findIndex(b => id === b.userData.blockId), 1)
    this.broadcast('deleteBlock', [id])
  }

  deleteSelectedBlock () {
    if (this.selectedBlock) {
      this.deleteBlock(this.selectedBlock.userData.blockId)
      this.renderer.select(null, this.myUserId)
    }
  }

  addBlock (blockName: string, id: string = null) {
    id = id || this.generateId()

    this.renderer.addBlock(blockName, id).then(block => {
      this.blockMap[id] = block
      this.blocks.push(block)
    })
    this.broadcast('addBlock', [blockName, id])
  }

  selectBlock (id: string, userId: string) {
    this.renderer.select(id ? this.blockMap[id] : null, userId)
    if (this.myUserId === userId) {
      this.selectedBlock = id ? this.blockMap[id] : null
    }
    this.broadcast('selectBlock', [id, userId])
  }

  deselect () {
    this.selectBlock(null, this.myUserId)
  }

  setTexture (id: string, url: string) {
    this.materialMap[id].setTexture(url)
    this.renderer.setDirty()
    this.broadcast('setTexture', [id, url])
  }

  setColor (id: string, color: string) {
    this.materialMap[id].setColor(color)
    this.renderer.setDirty()
    this.broadcast('setColor', [id, color])
  }

  setMaterial (blockId: string, materialId: string) {
    this.blockMap[blockId].material = this.materialMap[materialId].glMaterial
    this.renderer.setDirty()
    this.broadcast('setMaterial', [blockId, materialId])
  }

  addMaterial (color: string = null, texture: string = null, id: string = null) {
    id = id || this.generateId()

    const material = this.materialService.create(color, texture)
    material.id = id
    this.materialMap[id] = material
    this.materials.push(material)
    this.broadcast('addMaterial', [material.color, material.texture, id])
    return material
  }

  generateId () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
  }

  importSandblox (data, renderer: SBRenderer) {
    this.renderer.clearScene()

    if (!data.materials) {
      return
    }

    this.materials = data.materials.map(m =>
      this.materialService.fromExisting(m.id, m.color, m.texture))
    this.blocks = []

    renderer.setExposure(data.environment.exposure)
    renderer.setAmbientOcclusion(data.environment.ambientOcclusion)

    return Promise.all(data.blocks.map(info => renderer.addBlock(info.block, info.id).then(block => [block, info])))
      .then((blocks: [TH.Mesh, any][]) => {
        for (const [block, info] of blocks) {
          block.position.fromArray(info.position)
          block.rotation.set(0, TH.Math.degToRad(info.rotation), 0)
          block.material = this.materials[info.material]
            ? this.materials[info.material].glMaterial
            : renderer.getDefaultMaterial()
          this.blocks.push(block)
          this.blockMap[info.id] = block
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
        block: block.userData.block,
        id: block.userData.blockId
      })),
      environment: this.environment
    }
  }
}
