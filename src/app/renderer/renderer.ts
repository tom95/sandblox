import * as TH from 'three'

import { TextureService } from '../texture.service'

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

  blocks: TH.Object3D[] = []
  materialPicker: Material

  constructor (private textureService: TextureService, container: HTMLElement) {
    this.container = container
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
    /*this.control = new THREE.TransformControls(this.camera, this.renderer.domElement)
    this.control.setTranslationSnap(0.1)
    this.control.setRotationSnap(this.degToRad(15))
    this.control.addEventListener('change', () => {
      if (this.control.object) {
        this.control.object.userData.outlineCopy.position.copy(this.control.object.position)
      }
      this.setDirty()
    })
    this.scene.add(this.control)*/

    this.control = new Gizmo(this.renderer.domElement, this.camera)
    this.control.updated.subscribe(() => this.setDirty())
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
          (<TH.Mesh> intersects[0].object).material = this.materialPicker.glMaterial
        } else {
          const picked = intersects[0].object
          this.select(picked.parent.type === 'Group' ? picked.parent : picked)
        }
      } else {
        this.deselect()
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

  select (object) {
    if (this.control.target) {
      this.outlineScene.remove(this.control.target.userData.outlineCopy)
    }

    this.control.attach(object)

    /*if (object.type === 'Group') {
      const copy = new TH.Group()
      object.userData.outlineCopy = copy
      for (const child of object.children) {
        copy.add(this.outlineCopyFor(child))
      }
      copy.position.copy(object.position)
      this.outlineScene.add(copy)
    } else {
      const copy = this.outlineCopyFor(object)
      this.outlineScene.add(copy)
      object.userData.outlineCopy = copy
    }*/
  }

  outlineCopyFor (object) {
    const copy = new TH.Mesh(object.geometry, this.outlineMaterial)
    copy.scale.set(BASE_SCALE + 0.01, BASE_SCALE + 0.01, BASE_SCALE + 0.01)
    copy.position.copy(object.position)
    return copy
  }

  deselect () {
    if (this.control.target) {
      this.outlineScene.remove(this.control.target.userData.outlineCopy)
    }
    this.control.detach()
  }

  duplicateAndSelect (block: TH.Object3D) {
    const dupl = block.clone()
    this.blocks.push(dupl)
    this.scene.add(dupl)
    this.select(dupl)
    dupl.position.copy(block.position)
    return dupl
  }

  setTransformMode (mode) {
    // FIXME this.control.setMode(mode)
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

  degToRad (deg) {
    return deg * Math.PI / 180
  }

  loadBlock (identifier) {
    new THREE.GLTFLoader().load(`/public/blox/${identifier}.gltf`, data => {
      const block = data.scene.children[0]
      block.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE)
      block.material = new TH.MeshPhongMaterial({color: 0xffffff})
      block.position.set(BASE_SCALE / 2, 0, BASE_SCALE / 2)
      this.scene.add(block)
      this.blocks.push(block)
      this.setDirty()
    })
  }

  setDirty() {
    this.dirty = true
  }

  selectableObjects () {
    return this.blocks
  }

  setMaterialPicker (material: Material) {
    this.materialPicker = material
  }

  rotateSelected () {
    if (this.control.target) {
      this.control.target.rotateY(Math.PI / 2)
      this.setDirty()
    }
  }

  deleteSelected () {
    if (this.control.target) {
      this.scene.remove(this.control.target)
      this.blocks.splice(this.blocks.indexOf(this.control.target), 1)
      this.control.detach()
      this.setDirty()
    }
  }

  flipSelected (vec: TH.Vector3) {
    // TODO do this with rotations and translations as this flips normals
    if (this.control.target) {
      this.control.target.scale.multiply(vec)
    }
  }

  setExposure (value: number) {
    this.renderer.toneMappingExposure = value
    this.setDirty()
  }

  setAmbientOcclusion (value: number) {
    if (value <= 0) {
      this.ssaoPass.enabled = false
    } else {
      this.ssaoPass.enabled = true
      this.ssaoPass.radius = value
    }
    this.setDirty()
  }
}
