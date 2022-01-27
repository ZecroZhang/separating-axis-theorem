class Shape {
  constructor ({ x, y, width, height, rotation }) {
    this.x = x
    this.y = y
    this.width = width 
    this.height = height
    this.rotation = rotation || 0
    this.poly = null
  }
}

//Mouse coordinates
var mousePos = {
  x: 0,
  y: 0, 
  isDown: false
}

//Handles the current polygon and the selected polygon.
var polygons = [
  new Shape({
    x: 200, 
    y: 200,
    width: 100,
    height: 50,
    rotation: Math.PI/4
  }),
  new Shape({
    x: 300, 
    y: 200,
    width: 150,
    height: 90
  })
]
var currentPolygon = null
var selectedPolygon = null

//Canvas element + width
var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
var canvasBoundingBox = canvas.getBoundingClientRect()
canvas.width = 500
canvas.height = 500

//Canvas location.
var cDivBoundingBox = document.getElementById("canvasDiv").getBoundingClientRect()

//Info tabs + input 
var infoTab1 = document.getElementById("info1")
var infoTab2 = document.getElementById("info2")
var selectedShapeDisplay = document.getElementById("selectedShapeDisplay")
var selectedShapeX = document.getElementById("selectedShapeX")
var selectedShapeY = document.getElementById("selectedShapeY")

var widthInput = document.getElementById("widthInput")
var heightInput = document.getElementById("heightInput")
var rotationInput = document.getElementById("rotationInput")

var enableCornerPoints = false


//Frame loop. delta and last check are useless rn since this isn't a game. 
var delta, lastcheck = Date.now()
Animate()

function Animate () {
  requestAnimationFrame(Animate)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (var c = 0; c < polygons.length; c++) {
    //counter clockwise from bottom right
    var points = CalculateRectanglePoints(polygons[c])
    polygons[c].poly = new Polygon(points)

    ctx.save()
    ctx.translate(polygons[c].x, polygons[c].y)
    ctx.rotate(polygons[c].rotation)
    ctx.fillRect(-polygons[c].width/2,  -polygons[c].height/2, polygons[c].width, polygons[c].height)
    ctx.restore()

    //Draws the drag circle. 
    ctx.save()
    ctx.fillStyle = "#fff"
    ctx.beginPath()
    ctx.arc(polygons[c].x, polygons[c].y, 10, 0, Math.PI*2)
    ctx.fill()
    ctx.restore()

    //Draw in the corner points, if enabled
    if (enableCornerPoints) {
      for (var point of points) {
        ctx.save()
        ctx.fillStyle = "#fff"
        ctx.beginPath()
        ctx.arc(point.x, point.y, 5, 0, Math.PI*2)
        ctx.fill()
        ctx.restore()
      }
    }
  }

  //This is designed for a two polygon system. 
  if (polygons[0].poly.IsTouchingPolygon(polygons[1].poly)) {
    ctx.fillStyle = "#0f0"
  } else {
    ctx.fillStyle = "#000"
  }
}

function CalculateRectanglePoints (polygon) {
  var points = [
    new Point(polygon.x + polygon.width/2, polygon.y + polygon.height/2), //bottom right
    new Point(polygon.x + polygon.width/2, polygon.y - polygon.height/2), //top right 
    new Point(polygon.x - polygon.width/2, polygon.y - polygon.height/2), // top left 
    new Point(polygon.x - polygon.width/2, polygon.y + polygon.height/2) // bottom left   
  ]
  if (polygon.rotation != 0) {
    points = points.map(item => RotatePoint(item, polygon, polygon.rotation))
  }
  return points 
}


document.addEventListener("keyup", event => {
  if (event.code == "Enter") {
    //currentPolygon = Number(!currentPolygon)
  } else if (event.code == "KeyE") {
    //This is for testing.
    var poly1points = CalculateRectanglePoints(polygons[0])
    var poly2points = CalculateRectanglePoints(polygons[Number(1)])
    var returnString = ""
    var r2Text = ""

    poly1points.forEach(item => {
      returnString += `(${item.x}, ${item.y})\n`
      r2Text += `{x: ${item.x}, y: ${item.y}},\n`
    })
    poly2points.forEach(item => {
      returnString += `(${item.x}, ${item.y})\n`
      r2Text += `{x: ${item.x}, y: ${item.y}},\n`
    })
    console.log(returnString, r2Text)
  }
})

