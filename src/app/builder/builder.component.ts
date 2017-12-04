import { SimpleChanges, OnChanges, Input, HostListener, ElementRef, Component, OnInit, OnDestroy } from '@angular/core'

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
