import * as THREE from 'three'

export class Material {
  id: string
  texture: string
  color: string

  glMaterial: THREE.MeshStandardMaterial = null

  constructor (color, texture = null) {
    this.color = color
    this.texture = texture
    this.buildGLMaterial()
  }

  static fromExisting (id, color, texture) {
    const mat = new Material(color, texture)
    mat.id = id
    return mat
  }

  buildGLMaterial () {
    this.glMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color(this.color)})
  }

  setColor (color: string) {
    this.color = color
    this.glMaterial.color = new THREE.Color(this.color)
  }
}
