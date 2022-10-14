import { GameObjects } from "phaser";
import { GameScene } from "../scenes/GameScene";
const {Sprite} = GameObjects;

export class Gate extends Sprite {
  declare scene: GameScene;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, 'gate');

    this.scene = scene;

    this.scene.add.existing(this);

    this.setOrigin(0.5, 0.98);
    this.play({
      key: 'gate-open',
      repeat: -1
    });
  }
}