//Listens for mouse and window events. 
document.addEventListener("mousemove", event => {
  //Lets say the default canvas size is 500 px. 
  var scaleFactor = 500/cDivBoundingBox.width
  mousePos.x = (event.pageX-cDivBoundingBox.top)*scaleFactor
  mousePos.y = (event.pageY-cDivBoundingBox.left)*scaleFactor

  if (currentPolygon || currentPolygon === 0) {
    polygons[currentPolygon].x = mousePos.x
    polygons[currentPolygon].y = mousePos.y

    selectedShapeX.innerText = polygons[currentPolygon].x.toFixed(2)
    selectedShapeY.innerText = polygons[currentPolygon].y.toFixed(2)
  }
})

document.addEventListener("mousedown", () => {
  mousePos.isDown = true
  currentPolygon = TouchingPolygon()
  if (currentPolygon || currentPolygon === 0) {
    selectedPolygon = currentPolygon
    SelectedInfoTab()
  }
})

document.addEventListener("mouseup", () => {
  mousePos.isDown = false
  currentPolygon = null
  if (MouseIsInCanvas() && TouchingPolygon() === null) {
    GeneralInfoTab()
    selectedPolygon = null
  }
})

window.addEventListener("resize", () => {
  //Needs to adjust this so the margins remain accurate. 
  cDivBoundingBox = document.getElementById("canvasDiv").getBoundingClientRect()
  canvasBoundingBox = canvas.getBoundingClientRect()
})

//Listen for the inputs for shape changing
widthInput.addEventListener("change", () => {
  if (isNaN(widthInput.value) || widthInput.value < 20) return alert("The minimum width is 20px.") 
  polygons[selectedPolygon].width = Number(widthInput.value)
})
heightInput.addEventListener("change", () => {
  if (isNaN(heightInput.value) || heightInput.value < 20) return alert("The minimum height is 20px.") 
  polygons[selectedPolygon].height = Number(heightInput.value)
})
rotationInput.addEventListener("change", () => {
  if (isNaN(rotationInput.value)) return alert("The rotation must be a number.")
  polygons[selectedPolygon].rotation = rotationInput.value/180 * Math.PI
})

function GeneralInfoTab () {
  infoTab1.style.display = ""
  infoTab2.style.display = "none"
}
function SelectedInfoTab () {
  infoTab1.style.display = "none"
  infoTab2.style.display = ""
  selectedShapeDisplay.innerText = `Shape ${currentPolygon}`
  selectedShapeX.innerText = polygons[currentPolygon].x.toFixed(2)
  selectedShapeY.innerText = polygons[currentPolygon].y.toFixed(2)
  
  widthInput.value = ""
  heightInput.value = ""
  rotationInput.value = ""
}

function MouseIsInCanvas () {
  //Since the mousepos coords are adjusted for the canvas. 
  return mousePos.x >= 0 && mousePos.x <= 500 && mousePos.y >= 0 && mousePos.y <= 500 
}

function TouchingPolygon () {
  for (var p = 0; p < polygons.length; p++) {
    var dist = Math.hypot(polygons[p].x-mousePos.x, polygons[p].y-mousePos.y)
    if (dist < 15) return p
  }
  return null
}
function RotatePoint (pointClass, polygon, rotate) {
  //Let r be the amount to rotate counterclockwise
  //(x, y) => (xcosr - ysinr, xsinr + ycosr)
  var rotateCos = Math.cos(rotate)
  var rotateSin = Math.sin(rotate)
  return {
    x: ((pointClass.x-polygon.x)*rotateCos - (pointClass.y-polygon.y)*rotateSin) + polygon.x,
    y: ((pointClass.x-polygon.x)*rotateSin + (pointClass.y-polygon.y)*rotateCos) + polygon.y
  }
}