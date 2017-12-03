import { HostListener, EventEmitter, Output, HostBinding, Input, Component, OnInit } from '@angular/core'
import { Material } from '../material'

@Component({
  selector: 'sb-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.css'],
  host: {
    '[style.background-color]': 'material.color',
    '[style.border]': 'selected ? "4px solid #fff" : "none"',
    '[style.margin]': 'selected ? "0" : "4px"',
  }
})
export class MaterialComponent implements OnInit {

  @Input() material: Material

  @Input() selected = false

  constructor() { }

  ngOnInit() {
  }

}
