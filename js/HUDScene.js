export class HudScene extends Phaser.Scene {
    constructor() {
        super("HudScene");
    }

    preload() {
        this.load.image("dashboard", "assets/images/dashboard.png");

        this.load.spritesheet("face", "assets/images/face.png", {
            frameWidth: 25,
            frameHeight: 31
        });

        this.load.spritesheet("weapons", "assets/images/weapons.png", {
            frameWidth: 49,
            frameHeight: 26
        });
    }

    create() {
        this.stats = {
            floor: 1,
            score: 0,
            lives: 3,
            health: 100,
            ammo: 50
        };

        this.add.image(0, 0, "dashboard")
            .setOrigin(0, 0);

        this.floorText = this.add.text(20, 23, this.stats.floor, {
            fontFamily: "Arial",
            fontSize: "32px",
            color: "#ffffff"
        });

        this.scoreText = this.add.text(100, 23, this.stats.score, {
            fontFamily: "Arial",
            fontSize: "32px",
            color: "#ffffff"
        });

        this.livesText = this.add.text(170, 23, this.stats.lives, {
            fontFamily: "Arial",
            fontSize: "32px",
            color: "#ffffff"
        });

        this.healthText = this.add.text(260, 23, this.stats.health, {
            fontFamily: "Arial",
            fontSize: "32px",
            color: "#ffffff"
        });

        this.ammoText = this.add.text(345, 23, this.stats.ammo, {
            fontFamily: "Arial",
            fontSize: "32px",
            color: "#ffffff"
        });

        this.anims.create({
            key: "face_idle",
            frames: this.anims.generateFrameNumbers("face", {
                start: 0,
                end: 3
            }),
            frameRate: 4,
            repeat: -1
        });

        this.face = this.add.sprite(208, 5, "face")
            .setOrigin(0, 0)
            .setScale(2)
            .play("face_idle");

        this.weaponIcon = this.add.sprite(400, 5, "weapons", 0)
            .setOrigin(0, 0)
            .setScale(2);
    }

    updateStats(stats) {
        Object.assign(this.stats, stats);

        this.floorText.setText(this.stats.floor);
        this.scoreText.setText(this.stats.score);
        this.livesText.setText(this.stats.lives);
        this.healthText.setText(this.stats.health);
        this.ammoText.setText(this.stats.ammo);
    }
}