import { Scene, Tilemaps, Math as pMath } from 'phaser';

export class GameScene extends Scene {
  private map?: Tilemaps.Tilemap;
  private ground?: any;
  private kirk?: any;
  private gameStarted: boolean = false;
  private queuedEnemyCount: number = 0;
  private maxQueuedEnemies: number = 10;
  private baddies: any;
  // private hp: number = 4;
  // private maxHP: number = 4;
  private score: number = 0;

  constructor() {
    super('scene-game');
  }

  create() {
    this.map = this.add.tilemap('map');
    const tiles = this.map.addTilesetImage('tiles', 'tiles', 16, 16, 1, 2);
    this.ground = this.map.createLayer('ground', tiles);

    this.ground.setCollisionByProperty({ collides: true });

    this.kirk = this.physics.add.sprite(200, 0, 'kirk');
    this.kirk.play({
      key: 'kirk-down',
      repeat: -1
    });

    this.baddies = [];
    
    this.physics.add.collider(this.kirk, this.ground);

    // @ts-ignore
    this.physics.add.overlap(this.kirk, this.baddies, (kirk, enemy) => {
      this.handleEnemyOverlap(enemy);
    });

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.kirk);
    this.cameras.main.setBackgroundColor(0x110011);

    const ost = this.sound.add('ost1', {
      loop: true,
      volume: 0.15
    });

    const pullThreshold = 100;
    let startX: number = 0;
    let startY: number = 0;
    let isDown: boolean = false;

    this.input.on('pointerdown', ({ x, y }: { x: number, y: number }) => {
      if (this.kirk === undefined) {
        return;
      }

      startX = x;
      startY = y;
      isDown = true;
    });

    this.input.on('pointermove', ({ x, y }: { x: number, y: number }) => {
      if (isDown) {
        const dx = (startX - x);
        const dy = (startY - y);

        this.cameras.main.setFollowOffset(dx * 0.1, dy * 0.1);
      }
    });

    this.input.on('pointerup', ({ x, y }: { x: number, y: number }) => {
      const dx = (startX - x);
      const dy = (startY - y);
      const didPull = (Math.abs(dx) > pullThreshold || Math.abs(y) > pullThreshold);

      if (didPull) {
        const si = pMath.Between(1, 3);
        this.sound.play(`sfx-jump${si}`);

        this.kirk.body.setVelocity(dx * 1.5, dy * 2.5);

        if (!ost.isPlaying) {
          ost.play();
          this.gameStarted = true;
        }
      }
      else {
        this.kirk.body.setVelocityX(0);
      }
    });

    this.scene.launch('scene-hud', {
      parentScene: this,
      initialScore: this.score
    });
  }

  update() {
    if (this.map === undefined) {
      return;
    }

    const { isDown } = this.input.pointer1;

    // Kirk anim logic
    if (this.kirk.body.blocked.down) {
      if (this.kirk.body.velocity.x === 0) {
        this.kirk.play('kirk-idle', true);
      }
      else {
        this.kirk.play('kirk-run', true);
      }
    }
    else {
      if (this.kirk.body.velocity.y < 0) {
        this.kirk.play('kirk-up', true);
      }
      else {
        this.kirk.play('kirk-down', true);
      }
    }

    // FlipX logic
    if (this.kirk.body.velocity.x > 0) {
      this.kirk.setFlipX(false);
    }
    else if (this.kirk.body.velocity.x < 0) {
      this.kirk.setFlipX(true);
    }

    // Bound resets
    if (this.kirk.x < 0) {
      this.kirk.setX(this.map.widthInPixels);
    }
    else if (this.kirk.x > this.map.widthInPixels) {
      this.kirk.setX(0);
    }

    if (this.kirk.y > this.map.heightInPixels) {
      this.kirk.setY(0);
      this.kirk.body.setVelocityY(0);
    }

    // Camera recenter
    const {x, y} = this.cameras.main.followOffset;
    const doRecenterCamera = (x !== 0 && y !== 0 && !isDown);

    if (doRecenterCamera) {
      if ((x < 0 && x > -5 || x > 0 && x < 5) && ((y < 0 && y > -5) || y > 0 && y < 5)) {
        this.cameras.main.setFollowOffset(0, 0);
      }
      else {
        this.cameras.main.setFollowOffset(x * 0.95, y * 0.95);
      }
    }

    // Apply fake player-ground friction
    const {x: vx} = this.kirk.body.velocity;

    if (this.kirk.body.blocked.down) {
      if ((vx < 0 && vx > -5 || vx > 0 && vx < 5)) {
        this.kirk.body.setVelocityX(0);
      }
      else {
        this.kirk.body.setVelocityX(vx * 0.96);
      }
    }

    // Queue enemy spawns
    const doQueueEnemy = (this.gameStarted && this.queuedEnemyCount < this.maxQueuedEnemies);
    
    if (doQueueEnemy) {
      const delay = pMath.Between(1500, 10000);

      this.time.delayedCall(delay, () => {
        this.spawnBadGuy();
      });

      this.queuedEnemyCount++;
    }

    this.baddies.forEach((baddy: any) => {
      // Handle dumb enemy movement
      if (!baddy.getData('isDead')) {
        this.physics.moveTo(baddy, this.kirk.x, this.kirk.y, 50);
      }

      // Cleanup dead baddies
    });    
  }

  spawnBadGuy() {
    if (this.map === undefined) {
      return;
    }

    const x = pMath.Between(0, this.map.widthInPixels);
    const y = -100;

    const badGuy = this.physics.add.sprite(x, y, 'bad-guy');
    const collider = this.physics.add.collider(badGuy, this.ground);
    
    badGuy.setData('physicsCollider', collider);
    badGuy.setData('isDead', false);
    badGuy.body.setAllowGravity(false);
    badGuy.play({
      key: 'bad-guy-anim',
      repeat: -1
    });

    this.baddies.push(badGuy);
    this.queuedEnemyCount--;
  }

  handleEnemyOverlap(enemy: any) {
    const enemyIsDead = enemy.getData('isDead');

    if (!enemyIsDead) {
      const kirkIsUnder = (this.kirk.y > (enemy.y - (enemy.displayHeight * 0.75)));
  
      if (kirkIsUnder) {
        const si = pMath.Between(1, 3);
        this.sound.play(`sfx-hurt${si}`);

        this.cameras.main.shake(500, 0.01);
        this.cameras.main.flash(300, 255, 0, 0);

        // Damage Kirk
        if (this.kirk.body.velocity.x === 0) {
          const dir = (pMath.Between(0, 1) === 1 ? -1 : 1);
          const vel = pMath.Between(450, 500);
  
          this.kirk.body.setVelocityX(-dir * vel);
        }
        else {
          const vel = this.kirk.body.velocity.x;
  
          this.kirk.body.setVelocityX(-vel);
        }
  
        if (this.kirk.body.velocity.y === 0) {
          const vel = pMath.Between(450, 500);
  
          this.kirk.body.setVelocityY(-vel);
        }
        else {
          const vel = this.kirk.body.velocity.y;
          
          this.kirk.body.setVelocityY(-vel);
        }
      }
      else {
        this.kirk.body.setVelocityY(-225);
      }
  
      // Kill enemy
      const si = pMath.Between(1, 3);
      this.sound.play(`sfx-enemy${si}`);

      const collider = enemy.getData('physicsCollider');
  
      this.physics.world.removeCollider(collider);

      enemy.setData('isDead', true);
      enemy.body.setAllowGravity(true);
      enemy.body.setVelocity(0, -175);

      // Increase score
      this.score++;
    }
  }
}