import { Output, EventEmitter, Component, OnInit } from '@angular/core'
import { BloxService } from '../blox.service'
import { Material } from '../material'
import { MaterialService } from '../material.service'
import { SceneDataService } from '../scene-data.service'

@Component({
  selector: 'sb-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Output() exportScene = new EventEmitter<string>()

  @Output() viewDirty = new EventEmitter<void>()

  activeTab = 0

  selectedMaterial: Material = null

  blox: {[key: string]: string[]} = {}
  selectedCategory: string = null

  constructor(private materialService: MaterialService,
              private bloxService: BloxService,
              public sceneDataService: SceneDataService) { }

  ngOnInit () {
    this.bloxService.loadAllBlox().subscribe(data => {
      this.blox = <{[key: string]: string[]}> data
      this.selectedCategory = Object.keys(this.blox)[0]
    })
  }

  getSelectedMaterial () {
    return this.activeTab === 1 ? this.selectedMaterial : null
  }

  addMaterial () {
    this.selectedMaterial = this.sceneDataService.addMaterial()
  }

  onAddBlock (blockName: string) {
    this.sceneDataService.addBlock(blockName)
  }

  setViewDirty () {
    this.viewDirty.emit()
  }

  showMode (mode: string) {
    const MODES = [
      'blocks',
      'material',
      'settings',
      'export'
    ]
    this.activeTab = MODES.indexOf(mode)
  }

  updateExposure (value: number) {
    this.sceneDataService.setExposure(value)
  }

  updateAmbientOcclusion (value: number) {
    this.sceneDataService.setAmbientOcclusion(value)
  }
}
