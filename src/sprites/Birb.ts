import { GameObjects, Physics, Math as pMath } from "phaser";
import { createStateMachine } from "../createStateMachine";
import { type GameScene } from "../scenes/GameScene";
import { Feather } from "./Feather";
const {Sprite} = GameObjects;

const machine = createStateMachine<Birb>(
  {
    initialState: "perched",
    states: {
      perched: {
        transitions: {
          following: (birb) => birb.body.velocity.x !== 0 || birb.body.velocity.y !== 0,
          dead: (birb) => birb.hp <= 0
        },
        onEnter(birb) {
          birb.body.setAllowGravity(false);
          birb.play({
            key: 'birb-idle',
            repeat: -1
          });
        },
        onTick(birb) {
          const {monk} = birb.scene;
          const d2p = pMath.Distance.Between(birb.x, birb.y, monk.x, monk.y);

          birb.setFlipX(monk.x < birb.x);

          if (d2p <= birb.triggerThreshold) {
            birb.body.setVelocityY(-birb.speedY);
          }
        }
      },

      following: {
        transitions: {
          divebombing: (birb) => {
            const {monk} = birb.scene;
            const hasEnoughAltitude = (birb.y < monk.y - birb.altitude);
            const isWithinRange = (birb.x <= monk.x + birb.range && birb.x >= monk.x - birb.range);

            return hasEnoughAltitude && isWithinRange;
          },
          dead: (birb) => birb.hp <= 0
        },
        onEnter(birb) {
          birb.body.setAllowGravity(false);
          birb.play({
            key: 'birb-fly',
            repeat: -1
          });

          if (birb.cooldown) {
            birb.scene.time.delayedCall(1000, () => {
              birb.cooldown = false;
            });
          }
        },
        onTick(birb) {
          const {monk} = birb.scene;
          const xDir = (birb.x >= monk.x - birb.range && birb.x <= monk.x + birb.range ? 0 : birb.x > monk.x ? -1 : 1);
          const yDir = (birb.y <= monk.y - birb.altitude ? 0 : -1);

          birb.body.setVelocity(xDir * birb.speedX, yDir * birb.speedY);
          birb.setFlipX(monk.x < birb.x);
        }
      },

      divebombing: {
        transitions: {
          following: (birb) => birb.body.blocked.down || birb.cooldown,
          dead: (birb) => birb.hp <= 0
        },
        onEnter(birb) {
          birb.body.setAllowGravity(true);
          birb.body.setVelocity(0, 0);
          birb.play({
            key: 'birb-dive',
            repeat: 0
          });
        }
      },

      dead: {
        transitions: {},
        onEnter(birb) {
          birb.play({
            key: 'birb-dead',
            repeat: -1
          });

          birb.body.setVelocityY(-300);
          birb.body.setAllowGravity(true);
          birb.groundCollider.destroy();
          birb.setDepth(2);

          new Feather(birb.scene, birb.x, birb.y - 156);
        },
      }
    }
  }
);

export class Birb extends Sprite {
  private stateMachine = machine();
  declare body: Physics.Arcade.Body;
  declare scene: GameScene;
  groundCollider: Physics.Arcade.Collider;
  maxHP: number = 1;
  hp: number = this.maxHP;
  speedX: number = 50;
  speedY: number = 30;
  altitude: number = 150;
  triggerThreshold: number = 100;
  range: number = 8;
  cooldown: boolean = false;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, 'birb');

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);

    this.setDepth(0);

    this.groundCollider = this.scene.physics.add.collider(this, this.scene.ground);
  }

  update(_time: number, _delta: number) {
    this.stateMachine.tick(this);
  }

  handlePlayerCollision(player: Physics.Arcade.Sprite) {
    const hasHP = (this.hp > 0);
    const playerIsDescendingAndAbove = (player.body.velocity.y > 0 && player.y < this.y);

    if (hasHP) {
      if (playerIsDescendingAndAbove) {
        this.hp = 0;
        
        if (player.body instanceof Physics.Arcade.Body) {
          player.body.setVelocityY(-250);
        }
      }
      else if (!this.cooldown && this.body.velocity.y > 0) {
        if (player.body instanceof Physics.Arcade.Body) {
          const si = pMath.Between(1, 3);

          this.scene.sound.play(`sfx-hurt${si}`);
          
          this.scene.hp -= 2;
          
          if (!player.getData('hanging')) {
            player.body.setVelocityX((this.x - player.x) * -3);
            player.body.setVelocityY(-150);
          }
          else {
            player.body.setAllowGravity(true); // Off when hanging
            player.setData('hanging', false);
            player.setData('hangingY', null);
          }

          this.body.setVelocityX((this.flipX ? 1 : -1) * this.speedX * 2);
          this.setFlipX(!this.flipX);

          this.cooldown = true;
        }
      }
    }
  }
}