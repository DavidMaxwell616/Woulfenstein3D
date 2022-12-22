// just a few helper functions
var $ = function(id) { return document.getElementById(id); };
var dc = function(tag) { return document.createElement(tag); };

window.requestAnimFrame = (function(){
    return window.requestAnimationFrame       || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function(callback, element){
        window.setTimeout(callback, 1000 / 60);
    };
})();

function init() {

	mapWidth = map[0].length;
	mapHeight = map.length;

	bindKeys();

	initScreen();

	initSprites();

	initEnemies();

	initWeapon();

	gameCycle();
	renderCycle();
	drawMiniMap();
    drawDashboard();
}

function initWeapon(){
	var canvas = $("weapon");
	var ctx = canvas.getContext('2d');
	weapon = new Image();
	weapon.src = 'assets/images/weapon.png';
	weapon.onload = function (e)
	{
	    ctx.drawImage(weapon, 0, 0, 64, 64, 0,0,128, 128);
	}  
}

function initEnemies() {
	var screen = $("screen");

	for (var i=0;i<mapEnemies.length;i++) {
		var enemy = mapEnemies[i];
		var type = enemyTypes[enemy.type];
		var img = dc("img");
		img.src = type.img;
		img.style.display = "none";
		img.style.position = "absolute";

		enemy.state = 0;
		enemy.rot = 0;
		enemy.rotDeg = 0;
		enemy.dir = 0;
		enemy.speed = 0;
		enemy.moveSpeed = type.moveSpeed;
		enemy.rotSpeed = type.rotSpeed;
		enemy.totalStates = type.totalStates;

		enemy.oldStyles = {
			left : 0,
			top : 0,
			width : 0,
			height : 0,
			clip : "",
			display : "none",
			zIndex : 0
		};

		enemy.img = img;
		enemies.push(enemy);

		screen.appendChild(img);
	}
}


function initSprites() {
	spriteMap = [];
	for (var y=0;y<map.length;y++) {
		spriteMap[y] = [];
	}

	var screen = $("screen");

	for (var i=0;i<mapItems.length;i++) {
		var sprite = mapItems[i];
		var itemType = itemTypes[sprite.type];
		var img = dc("img");
		img.src = itemType.img;
		img.style.display = "none";
		img.style.position = "absolute";

		sprite.visible = false;
		sprite.block = itemType.block;
		sprite.img = img;

		spriteMap[sprite.y][sprite.x] = sprite;
		screen.appendChild(img);
	}

}


var lastGameCycleTime = 0;
var gameCycleDelay = 1000 / 30; // aim for 30 fps for game logic

function gameCycle() {
	var now = new Date().getTime();

	// time since last game logic
	var timeDelta = now - lastGameCycleTime;

	move(player, timeDelta);

	ai(timeDelta);

	var cycleDelay = gameCycleDelay; 

	// the timer will likely not run that fast due to the rendering cycle hogging the cpu
	// so figure out how much time was lost since last cycle

	if (timeDelta > cycleDelay) {
		cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
	}

	setTimeout(gameCycle, cycleDelay);

	lastGameCycleTime = now;
}

function ai(timeDelta) {
	for (var i=0;i<enemies.length;i++) {
		var enemy = enemies[i];

		var dx = player.x - enemy.x;
		var dy = player.y - enemy.y;

		var dist = Math.sqrt(dx*dx + dy*dy);
		if (dist > 4) {
			var angle = Math.atan2(dy, dx);

			enemy.rotDeg = angle * 180 / Math.PI;
			enemy.rot = angle;
			enemy.speed = 1;
			var frame = Math.floor((new Date() % cycleTime) / (cycleTime / walkFrames.length)) + walkFrames[0];
			enemy.state = frame;
		} 
		else 
		{
			enemy.speed = 0;
			var frame = Math.floor((new Date() % cycleTime) / (cycleTime / shootingFrames.length)) + shootingFrames[0];
			enemy.state==frame;
		}

		move(enemies[i], timeDelta);
	}
}

var lastRenderCycleTime = 0;

