let builder = new BlockBuilder(document.getElementById('view'))

function animate () {
  window.requestAnimationFrame(animate)
  builder.update()
}
animate()
