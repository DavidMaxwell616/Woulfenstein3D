// TweenScene.js
export class TweenScene extends Phaser.Scene {
    constructor() {
        super("TweenScene");
    }

    init(data) {
        this.nextLevel = data.nextLevel ?? 1;
        this.score = data.score ?? 0;
        this.lives = data.lives ?? 3;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cameras.main.setBackgroundColor("#000000");

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
                this.time.delayedCall(800, () => {
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