import { Output, EventEmitter, Component, OnInit } from '@angular/core'
import { BloxService } from '../blox.service'

@Component({
  selector: 'sb-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Output() transformModeChanged = new EventEmitter<string>()
  @Output() addBlock = new EventEmitter<string>()

  blox: {[key: string]: string[]} = {}
  selectedCategory: string = null

  constructor(private bloxService: BloxService) {}

  ngOnInit() {
    this.bloxService.loadAllBlox().subscribe(data => {
      this.blox = <{[key: string]: string[]}> data
      this.selectedCategory = Object.keys(this.blox)[0]
    })
  }

  onAddBlock(identifier: string) {
    this.addBlock.emit(identifier)
  }

}
