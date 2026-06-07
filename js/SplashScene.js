export class SplashScene extends Phaser.Scene {
    constructor() {
        super("SplashScene");
    }

    preload() {
        this.load.image("splash", "assets/images/splash.png");
    }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
            .setOrigin(0);

        if (this.textures.exists("splash")) {
            this.add.image(this.scale.width / 2, this.scale.height / 2, "splash").setScale(1.4, 1.5);
        }

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("GameScene");
        });
    }
}