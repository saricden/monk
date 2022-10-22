import { Scene, Tilemaps, Math as pMath, BlendModes, Display } from 'phaser';
import { HUD } from '../scenes/HUD';
import { Birb } from '../sprites/Birb';
import { Gate } from '../sprites/Gate';
import { MushroomRedSm } from '../sprites/MushroomRedSm';

export class RootLevel extends Scene {
  public map?: Tilemaps.Tilemap;
  public ground?: any;
  public monk?: any;
  public baddies: any;
  // @ts-ignore
  public hp: number = 8;
  // @ts-ignore
  public maxHP: number = 8;
  public feathers: number = 0;
  private scenery: Record<string, any[] | any> = {};
  public enemies: Record<string, any[] | any> = {};
  private ost!: any;
  public audioRate: number = 1;
  private gates: Gate[] = [];
  private hud!: any;

  private mapKey: string;
  private tilesetName: string;
  private tilesetKey: string;
  private musicKey: string;

  constructor(
    levelKey: string,
    {
      mapKey,
      tilesetName,
      tilesetKey,
      musicKey
    }:
    {
      mapKey: string,
      tilesetName: string,
      tilesetKey: string,
      musicKey: string
    }
    ) {
    super(`scene-${levelKey}`);

    this.mapKey = mapKey;
    this.tilesetName = tilesetName;
    this.tilesetKey = tilesetKey;
    this.musicKey = musicKey;
  }

  create() {
    this.map = this.add.tilemap(this.mapKey);
    const tiles = this.map.addTilesetImage(this.tilesetName, this.tilesetKey, 32, 32, 1, 2);

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

    if (this.map.getObjectLayer('spawn')) {
      this.map.getObjectLayer('spawn').objects.forEach((object) => {
        if (object.name === 'player') {
          this.monk.setPosition(object.x, object.y);
        }
      });
    }

    this.baddies = [];
    
    this.physics.add.collider(this.monk, this.ground, (monk, tile) => {
      this.handleHang(monk, tile);
    });

    this.physics.world.setBounds(0, -this.map.heightInPixels * 4, this.map.widthInPixels, this.map.heightInPixels * 8);
    this.monk.body.setCollideWorldBounds(true);

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.monk);
    this.cameras.main.setBounds(0, -this.map.heightInPixels * 4, this.map.widthInPixels, this.map.heightInPixels * 5);
    this.cameras.main.setBackgroundColor(0x3366EE);

    this.ost = this.sound.add(this.musicKey, {
      loop: true,
      volume: 0.23
    });

    const pullThreshold = 50;
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
        const isPulling = (pMath.Distance.Between(x, y, startX, startY) >= pullThreshold);

