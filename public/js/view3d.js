
class View3D {

  constructor (container) {
    this.container = container

    this.buildScene()
    this.buildRenderer()
    this.registerSelection()
    this.buildControls()
    this.resize()
  }

  buildRenderer () {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.container.appendChild(this.renderer.domElement)

    this.composer = new THREE.EffectComposer(this.renderer)
    let renderPass = new THREE.RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)
    this.outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera)
    this.composer.addPass(this.outlinePass)

    let outPass = new THREE.ShaderPass(THREE.CopyShader)
    outPass.renderToScreen = true
    this.composer.addPass(outPass)

    window.addEventListener('resize', () => { this.resize() }, false)
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

  buildControls () {
    this.control = new THREE.TransformControls(this.camera, this.renderer.domElement)
    this.control.setTranslationSnap(10)
    this.scene.add(this.control)

    this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.cameraControls.enableDamping = true
    this.cameraControls.rotateSpeed = 0.3
    this.cameraControls.zoomSpeed = 0.6
  }

  buildScene () {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 7000)
    this.camera.position.set(300, 300, 300)

    this.headLight = new THREE.PointLight(0x888888, 1.0)

    this.scene.add(this.camera)
    this.scene.add(this.headLight)
    this.scene.add(new THREE.AmbientLight(0x333333, 0.3))
    this.scene.add(new THREE.GridHelper(1000, 100, 0x333333, 0x333333))
    this.scene.add(new THREE.GridHelper(1000, 10, 0xffffff, 0xffffff))
  }
  registerSelection () {
    let justClick = false
    this.renderer.domElement.addEventListener('mousedown', event => { justClick = true })
    this.renderer.domElement.addEventListener('mousemove', event => { justClick = false })
    this.renderer.domElement.addEventListener('mouseup', event => {
      if (!justClick) return
      event.preventDefault()

      let rendererRect = this.renderer.domElement.getBoundingClientRect()

      let raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({
        x: ((event.clientX - rendererRect.left) / rendererRect.width) * 2 - 1,
        y: -((event.clientY - rendererRect.top) / rendererRect.height) * 2 + 1
      }, this.camera)

      let intersects = raycaster.intersectObjects(this.selectableObjects())
      if (intersects.length) {
        this.select(intersects[0].object)
      } else {
        this.deselect()
      }
    })
  }

  select (object) {
    this.control.attach(object)
    this.outlinePass.selectedObjects = [object]
  }

  deselect () {
    this.outlinePass.selectedObjects = []
    this.control.detach()
  }

  selectableObjects () {
    return []
  }
}

class BlockBuilder extends View3D {
  constructor (container) {
    super(container)

    this.blocks = []
    this.addExampleCube()
    this.loadBlock()
  }

  loadBlock (url) {
    new THREE.GLTFLoader().load('./roof_mid.gltf', data => {
      let block = data.scene.children[0]
      block.scale.set(50, 50, 50)
      this.scene.add(block)
      this.blocks.push(block)
    })
  }

  selectableObjects () {
    return this.blocks
  }

  addExampleCube () {
    let material = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.2,
      color: 0xccccccff
    })

    let object = new THREE.Mesh(new THREE.BoxBufferGeometry(100, 100, 100), material)
    object.position.set(0, 0, 0)
    this.scene.add(object)
    this.blocks.push(object)
  }
}
