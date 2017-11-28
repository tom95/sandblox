const path = require('path')
const glob = require('glob-promise')
const express = require('express')
const GLRenderer = require('./render-block')
const app = express()

let allBlocks = {}
let blockThumbs = {}

async function enumerateAllBlox () {
  let allBlox = {}
  let files = await glob(path.join(__dirname, 'public', 'blox', '*', '*.gltf'))
  for (let file of files) {
    let parts = file.split('/')
    let category = parts[parts.length - 2]
    let name = parts[parts.length - 1].slice(0, -5)

    if (!allBlox[category]) {
      allBlox[category] = []
    }
    allBlox[category].push(name)
  }
  return allBlox
}

app.get('/blox', (req, res) => res.send(allBlocks))
app.get('/thumb/:category/:name', (req, res) => res.set('Content-Type', 'image/png').send(blockThumbs[req.params.category + '/' + req.params.name]))
app.get('/', (req, res) => res.sendFile('index.html', {root: path.join(__dirname, 'public')}))
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/node_modules', express.static('node_modules'))
app.use((req, res, next) => {
  console.log('404', req.path)
  res.sendStatus(404)
})

const port = process.env.PORT || 3000

enumerateAllBlox().then(async b => {
  allBlocks = b

  let renderer = new GLRenderer()
  for (let [category, blocks] of Object.entries(allBlocks)) {
    for (let block of blocks) {
      blockThumbs[category + '/' + block] = await renderer.renderBlock(block, category)
    }
  }
})
  .then(() => app.listen(port, () => console.log(`Listening on ${port}.`))).catch(e => console.log(e))
  .catch(err => { throw err })