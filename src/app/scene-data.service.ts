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

  users: {[id: string]: string} = {}

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

    this.socket.on('disconnect', () => {
      this.users = {}
      this.renderer.removeAllUsers()
    })

    for (const message of [
      'setScene',
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

  addUser (userId: string, color: string, isSelf: boolean) {
    if (isSelf) {
      this.myUserId = userId
    }

    this.users[userId] = color
    this.renderer.addUser(userId, color, isSelf)
  }

  removeUser (userId) {
    this.renderer.removeUser(userId)
    delete this.users[userId]
  }

  setScene (scene) {
    this.importSandblox(scene)
    this.broadcast('setScene', [scene])
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
    this.renderer.updateSelectionBoxes()
    this.renderer.setDirty()
    this.broadcast('moveBlock', [id, position.toArray()])
  }

  rotateBlock (id: string, rotation: number) {
    this.blockMap[id].rotation.set(0, TH.Math.degToRad(rotation), 0)
    this.renderer.updateSelectionBoxes()
    this.renderer.setDirty()
    this.broadcast('rotateBlock', [id, rotation])
  }

  rotateSelectedBlock () {
    if (this.selectedBlock) {
      this.rotateBlock(this.selectedBlock.userData.blockId,
                       TH.Math.radToDeg(this.selectedBlock.rotation.y + Math.PI / 2))
    }
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

  /**
   * Adds the block identified by blockName to the scene. If no id is given,
   * one will be generated and returned. If requireImmediate is true, the block
   * will only be added if the necessary data exists in the cache. Otherwise an
   * error will be thrown.
   */
  addBlock (blockName: string, id: string = null, requireImmediate = false) {
    id = id || this.generateId()

    if (!requireImmediate) {
      this.renderer.addBlock(blockName, id).then(block => {
        this.blockMap[id] = block
        this.blocks.push(block)
      })
    } else {
      const block = this.renderer.addBlockImmediateOrFail(blockName, id)
      this.blockMap[id] = block
      this.blocks.push(block)
    }
    this.broadcast('addBlock', [blockName, id])

    return id
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

  setMaterial (blockId: string, materialId: string, childIndex: number) {
    console.log(materialId, this.materialMap)
    const mat = this.materialMap[materialId].glMaterial
    if (this.blockMap[blockId].type === 'Group') {
      (<TH.Mesh> this.blockMap[blockId].children[childIndex]).material = mat
    } else {
      this.blockMap[blockId].material = mat
    }
    this.renderer.setDirty()
    this.broadcast('setMaterial', [blockId, materialId, childIndex])
  }

  addMaterial (color: string = null, texture: string = null, id: string = null) {
    id = id || this.generateId()

    const material = this.materialService.create(color, texture)
    material.updateId(id)
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

  getUsedGeometryMap (): {[name: string]: THREE.BufferGeometry} {
    const map = {}
    for (const block of this.blocks) {
         map[block.userData.block] = block.geometry as THREE.BufferGeometry
    }
    return map
  }

  importSandblox (data) {
    console.log('Importing scene', data)
    this.renderer.clearScene()

    if (!data.materials) {
      return
    }

    this.materials = data.materials.map(m =>
      this.materialService.fromExisting(m.id, m.color, m.texture))
    for (const mat of this.materials) {
      this.materialMap[mat.id] = mat
    }
    this.blocks = []

    this.renderer.setExposure(data.environment.exposure)
    this.renderer.setAmbientOcclusion(data.environment.ambientOcclusion)

    return Promise.all(data.blocks.map(info => this.renderer.addBlock(info.block, info.id).then(block => [block, info])))
      .then((blocks: [TH.Mesh, any][]) => {
        for (const [block, info] of blocks) {
          block.position.fromArray(info.position)
          block.rotation.set(0, TH.Math.degToRad(info.rotation), 0)
          if (block.type === 'Group') {
            block.children.forEach((c, i) => (<TH.Mesh> c).material = this.glMaterialForId(info.material[i]))
          } else {
            block.material = this.glMaterialForId(info.material[0])
          }
          this.blocks.push(block)
          this.blockMap[info.id] = block
        }
      })
      .catch(err => alert(err))
  }

  glMaterialForId(id: string): TH.Material {
    return this.materialMap[id]
      ? this.materialMap[id].glMaterial
      : this.renderer.getDefaultMaterial()
  }

  exportSandblox () {
    return {
      materials: this.materials.map(m => m.export()),
      blocks: this.blocks.map(block => ({
        material: block.type === 'Group'
          ? block.children.map(b => (<TH.Material> (<TH.Mesh> b).material).id)
          : [(<TH.Material> block.material).id],
        position: block.position.toArray(),
        rotation: TH.Math.radToDeg(block.rotation.y),
        block: block.userData.block,
        id: block.userData.blockId
      })),
      environment: this.environment
    }
  }
}
