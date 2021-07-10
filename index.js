const bodyParser = require('body-parser')
const express = require('express')

const PORT = process.env.PORT || 3000

const app = express()
app.use(bodyParser.json())

app.get('/', handleIndex)
app.post('/start', handleStart)
app.post('/move', handleMove)
app.post('/end', handleEnd)

app.listen(PORT, () => console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`))


function handleIndex(request, response) {
  var battlesnakeInfo = {
    apiversion: '1',
    author: 'Sonichigo',
    color: '#9500ff',
    head: 'evil',
    tail: 'skinny'
  }
  response.status(200).json(battlesnakeInfo)
}

function handleStart(request, response) {
  var gameData = request.body

  console.log('START')
  response.status(200).send('ok')
}

function handleMove(request, response) {
  var gameData = request.body

  var possibleMoves = []
  var head = gameData.you.head
  var neck = gameData.you.body[1]
  var tail = gameData.you.tail

  // Avoid our neck
  console.log(head, neck)
  if ( head.x == neck.x && head.y > neck.y) {
    possibleMoves = ['up','left','right' ]
  }
  if (head.x == neck.x && head.y < neck.y) {
    possibleMoves = ['down','left','right']
  }
  if ( head.x > neck.x && head.y == neck.y) {
    possibleMoves = ['up','down','right' ]
  }
  if (head.x < neck.x && head.y == neck.y) {
    possibleMoves = ['up','down','left' ]
  }
  //Avoid Body
  /*if ( head.y == tail.x && head.y > tail.x) {
    possibleMoves = ['up','left','right' ]
  }
  if (head.y == tail.x && head.x < tail.y) {
    possibleMoves = ['down','left','right']
  }
  if ( head.x > tail.x && head.x == tail.x) {
    possibleMoves = ['up','down','right' ]
  }
  if (head.x < tail.x && head.x == tail.y) {
    possibleMoves = ['up','down','left' ]
  }*/
  //Avoid walls
  var maxX = gameData.board.width - 1
  var maxY = gameData.board.height - 1

  if (head.x == 0){
    possibleMoves = possibleMoves.filter((move) => move != 'left')
  }
  if (head.y == 0){
    possibleMoves = possibleMoves.filter((move) => move != 'down')
  }
  if (head.x == maxX){
    possibleMoves = possibleMoves.filter((move) => move != 'right')
  }
  if (head.y == maxY){
    possibleMoves = possibleMoves.filter((move) => move != 'up')
  }

  var move = 'up'
  if ( gameData. turn > 0) {
    console.log(possibleMoves)
    move = possibleMoves[Math.floor(Math.random()*possibleMoves.length) ]
  }

  console.log('MOVE: ' + move)
  response.status(200).send({
    move: move
  })
}

function handleEnd(request, response) {
  var gameData = request.body

  console.log('END')
  response.status(200).send('ok')
}
