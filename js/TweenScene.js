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
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cameras.main.setBackgroundColor("#000000");

        this.blazTween = this.add.sprite(W / 2, H * .57, "blazTween", 1)
            .setOrigin(0.5, 0.5)
            .setDepth(1000001)
            .setScale(5);


        if (!this.anims.exists("blazTween")) {
            this.anims.create({
                key: "blazTween",
                frames: this.anims.generateFrameNumbers("blazTween", {
                    start: 0,
                    end: 2
                }),
                frameRate: 10,
                repeat: 0
            });
        }
        this.blazTween.play("blazTween");

        const doorLeft = this.add.rectangle(
            0,
            0,
            w / 2,
            h,
            0x202020
        ).setOrigin(0, 0);

        const doorRight = this.add.rectangle(
            w,
            0,
            w / 2,
            h,
            0x202020
        ).setOrigin(1, 0);

        this.add.text(w / 2, h / 2 - 40, "ELEVATOR", {
            fontFamily: "Courier New",
            fontSize: "48px",
            fontStyle: "bold",
            color: "#ffffff"
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 2 + 20, `FLOOR ${this.nextLevel}`, {
            fontFamily: "Courier New",
            fontSize: "32px",
            fontStyle: "bold",
            color: "#ffff00"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: doorLeft,
            x: w / 2,
            duration: 700,
            ease: "Linear"
        });

        this.tweens.add({
            targets: doorRight,
            x: w / 2,
            duration: 700,
            ease: "Linear",
            onComplete: () => {
                this.time.delayedCall(5000, () => {
                    this.scene.start("GameScene", {
                        level: this.nextLevel,
                        score: this.score,
                        lives: this.lives
                    });
                });
            }
        });
    }
}