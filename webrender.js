/// <reference path="./libsat.js" />

"use strict"

class Shape {
  /**
   * Constructs a shape, defaults to rectangle.
   * @param { Shape } shapeClass
   */
  constructor ({ x, y, width, height, rotation, sides } = {}) {
    this.x = x || 0
    this.y = y || 0
    this.width = width || 10 
    this.height = height || 10
    this.rotation = rotation || 0
    this.sides = sides || 0

    /**
     * @type { Polygon }
     */
    this.poly
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
    rotation: Math.PI/4,
    sides: 4
  }),
  new Shape({
    x: 300, 
    y: 200,
    width: 150,
    height: 90,
    sides: 4
  })
]

/**
 * ??? 
 */
var currentPolygon = null
/**
 * Polygon selected by the user(most recently clicked and not unclicked). This determines the display on the right. 
 * @type { number | null } 
 */
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

//Inputs to update the polygons

var lockRatioCheckBox = document.getElementById("lockRatioCheckBox")

var widthTextInput = document.getElementById("widthTextInput")
var widthInput = document.getElementById("widthInput")

var heightTextInput = document.getElementById("heightTextInput")
var heightInput = document.getElementById("heightInput")

var smallSizeWarning =  document.getElementById("smallSizeWarning")

var rotationInput = document.getElementById("rotationInput")
var sideInput = document.getElementById("sideInput")

var rotationTextInput = document.getElementById("rotationTextInput")

/**
 * Used for debugging. If enabeled, circles are drawn at the CALCULATED corners of the shapes. 
 */
var enableCornerPoints = false

//Frame loop. delta and last check are useless rn since this isn't a game. 
var delta, lastcheck = Date.now()
Animate()

/**
 * Handles all the drawing to canvas. 
 */
function Animate () {
  requestAnimationFrame(Animate)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  var collisions = []
  collisions.length = polygons.length
  collisions.fill(false)

  //Define all the points and polygon class.
  for (var i = 0; i < polygons.length; i++) {
    //counter clockwise from bottom right
    var points = polygons[i].sides == 4 ? CalculateRectanglePoints(polygons[i]) : CalculatePolygonPoints(polygons[i])
    polygons[i].poly = new Polygon(points)
  }

  for (var i = 0; i < polygons.length; i++) {
    //This we do this to get every combination. Sadly can't break incase if this is touching another polygon later. 
    for (var t = i+1; t < polygons.length; t++) {

      if (polygons[i].poly.IsTouchingPolygon(polygons[t].poly)) {
        collisions[i] = true
        collisions[t] = true 
      }
    }

    //Polygons are green if hitting any other polygon. 
    if (collisions[i]) {
      ctx.fillStyle = "#0f0"
    } else {
      ctx.fillStyle = "#000"
    }

    if (polygons[i].sides == 4) {
      ctx.save()
      ctx.translate(polygons[i].x, polygons[i].y)
      ctx.rotate(polygons[i].rotation)
      ctx.fillRect(-polygons[i].width/2,  -polygons[i].height/2, polygons[i].width, polygons[i].height)
      ctx.restore()
    } else {
      var startPoint = polygons[i].poly.points[0]

      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)

      for (var p = 0; p < polygons[i].poly.points.length; p++) {
        var point = polygons[i].poly.points[p]

        ctx.lineTo(point.x, point.y)
      }

      ctx.fill()
    }

    //Draws the drag circle. 
    ctx.save()
    ctx.fillStyle = "#fff"
    ctx.beginPath()
    ctx.arc(polygons[i].x, polygons[i].y, 10, 0, Math.PI*2)
    ctx.fill()
    ctx.restore()

    //Draw in the corner points, if enabled
    if (enableCornerPoints) {
      for (var point of polygons[i].poly.points) {
        ctx.save()
        ctx.fillStyle = "#00f"
        ctx.beginPath()
        ctx.fillRect(point.x-4, point.y-4, 8, 8)
        ctx.fill()
        ctx.restore()
      }
    }
  }
}

/**
 * 
 * @param { Shape } polygon Rectangle. 
 * @returns { Array<Points> }
 */
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

/**
 * 
 * @param { Polygon } polygon 
 * @returns 
 */