function renderCycle() {

	updateMiniMap();

	clearSprites();

	castRays();

	renderSprites();

	renderEnemies();

	renderWeapon();

	updateDashboard();

	var now = new Date().getTime();
	var timeDelta = now - lastRenderCycleTime;
	var cycleDelay = cycleTime / 30;
	if (timeDelta > cycleDelay) {
	  cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
	}
	lastRenderCycleTime = now;
	setTimeout(renderCycle, cycleDelay);
	fps = cycleTime / timeDelta;
	if (showInfo) {
		updateInfo();
	}
}

function clearSprites() {
	// clear the visible sprites array but keep a copy in oldVisibleSprites for later.
	// also mark all the sprites as not visible so they can be added to visibleSprites again during raycasting.
	oldVisibleSprites = [];
	for (var i=0;i<visibleSprites.length;i++) {
		var sprite = visibleSprites[i];
		oldVisibleSprites[i] = sprite;
		sprite.visible = false;
	}
	visibleSprites = [];
}

function renderWeapon(){
}

function renderSprites() {

	for (var i=0;i<visibleSprites.length;i++) {
		var sprite = visibleSprites[i];
		var img = sprite.img;
		img.style.display = "block";

		// translate position to viewer space
		var dx = sprite.x + 0.5 - player.x;
		var dy = sprite.y + 0.5 - player.y;

		// distance to sprite
		var dist = Math.sqrt(dx*dx + dy*dy);

		// sprite angle relative to viewing angle
		var spriteAngle = Math.atan2(dy, dx) - player.rot;

		// size of the sprite
		var size = viewDist / (Math.cos(spriteAngle) * dist);

		if (size <= 0) continue;

		// x-position on screen
		var x = Math.tan(spriteAngle) * viewDist;

		img.style.left = (SCREENWIDTH/2 + x - size/2) + "px";

		// y is constant since we keep all sprites at the same height and vertical position
		img.style.top = ((SCREENHEIGHT-size)/2)+"px";

		img.style.width = size + "px";
		img.style.height =  size + "px";

		var dbx = sprite.x - player.x;
		var dby = sprite.y - player.y;
		var blockDist = dbx*dbx + dby*dby;
		img.style.zIndex = -Math.floor(blockDist*1000);
	}

	// hide the sprites that are no longer visible
	for (var i=0;i<oldVisibleSprites.length;i++) {
		var sprite = oldVisibleSprites[i];
		if (visibleSprites.indexOf(sprite) < 0) {
			sprite.visible = false;
			sprite.img.style.display = "none";
		}
	}

}

function renderEnemies() {

	for (var i=0;i<enemies.length;i++) {
		var enemy = enemies[i];
		var img = enemy.img;

		var dx = enemy.x - player.x;
		var dy = enemy.y - player.y;

		var angle = Math.atan2(dy, dx) - player.rot;

		if (angle < -Math.PI) angle += 2*Math.PI;
		if (angle >= Math.PI) angle -= 2*Math.PI;

		// is enemy in front of player? Maybe use the FOV value instead.
		if (angle > -Math.PI*0.5 && angle < Math.PI*0.5) {
			var distSquared = dx*dx + dy*dy;
			var dist = Math.sqrt(distSquared);
			var size = viewDist / (Math.cos(angle) * dist);

			if (size <= 0) continue;

			var x = Math.tan(angle) * viewDist;

			var style = img.style;
			var oldStyles = enemy.oldStyles;

			// height is equal to the sprite size
			if (size != oldStyles.height) {
				style.height =  size + "px";
				oldStyles.height = size;
			}

			// width is equal to the sprite size times the total number of states
			var styleWidth = size * enemy.totalStates;
			if (styleWidth != oldStyles.width) {
				style.width = styleWidth + "px";
				oldStyles.width = styleWidth;
			}

			// top position is halfway down the screen, minus half the sprite height
			var styleTop = ((SCREENHEIGHT-size)/2);
			if (styleTop != oldStyles.top) {
				style.top = styleTop + "px";
				oldStyles.top = styleTop;
			}

			// place at x position, adjusted for sprite size and the current sprite state
			var styleLeft = (SCREENWIDTH/2 + x - size/2 - size*enemy.state);
			if (styleLeft != oldStyles.left) {
				style.left = styleLeft + "px";
				oldStyles.left = styleLeft;
			}

			var styleZIndex = -(distSquared*1000)>>0;
			if (styleZIndex != oldStyles.zIndex) {
				style.zIndex = styleZIndex;
				oldStyles.zIndex = styleZIndex;
			}

			var styleDisplay = "block";
			if (styleDisplay != oldStyles.display) {
				style.display = styleDisplay;
				oldStyles.display = styleDisplay;
			}

			var styleClip = "rect(0, " + (size*(enemy.state+1)) + ", " + size + ", " + (size*(enemy.state)) + ")";
			if (styleClip != oldStyles.clip) {
				style.clip = styleClip;
				oldStyles.clip = styleClip;
			}
		} else {
			var styleDisplay = "none";
			if (styleDisplay != enemy.oldStyles.display) {
				img.style.display = styleDisplay;
				enemy.oldStyles.display = styleDisplay;
			}
		}
	}
}

