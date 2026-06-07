import { H, W, pickupData } from "./config.js";
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
        this.wallData = this.cache.json.get("wallData");
        this.objectData = this.cache.json.get("objectData");
        this.wallMap = this.wallData.wall_levels[0].level_1_wall_map;
        this.objectMap = this.objectData.object_levels[0].level_1_object_map;
        this.wallMap = this.wallMap.map(row =>
            row.map(cell => cell === 106 ? 0 : cell)
        );
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.health = 100;
        this.ammo = 50;
        this.hud = new HUD(this);
        this.mapW = this.wallMap[0].length;
        this.mapH = this.wallMap.length;
        this.createEnemyAnimations();
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
        // ceiling / floor background
        this.worldGfx = this.add.graphics();
        this.worldGfx.setDepth(0);
        this.weapon = this.add.sprite(W / 2, H * .57, "weapon", 1)
            .setOrigin(0.5, 0.5)
            .setDepth(82000)
            .setScale(5);

        if (!this.anims.exists("weapon")) {
            this.anims.create({
                key: "weapon",
                frames: this.anims.generateFrameNumbers("weapon", {
                    start: 0,
                    end: 4
                }),
                frameRate: 10,
                repeat: 0
            });
        }

        this.wallCanvas = this.textures.createCanvas("wallScreen", W, H);
        this.wallCtx = this.wallCanvas.getContext();

        this.wallScreen = this.add.image(0, 0, "wallScreen")
            .setOrigin(0, 0)
            .setDepth(1);

        this.wallsImage = this.textures.get("walls").getSourceImage();

        // enemies render above walls
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
        this.depthBuffer = [];
    }

    isDoorFrame(frame) {
        return frame >= this.DOOR_MIN && frame <= this.DOOR_MAX;
    }
    fireWeapon() {
        console.log('fire');
        if (this.ammo <= 0) {
            return;
        }

        this.ammo--;

        this.weapon.play("weapon");

        const hit = this.castRay(this.player.rot);

        if (!hit) {
            return;
        }

        console.log("BANG");
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
                            y: 32, //y,
                            rot: obj - 19 * 90,
                            moveSpeed: 3.2,
                            rotSpeed: 2.2
                        };
                    }
                    else if (obj >= 23 && obj <= 56) {
                        obj -= 21;
                        this.objects.push({
                            x: x + 0.5,
                            y: y + 0.5,
                            tileX: x,
                            tileY: y,
                            objectCode: obj,
                            frame: obj,
                            pickup: pickupData[obj] || null,
                            pickedUp: false,
                            sprite: this.add.sprite(0, 0, "objects", obj)
                                .setOrigin(0.5, 0.5)
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

    createEnemy(x, y, obj, base, movingBase, type) {
        const moving = obj >= movingBase;
        const dirBase = moving ? movingBase : base;
        const direction = Phaser.Math.DegToRad((obj - dirBase) * 90);

        const sprite = this.add.sprite(0, 0, type)
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(1000);

        const enemy = {
            x: x + 0.5,
            y: y + 0.5,
            moving,
            direction,
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
        mk("guard-stand", "guard", [1], 1);
        mk("guard-chase", "guard", [9, 17, 25, 32], 8);
        mk("guard-walk-south-west", "guard", [10, 18, 26, 33], 8);
        mk("guard-walk-west", "guard", [11, 19, 27, 34], 8);
        mk("guard-walk-north-west", "guard", [12, 20, 28, 35], 8);
        mk("guard-walk-north", "guard", [13, 21, 29, 36], 8);
        mk("guard-walk-north-east", "guard", [14, 22, 30, 37], 8);
        mk("guard-walk-east", "guard", [15, 23, 31, 38], 8);
        mk("guard-walk-south-east", "guard", [16, 24, 32, 39], 8);
        mk("guard-shoot", "guard", [50, 51], 8);
        mk("guard-die", "guard", [41, 42, 43, 44, 45], 8);

        // SS animations
        mk("ss-stand", "ss", [1], 1);
        mk("ss-chase", "ss", [9, 17, 25, 32], 8);
        mk("ss-walk-south-west", "ss", [10, 18, 26, 33], 8);
        mk("ss-walk-west", "ss", [11, 19, 27, 34], 8);
        mk("ss-walk-north-west", "ss", [12, 20, 28, 35], 8);
        mk("ss-walk-north", "ss", [13, 21, 29, 36], 8);
        mk("ss-walk-north-east", "ss", [14, 22, 30, 37], 8);
        mk("ss-walk-east", "ss", [15, 23, 31, 38], 8);
        mk("ss-walk-south-east", "ss", [16, 24, 32, 39], 8);
        mk("ss-shoot", "ss", [50, 51], 8);
        mk("ss-die", "ss", [41, 42, 43, 44, 45], 8);

        // dog animations
        mk("dog-chase", "dog", [1, 9, 25, 32], 10);
        mk("dog-walk-south-west", "dog", [2, 10, 18, 26], 8);
        mk("dog-walk-west", "dog", [3, 11, 19, 27], 8);
        mk("dog-walk-north-west", "dog", [4, 12, 20], 8);
        mk("dog-walk-north", "dog", [5, 13, 21, 29], 8);
        mk("dog-walk-north-east", "dog", [6, 14, 22, 30], 8);
        mk("dog-walk-east", "dog", [7, 15, 23, 31], 8);
        mk("dog-walk-south-east", "dog", [8, 16, 24, 32], 8);
        mk("dog-attack", "dog", [37, 38, 39], 8);
        mk("dog-die", "dog", [33, 34, 35, 36], 8);
    }
    getEnemyBaseAnim(enemy) {
        if (enemy.type === "guard") return "guard";
        if (enemy.type === "ss") return "ss";
        if (enemy.type === "dog") return "dog";
        return "guard";
    }
    updateEnemyAnimation(enemy) {
        if (enemy.dead) {
            enemy.sprite.play(`${enemy.type}-die`, true);
            return;
        }

        if (enemy.shooting && enemy.type !== "dog") {
            enemy.sprite.play(`${enemy.type}-shoot`, true);
            return;
        }

        if (!enemy.moving) {
            if (enemy.type === "dog") {
                enemy.sprite.play("dog-chase", true);
            } else {
                enemy.sprite.play(`${enemy.type}-stand`, true);
            }
            return;
        }

        enemy.sprite.play(this.getEnemyDirectionAnim(enemy), true);
    }

    getEnemyDirectionAnim(enemy) {
        const base = enemy.type;

        const a = Phaser.Math.Angle.Normalize(enemy.direction);
        const deg = Phaser.Math.RadToDeg(a);

        let dir = "east";

        if (deg >= 337.5 || deg < 22.5) dir = "east";
        else if (deg < 67.5) dir = "south-east";
        else if (deg < 112.5) dir = "chase";
        else if (deg < 157.5) dir = "south-west";
        else if (deg < 202.5) dir = "west";
        else if (deg < 247.5) dir = "north-west";
        else if (deg < 292.5) dir = "north";
        else dir = "north-east";

        const key = dir === "chase"
            ? `${base}-chase`
            : `${base}-walk-${dir}`;

        if (this.anims.exists(key)) {
            return key;
        }

        return `${base}-chase`;
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
        this.checkPickups();
        if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
            this.minimapVisible = !this.minimapVisible;
            this.mapGfx.setVisible(this.minimapVisible);
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) {
            this.fireWeapon();
        }
        this.movePlayer(dt);
        this.updateEnemies(dt);
        this.renderWorld();
        this.renderSprites();
        this.renderMiniMap();
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
                !obj.pickup ||
                obj.tileX !== px ||
                obj.tileY !== py
            ) {
                continue;
            }

            obj.pickedUp = true;
            obj.sprite.setVisible(false);
            obj.sprite.destroy();

            this.score += obj.pickup.score || 0;
            this.health = Phaser.Math.Clamp(
                this.health + (obj.pickup.health || 0),
                0,
                100
            );

            this.objectMap[obj.tileY][obj.tileX] = 0;
        }

        this.objects = this.objects.filter(obj => !obj.pickedUp);
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

    updateEnemies(dt) {
        if (!this.enemies) return;

        for (const enemy of this.enemies) {
            if (enemy.dead) {
                this.updateEnemyAnimation(enemy);
                continue;
            }

            if (!enemy.moving) {
                enemy.moving = true;
            }

            const turn = this.findTurnAt(enemy.x, enemy.y);

            if (turn) {
                const dx = Math.abs(enemy.x - turn.x);
                const dy = Math.abs(enemy.y - turn.y);

                if (dx < 0.12 && dy < 0.12) {
                    enemy.x = turn.x;
                    enemy.y = turn.y;
                    enemy.direction = turn.direction;
                }
            }

            const step = enemy.speed * dt;

            const nx = enemy.x + Math.cos(enemy.direction) * step;
            const ny = enemy.y + Math.sin(enemy.direction) * step;

            if (!this.isBlocking(nx, ny)) {
                enemy.x = nx;
                enemy.y = ny;
            } else {
                this.turnEnemyAtWall(enemy);
            }

            this.updateEnemyAnimation(enemy);
        }
    }
    turnEnemyAtWall(enemy) {
        const choices = [
            enemy.direction + Math.PI / 2,
            enemy.direction - Math.PI / 2,
            enemy.direction + Math.PI
        ];

        for (const dir of choices) {
            const tx = enemy.x + Math.cos(dir) * 0.25;
            const ty = enemy.y + Math.sin(dir) * 0.25;

            if (!this.isBlocking(tx, ty)) {
                enemy.direction = Phaser.Math.Angle.Normalize(dir);

                // nudge away from the wall so it does not keep colliding
                enemy.x += Math.cos(enemy.direction) * 0.03;
                enemy.y += Math.sin(enemy.direction) * 0.03;

                return;
            }
        }

        // fallback: random cardinal direction
        const dirs = [
            0,
            Math.PI / 2,
            Math.PI,
            -Math.PI / 2
        ];

        enemy.direction = Phaser.Utils.Array.GetRandom(dirs);
    }
    renderWorld() {
        const g = this.worldGfx;
        g.clear();

        g.fillStyle(0x383838);
        g.fillRect(0, 0, W, H / 2);

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

            let frameIndex = Math.max(0, hit.wall - 1);

            //doors
            if (this.isDoorFrame(frameIndex)) {
                frameIndex -= 61;
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