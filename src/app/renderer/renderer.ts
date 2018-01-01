import * as TH from 'three'

import { TextureService } from '../texture.service'
import { SceneDataService } from '../scene-data.service'

import { GLTFExporter } from './gltf-exporter'
import { X3DExporter } from './x3d-exporter'
import { CameraControls } from './orbit-controls'
import { Gizmo } from './gizmo'

import { Material } from '../material'

// declare var THREE: any
export declare namespace THREE {
  export class Pass {
    renderToScreen: boolean
    clear: boolean
    enabled: boolean
    needsSwap: boolean
  }
  export class BoxHelper extends TH.LineSegments {
    constructor(object?: TH.Object3D, color?: TH.Color|number)
    update()
    setFromObject(object: TH.Object3D)
  }
  export class CopyShader {}
  export class GLTFLoader {
    load(file: string, callback: any)
  }
  export class TransformControls extends TH.Object3D {
    constructor(camera: TH.Camera, elem: HTMLElement)
    object: TH.Object3D
    attach(object: TH.Object3D)
    detach()
    setMode(mode: string)
    setTranslationSnap(value: number)
    setRotationSnap(value: number)
    addEventListener(event, func)
  }
  export class SAOPass extends Pass {
    constructor(scene: TH.Scene, camera: TH.Camera, depth: boolean, normals: boolean, resolution: TH.Vector2)
    params: any
  }
  export class SSAOPass extends Pass {
    constructor(scene: TH.Scene, camera: TH.Camera)
    radius: number
    lumInfluence: number
    aoClamp: number
  }
  export class EffectComposer {
    constructor(renderer: TH.Renderer)
    addPass(pass: any)
    render()
    setSize(width: number, height: number)
  }
  export class RenderPass extends Pass {
    constructor(scene: TH.Scene, camera: TH.Camera)
    clearDepth: boolean
  }
  export class ShaderPass extends Pass {
    constructor(shader: any)
  }
}

const BASE_SCALE = 1

export class SBRenderer {

  dirty = true

  container: HTMLElement

  composer: THREE.EffectComposer
  ssaoPass: THREE.SSAOPass
  renderer: TH.WebGLRenderer
  outlineMaterial: TH.ShaderMaterial
  outlineScene = new TH.Scene()

  scene = new TH.Scene()
  camera: TH.PerspectiveCamera
  control: Gizmo
  cameraControls: any

  blockGeometries: TH.BufferGeometry[] = []
  materialPicker: Material

  defaultMaterial: TH.MeshStandardMaterial = null
  userSelectionBoxes: {[id: string]: THREE.BoxHelper} = {}
  myUserId: string = null

  constructor (private textureService: TextureService,
               private sceneDataService: SceneDataService,
               container: HTMLElement) {
    this.container = container
    this.sceneDataService.renderer = this
  }

  build () {
    this.buildScene()
    this.buildRenderer()
    this.buildOutlineMaterial()
    this.registerSelection()
    this.buildControls()
    this.resize()
  }

  buildScene () {
    this.camera = new TH.PerspectiveCamera(60, 1, 1, 10)
    this.camera.position.set(3, 3, 3)

    const ambient = new TH.AmbientLight(0xffffff, 0.3)

    const light = new TH.DirectionalLight(0xffffff, 0.8)
    light.position.set(0.5, 0, 0.866)

    this.camera.add(light)
    this.camera.add(ambient)

    this.scene.background = new TH.Color(0xcccccc)
    this.scene.add(this.camera)
    this.scene.add(new TH.AmbientLight(0x333333, 0.3))
    // this.scene.add(new TH.GridHelper(1000, 100, 0x333333, 0x333333))
    // this.scene.add(new TH.GridHelper(1000, 10, 0xffffff, 0xffffff))
  }

