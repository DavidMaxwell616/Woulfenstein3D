// just a few helper functions
var $ = function(id) { return document.getElementById(id); };
var dc = function(tag) { return document.createElement(tag); };
var lastGameCycleTime = 0;
var lastRenderCycleTime = 0;
var cycleTime = 1000;
var gameCycleDelay = cycleTime / 30; // aim for 30 fps for game logic
var face;

// window.requestAnimFrame = (function(){
//   return window.requestAnimationFrame       || 
//   window.webkitRequestAnimationFrame || 
//   window.mozRequestAnimationFrame    || 
//   window.oRequestAnimationFrame      || 
//   window.msRequestAnimationFrame     || 
//   // function(callback, element){
//   //     window.setTimeout(callback, 1000 / 30);
//   // };
// })();

function init() {
  initFace();
  renderCycle();
}

function initFace(){
  var canvas = $("canvas");
	var ctx = canvas.getContext('2d');

  var img = new Image();
	img.src = '../assets/images/face.png';
  img.onload = function (e)
	{
	face = new GameObject(img,0,0,25,31,4,7,4,cycleTime,0,4);
  face.draw(ctx);
  }
}

function renderCycle() {
  var now = new Date().getTime();
  var timeDelta = now - lastRenderCycleTime;
  var cycleDelay = cycleTime / 30;
  if (timeDelta > cycleDelay) {
    cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
  }
  lastRenderCycleTime = now;
  setTimeout(renderCycle, cycleDelay);
  fps = cycleTime / timeDelta;
  updateAnimations()
}

function updateAnimations()
{
  updateAnimation(face);
}

function updateAnimation(sprite){
  var canvas = $("canvas");
	var ctx = canvas.getContext('2d');

if(sprite==null)
return;

sprite.update();
sprite.draw(ctx);
}

window.onload = init;