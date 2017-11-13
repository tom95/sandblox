/* global THREE */
let camera, scene, renderer
let container = document.getElementById('view')

function init () {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000)
  camera.position.set(300, 300, 300)
  scene.add(camera)

  let material = new THREE.MeshBasicMaterial({})

  let grid = new THREE.GridHelper(1000, 10)
  scene.add(grid)

  let object = new THREE.Mesh(new THREE.BoxBufferGeometry(100, 100, 100), material)
  object.position.set(0, 0, 0)
  scene.add(object)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

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
  render()
}
function render () {
  camera.lookAt(0, 0, 0)
  renderer.render(scene, camera)
}

init()
animate()
