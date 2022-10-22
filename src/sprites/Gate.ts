import { GameObjects } from "phaser";
import { RootLevel } from "../levels/RootLevel";
const {Sprite} = GameObjects;

export class Gate extends Sprite {
  declare scene: RootLevel;

  constructor(scene: RootLevel, x: number, y: number) {
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