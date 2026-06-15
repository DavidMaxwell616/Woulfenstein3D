import { H, W, pickupData, weapons, weaponPickupData } from "./config.js";
import { HUD } from "./Hud.js";

export class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.spritesheet("walls", "assets/images/walls.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("objects", "assets/images/objects.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.image("dashboard", "assets/images/dashboard.png");

        this.load.spritesheet("face", "assets/images/face.png", {
            frameWidth: 25,
            frameHeight: 31
        });

        this.load.spritesheet("weapon_icons", "assets/images/weapon_icons.png", {
            frameWidth: 49,
            frameHeight: 26
        });
        this.load.spritesheet("guard", "assets/images/guard.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("ss", "assets/images/ss.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("dog", "assets/images/dog.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("weapon", "assets/images/weapons.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.path = "../assets/json/";
        this.load.json("wallData", "wall_map.json");
        this.load.json("objectData", "object_map.json");
    }

    create() {
        const data = this.scene.settings.data || {};
        this.level = data.level ?? 1;
        this.score = data.score ?? 0;
        this.lives = data.lives ?? 3;

        this.wallData = this.cache.json.get("wallData");
        this.objectData = this.cache.json.get("objectData");

        const levelIndex = this.level - 1;

        this.wallMap =
            this.wallData.wall_levels[levelIndex];

        this.objectMap =
            this.objectData.object_levels[levelIndex];

        this.wallMap = this.wallMap.map(row =>
            row.map(cell => cell === 106 ? 0 : cell)
        );

        this.enteringElevator = false;
        this.playerDying = false;
        this.health = 100;
        this.ammo = 50;
        this.health = 100;
        this.oldHealth = 100;
        this.hud = new HUD(this);

        this.enemiesAreOblivious = false;
        this.enemiesDontMove = false;

        this.createEnemyAnimations();
        this.mapW = this.wallMap[0].length;
        this.mapH = this.wallMap.length;
        this.setupObjects();
        this.fov = Phaser.Math.DegToRad(60);
        this.numRays = 320;
        this.stripW = W / this.numRays;
        this.viewDist = (W / 2) / Math.tan(this.fov / 2);
        this.doors = new Map();
        this.keys = this.input.keyboard.createCursorKeys();
        this.DOOR_OPEN_TIME = 5000;
        this.DOOR_MIN = 89;
        this.DOOR_MAX = 101;
        this.nextFireTime = 0;
        // ceiling / floor background
        this.worldGfx = this.add.graphics();
        this.worldGfx.setDepth(0);
        this.weaponSprite = this.add.sprite(W / 2, H * .58, "weapon", 1)
            .setOrigin(0.5, 0.5)
            .setDepth(1000001)
            .setScale(5);
        this.ownedWeapons = {
            0: true,   // knife always owned
            1: true,  // pistol
            2: false,  // machine gun
            3: false   // gatling gun
        };
        if (!this.anims.exists("knife")) {
            this.anims.create({
                key: "knife",
                frames: this.anims.generateFrameNumbers("weapon", {
                    start: 0,
                    end: 4
                }),
                frameRate: 10,
                repeat: 0
            });
        }
        if (!this.anims.exists("pistol")) {
            this.anims.create({
                key: "pistol",
                frames: this.anims.generateFrameNumbers("weapon", {
                    start: 5,
                    end: 9
                }),
                frameRate: 10,
                repeat: 0
            });
        }
        if (!this.anims.exists("machine_gun")) {
            this.anims.create({
                key: "machine_gun",
                frames: this.anims.generateFrameNumbers("weapon", {
                    start: 10,
                    end: 14
                }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!this.anims.exists("gatling_gun")) {
            this.anims.create({
                key: "gatling_gun",
                frames: this.anims.generateFrameNumbers("weapon", {
                    start: 15,
                    end: 19
                }),
                frameRate: 32,
                repeat: -1
            });
        }
        this.weapon = 0;

        this.enemyFacing = {
            "south": 0,
            "southWest": 1,
            "west": 2,
            "northWest": 3,
            "north": 4,
            "northEast": 5,
            "east": 6,
            "southEast": 7
        };

        if (this.textures.exists("wallScreen")) {
            this.textures.remove("wallScreen");
        }

        this.wallCanvas = this.textures.createCanvas("wallScreen", W, H);
        this.wallCtx = this.wallCanvas.getContext();

        this.wallScreen = this.add.image(0, 0, "wallScreen")
            .setOrigin(0, 0)
            .setDepth(1);

        this.wallsImage = this.textures.get("walls").getSourceImage();

        this.spriteLayer = this.add.container(0, 0);
        this.spriteLayer.setDepth(10);

        this.mapGfx = this.add.graphics();
        this.mapGfx.setDepth(9999);
        this.minimapVisible = true;

        this.keys.m = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.M
        );
        this.keys.space = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
        this.keys.fire = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.CTRL
        );
        this.keys.one = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.ONE
        );
        this.keys.two = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.TWO
        );
        this.keys.three = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.THREE
        );
        this.keys.four = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.FOUR
        );
        this.depthBuffer = [];
    }
    isSecretDoorMarker(mx, my) {
        return this.objectMap[my]?.[mx] === 98;
    }

    respawnPlayer() {
        this.health = 100;
        this.playerDying = false;

        this.player.x = this.startX;
        this.player.y = this.startY;
        this.player.rot = this.startRot;

        this.resetEnemies();

    }
    isDoorFrame(frame) {
        return frame >= this.DOOR_MIN && frame <= this.DOOR_MAX;
    }
    enemyCanSeePoint(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist * 8);

        for (let i = 1; i < steps; i++) {
            const t = i / steps;

            const x = x1 + dx * t;
            const y = y1 + dy * t;

            if (this.isBlocking(x, y)) {
                return false;
            }
        }

        return true;
    }
    enemyHasLineOfSight(x1, y1, x2, y2) {

        const dx = x2 - x1;
        const dy = y2 - y1;

        const dist = Math.hypot(dx, dy);

        const steps = Math.ceil(dist * 8);

        for (let i = 1; i < steps; i++) {

            const t = i / steps;

            const x = x1 + dx * t;
            const y = y1 + dy * t;

            const mx = Math.floor(x);
            const my = Math.floor(y);

            const tile =
                this.wallMap[my]?.[mx];

            if (
                tile > 0 &&
                !this.isSecretDoorMarker(mx, my)
            ) {
                return false;
            }
        }

        return true;
    }
    fireWeapon() {
        const weapon = weapons[this.weapon];
        if (weapon.ammo && this.ammo <= 0) {
            return;
        }

        if (
            this.weapon <= 1 &&
            this.time.now < this.nextFireTime
        ) {
            return;
        }

        this.nextFireTime =
            this.time.now + weapon.fireDelay;

        if (!this.weaponSprite.anims.isPlaying) {
            this.weaponSprite.play(weapon.animation);
        }

        if (weapon.ammo) {
            this.ammo--;
        }

        let bestEnemy = null;
        let bestDist = Infinity;

        for (const enemy of this.enemies) {

            if (enemy.dead) continue;

            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;

            const dist = Math.hypot(dx, dy);

            if (dist > weapon.range) continue;

            const angle =
                Phaser.Math.Angle.Wrap(
                    Math.atan2(dy, dx) -
                    this.player.rot
                );

            const aimCone =
                this.weapon === 0
                    ? Phaser.Math.DegToRad(45)
                    : Phaser.Math.DegToRad(10);

            if (Math.abs(angle) > aimCone) {
                continue;
            }

            if (!this.enemyCanSeePoint(
                this.player.x,
                this.player.y,
                enemy.x,
                enemy.y
            )) {
                continue;
            }

            if (dist < bestDist) {
                bestDist = dist;
                bestEnemy = enemy;
            }
        }

        if (bestEnemy) {
            this.damageEnemy(
                bestEnemy,
                weapon.damage
            );
        }
    }
    setupObjects() {
        this.objects = [];
        this.turns = [];
        this.guards = [];
        this.ss = [];
        this.dogs = [];

        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {

                let obj = this.objectMap[y][x];

                if (obj > 0) {
                    if (obj >= 19 && obj <= 22) {
                        this.player = {
                            x: x,
                            y: y,
                            rot: obj - 19 * 90,
                            moveSpeed: 3.2,
                            rotSpeed: 2.2
                        };

                        this.startX = this.player.x;
                        this.startY = this.player.y;
                        this.startRot = this.player.rot;
                    }
                    else if (obj >= 23 && obj <= 56) {
                        const objectCode = obj;   // original object-map value
                        const frame = obj - 21;   // sprite frame only

                        this.objects.push({
                            x: x + 0.5,
                            y: y + 0.5,
                            tileX: x,
                            tileY: y,

                            objectCode,
                            frame,

                            pickup: pickupData[objectCode] || null,
                            weaponPickup: weaponPickupData[objectCode] ?? null,

                            pickedUp: false,

                            sprite: this.add.sprite(0, 0, "objects", frame)
                                .setOrigin(0.5)
                                .setVisible(false)
                                .setDepth(20)
                        });
                    }
                    else if (obj >= 90 && obj <= 97) {
                        this.turns.push({
                            x: x + 0.5,
                            y: y + 0.5,
                            direction: Phaser.Math.DegToRad(
                                (obj - 90) * 45
                            )
                        });
                    }
                    else if (obj === 124) {
                        this.objects.push({
                            x: x + 0.5,
                            y: y + 0.5,
                            tileX: x,
                            tileY: y,

                            obj,
                            frame: 0,

                            pickup: null,
                            weaponPickup: null,

                            pickedUp: false,

                            sprite: this.add.sprite(0, 0, "objects", this.frame)
                                .setOrigin(0.5)
                                .setVisible(false)
                                .setDepth(20)
                        });
                    }
                    else if (obj >= 108 && obj <= 115) {
                        this.guards.push(this.createEnemy(x, y, obj, 108, 112, "guard"));
                    }
                    else if (obj >= 126 && obj <= 133) {
                        this.ss.push(this.createEnemy(x, y, obj, 126, 130, "ss"));
                    }
                    else if (obj >= 138 && obj <= 141) {
                        this.dogs.push(this.createEnemy(x, y, obj, 138, 138, "dog"));
                    }
                }
            }
        }
        this.enemies = [
            ...this.guards,
            ...this.ss,
            ...this.dogs
        ];
    }
    setWeapon(weaponIndex) {
        if (!this.ownedWeapons[weaponIndex]) {
            return;
        }

        this.weapon = weaponIndex;
        this.hud.weaponIcon.setFrame(weaponIndex);

        const idleFrames = [0, 5, 10, 15];

        this.weaponSprite.stop();
        this.weaponSprite.setFrame(idleFrames[weaponIndex]);
    }
    findTurnAt(x, y) {
        for (const turn of this.turns) {
            const dx = Math.abs(x - turn.x);
            const dy = Math.abs(y - turn.y);

            if (dx < 0.15 && dy < 0.15) {
                return turn;
            }
        }

        return null;
    }
    getEnemyPerspectiveFrame(enemy) {
        const enemyFacing = Math.atan2(enemy.dirY, enemy.dirX);

        const angleToPlayer = Math.atan2(
            this.player.y - enemy.y,
            this.player.x - enemy.x
        );

        const deg = Phaser.Math.RadToDeg(
            Phaser.Math.Angle.Wrap(angleToPlayer - enemyFacing)
        );

        // Player is in front of enemy
        if (deg >= -22.5 && deg < 22.5) return 0;

        // Player is front-right of enemy
        if (deg >= 22.5 && deg < 67.5) return 7;

        // Player is right side of enemy
        if (deg >= 67.5 && deg < 112.5) return 6;

        // Player is back-right of enemy
        if (deg >= 112.5 && deg < 157.5) return 5;

        // Player is behind enemy
        if (deg >= 157.5 || deg < -157.5) return 4;

        // Player is back-left of enemy
        if (deg >= -157.5 && deg < -112.5) return 3;

        // Player is left side of enemy
        if (deg >= -112.5 && deg < -67.5) return 2;

        // Player is front-left of enemy
        return 1;
    }
    createEnemy(x, y, obj, base, movingBase, type) {
        const moving = !this.enemiesDontMove && obj >= movingBase;
        const dirBase = moving ? movingBase : base;
        const angle = Phaser.Math.DegToRad((obj - dirBase) * 90);

        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);

        const sprite = this.add.sprite(0, 0, type)
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(1000);

        const enemy = {
            x: x + 0.5,
            y: y + 0.5,

            startX: x + 0.5,
            startY: y + 0.5,

            dirX,
            dirY,

            startDirX: dirX,
            startDirY: dirY,

            moving,
            startMoving: moving,

            speed: type === "dog" ? 1.6 : 1.2,
            type,
            sprite,
            state: "walk",
            dead: false,
            shooting: false
        };
        sprite.play(type === "dog" ? "dog-chase" : `${type}-stand`);

        return enemy;
    }
    resetEnemies() {
        for (const enemy of this.enemies) {
            enemy.x = enemy.startX;
            enemy.y = enemy.startY;

            enemy.dirX = enemy.startDirX;
            enemy.dirY = enemy.startDirY;

            enemy.moving = enemy.startMoving;

            enemy.dead = false;
            enemy.shooting = false;
            enemy.chasing = false;
            enemy.seesPlayer = false;
            enemy.nextShotTime = 0;

            enemy.sprite.setVisible(false);

            if (enemy.type === "dog") {
                enemy.sprite.play("dog-chase", true);
            } else {
                enemy.sprite.play(`${enemy.type}-stand`, true);
            }
        }
    }
    createEnemyAnimations() {
        const mk = (key, sheet, frames, frameRate = 10, repeat = -1) => {
            if (this.anims.exists(key)) return;

            this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(sheet, {
                    frames
                }),
                frameRate,
                repeat
            });
        };

        // guard animations
        mk("guard-stand", "guard", [0, 1, 2, 3, 4, 5, 6, 7], 1, 0);
        mk("guard-chase", "guard", [8, 16, 24, 32], 8);
        mk("guard-walk-south-west", "guard", [9, 17, 25, 33], 8);
        mk("guard-walk-west", "guard", [10, 18, 26, 34], 8);
        mk("guard-walk-north-west", "guard", [11, 19, 27, 35], 8);
        mk("guard-walk-north", "guard", [12, 20, 28, 36], 8);
        mk("guard-walk-north-east", "guard", [13, 21, 29, 37], 8);
        mk("guard-walk-east", "guard", [14, 22, 30, 38], 8);
        mk("guard-walk-south-east", "guard", [15, 23, 31, 39], 8);
        mk("guard-shoot", "guard", [49, 50], 8);
        mk("guard-die", "guard", [40, 41, 42, 43, 44], 8, 0);
        mk("guard-dead", "guard", [44], 1, 0);

        // SS animations
        mk("ss-stand", "ss", [0, 1, 2, 3, 4, 5, 6, 7], 1, 0);
        mk("ss-chase", "ss", [8, 16, 24, 32], 8);
        mk("ss-walk-south-west", "ss", [9, 17, 25, 33], 8);
        mk("ss-walk-west", "ss", [10, 18, 26, 34], 8);
        mk("ss-walk-north-west", "ss", [11, 19, 27, 35], 8);
        mk("ss-walk-north", "ss", [12, 20, 28, 36], 8);
        mk("ss-walk-north-east", "ss", [13, 21, 29, 37], 8);
        mk("ss-walk-east", "ss", [14, 22, 30, 38], 8);
        mk("ss-walk-south-east", "ss", [15, 23, 31, 39], 8);
        mk("ss-shoot", "ss", [49, 50], 8);
        mk("ss-die", "ss", [40, 41, 42, 43, 44], 8, 0);
        mk("ss-dead", "ss", [44], 1, 0);

        // dog animations
        mk("dog-chase", "dog", [0, 8, 16, 24], 10);
        mk("dog-walk-south-west", "dog", [1, 9, 17, 25], 8);
        mk("dog-walk-west", "dog", [2, 10, 18, 26], 8);
        mk("dog-walk-north-west", "dog", [3, 11, 19, 27], 8);
        mk("dog-walk-north", "dog", [4, 12, 20, 28], 8);
        mk("dog-walk-north-east", "dog", [5, 13, 21, 29], 8);
        mk("dog-walk-east", "dog", [6, 14, 22, 30], 8);
        mk("dog-walk-south-east", "dog", [7, 15, 23, 31], 8);
        mk("dog-attack", "dog", [36, 37, 38], 8);
        mk("dog-die", "dog", [32, 33, 34, 35], 8);
        mk("dog-dead", "dog", [35], 1, 0);
    }

    updateEnemyAnimation(enemy) {

        if (!enemy?.sprite) return;

        // -------------------------
        // Dead
        // -------------------------

        if (enemy.dead) {
            if (!enemy.dying) {
                enemy.sprite.anims.stop();
                enemy.sprite.setFrame(44); // dead frame
            }
            return;
        }

        if (enemy.dying) {
            return;
        }

        // -------------------------
        // Shooting
        // -------------------------

        if (enemy.shooting) {

            if (enemy.type === "dog") {

                if (
                    enemy.sprite.anims.currentAnim?.key !==
                    "dog-chase"
                ) {
                    enemy.sprite.play("dog-chase", true);
                }

            } else {

                const shootAnim =
                    `${enemy.type}-shoot`;

                if (
                    enemy.sprite.anims.currentAnim?.key !==
                    shootAnim
                ) {
                    enemy.sprite.play(
                        shootAnim,
                        true
                    );
                }
            }

            return;
        }

        // -------------------------
        // Determine facing
        // -------------------------

        const facing =
            this.getEnemyPerspectiveFrame(enemy);

        // -------------------------
        // Standing
        // -------------------------

        if (!enemy.moving) {

            enemy.sprite.anims.stop();

            // frames 0-7 are stand directions
            enemy.sprite.setFrame(facing);

            return;
        }

        // -------------------------
        // Walking
        // -------------------------

        const walkAnims = [
            `${enemy.type}-chase`,             // front
            `${enemy.type}-walk-south-west`,   // front-left
            `${enemy.type}-walk-west`,         // left
            `${enemy.type}-walk-north-west`,   // back-left
            `${enemy.type}-walk-north`,        // back
            `${enemy.type}-walk-north-east`,   // back-right
            `${enemy.type}-walk-east`,         // right
            `${enemy.type}-walk-south-east`    // front-right
        ];

        const animKey =
            walkAnims[facing];

        if (
            this.anims.exists(animKey) &&
            enemy.sprite.anims.currentAnim?.key !== animKey
        ) {
            enemy.sprite.play(
                animKey,
                true
            );
        }
    }
    advanceLevel() {
        this.scene.start("TweenScene", {
            nextLevel: this.level + 1,
            score: this.score,
            lives: this.lives
        });
    }
    isOnElevator() {
        const mx = Math.floor(this.player.x);
        const my = Math.floor(this.player.y);
        return this.wallMap[my]?.[mx] === 100;
    }
    startElevatorSequence() {
        this.player.moveSpeed = 0;

        const doorLeft = this.add.rectangle(
            0,
            0,
            W / 2,
            H,
            0x000000
        ).setOrigin(0, 0)
            .setDepth(2000000);

        const doorRight = this.add.rectangle(
            W,
            0,
            W / 2,
            H,
            0x000000
        ).setOrigin(1, 0)
            .setDepth(2000000);

        this.tweens.add({
            targets: doorLeft,
            x: W / 2,
            duration: 700
        });

        this.tweens.add({
            targets: doorRight,
            x: W / 2,
            duration: 700,

            onComplete: () => {
                this.scene.start("TweenScene", {
                    nextLevel: this.level + 1,
                    score: this.score,
                    lives: this.lives
                });
            }
        });
    }

    playerDied() {
        this.lives--;

        if (this.lives <= 0) {
            this.scene.start("SplashScene");
            return;
        }

        this.time.delayedCall(1000, () => {
            this.respawnPlayer();
        });
    }
    update(time, delta) {
        const dt = delta / 1000;
        this.hud.updateStats({
            floor: this.level,
            score: this.score,
            lives: this.lives,
            health: this.health,
            ammo: this.ammo
        });

        if (this.health != this.oldHealth && this.hud.face.anims.currentAnim) {
            const groupIndex = Math.min(
                5,
                Math.floor((100 - this.health) / 17)
            );
            if (this.health === 0) {
                this.hud.face.setFrame(25);
            }
            else {
                this.hud.face.play("face_" + groupIndex, true);
            }
            this.oldHealth = this.health;
        }
        this.checkPickups();
        if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
            this.minimapVisible = !this.minimapVisible;
            this.mapGfx.setVisible(this.minimapVisible);
        }
        if (
            this.isOnElevator() &&
            !this.enteringElevator
        ) {
            this.enteringElevator = true;
            this.startElevatorSequence();
        }

        const weapon = weapons[this.weapon];

        if (this.weapon <= 1) {
            // knife + pistol
            if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) {
                this.fireWeapon();
            }
        }
        else {
            // machine gun + gatling
            if (
                this.keys.fire.isDown &&
                this.time.now >= this.nextFireTime
            ) {
                this.fireWeapon();
                this.nextFireTime =
                    this.time.now + weapon.fireDelay;
            }
        }

        if (
            (this.weapon === 2 || this.weapon === 3) &&
            Phaser.Input.Keyboard.JustUp(this.keys.fire)
        ) {
            this.weaponSprite.stop();
            const idleFrames = [
                0,   // knife
                5,   // pistol
                10,  // machine gun
                15   // gatling gun
            ];

            this.weaponSprite.setFrame(
                idleFrames[this.weapon]
            );
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
            this.setWeapon(0);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
            this.setWeapon(1);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
            this.setWeapon(2);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.four)) {
            this.setWeapon(3);
        }
        this.movePlayer(dt);
        this.updateEnemies(dt);
        this.renderWorld();
        this.renderSprites();
        this.renderMiniMap();
    }

    openDoor(door) {
        if (!door || door.open || door.closing) {
            return;
        }

        door.open = true;

        door.tween = this.tweens.add({
            targets: door,
            amount: 1,
            duration: 350,
            ease: "Linear",

            onComplete: () => {

                this.time.delayedCall(
                    this.DOOR_OPEN_TIME,
                    () => {

                        door.closing = true;

                        door.tween = this.tweens.add({
                            targets: door,
                            amount: 0,
                            duration: 350,
                            ease: "Linear",

                            onComplete: () => {
                                door.open = false;
                                door.closing = false;
                            }
                        });
                    }
                );
            }
        });
    }

    getDoorKey(x, y) {
        return `${x},${y}`;
    }

    getDoorAt(mx, my) {
        return this.doors.get(this.getDoorKey(mx, my));
    }

    openDoor(mx, my) {
        const key = this.getDoorKey(mx, my);

        let door = this.doors.get(key);

        if (!door) {
            door = {
                open: true,
                amount: 0,
                closing: false
            };

            this.doors.set(key, door);
        }

        if (door.tween) {
            door.tween.stop();
        }

        door.open = true;
        door.closing = false;

        door.tween = this.tweens.add({
            targets: door,
            amount: 1,
            duration: 350,
            ease: "Linear",
            onComplete: () => {
                this.time.delayedCall(this.DOOR_OPEN_TIME, () => {
                    door.closing = true;

                    door.tween = this.tweens.add({
                        targets: door,
                        amount: 0,
                        duration: 350,
                        ease: "Linear",
                        onComplete: () => {
                            door.open = false;
                            door.closing = false;
                        }
                    });
                });
            }
        });
    }
    tryOpenFacingDoor() {
        const tx = Math.floor(this.player.x + Math.cos(this.player.rot));
        const ty = Math.floor(this.player.y + Math.sin(this.player.rot));

        const tile = this.wallMap[ty]?.[tx];

        if (this.isDoorFrame(tile)) {
            this.openDoor(tx, ty);
        }
    }
    checkPickups() {
        const px = Math.floor(this.player.x);
        const py = Math.floor(this.player.y);

        for (const obj of this.objects) {

            if (
                obj.pickedUp ||
                obj.tileX !== px ||
                obj.tileY !== py
            ) {
                continue;
            }

            // -------------------------
            // Weapon pickups
            // -------------------------
            if (obj.weaponPickup !== null) {

                this.ownedWeapons[obj.weaponPickup] = true;

                this.setWeapon(obj.weaponPickup);

                obj.pickedUp = true;

                obj.sprite.destroy();

                this.objectMap[obj.tileY][obj.tileX] = 0;

                continue;
            }

            // -------------------------
            // Normal pickups
            // -------------------------
            if (!obj.pickup) {
                continue;
            }

            // Don't pick up health if already full
            if (
                obj.pickup.health &&
                this.health >= 100
            ) {
                continue;
            }

            obj.pickedUp = true;

            obj.sprite.destroy();

            this.score += obj.pickup.score || 0;

            this.health = Phaser.Math.Clamp(
                this.health + (obj.pickup.health || 0),
                0,
                100
            );

            this.objectMap[obj.tileY][obj.tileX] = 0;
        }

        this.objects = this.objects.filter(
            obj => !obj.pickedUp
        );
    }

    movePlayer(dt) {
        if (this.keys.left.isDown) {
            this.player.rot -= this.player.rotSpeed * dt;
        }

        if (this.keys.right.isDown) {
            this.player.rot += this.player.rotSpeed * dt;
        }

        let move = 0;

        if (this.keys.up.isDown) move = 1;
        if (this.keys.down.isDown) move = -1;

        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.tryOpenFacingDoor();
        }

        if (move === 0) return;

        const step =
            this.player.moveSpeed *
            dt *
            move;

        const nx =
            this.player.x +
            Math.cos(this.player.rot) * step;

        const ny =
            this.player.y +
            Math.sin(this.player.rot) * step;

        // slide along walls instead of stopping completely
        if (!this.isBlocking(nx, this.player.y)) {
            this.player.x = nx;
        }

        if (!this.isBlocking(this.player.x, ny)) {
            this.player.y = ny;
        }

    }

    damageEnemy(enemy, damage) {
        if (enemy.dead) return;

        enemy.health ??= (
            enemy.type === "dog" ? 40 :
                enemy.type === "ss" ? 80 :
                    60
        );

        enemy.health -= damage;

        if (enemy.health <= 0) {
            enemy.dead = true;
            enemy.dying = true;

            enemy.moving = false;
            enemy.chasing = false;
            enemy.shooting = false;

            enemy.sprite.setVisible(true);
            enemy.sprite.play(`${enemy.type}-die`);

            enemy.sprite.once(
                Phaser.Animations.Events.ANIMATION_COMPLETE,
                () => {
                    enemy.dying = false;
                    enemy.sprite.setVisible(true);
                    enemy.sprite.play(`${enemy.type}-dead`, true);
                }
            );

            this.score += (
                enemy.type === "dog" ? 200 :
                    enemy.type === "ss" ? 500 :
                        100
            );
        }
    }
    updateEnemyAI(enemy, dt) {
        if (enemy.dead) return;

        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        enemy.seesPlayer = this.enemyCanSeePlayer(enemy);
        enemy.seesPlayer = !this.enemiesAreOblivious;
        if (enemy.seesPlayer) {
            enemy.direction = Math.atan2(dy, dx);

            enemy.chasing = true;
            enemy.moving = true;

            const shootRange = enemy.type === "ss" ? 6 : 5;

            if (dist <= shootRange && enemy.type !== "dog") {
                enemy.chasing = true;
                enemy.shooting = true;
                this.enemyFireWeapon(enemy);
            } else {
                enemy.chasing = true;
                enemy.shooting = false;
            }
            if (enemy.type === "dog" && dist <= 1.2) {
                enemy.shooting = true;
                this.enemyFireWeapon(enemy);
            }
        }
    }
    damageEnemy(enemy, damage) {
        if (enemy.dead) return;

        enemy.health ??= (
            enemy.type === "dog" ? 40 :
                enemy.type === "ss" ? 80 :
                    60
        );

        enemy.health -= damage;

        if (enemy.health <= 0) {

            enemy.dead = true;
            enemy.dying = true;

            enemy.moving = false;
            enemy.chasing = false;
            enemy.shooting = false;

            enemy.sprite.play(
                `${enemy.type}-die`
            );

            enemy.sprite.once(
                Phaser.Animations.Events.ANIMATION_COMPLETE,
                () => {
                    enemy.dying = false;
                    enemy.sprite.play(
                        `${enemy.type}-dead`
                    );
                }
            );

            return;
        }
    }

    enemyCanSeePlayer(enemy) {

        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;

        const dist = Math.hypot(dx, dy);

        if (dist > 12) {
            return false;
        }

        // must be facing player
        const dot =
            enemy.dirX * (dx / dist) +
            enemy.dirY * (dy / dist);

        if (dot < 0.5) {
            return false;
        }

        return this.enemyHasLineOfSight(
            enemy.x,
            enemy.y,
            this.player.x,
            this.player.y
        );
    }

    enemyFireWeapon(enemy) {
        if (enemy.type === "dog") {
            this.damagePlayer(8);
            return;
        }

        const now = this.time.now;

        if (!enemy.nextShotTime) {
            enemy.nextShotTime = 0;
        }

        if (now < enemy.nextShotTime) {
            return;
        }

        enemy.nextShotTime = now + 900;

        enemy.shooting = true;
        this.damagePlayer(enemy.type === "ss" ? 12 : 8);

        this.time.delayedCall(180, () => {
            enemy.shooting = false;
        });
    }
    damagePlayer(amount) {
        this.health = Phaser.Math.Clamp(
            this.health - amount,
            0,
            100
        );

        if (this.health <= 0 && !this.playerDying) {
            this.playerDying = true;
            this.playerDied();
        }

    }
    updateEnemies(dt) {
        const now = this.time.now;

        if (this.enemiesDontMove) {
            for (const enemy of this.enemies) {
                this.updateEnemyAnimation(enemy);
            }
            return;
        }

        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.dying) continue;

            const canSeePlayer = this.enemyCanSeePlayer(enemy);

            if (!this.enemiesAreOblivious) {
                enemy.chasing = canSeePlayer;

                if (
                    enemy.type !== "dog" &&
                    canSeePlayer &&
                    !enemy.shooting &&
                    now > (enemy.lastShotTime || 0) + 1200
                ) {
                    this.enemyFireWeapon(enemy);
                }
            }

            if (enemy.type === "dog" && canSeePlayer) {
                const dist = Phaser.Math.Distance.Between(
                    enemy.x,
                    enemy.y,
                    this.player.x,
                    this.player.y
                );

                if (dist < 1.25 && now > (enemy.lastAttackTime || 0) + 1000) {
                    enemy.lastAttackTime = now;
                    this.damagePlayer(15);
                }
            }

            if (
                !this.enemiesAreOblivious &&
                canSeePlayer &&
                !enemy.shooting
            ) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const len = Math.hypot(dx, dy);

                if (len > 0.001) {
                    enemy.dirX = dx / len;
                    enemy.dirY = dy / len;
                }
            }

            enemy.moving = !enemy.shooting;

            if (!enemy.moving) {
                this.updateEnemyAnimation(enemy);
                continue;
            }

            const speed = enemy.speed * dt;

            const nextX = enemy.x + enemy.dirX * speed;
            const nextY = enemy.y + enemy.dirY * speed;
            const mx = Math.floor(nextX);
            const my = Math.floor(nextY);

            const door = this.getDoorAt(mx, my);

            if (
                door &&
                (enemy.type === "guard" || enemy.type === "ss")
            ) {
                this.openDoor(door);

                // wait for door
                enemy.moving = false;
                this.updateEnemyAnimation(enemy);

                continue;
            }

            if (this.isBlocking(nextX, nextY)) {
                enemy.dirX *= -1;
                enemy.dirY *= -1;
                this.updateEnemyAnimation(enemy);
                continue;
            }

            enemy.x = nextX;
            enemy.y = nextY;

            const turn = this.findTurnAt(enemy.x, enemy.y);

            if (turn) {
                const angle = Phaser.Math.DegToRad(turn.direction);
                enemy.dirX = Math.cos(angle);
                enemy.dirY = Math.sin(angle);
            }

            this.updateEnemyAnimation(enemy);
        }
    }

    renderWorld() {
        const g = this.worldGfx;
        g.clear();

        //ceiling color = eclipse
        g.fillStyle(0x383838);
        g.fillRect(0, 0, W, H / 2);

        //floor color = dim gray
        g.fillStyle(0x707070);
        g.fillRect(0, H / 2, W, H / 2);

        const ctx = this.wallCtx;
        ctx.clearRect(0, 0, W, H);

        this.depthBuffer = [];

        for (let i = 0; i < this.numRays; i++) {
            const rayScreenPos = (-this.numRays / 2 + i) * this.stripW;

            const rayViewDist = Math.sqrt(
                rayScreenPos * rayScreenPos +
                this.viewDist * this.viewDist
            );

            const rayAngle =
                this.player.rot +
                Math.asin(rayScreenPos / rayViewDist);

            const hit = this.castRay(rayAngle);

            if (!hit || hit.texX === undefined) continue;

            let dist = hit.dist;
            dist *= Math.cos(this.player.rot - rayAngle);
            if (dist < 0.001) dist = 0.001;

            this.depthBuffer[i] = dist;

            const wallH = this.viewDist / dist;
            const top = Math.floor((H - wallH) / 2);

            let frameIndex;

            if (hit.wall === 100) {
                // elevator door
                frameIndex = 12;
            }
            else if (this.isDoorFrame(hit.wall)) {
                // regular doors
                frameIndex = hit.wall - 62;
            }
            else {
                // normal walls
                frameIndex = hit.wall - 1;
            }

            const frame = this.textures.getFrame("walls", frameIndex);
            let texX = Phaser.Math.Clamp(
                Math.floor(hit.texX * 64),
                0,
                63
            );

            if (this.isDoorFrame(hit.wall)) {
                const door = this.getDoorAt(hit.mapX, hit.mapY);

                if (door) {
                    // right-to-left opening
                    texX -= Math.floor(door.amount * 64);

                    if (texX < 0) {
                        continue;
                    }
                }
            }
            const sx = frame.cutX + texX;
            const sy = frame.cutY;

            const dx = Math.floor(i * this.stripW);
            const dw = Math.ceil(this.stripW) + 1;

            ctx.drawImage(
                this.wallsImage,
                sx,
                sy,
                1,
                64,
                dx,
                top,
                dw,
                wallH
            );

            if (hit.horizontal) {
                ctx.fillStyle = "rgba(0,0,0,0.28)";
                ctx.fillRect(dx, top, dw, wallH);
            }
        }

        this.wallCanvas.refresh();
    }

    castRay(angle) {
        angle = Phaser.Math.Angle.Normalize(angle);

        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        let best = null;
        // --------------------------
        // Vertical grid intersections
        // --------------------------
        if (Math.abs(cos) > 0.0001) {

            const right = cos > 0;
            const slope = sin / cos;

            let x = right
                ? Math.ceil(this.player.x)
                : Math.floor(this.player.x);

            let y =
                this.player.y +
                (x - this.player.x) * slope;

            const dx = right ? 1 : -1;
            const dy = dx * slope;

            while (
                x >= 0 &&
                x < this.mapW &&
                y >= 0 &&
                y < this.mapH
            ) {
                const mx = Math.floor(
                    x + (right ? 0 : -1)
                );

                const my = Math.floor(y);

                let tile = this.wallMap[my]?.[mx];
                if (tile > 0) {
                    if (this.isDoorFrame(tile)) {
                        const door = this.getDoorAt(mx, my);

                        if (door && door.amount >= 0.95) {
                            x += dx;
                            y += dy;
                            continue;
                        }
                    }
                    const dist = Math.hypot(
                        x - this.player.x,
                        y - this.player.y
                    );

                    let texX =
                        y - Math.floor(y);

                    // flip opposite wall faces
                    if (!right) {
                        texX = 1 - texX;
                    }

                    best = {
                        x,
                        y,
                        dist,
                        wall: this.wallMap[my][mx],
                        horizontal: false,
                        texX,
                        mapX: mx,
                        mapY: my,
                    };

                    break;
                }

                x += dx;
                y += dy;
            }
        }

        // --------------------------
        // Horizontal grid intersections
        // --------------------------
        if (Math.abs(sin) > 0.0001) {

            const down = sin > 0;
            const slope = cos / sin;

            let y = down
                ? Math.ceil(this.player.y)
                : Math.floor(this.player.y);

            let x =
                this.player.x +
                (y - this.player.y) * slope;

            const dy = down ? 1 : -1;
            const dx = dy * slope;

            while (
                x >= 0 &&
                x < this.mapW &&
                y >= 0 &&
                y < this.mapH
            ) {
                const mx = Math.floor(x);

                const my = Math.floor(
                    y + (down ? 0 : -1)
                );

                const tile = this.wallMap[my]?.[mx];

                if (tile > 0) {
                    if (this.isDoorFrame(tile)) {
                        const door = this.getDoorAt(mx, my);

                        if (door && door.amount >= 0.95) {
                            x += dx;
                            y += dy;
                            continue;
                        }
                    }

                    const dist = Math.hypot(
                        x - this.player.x,
                        y - this.player.y
                    );

                    let texX =
                        x - Math.floor(x);

                    // flip opposite wall faces
                    if (down) {
                        texX = 1 - texX;
                    }

                    if (
                        !best ||
                        dist < best.dist
                    ) {
                        best = {
                            x,
                            y,
                            dist,
                            wall: this.wallMap[my][mx],
                            horizontal: true,
                            texX,
                            mapX: mx,
                            mapY: my,
                        };
                    }

                    break;
                }

                x += dx;
                y += dy;
            }
        }

        return best;
    }

    renderSprites() {
        const sprites = [
            ...this.objects,
            ...this.guards,
            ...this.ss,
            ...this.dogs
        ];

        sprites.sort((a, b) => {
            const da = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                a.x,
                a.y
            );

            const db = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                b.x,
                b.y
            );

            return db - da;
        });

        for (const obj of sprites) {

            const dx = obj.x - this.player.x;
            const dy = obj.y - this.player.y;

            let angle =
                Math.atan2(dy, dx) -
                this.player.rot;

            angle = Phaser.Math.Angle.Wrap(angle);

            if (
                angle < -this.fov / 2 ||
                angle > this.fov / 2
            ) {
                obj.sprite.setVisible(false);
                continue;
            }

            const dist = Math.hypot(dx, dy);

            if (dist < 0.05) {
                obj.sprite.setVisible(false);
                continue;
            }

            const correctedDist =
                Math.cos(angle) * dist;

            const size =
                this.viewDist /
                Math.max(0.1, correctedDist);

            const screenX =
                W / 2 +
                Math.tan(angle) * this.viewDist;

            const rayIndex = Phaser.Math.Clamp(
                Math.floor(screenX / this.stripW),
                0,
                this.depthBuffer.length - 1
            );

            if (
                rayIndex >= 0 &&
                dist > this.depthBuffer[rayIndex]
            ) {
                obj.sprite.setVisible(false);
                continue;
            }

            // enemy animation update
            if (obj.type) {
                this.updateEnemyAnimation(obj);
            }

            obj.sprite.setVisible(!obj.pickedUp);

            obj.sprite.setPosition(
                screenX,
                H / 2 + size * 0.15
            );

            obj.sprite.setDisplaySize(
                size,
                size
            );

            obj.sprite.setDepth(
                100000 - dist
            );
        }
    }

    renderMiniMap() {
        if (!this.minimapVisible) {
            this.mapGfx.clear();
            return;
        }
        const g = this.mapGfx;

        const miniW = 240;
        const miniH = 240;
        const padding = 10;

        const offsetX = W - miniW - padding;
        const offsetY = padding;

        const s = Math.min(
            miniW / this.mapW,
            miniH / this.mapH
        );

        const actualW = this.mapW * s;
        const actualH = this.mapH * s;

        g.clear();
        g.setDepth(9999);

        // background
        g.fillStyle(0x000000, 0.7);
        g.fillRect(
            offsetX - 2,
            offsetY - 2,
            actualW + 4,
            actualH + 4
        );

        // walls
        g.fillStyle(0xffffff, 0.5);

        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                if (this.wallMap[y][x] > 0) {
                    g.fillRect(
                        offsetX + x * s,
                        offsetY + y * s,
                        s,
                        s
                    );
                }
            }
        }

        // player
        const px = offsetX + this.player.x * s;
        const py = offsetY + this.player.y * s;
        g.fillStyle(0xff0000);
        g.fillCircle(px, py, 2);

        g.lineStyle(1, 0xff0000);
        g.lineBetween(
            px,
            py,
            px + Math.cos(this.player.rot) * 8,
            py + Math.sin(this.player.rot) * 8
        );

        // enemies
        for (const e of this.guards) {
            g.fillStyle(0x00aaff);
            g.fillCircle(
                offsetX + e.x * s,
                offsetY + e.y * s,
                2
            );
        }
    }

    isBlocking(x, y) {
        const mx = Math.floor(x);
        const my = Math.floor(y);

        if (mx < 0 || my < 0 || mx >= this.mapW || my >= this.mapH) {
            return true;
        }
        const tile = this.wallMap[my][mx];

        if (tile > 0 && this.isSecretDoorMarker(mx, my)) {
            return false;
        }

        if (this.isDoorFrame(tile)) {
            const door = this.getDoorAt(mx, my);
            return !(door && door.amount >= 0.95);
        }

        if (tile === 0) {
            return false;
        }

        return tile > 0;
    }
}