function CalculatePolygonPoints (polygon) {
  /**
   * @type { Array<Point> }
   */
  var points = []

  var angle = 0//-Math.PI/polygon.sides * 2 //So the rectangle isn't a diamond 

  for (var c = 0; c < polygon.sides; c++) {
    points.push(new Point(
      Math.cos(angle) * polygon.width/2 + polygon.x,
      Math.sin(angle) * polygon.height/2 + polygon.y
    )) 

    angle += Math.PI*2 / polygon.sides
  }

  //Map the rotation
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
  mousePos.x = (event.pageX-cDivBoundingBox.left)*scaleFactor
  mousePos.y = (event.pageY-cDivBoundingBox.top)*scaleFactor

  if (currentPolygon || currentPolygon === 0) {
    polygons[currentPolygon].x = mousePos.x
    polygons[currentPolygon].y = mousePos.y

    selectedShapeX.innerText = polygons[currentPolygon].x.toFixed(2)
    selectedShapeY.innerText = polygons[currentPolygon].y.toFixed(2)
  }

  //Make it show it's draggable if it's touching a polygon handle
  if (TouchingPolygonHandle() !== null) {
    document.body.style.cursor = "move"
  } else {
    document.body.style.cursor = ""
  }
})
document.addEventListener("mousedown", () => {
  mousePos.isDown = true
  currentPolygon = TouchingPolygonHandle()
  if (currentPolygon || currentPolygon === 0) {
    selectedPolygon = currentPolygon
    SelectedInfoTab()
  }
})