  buildRenderer () {
    this.renderer = new TH.WebGLRenderer({
      antialias: true
    })
    this.renderer.autoClear = false
    this.renderer.toneMappingExposure = 2
    this.renderer.gammaOutput = true
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.container.appendChild(this.renderer.domElement)

    this.composer = new THREE.EffectComposer(this.renderer)

    const renderPass = new THREE.RenderPass(this.scene, this.camera)
    renderPass.clear = true
    renderPass.renderToScreen = false
    this.composer.addPass(renderPass)

    this.ssaoPass = new THREE.SSAOPass(this.scene, this.camera)
    this.ssaoPass.lumInfluence = 1.1
    this.ssaoPass.renderToScreen = false
    this.composer.addPass(this.ssaoPass)

    const copyPass = new THREE.ShaderPass(THREE.CopyShader)
    copyPass.renderToScreen = false
    this.composer.addPass(copyPass)

    const outlineRenderPass = new THREE.RenderPass(this.outlineScene, this.camera)
    outlineRenderPass.clear = false
    outlineRenderPass.clearDepth = true
    outlineRenderPass.renderToScreen = false
    this.composer.addPass(outlineRenderPass)

    const copyPass2 = new THREE.ShaderPass(THREE.CopyShader)
    copyPass2.renderToScreen = true
    this.composer.addPass(copyPass2)
  }

  buildControls () {
    this.control = new Gizmo(this.renderer.domElement, this.camera)
    this.control.updated.subscribe(() => {
      this.setDirty()
      this.updateSelectionBoxes()
      // FIXME: try this. this.sceneDataService.moveBlock(this.control.target.userData.blockId, position)
    })
    this.control.finishUpdate.subscribe(position => {
      this.sceneDataService.moveBlock(this.control.target.userData.blockId, position)
    })
    this.control.duplicate.subscribe(block => this.duplicateAndSelect(block))
    this.control.snapIncrement = 0.1
    this.outlineScene.add(this.control)

    this.cameraControls = new CameraControls(this.camera, this.renderer.domElement)
    this.cameraControls.rotateSpeed = 0.5
    this.cameraControls.zoomSpeed = 0.6
    this.cameraControls.onUpdate = () => this.setDirty()

    const light = new TH.DirectionalLight(0xffffff, 0.8)
    light.position.set(0.5, 0, 0.866)
    this.outlineScene.background = null
    this.outlineScene.add(light)
    this.outlineScene.add(new TH.AmbientLight(0x787878, 0.8))
  }

  registerSelection () {
    let justClick = false
    this.renderer.domElement.addEventListener('mousedown', event => { justClick = true })
    this.renderer.domElement.addEventListener('mousemove', event => { justClick = false })
    this.renderer.domElement.addEventListener('mouseup', event => {
      if (!justClick) {
        return
      }

      event.preventDefault()

      const rendererRect = this.renderer.domElement.getBoundingClientRect()

      const raycaster = new TH.Raycaster()
      raycaster.setFromCamera({
        x: ((event.clientX - rendererRect.left) / rendererRect.width) * 2 - 1,
        y: -((event.clientY - rendererRect.top) / rendererRect.height) * 2 + 1
      }, this.camera)

      const intersects = raycaster.intersectObjects(this.selectableObjects(), true)
      if (intersects.length) {
        if (this.materialPicker) {
          const block = (<TH.Mesh> intersects[0].object).userData.blockId
          console.log(this.materialPicker)
          this.sceneDataService.setMaterial(block, this.materialPicker.id)
        } else {
          const picked = intersects[0].object
          this.sceneDataService.selectBlock((picked.parent.type === 'Group' ? picked.parent : picked).userData.blockId, this.myUserId)
        }
      } else {
        this.sceneDataService.deselect()
      }
    })
  }

  update () {
    this.dirty = false
    this.composer.render()
  }

