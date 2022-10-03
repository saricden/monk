import { GameObjects, Physics, Math as pMath, type Time } from "phaser";
import { createStateMachine } from "../createStateMachine";
import { type GameScene } from "../scenes/GameScene";
const {Sprite} = GameObjects;

const machine = createStateMachine<MushroomRedSm>(
  {
    initialState: "falling",
    // onTransition: (prevState, nextState, meta) => {
    //   console.group("State transition:", prevState, "->", nextState);
    //   console.log("Meta:", meta);
    //   console.groupEnd();
    // },
    states: {
      falling: {
        transitions: {
          moving: (mushroom) => mushroom.body.blocked.down && mushroom.body.velocity.x !== 0,
          idle: (mushroom) => mushroom.body.blocked.down,
          dead: (mushroom) => mushroom.hp <= 0
        }
      },

      idle: {
        transitions: {
          falling: (mushroom) => mushroom.body.velocity.y > 0,
          moving: (mushroom) => mushroom.body.velocity.x !== 0,
          dead: (mushroom) => mushroom.hp <= 0
        },
        onEnter(mushroom) {
          mushroom.play({
            key: 'sm-mush-red-idle',
            repeat: -1
          });
        
          // Random hop
          const delayToHop = pMath.Between(0, 5000);

          mushroom.scene.time.delayedCall(delayToHop, () => {
            if (mushroom.body && mushroom.hp > 0) {
              mushroom.scene.playSpatialSound(mushroom.x, mushroom.y, 'sfx-mushroom-sm-jump');
              mushroom.body.setVelocityY(-200);
            }
          });
        }
      },

      moving: {
        transitions: {
          falling: (mushroom) => mushroom.body.velocity.y > 0,
          idle: (mushroom) => mushroom.body.velocity.x === 0,
          dead: (mushroom) => mushroom.hp <= 0
        },
        onEnter(mushroom) {
          mushroom.play({
            key: 'sm-mush-red-run',
            repeat: -1
          });
        },
        onTick(mushroom) {
          mushroom.setXFlip(mushroom.body.velocity.x < 0);
        }
      },

      dead: {
        transitions: {},
        onEnter: (mushroom) => {
          mushroom.scene.playSpatialSound(mushroom.x, mushroom.y, 'sfx-mushroom-sm-die');

          if (mushroom.movementTimer) {
            mushroom.movementTimer.destroy();
          }

          mushroom.play({
            key: 'sm-mush-red-dead',
            repeat: 0
          });

          mushroom.body.setVelocityY(-300);
          mushroom.groundCollider.destroy();
          mushroom.setDepth(2);

          mushroom.scene.score++;
        },
        onTick(mushroom) {
          if (!mushroom.scene.map) {
            return;
          }

          if (mushroom.y > mushroom.scene.map.heightInPixels) {
            const mushrooms = mushroom.scene.enemies.mushrooms;
            mushrooms.splice(mushrooms.indexOf(mushroom), 1);
            mushroom.destroy();
          }
        }
      }
    }
  }
);

export class MushroomRedSm extends Sprite {
  private stateMachine = machine();
  declare body: Physics.Arcade.Body;
  movementTimer?: Time.TimerEvent;
  maxHP: number = 1;
  hp: number = this.maxHP;
  speed: number = 20;
  declare scene: GameScene;
  groundCollider: Physics.Arcade.Collider;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, 'mushroom-sm-red');

    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.body.setCollideWorldBounds(true);
    this.body.setBounceX(1);
    this.body.setSize(10, 12);
    this.setXFlip(false);

    this.setDepth(0);

    this.queueRandomMove();

    this.groundCollider = this.scene.physics.add.collider(this, this.scene.ground);
  }

  update(_time: number, _delta: number) {
    this.stateMachine.tick(this);
  }

  queueRandomMove() {
    const delay = pMath.Between(2500, 7500);

    this.movementTimer = this.scene.time.delayedCall(delay, () => {
      const dir = pMath.Between(-1, 1);

      this.body.setVelocityX(dir * this.speed);

      if (this.hp > 0) {
        this.queueRandomMove();
      }
    });
  }

  // Phaser.Types.Physics.Arcade.GameObjectWithBody
  handlePlayerCollision(player: Physics.Arcade.Sprite) {
    const hasHP = (this.hp > 0);
    const playerIsDescending = (player.body.velocity.y > 0);

    if (hasHP) {
      if (playerIsDescending) {
        this.hp = 0;
        
        if (player.body instanceof Physics.Arcade.Body) {
          player.body.setVelocityY(-250);
        }
      }
      else {
        if (player.body instanceof Physics.Arcade.Body) {
          const si = pMath.Between(1, 3);

          this.scene.sound.play(`sfx-hurt${si}`);
          
          this.scene.hp -= 1;
          
          if (!player.getData('hanging')) {
            player.body.setVelocityX((this.x - player.x) * -3);
            player.body.setVelocityY(-150);
          }
          else {
            player.body.setAllowGravity(true); // Off when hanging
            player.setData('hanging', false);
            player.setData('hangingY', null);
          }

          this.body.setVelocityX((this.flipX ? 1 : -1) * this.speed * 2);
          this.setXFlip(!this.flipX);
        }
      }
    }
  }

  setXFlip(value: boolean): this {
    this.setFlipX(value);

    if (value) {
      this.body.setOffset(1, 3);
    }
    else {
      this.body.setOffset(5.5, 3);
    }

    return this;
  }
}