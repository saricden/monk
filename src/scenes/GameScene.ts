import { Scene, Tilemaps } from 'phaser';

export class GameScene extends Scene {
  private map?: Tilemaps.Tilemap;
  private kirk?: any;

  constructor() {
    super('scene-game');
  }

  create() {
    this.map = this.add.tilemap('map');
    const tiles = this.map.addTilesetImage('tiles', 'tiles', 16, 16, 1, 2);
    const ground = this.map.createLayer('ground', tiles);

    ground.setCollisionByProperty({ collides: true });

    this.kirk = this.physics.add.sprite(200, 0, 'kirk');
    this.kirk.play({
      key: 'kirk-down',
      repeat: -1
    });
    
    this.physics.add.collider(this.kirk, ground);

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.kirk);
    this.cameras.main.setBackgroundColor(0x110011);

    const ost = this.sound.add('ost1', {
      loop: true
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
        this.kirk.body.setVelocity(dx * 1.5, dy * 2.5);

        if (!ost.isPlaying) {
          ost.play();
        }
      }
      else {
        this.kirk.body.setVelocityX(0);
      }
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
  }


}