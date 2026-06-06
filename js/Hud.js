export class HUD {
    constructor(scene) {
        this.scene = scene;

        this.stats = {
            floor: 1,
            score: 0,
            lives: 3,
            health: 100,
            ammo: 50
        };

        const scale = 1.5;

        this.container = scene.add.container(scene.game.config.width / 2, scene.game.config.height - 50);
        this.container.setDepth(9999);
        this.container.setScrollFactor(0);
        this.container.setScale(scale);
        this.dashboard = scene.add.image(0, 0, "dashboard")
            .setOrigin(0.5, 0.5);

        this.floorText = scene.add.text(-230, -10, this.stats.floor, this.textStyle());
        this.scoreText = scene.add.text(-160, -10, this.stats.score, this.textStyle());
        this.livesText = scene.add.text(-80, -10, this.stats.lives, this.textStyle());
        this.healthText = scene.add.text(10, -10, this.stats.health, this.textStyle());
        this.ammoText = scene.add.text(80, -10, this.stats.ammo, this.textStyle());


        if (!scene.anims.exists("face_idle")) {
            scene.anims.create({
                key: "face_idle",
                frames: scene.anims.generateFrameNumbers("face", {
                    start: 0,
                    end: 3
                }),
                frameRate: 1,
                repeat: -1
            });
        }
        this.face = scene.add.sprite(-20, 0, "face")
            .setOrigin(0.5)
            .setScale(scale)
            .play("face_idle");


        this.weaponIcon = scene.add.sprite(200, 5, "weapon_icons", 0)
            .setOrigin(0.5)
            .setScale(scale);

        this.container.add([
            this.dashboard,
            this.floorText,
            this.scoreText,
            this.livesText,
            this.healthText,
            this.ammoText,
            this.face,
            this.weaponIcon
        ]);
    }

    textStyle() {
        return {
            fontFamily: "Arial",
            fontSize: "32px",
            color: "#939CFE"
        };
    }

    updateStats(stats) {
        Object.assign(this.stats, stats);

        this.floorText.setText(this.stats.floor);
        this.scoreText.setText(this.stats.score);
        this.livesText.setText(this.stats.lives);
        this.healthText.setText(this.stats.health);
        this.ammoText.setText(this.stats.ammo);
    }

    setVisible(value) {
        this.container.setVisible(value);
    }

    destroy() {
        this.container.destroy(true);
    }
}