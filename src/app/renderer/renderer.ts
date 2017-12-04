import * as TH from 'three'

declare var THREE: any

import { TextureService } from '../texture.service'

import { CameraControls } from './orbit-controls'

import { Material } from '../material'

declare class TransformControls extends TH.TransformControls {
  setTranslationSnap(value: number)
  setRotationSnap(value: number)
  addEventListener(event, func)
}

const BASE_SCALE = 1

export class SBRenderer {

  dirty = true

  container: HTMLElement

  composer: THREE.EffectComposer
  saoPass: THREE.SAOPass
  renderer: TH.WebGLRenderer
  outlineMaterial: THREE.ShaderMaterial
  outlineScene = new TH.Scene()

  scene = new TH.Scene()
  camera: TH.PerspectiveCamera
  control: TransformControls
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

    this.scene.background = new THREE.Color('#cccccc')
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
    this.saoPass = new THREE.SAOPass(this.scene, this.camera, true, true, new TH.Vector2(1024, 1024))
    this.saoPass.renderToScreen = true

    this.composer.addPass(renderPass)
    this.composer.addPass(this.saoPass)
  }

  buildControls () {
    this.control = new THREE.TransformControls(this.camera, this.renderer.domElement)
    this.control.setTranslationSnap(0.1)
    this.control.setRotationSnap(this.degToRad(15))
    this.control.addEventListener('change', () => {
      if (this.control.object) {
        this.control.object.userData.outlineCopy.position.copy(this.control.object.position)
      }
      this.setDirty()
    })
    this.scene.add(this.control)

    this.cameraControls = new CameraControls(this.camera, this.renderer.domElement)
    this.cameraControls.rotateSpeed = 0.5
    this.cameraControls.zoomSpeed = 0.6
    this.cameraControls.onUpdate = () => this.setDirty()
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
    this.renderer.clear()
    // this.renderer.render(this.outlineScene, this.camera)
    // this.renderer.render(this.scene, this.camera)
    this.composer.render()
  }

  resize () {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  select (object) {
    if (this.control.object) {
      this.outlineScene.remove(this.control.object.userData.outlineCopy)
    }

    this.control.attach(object)

    if (object.type === 'Group') {
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
    }
  }

  outlineCopyFor (object) {
    const copy = new TH.Mesh(object.geometry, this.outlineMaterial)
    copy.scale.set(BASE_SCALE + 1, BASE_SCALE + 1, BASE_SCALE + 1)
    copy.position.copy(object.position)
    return copy
  }

  deselect () {
    if (this.control.object) {
      this.outlineScene.remove(this.control.object.userData.outlineCopy)
    }
    this.control.detach()
  }

  setTransformMode (mode) {
    this.control.setMode(mode)
  }

  buildOutlineMaterial () {
    this.outlineMaterial = new THREE.ShaderMaterial({
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
      console.log(block)
      block.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE)
      block.material = new THREE.MeshPhongMaterial(0xffffff)
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

  setExposure (value: number) {
    this.renderer.toneMappingExposure = value
    this.setDirty()
  }

  setAmbientOcclusion (value: number) {
    this.saoPass.params.saoIntensity = value
    this.setDirty()
  }
}
