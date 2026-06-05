import { GameScene } from "./GameScene.js";
import { W, H } from "./config.js";

const config = {
    type: Phaser.AUTO,
    width: W,
    height: H,
    backgroundColor: "#081018",
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: [GameScene]
};

new Phaser.Game(config);

