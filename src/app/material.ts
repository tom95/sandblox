import * as THREE from 'three'

export class Material {
  id: string
  texture: string
  color: string

  glMaterial: THREE.MeshStandardMaterial = null

  constructor (color, texture = null) {
    this.color = color
    this.texture = texture
    this.id = this.generateId()
    this.buildGLMaterial()
  }

  static fromExisting (id, color, texture) {
    const mat = new Material(color, texture)
    mat.id = id
    return mat
  }

  buildGLMaterial () {
    let gltex = null
    if (this.texture) {
      // TODO move the loader into an injected service
      gltex = new THREE.TextureLoader().load(this.textureUrl())
      gltex.wrapS = THREE.RepeatWrapping
      gltex.wrapT = THREE.RepeatWrapping
    }

    this.glMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.color),
      map: this.texture ? gltex : null
    })
  }

  textureUrl () {
    return `/public/textures/${this.texture}.png`
  }

  setColor (color: string) {
    this.color = color
    this.glMaterial.color = new THREE.Color(this.color)
  }

  generateId () {
    const dict = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const len = 20
    let out = ''
    for (let i = 0; i < len; i++) {
      out += dict[Math.floor(Math.random() * dict.length)]
    }
    return out
  }
}
