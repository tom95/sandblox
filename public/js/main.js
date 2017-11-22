/* globals BlockBuilder, UI */
let builder = new BlockBuilder(document.getElementById('view'))
builder.loadBlock('castle_wall', 'castle')
builder.loadBlock('stairs', 'castle')

let ui = new UI(builder)
ui.allBlox()

function animate () {
  window.requestAnimationFrame(animate)
  builder.update()
}
animate()