function updateInfo() {
	var debugText = "FPS: " + fps.toFixed(1) + "<br/>"+
	"playerX: "+ Math.floor(player.x) + "<br/>" +
	"playerY: "+ Math.floor(player.y) + "<br/>";
	info.innerHTML = debugText;
	infoText = "";
}

function updateDashboard(){
	dashboard = $("dashboard");
	var ctx = dashboard.getContext('2d');
	animateSprite(face,ctx);
}

function animateSprite(sprite, ctx){
	if(sprite==null)
	return;
	sprite.update();
	sprite.draw(ctx);
}


function drawDashboard(){
	dashboard = $("dashboard");
	var ctx = dashboard.getContext('2d');
	var dash = new Image();
	dash.src = 'assets/images/dashboard.png';
	dash.onload = function (e)
	{
        ctx.drawImage(dash, 0, 0);
		ctx.fillStyle = "white";
		ctx.font = "32px Arial";
		ctx.fillText(stats.floor, 20, 55);
		ctx.fillText(stats.score, 100, 55);
		ctx.fillText(stats.lives, 170, 55);
		ctx.fillText(stats.health, 260, 55);
		ctx.fillText(stats.ammo, 345, 55);
	}
	var img = new Image();
	img.src = 'assets/images/face.png';
	img.onload = function (e)
	{
		face = new GameObject(img,208,5,25,31,2,4,7,4,cycleTime,0,4);
		face.draw(ctx);
	}
	var img2 = new Image();
		img2.src = 'assets/images/weapons.png';
		img2.onload = function (e)
	{
		weaponIcon = new GameObject(img2, 400, 5, 49, 26,2, 4,1,4,cycleTime,0,0);
		weaponIcon.draw(ctx);
	}	  
}


function initScreen() {

	var screen = $("screen");
	var walls = new Image();
	walls.src = "assets/images/walls.png";
	for (let i = 0; i < 4; i++) {
		cropImage(walls, i*64, 0, 64, 64);
		var wallTexture = new Image();
	
		wallTextures = [];
	
		walls.onload = function (e)
		{
			wallTextures.push(walls.src);
		};
	}

	function cropImage(originalImage, newX, newY, newWidth, newHeight) {
		//initialize the canvas object
		const canvas = $('wall'); 
		const ctx = canvas.getContext('2d');
	 
		//wait for the image to finish loading
		originalImage.addEventListener('load', function() {
	 
			//set the canvas size to the new width and height
			canvas.width = newWidth;
			canvas.height = newHeight;
			 
			//draw the image
			ctx.drawImage(originalImage, newX, newY, newWidth, newHeight, 0, 0, newWidth, newHeight); 
		});
	}

	for (var i=0;i<SCREENWIDTH;i+=stripWidth) {
		var strip = dc("img");
		strip.style.position = "absolute";
		strip.style.height = "0px";
		strip.style.left = strip.style.top = "0px";
		//strip.src = "assets/images/walls.png";
		// if (useSingleTexture) {
		// 	strip.src = (window.opera ? "walls_19color.png" : "walls.png");
		// }

		strip.oldStyles = {
			left : 0,
			top : 0,
			width : 0,
			height : 0,
			clip : "",
			src : ""
		};

		screenStrips.push(strip);
		screen.appendChild(strip);
	}

	// info div for adding text like fps count, etc.
	info = dc("div");
	info.id = "info";
	info.style.display = showInfo ? "block" : "none";
	screen.appendChild(info);

}

