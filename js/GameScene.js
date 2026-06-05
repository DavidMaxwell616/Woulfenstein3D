import { H, W } from "./config.js";

export class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.spritesheet("walls", "assets/images/walls.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.image("guard", "assets/images/guard.png");
        this.load.path = "../assets/json/";
        this.load.json("wallData", "wall_map.json");
        this.load.json("objectData", "object_map.json");
    }

    create() {
        this.wallData = this.cache.json.get("wallData");
        this.objectData = this.cache.json.get("objectData");
        this.wallMap = this.wallData.wall_levels[0].level_1_wall_map;
        this.mapW = this.wallMap[0].length;
        this.mapH = this.wallMap.length;

        this.player = {
            x: 28,
            y: 45.5,
            rot: 0,
            moveSpeed: 3.2,
            rotSpeed: 2.2
        };

        this.fov = Phaser.Math.DegToRad(60);
        this.numRays = 320;
        this.stripW = W / this.numRays;
        this.viewDist = (W / 2) / Math.tan(this.fov / 2);
        this.doors = new Map();
        this.keys = this.input.keyboard.createCursorKeys();

        // ceiling / floor background
        this.worldGfx = this.add.graphics();
        this.worldGfx.setDepth(0);

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

        this.enemies = [
            {
                x: 17.5,
                y: 4.5,
                sprite: this.add.sprite(0, 0, "guard")
            },
            {
                x: 25.5,
                y: 16.5,
                sprite: this.add.sprite(0, 0, "guard")
            }
        ];

        this.enemies.forEach(e => {
            e.sprite.setVisible(false);
            e.sprite.setOrigin(0.5, 1);
            this.spriteLayer.add(e.sprite);
        });
        this.keys.space = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
        this.depthBuffer = [];
    }

    update(time, delta) {
        const dt = delta / 1000;

        this.movePlayer(dt);
        this.updateEnemies(dt);
        this.renderWorld();
        this.renderSprites();
        this.renderMiniMap();
        // console.log(
        //     "player tile:",
        //     Math.floor(this.player.x),
        //     Math.floor(this.player.y),
        //     "value:",
        //     this.map[Math.floor(this.player.y)][Math.floor(this.player.x)]
        // );

    }
    getDoorKey(x, y) {
        return `${x},${y}`;
    }

    getDoorAt(mx, my) {
        return this.doors.get(this.getDoorKey(mx, my));
    }

    openDoor(mx, my) {
        const key = this.getDoorKey(mx, my);

        this.doors.set(key, {
            open: true,
            amount: 1
        });
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
        if (this.keys.space?.isDown) {
            const tx = Math.floor(this.player.x + Math.cos(this.player.rot));
            const ty = Math.floor(this.player.y + Math.sin(this.player.rot));

            if (this.map[ty]?.[tx] === 5) {
                this.openDoor(tx, ty);
            }
        }
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 4) {
                const a = Math.atan2(dy, dx);

                const nx = enemy.x + Math.cos(a) * dt * 1.2;
                const ny = enemy.y + Math.sin(a) * dt * 1.2;

                if (!this.isBlocking(nx, ny)) {
                    enemy.x = nx;
                    enemy.y = ny;
                }
            }
        }
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

            const frameIndex = Math.max(0, hit.wall - 1);

            const frame = this.textures.getFrame("walls", frameIndex);

            const texX = Phaser.Math.Clamp(
                Math.floor(hit.texX * 64),
                0,
                63
            );

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

                const tile = this.map[my]?.[mx];

                if (tile > 0) {
                    if (tile === 5) {
                        const door = this.getDoorAt(mx, my);

                        if (door && door.open) {
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
                        wall: this.map[my][mx],
                        horizontal: false,
                        texX
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

                const tile = this.map[my]?.[mx];

                if (tile > 0) {
                    if (tile === 5) {
                        const door = this.getDoorAt(mx, my);

                        if (door && door.open) {
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
                            wall: this.map[my][mx],
                            horizontal: true,
                            texX
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
        const sprites = [...this.enemies];

        sprites.sort((a, b) => {
            const da = Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y);
            const db = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
            return db - da;
        });

        for (const obj of sprites) {
            const dx = obj.x - this.player.x;
            const dy = obj.y - this.player.y;

            let angle = Math.atan2(dy, dx) - this.player.rot;
            angle = Phaser.Math.Angle.Wrap(angle);

            if (angle < -this.fov / 2 || angle > this.fov / 2) {
                obj.sprite.setVisible(false);
                continue;
            }

            const dist = Math.hypot(dx, dy);
            const size = this.viewDist / (Math.cos(angle) * dist);

            const screenX =
                W / 2 +
                Math.tan(angle) * this.viewDist;

            const rayIndex = Math.floor(screenX / this.stripW);

            if (
                rayIndex >= 0 &&
                rayIndex < this.depthBuffer.length &&
                dist > this.depthBuffer[rayIndex]
            ) {
                obj.sprite.setVisible(false);
                continue;
            }

            obj.sprite.setVisible(true);
            obj.sprite.setPosition(screenX, H / 2);
            obj.sprite.setDisplaySize(size, size);
            obj.sprite.setDepth(1000 - dist);
        }
    }

    renderMiniMap() {
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
                if (this.map[y][x] > 0) {
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
        for (const e of this.enemies) {
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

        const tile = this.map[my][mx];

        if (tile === 0) {
            return false;
        }

        // door tile
        if (tile === 5) {
            const door = this.getDoorAt(mx, my);
            return !(door && door.open);
        }

        return tile > 0;
    }
}