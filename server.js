const path = require('path')
const glob = require('glob-promise')
const express = require('express')
const app = express()

app.get('/blox', async (req, res) => {
  res.send(await enumerateAllBlox())
})

async function enumerateAllBlox () {
  let allBlox = {}
  let files = await glob('public/blox/*/*.gltf')
  for (let file of files) {
    let parts = file.split('/')
    let category = parts[2]
    let name = parts[3].slice(0, -5)

    if (!allBlox[category])
      allBlox[category] = []
    allBlox[category].push(name)
  }
  return allBlox
}

app.use('/public', express.static('public'))
app.use('/node_modules', express.static('node_modules'))
app.use('/', (req, res) => { res.sendFile('index.html', {root: path.join(__dirname, 'public')}) })
app.listen(process.env.POST || 3000, () => console.log('Port 3000'))
