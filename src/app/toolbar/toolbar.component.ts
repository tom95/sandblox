import { EventEmitter, Output, Component, OnInit } from '@angular/core';

@Component({
  selector: 'sb-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

  @Output() transformModeChanged = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  changeTransformMode(mode) {
    this.transformModeChanged.emit(mode);
  }

}
