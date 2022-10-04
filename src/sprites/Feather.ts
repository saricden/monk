import { GameObjects, Physics } from "phaser";
import { type GameScene } from "../scenes/GameScene";
const {Sprite} = GameObjects;

export class Feather extends Sprite {
  declare scene: GameScene;
  declare body: Physics.Arcade.Body;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, 'feather');

    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.body.setMaxVelocityY(10);

    this.setDepth(2);
    this.play({
      key: 'feather-pulse',
      repeat: -1,
      repeatDelay: 1000
    });

    this.scene.physics.add.collider(this, this.scene.ground);

    this.scene.physics.add.overlap(this, this.scene.monk, () => {
      this.scene.feathers++;
      this.destroy();
    });
  }
}