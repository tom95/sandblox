const path = require('path')
const glob = require('glob-promise')
const express = require('express')
const GLRenderer = require('./render-block')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

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

const scene = {
  materials: [],
  blocks: [],
  environment: {
    exposure: 1,
    ambientOcclusion: 0
  }
}

let currentColorIndex = 0
let currentUsers = {}

io.on('connection', socket => {
  console.log('Socket connected.')

  const COLORS = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFEB3B',
    '#FFC107',
    '#FF9800',
    '#FF5722',
    '#795548'
  ]

  const color = COLORS[currentColorIndex]
  currentColorIndex = (currentColorIndex + 1) % COLORS.length

  socket.emit('setScene', scene)
  socket.emit('addUser', [socket.id, color, true])
  for (let [id, otherColor] of Object.entries(currentUsers)) {
    socket.emit('addUser', [id, otherColor, false])
  }
  socket.broadcast.emit('addUser', [socket.id, color, false])

  currentUsers[socket.id] = color

  socket.on('disconnect', () => {
    socket.broadcast.emit('removeUser', [socket.id])
    delete currentUsers[socket.id]
  })

  for (const message of [
    'moveBlock',
    'setExposure',
    'setAmbientOcclusion',
    'rotateBlock',
    'deleteBlock',
    'selectBlock',
    'setColor',
    'addBlock',
    'setMaterial',
    'addMaterial',
    'setTexture',
    'addUser',
    'removeUser'
  ]) {
    socket.on(message, data => {
      switch (message) {
        case 'addBlock':
          scene.blocks.push({
            block: data[0],
            id: data[1],
            material: -1,
            position: [0, 0, 0],
            rotation: 0
          })
          break
        case 'moveBlock':
          scene.blocks.find(b => b.id === data[0]).position = data[1]
          break
        case 'rotateBlock':
          scene.blocks.find(b => b.id === data[0]).rotation = data[1]
          break
        case 'setExposure':
          scene.environment.exposure = data[0]
          break
        case 'setAmbientOcclusion':
          scene.environment.ambientOcclusion = data[0]
          break
        case 'deleteBlock':
          scene.blocks.splice(scene.blocks.findIndex(b => b.id === data[0]), 1)
          break
        case 'setColor':
          scene.materials.find(m => m.id === data[0]).color = data[1]
          break
        case 'setTexture':
          scene.materials.find(m => m.id === data[0]).texture = data[1]
          break
        case 'addMaterial':
          scene.materials.push({color: data[0], texture: data[1], id: data[2]})
          break
        case 'setMaterial':
          scene.blocks.find(b => b.id === data[0]).material = scene.materials.findIndex(m => m.id === data[1])
          break
      }
      socket.broadcast.emit(message, data)
    })
  }
})

app.get('/blox', (req, res) => res.send(allBlocks))
app.get('/thumb/:category/:name', (req, res) =>
  res
    .set('Content-Type', 'image/png')
    .send(blockThumbs[req.params.category + '/' + req.params.name]))
app.get('/', (req, res) => res.sendFile('index.html', {root: path.join(__dirname, 'public')}))
/* app.get('/socket.io/socket.io.js', (req, res) => {
  console.log('SENDING')
  res.sendFile('node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js')
}) */
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
  .then(() => http.listen(port, () => console.log(`Listening on ${port}.`))).catch(e => console.log(e))
  .catch(err => { throw err })
