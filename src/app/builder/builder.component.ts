import { HostListener, ElementRef, Component, OnInit, OnDestroy } from '@angular/core'

import { SBRenderer } from '../renderer/renderer'
import { BloxService } from '../blox.service'

@Component({
  selector: 'sb-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css']
})
export class BuilderComponent implements OnInit, OnDestroy {

  renderer: SBRenderer
  running = false

  constructor(private element: ElementRef, private bloxService: BloxService) {}

  ngOnInit() {
    this.renderer = new SBRenderer(this.element.nativeElement)
    this.running = true
    this.step()
  }

  ngOnDestroy() {
    this.running = false
  }

  setTransformMode(mode: string) {
    this.renderer.setTransformMode(mode)
  }

  addBlock(identifier: string) {
    this.renderer.loadBlock(identifier)
  }

  @HostListener('window:resize')
  resizeRenderer() {
    this.renderer.resize()
  }

  @HostListener('window:keydown', ['$event'])
  shortcutHandler(event) {
    console.log(event)
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
    this.renderer.update()
    if (this.running) {
      window.requestAnimationFrame(() => this.step())
    }
  }

}
