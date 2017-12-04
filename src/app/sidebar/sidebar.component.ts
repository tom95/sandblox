import { Output, EventEmitter, Component, OnInit } from '@angular/core'
import { BloxService } from '../blox.service'
import { Material } from '../material'
import { MaterialService } from '../material.service'

@Component({
  selector: 'sb-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Output() setExposure = new EventEmitter<number>()
  @Output() setAmbientOcclusion = new EventEmitter<number>()

  @Output() transformModeChanged = new EventEmitter<string>()
  @Output() addBlock = new EventEmitter<string>()
  @Output() viewDirty = new EventEmitter<void>()

  activeTab = 0

  materials: Material[]
  selectedMaterial: Material = null

  blox: {[key: string]: string[]} = {}
  selectedCategory: string = null

  constructor(private materialService: MaterialService, private bloxService: BloxService) {
    this.materials = [
      this.materialService.create('#ff0000'),
      this.materialService.create('#00ff00'),
      this.materialService.create('#0000ff'),
      this.materialService.create('#ffffff', 'wall.png')
    ]
  }

  ngOnInit() {
    this.bloxService.loadAllBlox().subscribe(data => {
      this.blox = <{[key: string]: string[]}> data
      this.selectedCategory = Object.keys(this.blox)[0]
    })
  }

  getSelectedMaterial() {
    return this.activeTab === 1 ? this.selectedMaterial : null
  }

  addMaterial() {
    const mat = this.materialService.createDefault()
    this.materials.push(mat)
    this.selectedMaterial = mat
  }

  onAddBlock(identifier: string) {
    this.addBlock.emit(identifier)
  }

  setViewDirty() {
    this.viewDirty.emit()
  }

}
