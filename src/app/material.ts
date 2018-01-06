import * as THREE from 'three'

import { TextureService } from './texture.service'

export class Material {
  id: string
  texture: string
  color: string

  glMaterial: THREE.MeshStandardMaterial = null

  constructor (private textureService: TextureService, color, texture = null) {
    this.color = color
    this.texture = texture
    this.id = this.generateId()
    this.buildGLMaterial()
  }

  buildGLMaterial () {
    let gltex = null
    if (this.texture) {
      gltex = this.textureService.load(this.textureUrl())
    }

    this.glMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.color),
      map: this.texture ? gltex : null,
      envMap: this.textureService.getDefaultEnvMap()
    })
    this.glMaterial.userData.id = this.id
  }

  textureUrl () {
    return `/public/textures/${this.texture}`
  }

  setColor (color: string) {
    this.color = color
    this.glMaterial.color = new THREE.Color(this.color)
  }

  setTexture (texture: string) {
    this.texture = texture
    if (this.texture) {
      this.glMaterial.map = this.textureService.load(this.textureUrl())
    } else {
      this.glMaterial.map = null
    }
    this.glMaterial.needsUpdate = true
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

  updateId (id: string) {
    this.id = id
    if (this.glMaterial) {
      this.glMaterial.userData.id = id
    }
  }

  export () {
    return {
      id: this.id,
      color: this.color,
      texture: this.texture
    }
  }
}
