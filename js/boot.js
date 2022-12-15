const SCREENWIDTH = 800;
const SCREENHEIGHT = 500;

var objectsPath = "assets/images/objects.png";
var itemTypes = [
	{ type: 0, name: "table and chairs", column: 5, row: 1, block : true },
	{ type: 1, name: "armor", column: 4, row: 4, block : true },
	{ type: 2, name: "plant", column: 1, row: 3, block : true },
	{ type: 3, name: "lamp", column: 1, row: 2, block : false },
	{ type: 4, name: "door", column: 5, row: 1, block : false }
];


var mapItems = [
    // lamps in center area
	{type:3, x:10, y:7},
	{type:3, x:15, y:7},

	// lamps in bottom corridor
	{type:3, x:5, y:22},
	{type:3, x:12, y:22},
	{type:3, x:19, y:22},

	// tables in long bottom room
	{type:0, x:10, y:18},
	{type:0, x:15, y:18},
	// lamps in long bottom room
	{type:3, x:8, y:18},
	{type:3, x:17, y:18}
];

var cycleTime = 1000;
var walkFrames = [1,2,3,4];
var dieFrames = [5,6,7,8];
var shootingFrames = [11,12]
var enemyTypes = [
	{ img : "assets/images/guard.png", moveSpeed : 0.05, rotSpeed : 3, totalStates : 13 },
	{ img : "assets/images/ss.png", moveSpeed : 0.05, rotSpeed : 3, totalStates : 13 },
	{ img : "assets/images/dog.png", moveSpeed : 0.05, rotSpeed : 3, totalStates : 13 }
];

var weaponStates = 
	{ 	img : "assets/images/weapon.png", 
		weaponType : 0, width: 64, height: 64, 
		left: 200, top: 100, firing: false 
	};


var mapEnemies = [
	{type : 0, x : 33.5, y : 2.5},
	{type : 0, x : 35.5, y : 16.5}
];

var player = {
	x : 28.5,		// current x, y position
	y : 50.5,
	dir : 0,		// the direction that the player is turning, either -1 for left or 1 for right.
	rotDeg : 0,		// the current angle of rotation 
	rot : 0,		// rotation in radians
	speed : 0,		// is the playing moving forward (speed = 1) or backwards (speed = -1).
	moveSpeed : 0.10,	// how far (in map units) does the player move each step/update
	rotSpeed : 3		// how much does the player rotate each step/update (in degrees)
}

var mapWidth = 0;
var mapHeight = 0;

var miniMapScale = 4;

var showInfo = true;

var stripWidth = 3;
var fov = 90 * Math.PI / 180;

var numRays = Math.ceil(SCREENWIDTH / stripWidth);
var fovHalf = fov / 2;

var viewDist = (SCREENWIDTH/2) / Math.tan((fov / 2));

var twoPI = Math.PI * 2;

var walls = new Image();
walls.src = "assets/images/walls.png";
var wallTextures = [];
walls.onload = function (e)
{
	wallTextures.push(walls.src);
};

var userAgent = navigator.userAgent.toLowerCase();
var isGecko = userAgent.indexOf("gecko") != -1 && userAgent.indexOf("safari") == -1;

// enable this to use a single image file containing all wall textures. This performs better in Firefox. Opera likes smaller images.
var useSingleTexture = isGecko;

var screenStrips = [];
var info;
var weapon;
var fps = 0;
var infoText = "";

var dashboard;

var stats = {
	floor: 1,
	score: 0,
	lives: 3,
	health: 100,
	ammo: 7
};

var enemies = [];
var spriteMap;
var visibleSprites = [];
var oldVisibleSprites = [];
var face;
var weaponIcon;

