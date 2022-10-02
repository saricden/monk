import { Scene, Tilemaps, Math as pMath, BlendModes, Display } from 'phaser';

export class GameScene extends Scene {
  private map?: Tilemaps.Tilemap;
  private ground?: any;
  private monk?: any;
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
    this.monk.body.setSize(10, 29);
    this.monk.body.setOffset(10, 2);
    this.monk.setData('hanging', false);
    this.monk.setData('hangingY', null);
    this.monk.setData('pullupVelocityX', 0);
    this.monk.play({
      key: 'Monk-Down',
      repeat: -1
    });

    this.ground.setDepth(-1);
    this.monk.setDepth(0);

    this.baddies = [];
    
    this.physics.add.collider(this.monk, this.ground, (monk, tile) => {
      this.handleHang(monk, tile);
    });

    this.physics.world.setBounds(0, -this.map.heightInPixels * 4, this.map.widthInPixels, this.map.heightInPixels * 8);
    this.monk.body.setCollideWorldBounds(true);

    // @ts-ignore
    // this.physics.add.overlap(this.monk, this.baddies, (kirk, enemy) => {
    //   this.handleEnemyOverlap(enemy);
    // });

    // this.cameras.main.setZoom(0.2);
    this.cameras.main.setZoom(2);
    // this.cameras.main.setZoom(1);
    this.cameras.main.startFollow(this.monk);
    this.cameras.main.setBounds(0, -this.map.heightInPixels * 4, this.map.widthInPixels, this.map.heightInPixels * 5);
    this.cameras.main.setBackgroundColor(0x3366EE);

