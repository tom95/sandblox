let camera, scene, renderer, cameraControls
let container = document.getElementById('view')

function init () {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 7000)
  camera.position.set(300, 300, 300)

  scene.add(camera)

  let material = new THREE.MeshBasicMaterial({color: 0xccccccff})

  scene.add(new THREE.GridHelper(1000, 100, 0x333333, 0x333333))
  scene.add(new THREE.GridHelper(1000, 10, 0xffffff, 0xffffff))

  let object = new THREE.Mesh(new THREE.BoxBufferGeometry(100, 100, 100), material)
  object.position.set(0, 0, 0)
  scene.add(object)

  var light = new THREE.DirectionalLight(0xffffff)
  light.position.set(1, 1, 1)
  scene.add(light)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  let control = new THREE.TransformControls(camera, renderer.domElement)
  control.setTranslationSnap(10)
  control.attach(object)
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
}
function animate () {
  window.requestAnimationFrame(animate)
  cameraControls.update()
  render()
}
function render () {
  renderer.render(scene, camera)
}

init()
animate()
