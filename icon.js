"use strict"

var iconSVG = document.getElementById("lightRaysImage")
//SVGs don't draw properly without the width/height on firefox...
iconSVG.setAttribute("width", 180)
iconSVG.setAttribute("height", 150)

var iconImage = new Image()
iconImage.src = URL.createObjectURL(new Blob([ iconSVG.outerHTML ], { type: "image/svg+xml" } ))
iconImage.onload = function () {
  var canvas = document.createElement("canvas")
  canvas.width = iconImage.width || 180 //Image loads with 0 width/height in firefox for some reason. 
  canvas.height = iconImage.height || 150 

  canvas.getContext("2d").drawImage(iconImage, 0, 0)
  
  var icon = document.createElement("link")
  icon.rel = "icon"
  icon.href = canvas.toDataURL("image/png")
  document.head.appendChild(icon)

  //Remove the attributes since I don't need them 
  iconSVG.removeAttribute("width")
  iconSVG.removeAttribute("height")
}
