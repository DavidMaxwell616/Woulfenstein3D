
// bind keyboard events to game functions (movement, etc)
function bindKeys() {

	document.onkeydown = function(e) {
		e = e || window.event;

		switch (e.key) { // which key was pressed?

			case 'ArrowUp': // up, move player forward, ie. increase speed
				player.speed = 1;
				break;

			case 'ArrowDown': // down, move player backward, set negative speed
				player.speed = -1;
				break;

			case 'ArrowLeft': // left, rotate player left
				player.dir = -1;
				break;

			case 'ArrowRight': // right, rotate player right
				player.dir = 1;
				break;

			case 'Space': // right, rotate player right
				fireWeapon();
				break;
		}
	}

	document.onkeyup = function(e) {
		e = e || window.event;

		switch (e.key) {
			case 'ArrowUp':
			case 'ArrowDown':
				player.speed = 0;	// stop the player movement when up/down key is released
				break;
			case 'ArrowLeft':
			case 'ArrowRight':
				player.dir = 0;
				break;
		}
	}
}