    const ost = this.sound.add('ost1', {
      loop: true,
      volume: 0.23
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

        if (this.monk.getData('hanging')) {
          this.monk.body.setAllowGravity(true); // Off when hanging
          this.monk.setData('hanging', false);
          this.monk.setData('hangingY', null);

          if (dx < 0 && this.monk.flipX || dx > 0 && !this.monk.flipX) {
            this.monk.setData('pullupVelocityX', dx * 1.5);
          }
        }

        this.monk.body.setVelocity(dx * 1.5, dy * 2.5);

        if (!ost.isPlaying) {
          ost.play();
          // this.gameStarted = true;
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
    let lowestDepth = 0;

    for (let i = 0; i < numClouds; i++) {
      const depthRatio = pMath.FloatBetween(0.05, 0.2);
      const depth = Math.floor(depthRatio * -100);
      const scale = ((depthRatio * 2) + 0.6); // Max depthRatio * 2 = 0.4, so add 0.6 to make max 1
      const x = pMath.Between(0, (this.map.widthInPixels * (i / numClouds)));
      const y = (pMath.Between(0, Math.ceil(window.innerWidth / 2)) * 2); // *2 for zoom
      const fi = pMath.Between(1, 2);
      const xsf = depthRatio;
      const ysf = 0;

      this.scenery.clouds[i] = this.add.sprite(x, y, 'cloud');
      this.scenery.clouds[i].play({
        key: `cloud${fi}`,
        repeat: 0
      });
      this.scenery.clouds[i].setDepth(depth);
      this.scenery.clouds[i].setScrollFactor(xsf, ysf);
      this.scenery.clouds[i].setScale(scale);

      if (depth < lowestDepth) {
        lowestDepth = depth;
      }
    }

    // Render sun (static for now)
    this.scenery.sun = this.add.sprite(
      window.innerWidth / 1.5,
      200,
      'sun2'
    );
    this.scenery.sun.setScrollFactor(0, 0);
    this.scenery.sun.setBlendMode(BlendModes.ADD);
    this.scenery.sun.setScale(0.9);
    this.scenery.sun.setData('movementAngle', -Math.PI / 2);
    this.scenery.sun.setDepth(lowestDepth - 1);

    this.scenery.moon = this.add.sprite(
      -window.innerWidth / 1.5,
      400,
      'moon'
    );
    this.scenery.moon.setScrollFactor(0, 0);
    this.scenery.moon.setBlendMode(BlendModes.ADD);
    this.scenery.moon.setScale(0.9);
    this.scenery.moon.setData('movementAngle', -Math.PI);
    this.scenery.moon.setDepth(lowestDepth - 1);
    this.scenery.moon.setFlip(true, true);

    // Render map objects
    this.map.getObjectLayer('scenery').objects.forEach((obj) => {
      if (obj.name === 'pine') {
        const pine = this.add.sprite(obj.x as number, obj.y as number, 'tree-pine');
        pine.setOrigin(0.5, 0.995);
        pine.setDepth(-1);
        pine.setFrame(pMath.Between(0, 1));
      }
      else if (obj.name === 'bonsai') {
        const bonsai = this.add.sprite(obj.x as number, obj.y as number, 'tree-bonsai');
        bonsai.setOrigin(0.5, 0.92);
        bonsai.setDepth(-1);
      }
      else if (obj.name === 'grass') {
        const grass = this.physics.add.sprite(obj.x as number, obj.y as number, 'grass');
        grass.setOrigin(0.5, 0.88);
        grass.setDepth(1);
        grass.body.setAllowGravity(false);
        grass.setFrame(0);

        this.physics.add.overlap(this.monk, grass, (monk: any, grass: any) => {
          const d2g = pMath.Distance.Between(monk.x, monk.y, grass.x, grass.y) - 10;
          const frameFraction = (grass.displayWidth / 8);
          const frameNum = Math.min(Math.floor(d2g / frameFraction), 3);
          grass.setFrame(3 - frameNum);
        });
      }
    });

    // Darkness
    this.scenery.darkness = this.add.graphics();
    this.scenery.darkness.fillStyle(0x110011, 0.65);
    this.scenery.darkness.fillRect(0, 0, window.innerWidth, window.innerHeight);
    this.scenery.darkness.setScrollFactor(0, 0);
    this.scenery.darkness.setAlpha(0);
    this.scenery.darkness.setDepth(100);

    // Stars
    const numStars = 40;
    this.scenery.stars = [];

    for (let i = 0; i < numStars; i++) {
      const x = pMath.Between(0, window.innerWidth);
      const y = (pMath.Between(0, Math.ceil(window.innerHeight / 2)));
      const ratio = pMath.FloatBetween(0.5, 1);
      this.scenery.stars[i] = this.add.sprite(x, y, 'star');
      this.scenery.stars[i].setAlpha(0);
      this.scenery.stars[i].setScrollFactor(0, 0);
      this.scenery.stars[i].setScale(ratio - 0.25);
      this.scenery.stars[i].setDepth(lowestDepth - 2);
      this.scenery.stars[i].play({
        key: 'star-anim',
        repeat: -1,
        repeatDelay: pMath.Between(0, 1000)
      });
      this.scenery.stars[i].setBlendMode(BlendModes.ADD);
    }
  }

  update() {
    if (this.map === undefined) {
      return;
    }

    const { isDown } = this.input.pointer1;

    // Extra velocity for edge pull-up
    if (this.monk.getData('pullupVelocityX') !== 0 && !this.monk.body.blocked.down) {
      this.monk.body.setVelocityX(this.monk.getData('pullupVelocityX'));
    }
    else if (this.monk.body.blocked.down) {
      this.monk.setData('pullupVelocityX', 0);
    }

    // Hanging logic
    if (this.monk.getData('hanging')) {
      this.monk.setY(this.monk.getData('hangingY'));
    }

    // Kirk anim logic
    if (!this.monk.body.allowGravity) {
      this.monk.play('Monk-Hang', true);
    }
    else {
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
    }

    // FlipX logic
    if (this.monk.body.velocity.x > 0) {
      this.monk.setFlipX(false);
      this.monk.body.setOffset(10, 2);
    }
    else if (this.monk.body.velocity.x < 0) {
      this.monk.setFlipX(true);
      this.monk.body.setOffset(4, 2);
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
    // const doQueueEnemy = (this.gameStarted && this.queuedEnemyCount < this.maxQueuedEnemies);
    
    // if (doQueueEnemy) {
    //   const delay = pMath.Between(1500, 10000);

    //   // this.time.delayedCall(delay, () => {
    //   //   this.spawnBadGuy();
    //   // });

    //   this.queuedEnemyCount++;
    // }

    // Handle baddy logic
    this.baddies.forEach((baddy: any) => {
      // Handle dumb enemy movement
      if (!baddy.getData('isDead')) {
        this.physics.moveTo(baddy, this.monk.x, this.monk.y, 50);
      }

      // Cleanup dead baddies
    });

    // Day / night cycle
    this.cycleDayNight();
  }

  handleHang(monk: any, tile: any) {
    if (
        (monk.body.blocked.left || monk.body.blocked.right) &&
        !monk.getData('hanging') &&
        monk.getData('pullupVelocityX') === 0
    ) {
      const tileAbove = this.map?.getTileAt(tile.x, tile.y - 1, false, this.ground);

      if (tileAbove === null) {
        monk.body.setVelocity(0, 0);
        monk.setData('hangingY', (tile.y * tile.height + 14));
        monk.body.setAllowGravity(false);
        monk.setData('hanging', true);
      }
    }
  }

  cycleDayNight() {
    // Rotate sun and moon around point, at given radius
    const radius = pMath.Distance.Between(0, 0, window.innerWidth, window.innerHeight) / 2.9;

    this.scenery.sun.setPosition(
      window.innerWidth / 1.5,
      200
    );
    this.scenery.moon.setPosition(
      -window.innerWidth / 1.5,
      400
    );
    
    pMath.RotateAroundDistance(
      this.scenery.sun,
      window.innerWidth / 2,
      window.innerHeight / 2 + 100,
      this.scenery.sun.getData('movementAngle'),
      radius
    );

    pMath.RotateAroundDistance(
      this.scenery.moon,
      window.innerWidth / 2,
      window.innerHeight / 2 + 100,
      this.scenery.moon.getData('movementAngle'),
      radius
    );

    this.scenery.sun.setData(
      'movementAngle',
      pMath.Angle.Wrap(this.scenery.sun.getData('movementAngle') + 0.00075)
    );
    this.scenery.moon.setData(
      'movementAngle',
      pMath.Angle.Wrap(this.scenery.moon.getData('movementAngle') + 0.00075)
    );

    // Apply global darkness tint
    const t = this.scenery.sun.getData('movementAngle') / Math.PI;
    const darkRatio = Math.abs(t);
    
    this.scenery.darkness.setAlpha(darkRatio);
    
    // Fade clouds
    this.scenery.clouds.forEach((cloud: any) => {
      const a = Math.max(1 - darkRatio - 0.3, 0);
      cloud.setAlpha(a);
    });

    // Adjust bgcolor
    const r = (50 * (1 - darkRatio));
    const g = (125 * (1 - darkRatio));
    const b = (250 * (1 - darkRatio));
    const skyColor = Display.Color.GetColor(r, g, b);

    this.cameras.main.setBackgroundColor(skyColor);

    // Fade stars
    this.scenery.stars.forEach((star: any) => {
      if (darkRatio >= 0.7) {
        const a = (((darkRatio - 0.7) / 0.3) * 1);
        star.setAlpha(a);
      }
      else {
        star.setAlpha(0);
      }
    });
  }

  // spawnBadGuy() {
  //   if (this.map === undefined) {
  //     return;
  //   }

  //   const x = pMath.Between(0, this.map.widthInPixels);
  //   const y = -100;

  //   const badGuy = this.physics.add.sprite(x, y, 'bad-guy');
  //   const collider = this.physics.add.collider(badGuy, this.ground);
    
  //   badGuy.setData('physicsCollider', collider);
  //   badGuy.setData('isDead', false);
  //   badGuy.body.setAllowGravity(false);
  //   badGuy.play({
  //     key: 'bad-guy-anim',
  //     repeat: -1
  //   });

  //   this.baddies.push(badGuy);
  //   this.queuedEnemyCount--;
  // }

  // handleEnemyOverlap(enemy: any) {
  //   const enemyIsDead = enemy.getData('isDead');

  //   if (!enemyIsDead) {
  //     const kirkIsUnder = (this.monk.y > (enemy.y - (enemy.displayHeight * 0.75)));
  
  //     if (kirkIsUnder) {
  //       const si = pMath.Between(1, 3);
  //       this.sound.play(`sfx-hurt${si}`);

  //       this.cameras.main.shake(500, 0.01);
  //       this.cameras.main.flash(300, 255, 0, 0);

  //       // Damage Kirk
  //       if (this.monk.body.velocity.x === 0) {
  //         const dir = (pMath.Between(0, 1) === 1 ? -1 : 1);
  //         const vel = pMath.Between(450, 500);
  
  //         this.monk.body.setVelocityX(-dir * vel);
  //       }
  //       else {
  //         const vel = this.monk.body.velocity.x;
  
  //         this.monk.body.setVelocityX(-vel);
  //       }
  
  //       if (this.monk.body.velocity.y === 0) {
  //         const vel = pMath.Between(450, 500);
  
  //         this.monk.body.setVelocityY(-vel);
  //       }
  //       else {
  //         const vel = this.monk.body.velocity.y;
          
  //         this.monk.body.setVelocityY(-vel);
  //       }
  //     }
  //     else {
  //       this.monk.body.setVelocityY(-225);
  //     }
  
  //     // Kill enemy
  //     const si = pMath.Between(1, 3);
  //     this.sound.play(`sfx-enemy${si}`);

  //     const collider = enemy.getData('physicsCollider');
  
  //     this.physics.world.removeCollider(collider);

  //     enemy.setData('isDead', true);
  //     enemy.body.setAllowGravity(true);
  //     enemy.body.setVelocity(0, -175);

  //     // Increase score
  //     this.score++;
  //   }
  // }
}