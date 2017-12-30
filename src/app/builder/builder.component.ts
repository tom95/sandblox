import {
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  Input,
  HostListener,
  ElementRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core'
import * as THREE from 'three'

import { SBRenderer } from '../renderer/renderer'

import { BloxService } from '../blox.service'
import { TextureService } from '../texture.service'
import { SceneDataService } from '../scene-data.service'

@Component({
  selector: 'sb-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css'],
  host: {
    '[style.cursor]': 'materialPicker ? "crosshair" : "default"'
  }
})
export class BuilderComponent implements OnInit, OnDestroy, OnChanges {

  @Input() materialPicker
  @Output() changeMode = new EventEmitter<string>()

  renderer: SBRenderer
  running = false

  constructor(private element: ElementRef,
              private textureService: TextureService,
              private sceneDataService: SceneDataService,
              private bloxService: BloxService) {
    this.renderer = new SBRenderer(this.textureService, this.sceneDataService, this.element.nativeElement)
  }

  ngOnInit () {
    this.renderer.build()
    this.running = true

    // reenable in case of failure to load data from server to prevent dataloss
    /* if (localStorage.lastScene) {
      let data
      try {
        data = JSON.parse(localStorage.lastScene)
        this.sceneDataService.importSandblox(data, this.renderer)
      } catch (e) {
        console.log('Import Error:', e)
        console.log(localStorage.lastScene)
        delete localStorage.lastScene
      }
    } */

    this.step()
  }

  ngOnDestroy () {
    this.running = false
  }

  ngOnChanges (changes: SimpleChanges) {
    if (changes.materialPicker !== undefined) {
      this.renderer.setMaterialPicker(changes.materialPicker.currentValue)
    }
  }

  addBlock (identifier: string) {
    this.sceneDataService.addBlock(identifier)
  }

  exportScene (format: string) {
    let promise, mimetype
    switch (format) {
      case 'gltf':
        promise = this.renderer.exportGLTF(false).then(data => JSON.stringify(data))
        mimetype = 'model/gltf+json'
        break
      case 'glb':
        promise = this.renderer.exportGLTF(true).then(data => JSON.stringify(data))
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#mime-type
        mimetype = 'model/gltf-binary'
        break
      case 'x3d':
        promise = this.renderer.exportX3D()
        mimetype = 'application/xml'
        break
      default:
        throw new Error('Invalid format')
    }

    return promise.then(data => {
      this.download(data, 'scene.' + format)
    })
  }

  download(data, name) {
    const a = window.document.createElement('a')
    a.href = window.URL.createObjectURL(new Blob([data], {type: 'text/plain'}))
    a.download = name

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  @HostListener('window:resize')
  resizeRenderer() {
    this.renderer.setDirty()
    this.renderer.resize()
  }

  @HostListener('window:beforeunload')
  saveSceneLocally() {
    localStorage.lastScene = JSON.stringify(this.sceneDataService.exportSandblox())
  }

  @HostListener('window:keydown', ['$event'])
  shortcutHandler(event) {
    this.renderer.dirty = true
    console.log(event.key)

    switch (event.key) {
      case ' ':
        this.sceneDataService.rotateSelectedBlock()
        break
      case 'q':
        this.changeMode.emit('blocks')
        break
      case 'w':
        this.changeMode.emit('material')
        break
      case 'e':
        this.changeMode.emit('settings')
        break
      case 'r':
        this.changeMode.emit('export')
        break
      case 'x':
      case 'Delete':
        this.sceneDataService.deleteSelectedBlock()
        break
      /*case 'j':
        this.sceneDataService.flipSelected(new THREE.Vector3(1, -1, 1))
        break
      case 'h':
        this.sceneDataService.flipSelected(new THREE.Vector3(-1, 1, 1))
        break
      case 'k':
        this.sceneDataService.flipSelected(new THREE.Vector3(1, 1, -1))
        break*/
    }
  }

  step() {
    if (this.renderer.dirty) {
      this.renderer.update()
    }

    if (this.running) {
      window.requestAnimationFrame(() => this.step())
    }
  }

  setDirty() {
    this.renderer.setDirty()
  }
}
