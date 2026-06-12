import { H, W, } from "./config.js";

export class TweenScene extends Phaser.Scene {
    constructor() {
        super("TweenScene");
    }

    init(data) {
        this.nextLevel = data.nextLevel ?? 1;
        this.score = data.score ?? 0;
        this.lives = data.lives ?? 3;
    }

    preload() {
        this.load.spritesheet("blazTween", "assets/images/blazTween.png", {
            frameWidth: 81,
            frameHeight: 87
        });
        this.load.image("elevator_interior", "assets/images/elevator interior.png");
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");
        if (this.textures.exists("elevator_interior")) {
            this.add.image(this.scale.width / 2, this.scale.height / 2, "elevator_interior").setScale(1.4, 1.5);
        }
        this.blazTween = this.add.sprite(W / 2, H * .63, "blazTween", 1)
            .setOrigin(0.5, 0.5)
            .setDepth(1000001)
            .setScale(5);

        if (!this.anims.exists("blazTween")) {
            this.anims.create({
                key: "blazTween",
                frames: this.anims.generateFrameNumbers("blazTween", {
                    start: 0,
                    end: 3
                }),
                frameRate: 3,
                repeat: -1
            });
        }
        this.blazTween.play("blazTween");

        this.add.text(W / 2, H * .1, "ELEVATOR TO:", {
            fontFamily: "Courier New",
            fontSize: "48px",
            fontStyle: "bold",
            color: "#ffffff"
        }).setOrigin(0.5);

        this.add.text(W / 2, H * .2, `FLOOR ${this.nextLevel}`, {
            fontFamily: "Courier New",
            fontSize: "48px",
            fontStyle: "bold",
            color: "#ffff00"
        }).setOrigin(0.5);

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("GameScene", {
                level: this.nextLevel,
                score: this.score,
                lives: this.lives
            });
        });
    }
}