const SIZE = 64
const Jimp = require('jimp')
const gl = require('gl')(SIZE, SIZE)
const GLTFLoader = require('./GLTFLoader')
const path = require('path')

// THREE.js setup
const THREE = require('three')
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xffffff)
// const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
const CAMERA_SIZE = 3 / 2
const camera = new THREE.OrthographicCamera(-CAMERA_SIZE, CAMERA_SIZE, CAMERA_SIZE, -CAMERA_SIZE, 0.1, 100)
scene.add(camera)
scene.add(new THREE.AmbientLight(0x333333, 0.7))
let light = new THREE.DirectionalLight(0xffffff, 1.0)
light.position.set(20, 20, 0)
scene.add(light)
camera.position.set(2, 2.5, 2)
camera.lookAt(new THREE.Vector3(0, 0.5, 0))

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  width: 0,
  height: 0,
  canvas: {addEventListener: () => {}},
  context: gl
})

new GLTFLoader().load(path.join(__dirname, '/public/blox/castle/roof_mid.gltf'), data => {
  let block = data.scene.children[0]
  // block.scale.set(0.01, 0.01, 0.01)
  scene.add(block)
  done()
}, () => {}, err => console.log(err))

function done () {
  let rtTexture = new THREE.WebGLRenderTarget(SIZE, SIZE, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
  })
  renderer.render(scene, camera, rtTexture, true)

  let pixels = new Uint8Array(SIZE * SIZE * 4)
  gl.readPixels(0, 0, SIZE, SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  let image = new Jimp(SIZE, SIZE)
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      let k = j * SIZE + i
      let m = (SIZE - j + 1) * SIZE + i
      for (let a = 0; a < 4; a++) {
        image.bitmap.data[4 * m + a] = pixels[4 * k + a]
      }
    }
  }
  image.write('out.png', err => {
    console.log(err)
  })
}
