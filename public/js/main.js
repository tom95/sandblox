/* globals BlockBuilder */
let builder = new BlockBuilder(document.getElementById('view'))
builder.loadBlock('castle_wall', 'castle')
builder.loadBlock('stairs', 'castle')

function animate () {
  window.requestAnimationFrame(animate)
  builder.update()
}
animate()
