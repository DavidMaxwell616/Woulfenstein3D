const SCREENWIDTH = 800;
const SCREENHEIGHT = 500;

var itemTypes = [
	{ img : "assets/images/tablechairs.png", block : true },	// 0
	{ img : "assets/images/armor.png", block : true },		// 1
	{ img : "assets/images/plantgreen.png", block : true },	// 2
	{ img : "assets/images/lamp.png", block : false }		// 3
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


var enemyTypes = [
	{ img : "assets/images/guard.png", moveSpeed : 0.05, rotSpeed : 3, totalStates : 13 }
];

var weaponStates = 
	{ img : "assets/images/weapon.png", weaponType : 0, width: 64, height: 64, left: 200, top: 100, firing: false };


var mapEnemies = [
	{type : 0, x : 17.5, y : 4.5},
	{type : 0, x : 25.5, y : 16.5}
];

var player = {
	x : 26.5,		// current x, y position
	y : 45.5,
	dir : 0,		// the direction that the player is turning, either -1 for left or 1 for right.
	rotDeg : 0,		// the current angle of rotation 
	rot : 0,		// rotation in radians
	speed : 0,		// is the playing moving forward (speed = 1) or backwards (speed = -1).
	moveSpeed : 0.10,	// how far (in map units) does the player move each step/update
	rotSpeed : 3		// how much does the player rotate each step/update (in degrees)
}

var mapWidth = 0;
var mapHeight = 0;

var miniMapScale = 8;

var showInfo = true;

var stripWidth = 3;
var fov = 60 * Math.PI / 180;

var numRays = Math.ceil(SCREENWIDTH / stripWidth);
var fovHalf = fov / 2;

var viewDist = (SCREENWIDTH/2) / Math.tan((fov / 2));

var twoPI = Math.PI * 2;

var numTextures = 4;
var wallTextures = [
	"assets/images/walls_1.png",
	"assets/images/walls_2.png",
	"assets/images/walls_3.png",
	"assets/images/walls_4.png"
];

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

