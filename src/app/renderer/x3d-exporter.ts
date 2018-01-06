import * as THREE from 'three'

import { SceneDataService } from '../scene-data.service'
import { Material } from '../material'

export class X3DExporter {

  export(sceneDataService: SceneDataService) {
    const doc = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE X3D PUBLIC "ISO//Web3D//DTD X3D 3.0//EN" "http://www.web3d.org/specifications/x3d-3.0.dtd">
<X3D
  version="3.0"
  profile="Immersive"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema-instance"
  xsd:noNamespaceSchemaLocation="http://www.web3d.org/specifications/x3d-3.0.xsd">
</X3D>`, 'text/xml')

    doc.children[0].appendChild(this.create('head', {}, [
      this.create('meta', {filename: 'scene.x3d'}),
      this.create('meta', {generator: 'sandblox x3d exporter'})
    ]))

    const meshes = sceneDataService.blocks.filter(b => b.type === 'Mesh')
    const groups = sceneDataService.blocks.filter(b => b.type === 'Group')

    doc.children[0].appendChild(this.create('Scene', {}, [
      ...Object.entries(sceneDataService.getUsedGeometryMap()).map(([name, geom]) => this.createBlockDef(name, geom)),
      ...sceneDataService.materials.map(mat => this.createMaterialDef(mat)),
      ...meshes.map(block => this.createBlockInstance(block.userData.block, (block.material as THREE.Material).userData.id)),
      ...this.flatten(groups.map(block => this.createBlockGroupInstance(block)))
    ]))

    return Promise.resolve(new XMLSerializer().serializeToString(doc))
  }

  flatten (array: Element[][]): Element[] {
    return [].concat.apply([], array)
  }

  createBlockGroupInstance(block: THREE.Group): Element[] {
    return block.children.map((child, i) => {
      return this.createBlockInstance(block.userData.block + '_' + i,
                                      (<THREE.Material> (<THREE.Mesh> child).material).userData.id)
    })
  }

  createBlockDef(blockName: string, geometry: THREE.BufferGeometry): Element {
    const attributes: any = geometry.attributes

    return this.create('IndexedFaceSet', {
      DEF: blockName,
      normalPerVertex: 'true',
      solid: 'true',
      coordIndex: this.faceIndexBufferToString(geometry.index)
    }, [
      this.create('Coordinate', {point: this.bufferToString(attributes.position)}),
      this.create('Normal', {vector: this.bufferToString(attributes.normal)}),
      this.create('TextureCoordinate', {point: this.bufferToString(attributes.uv)})
    ])
  }

  createMaterialDef(material: Material) {
    const color = new THREE.Color(material.color)
    const props = [
      this.create('Material', {
        diffuseColor: `${color.r} ${color.g} ${color.b}`
      })
    ]

    if (material.texture) {
      props.push(this.create('ImageTexture', {
        containerField: 'diffuseTexture',
        url: material.texture
      }))
    }

    return this.create('Appearance', { DEF: material.id, }, props)
  }

  createBlockInstance(blockName: string, material: string) {
    return this.create('Transform', {}, [
      this.create('Shape', {}, [
        this.create('Appearance', {USE: material}),
        this.create('IndexedFaceSet', {USE: blockName})
      ])
    ])
  }

  create(tagName: string, props: {[name: string]: string} = {}, children: Element[] = []): Element {
    const element = document.createElementNS(null, tagName)
    for (const [key, value] of Object.entries(props)) {
      element.setAttribute(key, value)
    }
    for (const child of children) {
      element.appendChild(child)
    }
    return element
  }

  bufferToString (buffer: THREE.BufferAttribute) {
    const data: any = buffer.array
    return data.join(' ')
  }

  /**
   * Convert buffer to format expected by X3D coordIndex. After each face, a -1 needs to appear.
   */
  faceIndexBufferToString (buffer: THREE.BufferAttribute) {
    const data: number[] = <number[]> buffer.array
    let str = ''
    let faceEnd = 3
    for (const num of data) {
      str += num + ' '
      if (--faceEnd === 0) {
        faceEnd = 3
        str += '-1 '
      }
    }
    return str
  }
}
