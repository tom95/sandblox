import { HostListener, HostBinding, Output, EventEmitter, Input, Component, OnInit } from '@angular/core'

@Component({
  selector: 'sb-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.css']
})
export class BlockComponent implements OnInit {

  @Input() category: string
  @Input() name: string

  @Output() added = new EventEmitter<string>()

  @HostBinding('style.background-image') image: string

  constructor() {}

  ngOnInit() {
    this.image = `url(/thumb/${this.identifier()})`
  }

  @HostListener('click')
  onClicked() {
    this.added.emit(this.identifier())
  }

  identifier() {
    return `${this.category}/${this.name}`
  }

}
