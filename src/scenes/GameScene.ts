import { Scene, Tilemaps, Math as pMath } from 'phaser';

export class GameScene extends Scene {
  private map?: Tilemaps.Tilemap;
  private ground?: any;
  private monk?: any;
  private gameStarted: boolean = false;
  private queuedEnemyCount: number = 0;
  private maxQueuedEnemies: number = 3;
  private baddies: any;
  // @ts-ignore
  private hp: number = 8;
  // @ts-ignore
  private maxHP: number = 8;
  private score: number = 0;
  private scenery: Record<string, any[] | any> = {};

  constructor() {
    super('scene-game');
  }

  create() {
    this.map = this.add.tilemap('map-cloud-hills');
    const tiles = this.map.addTilesetImage('grassland', 'tileset-grassland', 32, 32, 1, 2);
    this.ground = this.map.createLayer('ground', tiles);

    this.ground.setCollisionByProperty({ collides: true });

    this.monk = this.physics.add.sprite(200, 0, 'monk');
    this.monk.play({
      key: 'Monk-Down',
      repeat: -1
    });

    this.ground.setDepth(-1);
    this.monk.setDepth(0);

    this.baddies = [];
    
    this.physics.add.collider(this.monk, this.ground);

    this.physics.world.setBounds(0, -this.map.heightInPixels * 4, this.map.widthInPixels, this.map.heightInPixels * 8);
    this.monk.body.setCollideWorldBounds(true);

    // @ts-ignore
    this.physics.add.overlap(this.monk, this.baddies, (kirk, enemy) => {
      this.handleEnemyOverlap(enemy);
    });

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.monk);
    this.cameras.main.setBounds(0, -this.map.heightInPixels * 4, this.map.widthInPixels, this.map.heightInPixels * 5);
    this.cameras.main.setBackgroundColor(0x3366EE);

    const ost = this.sound.add('ost1', {
      loop: true,
      volume: 0.15
    });

    const pullThreshold = 100;
    let startX: number = 0;
    let startY: number = 0;
    let isDown: boolean = false;

    this.input.on('pointerdown', ({ x, y }: { x: number, y: number }) => {
      if (this.monk === undefined) {
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

        this.monk.body.setVelocity(dx * 1.5, dy * 2.5);

        if (!ost.isPlaying) {
          ost.play();
          this.gameStarted = true;
        }
      }
      else {
        this.monk.body.setVelocityX(0);
      }
    });

    this.scene.launch('scene-hud', {
      parentScene: this,
      initialScore: this.score
    });

    // Randomly add clouds
    this.scenery.clouds = [];
    const numClouds = pMath.Between(100, 200);

    for (let i = 0; i < numClouds; i++) {
      const x = pMath.Between(0, (this.map.widthInPixels * (i / numClouds)));
      const y = (pMath.Between(0, Math.ceil(window.innerWidth / 2)) * 2); // *2 for zoom
      const fi = pMath.Between(1, 2);
      const xsf = pMath.FloatBetween(0.95, 1);
      const ysf = 0;

      this.scenery.clouds[i] = this.add.sprite(x, y, 'cloud');
      this.scenery.clouds[i].play({
        key: `cloud${fi}`,
        repeat: 0
      });
      this.scenery.clouds[i].setDepth(-2);
      this.scenery.clouds[i].setScrollFactor(xsf, ysf);


    }

    
  }

  update() {
    if (this.map === undefined) {
      return;
    }

    const { isDown } = this.input.pointer1;

    // Kirk anim logic
    if (this.monk.body.blocked.down) {
      if (this.monk.body.velocity.x === 0) {
        this.monk.play('Monk-Idle', true);
      }
      else {
        this.monk.play('Monk-Run', true);
      }
    }
    else {
      if (this.monk.body.velocity.y < 0) {
        this.monk.play('Monk-Up', true);
      }
      else {
        this.monk.play('Monk-Down', true);
      }
    }

    // FlipX logic
    if (this.monk.body.velocity.x > 0) {
      this.monk.setFlipX(false);
    }
    else if (this.monk.body.velocity.x < 0) {
      this.monk.setFlipX(true);
    }

    // Bound resets
    if (this.monk.x < 0) {
      this.monk.setX(this.map.widthInPixels);
    }
    else if (this.monk.x > this.map.widthInPixels) {
      this.monk.setX(0);
    }

    if (this.monk.y > this.map.heightInPixels) {
      this.monk.setY(0);
      this.monk.body.setVelocityY(0);
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
    const {x: vx} = this.monk.body.velocity;

    if (this.monk.body.blocked.down) {
      if ((vx < 0 && vx > -5 || vx > 0 && vx < 5)) {
        this.monk.body.setVelocityX(0);
      }
      else {
        this.monk.body.setVelocityX(vx * 0.97);
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
        this.physics.moveTo(baddy, this.monk.x, this.monk.y, 50);
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
      const kirkIsUnder = (this.monk.y > (enemy.y - (enemy.displayHeight * 0.75)));
  
      if (kirkIsUnder) {
        const si = pMath.Between(1, 3);
        this.sound.play(`sfx-hurt${si}`);

        this.cameras.main.shake(500, 0.01);
        this.cameras.main.flash(300, 255, 0, 0);

        // Damage Kirk
        if (this.monk.body.velocity.x === 0) {
          const dir = (pMath.Between(0, 1) === 1 ? -1 : 1);
          const vel = pMath.Between(450, 500);
  
          this.monk.body.setVelocityX(-dir * vel);
        }
        else {
          const vel = this.monk.body.velocity.x;
  
          this.monk.body.setVelocityX(-vel);
        }
  
        if (this.monk.body.velocity.y === 0) {
          const vel = pMath.Between(450, 500);
  
          this.monk.body.setVelocityY(-vel);
        }
        else {
          const vel = this.monk.body.velocity.y;
          
          this.monk.body.setVelocityY(-vel);
        }
      }
      else {
        this.monk.body.setVelocityY(-225);
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