        if (this.monk.body.blocked.down || this.feathers > 0) {
          this.cameras.main.setFollowOffset(dx * 0.1, dy * 0.1);

          if (isPulling && !this.monk.body.blocked.down && !this.monk.getData('hanging')) {
            const d2s = pMath.Distance.Between(x, y, startX, startY);

            if (this.physics.world.timeScale === 1) {
              this.cameras.main.flash(500, 200, 215, 255);
            }

            this.physics.world.timeScale = 2;
            this.time.timeScale = 0.5;
            this.monk.body.setAllowGravity(false);
            this.monk.body.setVelocity(0, 0);
            this.monk.setData('pullupVelocityX', 0);
            this.cameras.main.setZoom(2 - Math.min((d2s / 300 * 1), 1.5));
            this.ost.setRate(0.5);
            this.audioRate = 0.5;
          }
        }

      }
    });

    this.input.on('pointerup', ({ x, y }: { x: number, y: number }) => {
      const dx = (startX - x);
      const dy = (startY - y);
      const didPull = (pMath.Distance.Between(x, y, startX, startY) >= pullThreshold);
      
      this.monk.setData('pullupVelocityX', 0);
      this.physics.world.timeScale = 1;
      this.time.timeScale = 1;
      this.monk.body.setAllowGravity(true);
      this.cameras.main.zoomTo(2, 200);
      this.ost.setRate(1);
      this.audioRate = 1;

      if (didPull && (this.monk.getData('hanging') || this.monk.body.blocked.down || this.feathers > 0)) {
        const si = pMath.Between(1, 3);
        this.sound.play(`sfx-jump${si}`);

        // Lose a feather if jumping mid-air
        if (!this.monk.getData('hanging') && !this.monk.body.blocked.down) {
          this.feathers--;

          const feather = this.physics.add.sprite(this.monk.x, this.monk.y, 'feather');
          feather.play({
            key: 'feather-idle',
            repeat: 0
          });
          feather.body.setMaxVelocityY(10);
          feather.body.setVelocityY(-10);
          feather.setScale(0.5);

          this.tweens.add({
            targets: feather,
            alpha: 0,
            duration: 750,
            angle: 360,
            onComplete: () => {
              feather.destroy();
            }
          });
        }

        if (this.monk.getData('hanging')) {
          this.monk.body.setAllowGravity(true); // Off when hanging
          this.monk.setData('hanging', false);
          this.monk.setData('hangingY', null);

          if (dx < 0 && this.monk.flipX || dx > 0 && !this.monk.flipX) {
            this.monk.setData('pullupVelocityX', dx * 1.5);
          }
        }

        this.monk.body.setVelocity(dx * 1.5, dy * 2.5);

        if (!this.ost.isPlaying) {
          this.ost.play();
          // this.gameStarted = true;
        }
      }
      else {
        this.monk.body.setVelocityX(0);
      }
    });

    this.scene.launch('scene-hud', {
      parentScene: this
    });
    this.hud = this.scene.get('scene-hud');

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

    // Enemies
    this.enemies.mushrooms = [];
    this.enemies.birbs = [];

    this.map.getObjectLayer('enemies').objects.forEach((enemy) => {
      if (enemy.name === 'mushroom-sm-red') {
        const mushroom = new MushroomRedSm(
          this,
          enemy.x as number,
          enemy.y as number
        );

        this.enemies.mushrooms.push(mushroom);
      }
      else if (enemy.name === 'birb') {
        const birb = new Birb(
          this,
          enemy.x as number,
          enemy.y as number
        );

        this.enemies.birbs.push(birb);
      }
    });

    this.physics.add.overlap(
      this.monk,
      [
        ...this.enemies.mushrooms,
        ...this.enemies.birbs
      ],
      (monk, enemy: any) => {
      enemy.handlePlayerCollision(monk);
    });

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

        this.physics.add.overlap(
          [
            this.monk,
            ...this.enemies.mushrooms
          ],
          grass,
          (monk: any, grass: any) => {
            const d2g = Math.abs(pMath.Distance.Between(monk.x, monk.y, grass.x, grass.y) - 10);
            const frameFraction = (grass.displayWidth / 8);
            const frameNum = Math.min(Math.floor(d2g / frameFraction), 3);
            grass.setFrame(3 - frameNum);
          }
        );
      }
      else if (obj.name === 'gate') {
        const to = obj.properties.find((prop: any) => prop.name === 'to').value;
        const gate = new Gate(
          this,
          obj.x as number,
          obj.y as number
        );

        gate.setData('to', to);

        gate.setDepth(-1);

        const rect = this.add.graphics();
        rect.fillStyle(0xFFFFFF);
        rect.setDepth(-1);

        rect.beginPath();
        rect.fillRect(
          obj.x as number - 14,
          obj.y as number - 49,
          32,
          50
        );

        const mask = rect.createGeometryMask();

        const level = this.add.image(obj.x as number, obj.y as number + 3, `map-preview-${to}`);
        level.setScrollFactor(0.85, 1);
        level.setOrigin(0.7, 1);
        level.setMask(mask);
        level.setDepth(-1);

        this.gates.push(gate);
      }
    });
  }

  update(time: number, delta: number) {
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
    if (this.monk.getData('hanging')) {
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

    // Day / night cycle
    this.cycleDayNight();

    // Update enemies
    for (let enemyType of Object.values(this.enemies)) {
      for (let enemy of enemyType) {
        enemy.update?.(time, delta);
      }
    }

    // Watch for game-over
    if (this.hp <= 0) {
      this.ost.stop();
      this.hp = this.maxHP;
      this.feathers = 0;
      this.scene.stop('scene-hud');
      this.scene.restart();
    }

    // Gate proximity
    let nearbyGateTo = '';

    this.gates.forEach((gate) => {
      const d2p = pMath.Distance.Between(gate.x, gate.y, this.monk.x, this.monk.y);

      if (d2p < 50) {
        nearbyGateTo = gate.getData('to');
      }
    });

    if (nearbyGateTo === '') {
      this.hud.hideBtn();
    }
    else {
      this.hud.showBtn(`Go to ${nearbyGateTo}`, () => {
        this.ost.destroy();
        this.scene.stop('scene-hud');
        this.scene.start(`scene-${nearbyGateTo}`);
      });
    }
  }

  handleHang(monk: any, tile: any) {
    if (
        (monk.body.blocked.left || monk.body.blocked.right) &&
        !monk.getData('hanging') &&
        monk.getData('pullupVelocityX') === 0 &&
        tile.pixelY < monk.y
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

  playSpatialSound(x: number, y: number, key: string) {
    const silenceThreshold = 400;
    const d2p = pMath.Distance.Between(x, y, this.monk.x, this.monk.y);
    const volume = (1 - Math.min(d2p / silenceThreshold, 1));
    
    this.sound.play(key, {
      volume,
      rate: this.audioRate
    });
  }
}