let builder = new BlockBuilder(document.getElementById('view'))
let ui = new UI()
ui.allBlox()

function animate () {
  window.requestAnimationFrame(animate)
  builder.update()
}
animate()
