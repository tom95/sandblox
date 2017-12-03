import { Output, EventEmitter, Component, OnInit } from '@angular/core'
import { BloxService } from '../blox.service'
import { Material } from '../material'

@Component({
  selector: 'sb-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Output() transformModeChanged = new EventEmitter<string>()
  @Output() addBlock = new EventEmitter<string>()
  @Output() viewDirty = new EventEmitter<void>()

  activeTab = 'blocks'

  materials = [new Material('#ff0000'), new Material('#00ff00'), new Material('#0000ff'), new Material('#ffffff', 'wall')]
  selectedMaterial: Material = null

  blox: {[key: string]: string[]} = {}
  selectedCategory: string = null

  constructor(private bloxService: BloxService) {}

  ngOnInit() {
    this.bloxService.loadAllBlox().subscribe(data => {
      this.blox = <{[key: string]: string[]}> data
      this.selectedCategory = Object.keys(this.blox)[0]
    })
  }

  getSelectedMaterial() {
    return this.activeTab === 'paint' ? this.selectedMaterial : null
  }

  onAddBlock(identifier: string) {
    this.addBlock.emit(identifier)
  }

  setViewDirty() {
    this.viewDirty.emit()
  }

}
