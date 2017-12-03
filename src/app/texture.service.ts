import * as THREE from 'three'

import { Injectable } from '@angular/core'

@Injectable()
export class TextureService {

  loader: THREE.TextureLoader
  cubeLoader: THREE.CubeTextureLoader

  textures: {[key: string]: THREE.Texture} = {}
  defaultEnvMap: THREE.Texture

  constructor () {
    this.loader = new THREE.TextureLoader()
    this.cubeLoader = new THREE.CubeTextureLoader()
  }

  defaultTextureNames () {
    return [
      'roof.jpg',
      'wall.png'
    ]
  }

  load (url: string) {
    if (this.textures[url]) {
      return this.textures[url]
    }

    const tex = this.loader.load(url)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.encoding = THREE.sRGBEncoding
    this.textures[url] = tex
    return tex
  }

  loadCube (baseUrl: string, format: string = '.jpg', refraction = false) {
    const urls = [
      baseUrl + 'posx' + format, baseUrl + 'negx' + format,
      baseUrl + 'posy' + format, baseUrl + 'negy' + format,
      baseUrl + 'posz' + format, baseUrl + 'negz' + format
    ]
    const tex = this.cubeLoader.load(urls)
    tex.format = THREE.RGBFormat
    if (refraction) {
      tex.mapping = THREE.CubeRefractionMapping
    }
    return tex
  }

  getDefaultEnvMap (): THREE.Texture {
    if (!this.defaultEnvMap) {
      this.defaultEnvMap = this.loadCube('/public/env/', '.jpg', true)
    }
    return this.defaultEnvMap
  }
}
