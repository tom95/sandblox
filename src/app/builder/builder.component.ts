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
              private bloxService: BloxService) {
    this.renderer = new SBRenderer(this.textureService, this.element.nativeElement)
  }

  ngOnInit() {
    this.renderer.build()
    this.running = true
    this.step()
  }

  ngOnDestroy() {
    this.running = false
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.materialPicker !== undefined) {
      this.renderer.setMaterialPicker(changes.materialPicker.currentValue)
    }
  }

  setTransformMode(mode: string) {
    this.renderer.setTransformMode(mode)
  }

  addBlock(identifier: string) {
    this.renderer.loadBlock(identifier)
  }

  @HostListener('window:resize')
  resizeRenderer() {
    this.renderer.setDirty()
    this.renderer.resize()
  }

  @HostListener('window:keydown', ['$event'])
  shortcutHandler(event) {
    this.renderer.dirty = true
    console.log(event.key)

    switch (event.key) {
      case 's':
        this.setTransformMode('scale')
        break
      case 'g':
        this.setTransformMode('translate')
        break
      case 'r':
        this.setTransformMode('rotate')
        break
      case ' ':
        this.renderer.rotateSelected()
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
      case 'x':
      case 'Delete':
        this.renderer.deleteSelected()
        break
      case 'j':
        this.renderer.flipSelected(new THREE.Vector3(1, -1, 1))
        break
      case 'h':
        this.renderer.flipSelected(new THREE.Vector3(-1, 1, 1))
        break
      case 'k':
        this.renderer.flipSelected(new THREE.Vector3(1, 1, -1))
        break
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

  setExposure (value: number) {
    this.renderer.setExposure(value)
  }

  setAmbientOcclusion (value: number) {
    this.renderer.setAmbientOcclusion(value)
  }

}