document.addEventListener("mouseup", () => {
  mousePos.isDown = false
  currentPolygon = null
  if (MouseIsInCanvas() && TouchingPolygonHandle() === null) {
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
widthTextInput.oninput = () => {
  if (IsModifiedNumber(widthTextInput.value)) return 

  if (MinSizeCheck(widthTextInput.value)) return
  
  if (lockRatioCheckBox.checked) {
    //Adjust width/height while keeping the same ratio. 
    AdjustWidthAndHeight(widthTextInput.value, "width", "height")
  } else {
    polygons[selectedPolygon].width = Number(widthTextInput.value)

    widthInput.value = widthTextInput.value
  }

}
widthInput.oninput = () => {
  if (lockRatioCheckBox.checked) AdjustWidthAndHeight(widthInput.value, "width", "height")
  else {
    polygons[selectedPolygon].width = Number(widthInput.value)
    
    widthTextInput.value = widthInput.value
  }
}

heightTextInput.oninput = () => {
  if (IsModifiedNumber(heightTextInput.value)) return 

  if (MinSizeCheck(heightTextInput.value)) return 

  if (lockRatioCheckBox.checked) AdjustWidthAndHeight(heightTextInput.value, "height", "width")
  else {
    polygons[selectedPolygon].height = Number(heightTextInput.value)
    
    heightInput.value = heightTextInput.value
  }
}
heightInput.oninput = () => {
  if (lockRatioCheckBox.checked) AdjustWidthAndHeight(heightInput.value, "height", "width")
  else {
    polygons[selectedPolygon].height = Number(heightInput.value)
    
    heightTextInput.value = heightInput.value
  }
}

//Text input 
rotationTextInput.oninput = () => {
  //Rotate the current shape only if it is a valid rotation. Also if it ends with a dot, probably trying to type a decimal. 
  if (IsModifiedNumber(rotationTextInput.value)) return 

  RotateCurrentShape(rotationTextInput.value % 360)
}
//Slider
rotationInput.oninput = () => {
  RotateCurrentShape(rotationInput.value)
}

/**
 * Checks if the input value is less than the min value(20). If so it shows the user notification, otherwise hides it. 
 * @param { number } value Input value. 
 * @returns { boolean } Returns true if it's less than the height, otherwise returns false. 
 */
function MinSizeCheck (value) {
  if (value < 20) {
    smallSizeWarning.style.display = ""
    return true
  } else {
    smallSizeWarning.style.display = "none"
    return false
  }
}

/**
 * Adjust the text display and sliders for width and height for when RATIO LOCK IS ENABLED.
 * @param { number } inputValue New value for either height of width. 
 * @param { "height" | "width" } focusAttribute The value that is being changed. 
 * @param { "height" | "width" } affectedAttribute The value gets changed to maintain the same ratio. 
 */
function AdjustWidthAndHeight (inputValue, focusAttribute, affectedAttribute) {
  var changedValue = Number(inputValue)
  var ratio = polygons[selectedPolygon][affectedAttribute] / polygons[selectedPolygon][focusAttribute]

  polygons[selectedPolygon][focusAttribute] = changedValue
  polygons[selectedPolygon][affectedAttribute] = changedValue * ratio

  //switching focus attribute if it's height since the names of the document items are always the same. 
  if (focusAttribute == "width") {
    focusAttribute = "height", affectedAttribute = "width"
  }
  //So focusattribute will always be height and affected attribute will always be width for setting element values. 
  UpdateHeightDisplay(Math.round(polygons[selectedPolygon][focusAttribute]*10000)/10000) //Used to prevent floating point mistakes. Values beyond 4 can still be submitted via copy/paste, but why would anyone need that much precision? 
  UpdateWidthDisplay(Math.round(polygons[selectedPolygon][affectedAttribute]*10000)/10000)
}

/**
 * Sets the width text and slider to the value. 
 * @param { number } value 
 */
function UpdateWidthDisplay (value) {
  widthTextInput.value = value
  widthInput.value = value
}
/**
 * Sets the height text and slider to the value. 
 * @param {*} value 
 */
function UpdateHeightDisplay (value) {
  heightTextInput.value = value
  heightInput.value = value
}

/**
 * Returns true if the text is not a number or it ends with dot(needed so people can enter decimals).
 * @param { string } text Text inside the text area for number input.
 * @returns { boolean }
 */
function IsModifiedNumber (text) {
  return isNaN(text) || text.endsWith(".")
}

sideInput.addEventListener("change", () => {
  if (isNaN(sideInput.value)) return alert("The sides must be a number.")
  if (sideInput.value < 3) return alert("A polygon needs at least 3 sides.")
  
  if (sideInput.value == 4) {
    //widthHeightDiv.style.display = ""
  } else {
    //widthHeightDiv.style.display = "none"
  }

  polygons[selectedPolygon].sides = Math.round(sideInput.value)
})

/**
 * Show the general info tab. 
 */
function GeneralInfoTab () {
  infoTab1.style.display = ""
  infoTab2.style.display = "none"
}

/**
 * Selected a shape. 
 */
function SelectedInfoTab () {
  infoTab1.style.display = "none"
  infoTab2.style.display = ""
  selectedShapeDisplay.innerText = `Shape ${currentPolygon}`
  selectedShapeX.innerText = polygons[currentPolygon].x.toFixed(2)
  selectedShapeY.innerText = polygons[currentPolygon].y.toFixed(2)

  sideInput.value = polygons[currentPolygon].sides

  UpdateWidthDisplay(polygons[currentPolygon].width)
  UpdateHeightDisplay(polygons[currentPolygon].height)

  var angle = polygons[currentPolygon].rotation/Math.PI * 180
  rotationInput.value = angle
  rotationTextInput.value = angle
}

/**
 * If the mouse is in the canvas. 
 * @returns { boolean }
 */
function MouseIsInCanvas () {
  //Since the mousepos coords are adjusted for the canvas. 
  return mousePos.x >= 0 && mousePos.x <= 500 && mousePos.y >= 0 && mousePos.y <= 500 
}

/**
 * If the mouse is touching the polygon handle. 
 * @returns { number | null } item index of the polygon. 
 */
function TouchingPolygonHandle () {
  for (var p = 0; p < polygons.length; p++) {
    var dist = Math.hypot(polygons[p].x-mousePos.x, polygons[p].y-mousePos.y)
    if (dist < 15) return p
  }
  return null
}

/**
 * Rotates a point. 
 * @param { Point } pointClass 
 * @param { Shape } polygon Used fo find the center x and y.
 * @param { number } rotate angle rad
 * @returns {  }
 */
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

/**
 * Rotate shape? 
 * @param { number } angle 
 */
function RotateCurrentShape (angle) {
  polygons[selectedPolygon].rotation = angle/180 * Math.PI
  rotationInput.value = angle
  rotationTextInput.value = angle
}