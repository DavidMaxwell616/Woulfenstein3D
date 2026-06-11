import { SplashScene } from "./SplashScene.js";
import { TweenScene } from "./TweenScene.js";
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
    scene: [SplashScene, TweenScene, GameScene]
};

new Phaser.Game(config);

