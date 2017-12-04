require('require-rebuild')();
const SIZE = 128
const Jimp = require('jimp')
const gl = require('gl')(SIZE, SIZE)
const THREE = require('three')
const GLTFLoader = require('./GLTFLoader')
const path = require('path')

module.exports = class GLRenderer {
  constructor () {
    this.scene = new THREE.Scene()
    // this.scene.background = new THREE.Color(0xffffff)
    // this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    const CAMERA_SIZE = 1
    this.camera = new THREE.OrthographicCamera(-CAMERA_SIZE, CAMERA_SIZE, CAMERA_SIZE, -CAMERA_SIZE, 0.1, 100)
    this.scene.add(this.camera)
    this.scene.add(new THREE.AmbientLight(0x333333, 0.7))
    let light = new THREE.DirectionalLight(0xffffff, 1.0)
    light.position.set(20, 20, 0)
    this.scene.add(light)
    this.camera.position.set(2, 2.5, 2)
    this.camera.lookAt(new THREE.Vector3(0, 0.5, 0))

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      width: 0,
      height: 0,
      canvas: {addEventListener: () => {}},
      context: gl
    })

    this.renderTargetTexture = new THREE.WebGLRenderTarget(SIZE, SIZE, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    })
  }

  renderBlock (name, category) {
    return this.renderGltf(path.join(__dirname, 'public', 'blox', category, name + '.gltf'))
  }

  async renderGltf (blockPath) {
    let block = await this.loadGltf(blockPath)

    this.scene.add(block)
    let buffer = await this.snapshotPngBuffer()
    this.scene.remove(block)

    return buffer
  }

  loadGltf (blockPath) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(blockPath, data => {
        const obj = data.scene.children[0]
        const material = new THREE.MeshStandardMaterial({color: new THREE.Color('#ffffff')})
        obj.position.set(0, 0, 0)
        if (obj.type === 'Group') {
          obj.children.forEach(o => { o.material = material })
        } else {
          obj.material = material
        }
        resolve(obj)
      }, () => {}, err => reject(err))
    })
  }

  snapshotPngBuffer () {
    return new Promise((resolve, reject) => {
      this.renderer.render(this.scene, this.camera, this.renderTargetTexture, true)

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

      image.quality(72).getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        if (err) reject(err)
        else resolve(buffer)
      })
    })
  }
}
