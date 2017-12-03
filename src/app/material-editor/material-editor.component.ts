import { EventEmitter, Output, Input, Component, OnInit } from '@angular/core'

import { Material } from '../material'

@Component({
  selector: 'sb-material-editor',
  templateUrl: './material-editor.component.html',
  styleUrls: ['./material-editor.component.css']
})
export class MaterialEditorComponent implements OnInit {

  @Input() material: Material
  @Output() change = new EventEmitter<void>()

  constructor() { }

  ngOnInit() {
  }

  updateColor (color) {
    this.material.setColor(color.target.value)
    this.change.emit()
  }

}