function move(entity, timeDelta) {
	// time timeDelta has passed since we moved last time. We should have moved after time gameCycleDelay, 
	// so calculate how much we should multiply our movement to ensure game speed is constant

	var mul = timeDelta / gameCycleDelay;

	var moveStep = mul * entity.speed * entity.moveSpeed;	// entity will move this far along the current direction vector

	entity.rotDeg += mul * entity.dir * entity.rotSpeed; // add rotation if entity is rotating (entity.dir != 0)
	entity.rotDeg %= 360;

	if (entity.rotDeg < -180) entity.rotDeg += 360;
	if (entity.rotDeg >= 180) entity.rotDeg -= 360;

	var snap = (entity.rotDeg+360) % 90
	if (snap < 2 || snap > 88) {
		entity.rotDeg = Math.round(entity.rotDeg / 90) * 90;
	}

	entity.rot = entity.rotDeg * Math.PI / 180;

	var newX = entity.x + Math.cos(entity.rot) * moveStep;	// calculate new entity position with simple trigonometry
	var newY = entity.y + Math.sin(entity.rot) * moveStep;

	var pos = checkCollision(entity.x, entity.y, newX, newY, 0.35);

	entity.x = pos.x; // set new position
	entity.y = pos.y;
}

function checkCollision(fromX, fromY, toX, toY, radius) {
	var pos = {
		x : fromX,
		y : fromY
	};

	if (toY < 0 || toY >= mapHeight || toX < 0 || toX >= mapWidth)
		return pos;

	var blockX = Math.floor(toX);
	var blockY = Math.floor(toY);


	if (isBlocking(blockX,blockY)) {
		return pos;
	}

	pos.x = toX;
	pos.y = toY;

	var blockTop = isBlocking(blockX,blockY-1);
	var blockBottom = isBlocking(blockX,blockY+1);
	var blockLeft = isBlocking(blockX-1,blockY);
	var blockRight = isBlocking(blockX+1,blockY);

	if (blockTop != 0 && toY - blockY < radius) {
		toY = pos.y = blockY + radius;
	}
	if (blockBottom != 0 && blockY+1 - toY < radius) {
		toY = pos.y = blockY + 1 - radius;
	}
	if (blockLeft != 0 && toX - blockX < radius) {
		toX = pos.x = blockX + radius;
	}
	if (blockRight != 0 && blockX+1 - toX < radius) {
		toX = pos.x = blockX + 1 - radius;
	}

	// is tile to the top-left a wall
	if (isBlocking(blockX-1,blockY-1) != 0 && !(blockTop != 0 && blockLeft != 0)) {
		var dx = toX - blockX;
		var dy = toY - blockY;
		if (dx*dx+dy*dy < radius*radius) {
			if (dx*dx > dy*dy)
				toX = pos.x = blockX + radius;
			else
				toY = pos.y = blockY + radius;
		}
	}
	// is tile to the top-right a wall
	if (isBlocking(blockX+1,blockY-1) != 0 && !(blockTop != 0 && blockRight != 0)) {
		var dx = toX - (blockX+1);
		var dy = toY - blockY;
		if (dx*dx+dy*dy < radius*radius) {
			if (dx*dx > dy*dy)
				toX = pos.x = blockX + 1 - radius;
			else
				toY = pos.y = blockY + radius;
		}
	}
	// is tile to the bottom-left a wall
	if (isBlocking(blockX-1,blockY+1) != 0 && !(blockBottom != 0 && blockBottom != 0)) {
		var dx = toX - blockX;
		var dy = toY - (blockY+1);
		if (dx*dx+dy*dy < radius*radius) {
			if (dx*dx > dy*dy)
				toX = pos.x = blockX + radius;
			else
				toY = pos.y = blockY + 1 - radius;
		}
	}
	// is tile to the bottom-right a wall
	if (isBlocking(blockX+1,blockY+1) != 0 && !(blockBottom != 0 && blockRight != 0)) {
		var dx = toX - (blockX+1);
		var dy = toY - (blockY+1);
		if (dx*dx+dy*dy < radius*radius) {
			if (dx*dx > dy*dy)
				toX = pos.x = blockX + 1 - radius;
			else
				toY = pos.y = blockY + 1 - radius;
		}
	}

	return pos;
}

