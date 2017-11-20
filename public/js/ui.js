/* globals $ */

class UI {

  allBlox () {
    $.get('/blox').then(data => {
      let sidebar = $('#sidebar-blocks')
      for (let [category, blox] of Object.entries(data)) {
        for (let block of blox) {
          $(`<div>${category}, ${block}</div>`)
            .css('background-image', `url(/thumb/${category}/${block})`)
            .appendTo(sidebar)
        }
      }
    })
  }
}