  resize () {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  updateSelectionBoxes () {
    for (const box of Object.values(this.userSelectionBoxes)) {
      box.update()
    }
  }

  select (object: TH.Mesh, userId: string) {
    this.userSelectionBoxes[userId].visible = !!object

    if (object) {
      if (userId === this.myUserId) {
        this.control.attach(object)
      }
      this.userSelectionBoxes[userId].setFromObject(object)
    } else if (userId === this.myUserId) {
      this.control.detach()
    }

    this.setDirty()
  }

  addUser (userId: string, color: string, isSelf: boolean) {
    if (!this.userSelectionBoxes[userId]) {
      const helper = new THREE.BoxHelper(undefined, new TH.Color(color))
      helper.material = new TH.LineBasicMaterial({ color: color, linewidth: 5 })
      helper.visible = false
      this.userSelectionBoxes[userId] = helper
      this.scene.add(helper)
    }
    if (isSelf) {
      this.myUserId = userId
    }
  }

  removeUser (userId) {
    this.scene.remove(this.userSelectionBoxes[userId])
    delete this.userSelectionBoxes[userId]
  }

  removeAllUsers () {
    for (const [id, box] of Object.entries(this.userSelectionBoxes)) {
      this.scene.remove(box)
      delete this.userSelectionBoxes[id]
    }
  }

  duplicateAndSelect (block: TH.Mesh) {
    const id = this.sceneDataService.addBlock(block.userData.block, null, true)
    this.sceneDataService.moveBlock(id, block.position)
    this.sceneDataService.selectBlock(id, this.myUserId)
  }

  buildOutlineMaterial () {
    this.outlineMaterial = new TH.ShaderMaterial({
      uniforms: {
        offset: { value: 0 / BASE_SCALE }
      },
      vertexShader: `
      uniform float offset;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * offset, 1.0);
      }
      `,
      fragmentShader: `
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
      `
    })
    this.outlineMaterial.depthWrite = false
  }

  getDefaultMaterial () {
    if (!this.defaultMaterial) {
      this.defaultMaterial = new TH.MeshStandardMaterial()
    }
    return this.defaultMaterial
  }

  addBlockImmediateOrFail (blockName: string, id: string): TH.Mesh {
    const geometry = this.blockGeometries[blockName]
    if (!geometry) {
      throw new Error('Geometry for ' + blockName + ' is not loaded.')
    }

    const block = new TH.Mesh(geometry, this.getDefaultMaterial())
    block.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE)
    block.position.set(BASE_SCALE / 2, 0, BASE_SCALE / 2)
    block.userData.block = blockName
    block.userData.blockId = id
    this.scene.add(block)
    this.setDirty()
    return block
  }

  addBlock (blockName: string, id: string): Promise<TH.Mesh> {
    return this.loadBlock(blockName).then(() => this.addBlockImmediateOrFail(blockName, id))
  }

  loadBlock (blockName): Promise<TH.BufferGeometry> {
    let geometry = this.blockGeometries[blockName]
    if (geometry) {
      return Promise.resolve(geometry)
    }

    return new Promise((resolve, reject) => {
      new THREE.GLTFLoader().load(`/public/blox/${blockName}.gltf`, data => {
        geometry = data.scene.children[0].geometry as TH.BufferGeometry
        if (!geometry) {
          console.log(data)
          return alert('Error: Could not find geometry in downloaded gltf block!')
        }
        geometry.name = blockName
        this.blockGeometries[blockName] = geometry
        resolve(geometry)
      })
    })
  }

  setDirty() {
    this.dirty = true
  }

  selectableObjects () {
    return this.sceneDataService.blocks
  }

  setMaterialPicker (material: Material) {
    this.materialPicker = material
  }

  deleteBlock (block) {
    this.scene.remove(block)
    this.setDirty()
  }

  setExposure (value: number) {
    this.renderer.toneMappingExposure = value
    this.setDirty()
  }

  setAmbientOcclusion (value: number) {
    if (value <= 0) {
      this.ssaoPass.enabled = false
      this.ssaoPass.radius = 0
    } else {
      this.ssaoPass.enabled = true
      this.ssaoPass.radius = value
    }
    this.setDirty()
  }

  exportGLTF (binary = false) {
    return new Promise((resolve, reject) => {
      const exportScene = new TH.Scene()
      for (const block of this.sceneDataService.blocks) { exportScene.add(block) }

      new GLTFExporter().parse(exportScene, data => {
        for (const block of this.sceneDataService.blocks) { this.scene.add(block) }
        resolve(data)
      }, {binary})
    })
  }

  exportX3D () {
    return Promise.resolve(new X3DExporter().export(this.sceneDataService))
  }

  clearScene () {
    for (const b of this.sceneDataService.blocks) {
      this.scene.remove(b)
    }

    this.sceneDataService.blocks = []
  }
}
