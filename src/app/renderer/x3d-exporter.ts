import * as THREE from 'three'

export class X3DExporter {

  export(blocks: THREE.Mesh[]) {
    const doc = new DOMParser().parseFromString(`
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE X3D PUBLIC "ISO//Web3D//DTD X3D 3.0//EN" "http://www.web3d.org/specifications/x3d-3.0.dtd">
<X3D
  version="3.0"
  profile="Immersive"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema-instance"
    xsd:noNamespaceSchemaLocation="http://www.web3d.org/specifications/x3d-3.0.xsd">
</X3D>`, 'text/html')
    console.log(doc)

    const materials = Array.from(new Set(blocks.map(child =>
      (<THREE.Mesh> child).material as THREE.MeshStandardMaterial)))
    const geometries = Array.from(new Set(blocks.map(block =>
      (<THREE.Mesh> block).geometry)))

    doc.rootElement.appendChild(this.create('head', {}, [
      this.create('meta', {filename: 'scene.x3d'}),
      this.create('meta', {generator: 'sandblox x3d exporter'})
    ]))

    doc.rootElement.appendChild(this.create('Scene', {}, [
      ...geometries.map(geom => this.createBlockDef(geom as THREE.BufferGeometry)),
      ...materials.map((mat, index) => this.createMaterialDef(index, mat)),
      ...blocks.map(child => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        return this.createBlockInstance(child.userData.block, materials.indexOf(mat), child as THREE.Mesh)
      })
    ]))

    return Promise.resolve(new XMLSerializer().serializeToString(doc.documentElement))
  }

  createBlockDef(geometry: THREE.BufferGeometry) {
    const attributes: any = geometry.attributes

    return this.create('IndexedFaceSet', {
      DEF: geometry.name,
      normalPerVertex: 'true',
      solid: 'true',
      coordIndex: this.bufferToString(geometry.index)
    }, [
      this.create('Coordinate', {point: this.bufferToString(attributes.position)}),
      this.create('Normal', {vector: this.bufferToString(attributes.normal)}),
      this.create('TextureCoordinate', {point: this.bufferToString(attributes.uv)})
    ])
  }

  createMaterialDef(name: number, material: THREE.MeshStandardMaterial) {
    const image = material.map ?  [this.create('ImageTexture', {
      containerField: 'diffuseTexture',
      url: material.map.image.url
    })] : []

    return this.create('CommonSurfaceShaderNode', {
      DEF: 'mat' + name,
      diffuseFactor: `${material.color.r} ${material.color.g} ${material.color.b}`
    }, image)
  }

  createBlockInstance(blockName: string, material: number, object: THREE.Mesh) {
    return this.create('Transform', {}, [
      this.create('Shape', {}, [
        this.create('Appearance', {}, [
          this.create('CommonSurfaceShaderNode', {USE: 'mat' + material})
        ]),
        this.create('IndexedFaceSet', {USE: blockName})
      ])
    ])
  }

  create(tagName: string, props: {[name: string]: string} = {}, children: Element[] = []) {
    const element = document.createElement(tagName)
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
}
