/* globals $ */

class UI {

  constructor (builder) {
    this.builder = builder
  }

  allBlox () {
    $.get('/blox').then(data => {
      let sidebar = $('#sidebar-blocks')
      for (let [category, blox] of Object.entries(data)) {
        for (let block of blox) {
          $(`<div>${category}, ${block}</div>`)
            .click(() => this.addBlock(block, category))
            .css('background-image', `url(/thumb/${category}/${block})`)
            .appendTo(sidebar)
        }
      }
    })
  }

  addBlock (block, category) {
    this.builder.loadBlock(block, category)
  }
}
