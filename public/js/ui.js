/* globals $ */

class UI {

  allBlox () {
    $.get('/blox').then(data => {
      for (let [category, blox] of Object.entries(data)){
        for (let block of blox) {
          $('#sidebar-blocks').append(`<div>${category}, ${block}</div>`)
        }
      }
    })
  }
}