function isBlocking(x,y) {

	// first make sure that we cannot move outside the boundaries of the level
	if (y < 0 || y >= mapHeight || x < 0 || x >= mapWidth)
		return true;

	var ix = Math.floor(x);
	var iy = Math.floor(y);

	// return true if the map block is not 0, ie. if there is a blocking wall.
	if (map[iy][ix] != 0)
		return true;

	if (spriteMap[iy][ix] && spriteMap[iy][ix].block)
		return true;

	return false;
}

function updateMiniMap() {

	var miniMap = $("minimap");
	var miniMapObjects = $("minimapobjects");

	var objectCtx = miniMapObjects.getContext("2d");
	miniMapObjects.width = miniMapObjects.width;

	objectCtx.fillStyle = "red";
	objectCtx.fillRect(		// draw a dot at the current player position
		player.x * miniMapScale - 2, 
		player.y * miniMapScale - 2,
		4, 4
	);

	objectCtx.strokeStyle = "red";
	objectCtx.beginPath();
	objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
	objectCtx.lineTo(
		(player.x + Math.cos(player.rot) * 4) * miniMapScale,
		(player.y + Math.sin(player.rot) * 4) * miniMapScale
	);
	objectCtx.closePath();
	objectCtx.stroke();

	for (var i=0;i<enemies.length;i++) {
		var enemy = enemies[i];

		objectCtx.fillStyle = "blue";
		objectCtx.fillRect(		// draw a dot at the enemy position
			enemy.x * miniMapScale - 2, 
			enemy.y * miniMapScale - 2,
			4, 4
		);
	}
}

function drawMiniMap() {

	// draw the topdown view minimap

	var miniMap = $("minimap");			// the actual map
	var miniMapCtr = $("minimapcontainer");		// the container div element
	var miniMapObjects = $("minimapobjects");	// the canvas used for drawing the objects on the map (player character, etc)

	miniMap.width = mapWidth * miniMapScale;	// resize the internal canvas dimensions 
	miniMap.height = mapHeight * miniMapScale;	// of both the map canvas and the object canvas
	miniMapObjects.width = miniMap.width;
	miniMapObjects.height = miniMap.height;

	var w = (mapWidth * miniMapScale) + "px" 	// minimap CSS dimensions
	var h = (mapHeight * miniMapScale) + "px"
	miniMap.style.width = miniMapObjects.style.width = miniMapCtr.style.width = w;
	miniMap.style.height = miniMapObjects.style.height = miniMapCtr.style.height = h;

	var ctx = miniMap.getContext("2d");
	ctx.globalAlpha = 0.2;
	ctx.fillStyle = "white";
	ctx.fillRect(0,0,miniMap.width,miniMap.height);

	// loop through all blocks on the map
	for (var y=0;y<mapHeight;y++) {
		for (var x=0;x<mapWidth;x++) {

			var wall = map[y][x];

			if (wall > 0) { // if there is a wall block at this (x,y) ...
				ctx.fillStyle = "rgb(200,200,200)";
				ctx.fillRect(				// ... then draw a block on the minimap
					x * miniMapScale,
					y * miniMapScale,
					miniMapScale,miniMapScale
				);
			}

			if (spriteMap[y][x]) {
				ctx.fillStyle = "rgb(100,200,100)";
				ctx.fillRect(
					x * miniMapScale + miniMapScale*0.25,
					y * miniMapScale + miniMapScale*0.25,
					miniMapScale*0.5,miniMapScale*0.5
				);
			}
		}
	}

	updateMiniMap();
}

function fireWeapon(){

}

window.onload = init;