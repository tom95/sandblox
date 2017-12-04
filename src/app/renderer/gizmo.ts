import { EventEmitter } from '@angular/core'

import * as THREE from 'three'

export class Gizmo extends THREE.Object3D {
  orientationPlane: THREE.Mesh
  arrows: THREE.Mesh[]
  target: THREE.Object3D
  snapIncrement = 0

  updated = new EventEmitter<void>()
  duplicate = new EventEmitter<THREE.Object3D>()

  constructor (private container: HTMLElement, private camera: THREE.Camera) {
    super()

    const arrowGeometry = this.buildArrow()

    const directions = [
      {v: new THREE.Vector3(0, 1, 0), r: new THREE.Euler(Math.PI, 0, 0)},
      {v: new THREE.Vector3(0, -1, 0), r: new THREE.Euler(0, 0, 0)},
      {v: new THREE.Vector3(0, 0, 1), r: new THREE.Euler(Math.PI / -2, 0, 0)},
      {v: new THREE.Vector3(0, 0, -1), r: new THREE.Euler(Math.PI / 2, 0, 0)},
      {v: new THREE.Vector3(-1, 0, 0), r: new THREE.Euler(Math.PI / 2, 0, Math.PI / -2)},
      {v: new THREE.Vector3(1, 0, 0), r: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2)}
    ]
    const DISTANCE_APART = 0.3
    const UNROTATED_DIRECTION = new THREE.Vector3(0, 1, 0)

    this.arrows = directions.map(({v: direction, r: rotation}) => {
      const arrow = new THREE.Mesh(arrowGeometry, new THREE.MeshStandardMaterial({color: 0xffffff}))
      arrow.userData.plane = new THREE.Vector3(Math.abs(direction.x), Math.abs(direction.y), Math.abs(direction.z))
      arrow.rotation.copy(rotation)
      arrow.position.copy(direction)
      arrow.position.multiplyScalar(DISTANCE_APART)
      this.add(arrow)
      return arrow
    })

    this.buildPlane()
    this.registerSelection()
    this.visible = false
  }

  buildArrow () {
    const ARROW_WIDTH = 0.15
    const ARROW_LENGTH = 0.07
    const BASE_LENGTH = 0.07
    const BASE_WIDTH = 0.08
    const EXTRUDE = 0.02

    const shapeBase = new THREE.Shape()
    shapeBase.moveTo(-BASE_WIDTH / 2, -ARROW_LENGTH)
    this.relLineTo(shapeBase, 0, BASE_LENGTH)
    this.relLineTo(shapeBase, BASE_WIDTH, 0)
    this.relLineTo(shapeBase, 0, -BASE_LENGTH)

    const shapeTip = new THREE.Shape()
    shapeTip.moveTo(-ARROW_WIDTH / 2, -ARROW_LENGTH)
    this.relLineTo(shapeTip, ARROW_WIDTH, 0)
    this.relLineTo(shapeTip, -ARROW_WIDTH / 2, -ARROW_LENGTH)
    this.relLineTo(shapeTip, -ARROW_WIDTH / 2, ARROW_LENGTH)

    const geometry = new THREE.ExtrudeGeometry([shapeBase, shapeTip], {
      amount: EXTRUDE,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.01
    })
    geometry.translate(0, 0, EXTRUDE / -2)
    return geometry
  }

  relLineTo (shape: THREE.Shape, x: number, y: number) {
    shape.lineTo(x + shape.currentPoint.x, y + shape.currentPoint.y)
  }

  buildPlane () {
    const planeGeometry = new THREE.PlaneBufferGeometry(50, 50, 2, 2)
    const planeMaterial = new THREE.MeshBasicMaterial({visible: false, side: THREE.DoubleSide})
    this.orientationPlane = new THREE.Mesh(planeGeometry, planeMaterial)
    this.add(this.orientationPlane)
  }

  registerSelection () {
    let down = false
    let hovered: THREE.Mesh = null
    let offset: THREE.Vector3 = null
    let oldPosition: THREE.Vector3 = null
    const point = new THREE.Vector3()

    this.container.addEventListener('mousedown', event => {
      if (!hovered) {
        return false
      }
      this.orientationPlane.quaternion.setFromUnitVectors(hovered.userData.plane, new THREE.Vector3(0, 1, 0))
      this.orientationPlane.updateMatrixWorld(false)

      const intersection = this.intersects(event, [this.orientationPlane])
      if (!intersection) {
        return false
      }

      down = true
      oldPosition = this.position.clone()
      offset = intersection[0].point

      if (event.shiftKey) {
        this.duplicate.emit(this.target)
      }
    })
    this.container.addEventListener('mouseup', event => {
      down = false
    })
    this.container.addEventListener('mousemove', event => {
      if (!down) {
        const intersects = this.intersects(event, this.arrows)
        if (!intersects.length) {
          this.highlightArrow(hovered, false)
          hovered = null
        } else if (!hovered) {
          hovered = intersects[0].object as THREE.Mesh
          this.highlightArrow(hovered, true)
        }
        return false
      } else {
        const intersection = this.intersects(event, [this.orientationPlane])
        if (!intersection.length) {
          return false
        }

        event.stopPropagation()
        event.preventDefault()

        point.copy(intersection[0].point)
        point.sub(offset)
        this.position.copy(oldPosition)
        this.position.add(point.multiply(hovered.userData.plane))
        this.target.position.copy(this.position)
        if (this.snapIncrement) {
          this.target.position.x = Math.round(this.target.position.x / this.snapIncrement) * this.snapIncrement
          this.target.position.y = Math.round(this.target.position.y / this.snapIncrement) * this.snapIncrement
          this.target.position.z = Math.round(this.target.position.z / this.snapIncrement) * this.snapIncrement
        }
        this.position.copy(this.target.position)
        this.updated.emit()
        return true
      }
    }, false)
  }

  highlightArrow (arrow: THREE.Mesh, highlight: boolean) {
    if (!arrow) {
      return
    }
    const material = arrow.material as THREE.MeshStandardMaterial
    material.color = new THREE.Color(highlight ? 0x4444ff : 0xffffff)
    this.updated.emit()
  }

  intersects (event: any, objects: THREE.Mesh[]) {
    const rendererRect = this.container.getBoundingClientRect()

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera({
      x: ((event.clientX - rendererRect.left) / rendererRect.width) * 2 - 1,
      y: -((event.clientY - rendererRect.top) / rendererRect.height) * 2 + 1
    }, this.camera)

    return raycaster.intersectObjects(objects, true)
  }

  attach (object: THREE.Object3D) {
    this.target = object
    this.visible = true
    this.position.copy(object.position)
  }

  detach () {
    this.target = null
    this.visible = false
  }
}
