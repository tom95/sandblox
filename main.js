let camera, scene, renderer, cameraControls, headLight, outlinePass, control, composer
let blocks = []
let container = document.getElementById('view')

function registerPicking (renderer, scene) {
  let justClick = false
  renderer.domElement.addEventListener('mousedown', event => { justClick = true })
  renderer.domElement.addEventListener('mousemove', event => { justClick = false })
  renderer.domElement.addEventListener('mouseup', event => {
    if (!justClick) return
    event.preventDefault()

    let rendererRect = renderer.domElement.getBoundingClientRect()

    let raycaster = new THREE.Raycaster()
    raycaster.setFromCamera({
      x: ((event.clientX - rendererRect.left) / rendererRect.width) * 2 - 1,
      y: -((event.clientY - rendererRect.top) / rendererRect.height) * 2 + 1
    }, camera)

    let intersects = raycaster.intersectObjects(blocks)
    if (intersects.length) {
      let picked = intersects[0].object
      control.attach(picked)
      outlinePass.selectedObjects = [picked]
    } else {
      outlinePass.selectedObjects = []
      control.detach()
    }
  })
}

function init () {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 7000)
  camera.position.set(300, 300, 300)

  scene.add(camera)

  let material = new THREE.MeshStandardMaterial({
    roughness: 0.8,
    metalness: 0.2,
    color: 0xccccccff
  })

  scene.add(new THREE.GridHelper(1000, 100, 0x333333, 0x333333))
  scene.add(new THREE.GridHelper(1000, 10, 0xffffff, 0xffffff))

  let object = new THREE.Mesh(new THREE.BoxBufferGeometry(100, 100, 100), material)
  object.position.set(0, 0, 0)
  scene.add(object)
  blocks.push(object)

  scene.add(new THREE.AmbientLight(0x333333, 0.3))
  headLight = new THREE.PointLight(0x888888, 1.0)
  scene.add(headLight)

  renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  composer = new THREE.EffectComposer(renderer)
  var renderPass = new THREE.RenderPass(scene, camera)
  composer.addPass(renderPass)
  outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
  composer.addPass(outlinePass)

  let outPass = new THREE.ShaderPass(THREE.CopyShader)
  outPass.renderToScreen = true
  composer.addPass(outPass)

  registerPicking(renderer, scene)

  new THREE.GLTFLoader().load('./roof_mid.gltf', data => {
    let block = data.scene.children[0]
    block.scale.set(50, 50, 50)
    scene.add(block)
    blocks.push(block)
  })

  control = new THREE.TransformControls(camera, renderer.domElement)
  control.setTranslationSnap(10)
  scene.add(control)

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement)
  cameraControls.enableDamping = true
  cameraControls.rotateSpeed = 0.3
  cameraControls.zoomSpeed = 0.6

  onWindowResize()
  window.addEventListener('resize', onWindowResize, false)
}
function onWindowResize () {
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
  composer.setSize(container.clientWidth, container.clientHeight)
}
function animate () {
  window.requestAnimationFrame(animate)
  headLight.position.set(camera.position.x, camera.position.y, camera.position.z)
  cameraControls.update()
  render()
}
function render () {
  // renderer.render(scene, camera)
  composer.render()
}

init()
animate()
