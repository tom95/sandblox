import * as TH from 'three'

declare var THREE: any

declare class TransformControls extends TH.TransformControls {
  setTranslationSnap(value: number)
  setRotationSnap(value: number)
}

export class SBRenderer {

  container: HTMLElement

  renderer: TH.WebGLRenderer
  outlinePass: THREE.OutlinePass
  composer: THREE.EffectComposer

  scene: TH.Scene
  camera: TH.PerspectiveCamera
  headLight: TH.PointLight
  control: TransformControls
  cameraControls: THREE.OrbitControls

  blocks: TH.Object3D[] = []

  constructor(container) {
    this.container = container

    this.buildScene()
    this.buildRenderer()
    this.registerSelection()
    this.buildControls()
    this.resize()
  }

  buildRenderer () {
    this.renderer = new TH.WebGLRenderer({
      antialias: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.container.appendChild(this.renderer.domElement)

    const renderPass = new THREE.RenderPass(this.scene, this.camera)

    this.composer = new THREE.EffectComposer(this.renderer)
    this.composer.addPass(renderPass)
    this.outlinePass = new THREE.OutlinePass(new TH.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera)
    this.composer.addPass(this.outlinePass)

    const outPass = new THREE.ShaderPass(THREE.CopyShader)
    outPass.renderToScreen = true
    this.composer.addPass(outPass)
  }

  buildControls () {
    this.control = new THREE.TransformControls(this.camera, this.renderer.domElement)
    this.control.setTranslationSnap(10)
    this.control.setRotationSnap(this.degToRad(15))
    this.scene.add(this.control)

    this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.cameraControls.enableDamping = true
    this.cameraControls.rotateSpeed = 0.3
    this.cameraControls.zoomSpeed = 0.6
  }

  buildScene () {
    this.scene = new TH.Scene()

    this.camera = new TH.PerspectiveCamera(45, 1, 0.1, 7000)
    this.camera.position.set(300, 300, 300)

    this.headLight = new TH.PointLight(0x888888, 1.0)

    const light = new TH.DirectionalLight(0xffffff, 0.5)
    light.position.set(20, 20, 0)

    this.scene.add(light)
    this.scene.add(this.camera)
    this.scene.add(this.headLight)
    this.scene.add(new TH.AmbientLight(0x333333, 0.3))
    this.scene.add(new TH.GridHelper(1000, 100, 0x333333, 0x333333))
    this.scene.add(new TH.GridHelper(1000, 10, 0xffffff, 0xffffff))
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

      const intersects = raycaster.intersectObjects(this.selectableObjects())
      if (intersects.length) {
        this.select(intersects[0].object)
      } else {
        this.deselect()
      }
    })
  }

  update () {
    this.headLight.position.copy(this.camera.position)
    this.cameraControls.update()
    this.composer.render()
  }

  resize () {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  select (object) {
    this.control.attach(object)
    this.outlinePass.selectedObjects = [object]
  }

  deselect () {
    this.outlinePass.selectedObjects = []
    this.control.detach()
  }

  setTransformMode (mode) {
    this.control.setMode(mode)
  }

  degToRad (deg) {
    return deg * Math.PI / 180
  }

  loadBlock (identifier) {
    new THREE.GLTFLoader().load(`/public/blox/${identifier}.gltf`, data => {
      const block = data.scene.children[0]
      block.scale.set(100, 100, 100)
      this.scene.add(block)
      this.blocks.push(block)
      console.log('JI', identifier)
    })
  }

  selectableObjects () {
    return this.blocks
  }
}
