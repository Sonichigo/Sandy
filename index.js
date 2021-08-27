const bodyParser = require('body-parser')
const express = require('express')
const Board = require('./Board');
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
    color: '#3E338F',
    head: 'fang',
    tail: 'curled'
  }
  response.status(200).json(battlesnakeInfo)
}

function handleStart(request, response) {
  var gameData = request.body

  console.log('START')
  response.status(200).send('ok')
}

// Functions for battlesnake strategy
// Checks if move would hit the wall
function hitsWall(newHeadPos, boardWidth, boardHeight) {
  if (newHeadPos.y >= boardHeight || newHeadPos.y < 0 || newHeadPos.x >= boardWidth || newHeadPos.x < 0) {
    console.log("Hits wall")
    return true
  }
  return false
}

// Checks if move would hit self
function hitsSnake(newHeadPos, bodyCoords) {
  for (var i = 0; i < bodyCoords.length; ++i) {
    var bodyCoord = bodyCoords[i]
    if (newHeadPos.x === bodyCoord.x && newHeadPos.y === bodyCoord.y) {
      console.log("Hits snake")
      return true
    }
  }
  return false
}

// Checks if move would hit other snakes
function hitsOtherSnakes(newHeadPos, snakes) {
  for (var i = 0; i < snakes.length; ++i) {
    var snake = snakes[i]
    if (hitsSnake(newHeadPos, snake.body)) {
      return true
    }
  }
  return false
}

// Returns object with new head position after move
function getNewPos(headCoord, move) {
  var newPos = {...headCoord}
  switch (move) {
    case 'up':
      newPos.y = headCoord.y + 1
      break
    case 'down':
      newPos.y = headCoord.y - 1
      break
    case 'left':
      newPos.x = headCoord.x - 1
      break
    case 'right':
      newPos.x = headCoord.x + 2
      break
  }
  return newPos
}
function cityBlocksBetween(p1, p2) { 
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y); 
  }
function findFood(p) {
  for (var i = 0; i < p.length; ++i)
  var food = p[i]
  if (food.length > 1) {  // we need to sort
    for (let f of food)
      f.distance = cityBlocksBetween(p, f);

    food.sort(function(a , b) { return a.distance - b.distance } );
   }

  return food;
}

function handleMove(request, response) {
  var gameData = request.body

  var yourSnake = gameData.you
  var board = gameData.board

  var possibleMoves = ['up', 'down', 'left', 'right']
  var i = 0
  while (i < 10) {
    var move = possibleMoves[i]
    var newHeadPos = getNewPos(yourSnake.head, move)
    headHitsWall = hitsWall(newHeadPos, board.width, board.height)
    var headHitsSelf = hitsSnake(newHeadPos, yourSnake.body)
    var headHitsSnake = hitsOtherSnakes(newHeadPos, board.snakes)
    var food = findFood(yourSnake.body)
    if (!headHitsWall && !headHitsSelf && !headHitsSnake && !food) {
      break
    }
    ++i
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