import { Scene } from 'phaser';

export class BootScene extends Scene {
  constructor() {
    super('scene-boot');
  }

  preload() {
    // Sprites
    this.load.aseprite('kirk', 'assets/sprites/kirk.png', 'assets/sprites/kirk.json');
    this.load.aseprite('bad-guy', 'assets/sprites/bad-guy.png', 'assets/sprites/bad-guy.json');
    this.load.aseprite('heart', 'assets/sprites/heart.png', 'assets/sprites/heart.json');
    this.load.aseprite('monk', 'assets/sprites/monk.png', 'assets/sprites/monk.json');

    // UI
    this.load.aseprite('ui-heart', 'assets/ui/ui-heart.png', 'assets/ui/ui-heart.json');

    // Tilesets & maps
    this.load.image('tiles', 'assets/maps/tiles-ex.png');
    this.load.image('tileset-jungle', 'assets/maps/jungle-ex.png');
    this.load.image('tileset-grassland', 'assets/maps/grassland-ex.png');

    this.load.tilemapTiledJSON('map', 'assets/maps/map1.map.json');
    this.load.tilemapTiledJSON('map-jungle', 'assets/maps/jungle.map.json');
    this.load.tilemapTiledJSON('map-cloud-hills', 'assets/maps/cloud-hills.map.json');

    // Scenery props
    this.load.aseprite('clouds', 'assets/maps/scenery/clouds.png', 'assets/maps/scenery/clouds.json');
    this.load.image('sun', 'assets/maps/scenery/sun.png');
    this.load.image('sun2', 'assets/maps/scenery/sun2.png');
    this.load.aseprite('tree-pine', 'assets/maps/scenery/tree-pine.png', 'assets/maps/scenery/tree-pine.json');
    this.load.image('moon', 'assets/maps/scenery/moon.png');

    // Music
    this.load.audio('ost1', 'assets/music/mountain-loop.mp3');

    // SFX
    this.load.audio('sfx-jump1', 'assets/sfx/jump1.wav');
    this.load.audio('sfx-jump2', 'assets/sfx/jump2.wav');
    this.load.audio('sfx-jump3', 'assets/sfx/jump3.wav');
    this.load.audio('sfx-hurt1', 'assets/sfx/hurt1.wav');
    this.load.audio('sfx-hurt2', 'assets/sfx/hurt2.wav');
    this.load.audio('sfx-hurt3', 'assets/sfx/hurt3.wav');
    this.load.audio('sfx-enemy1', 'assets/sfx/enemy1.wav');
    this.load.audio('sfx-enemy2', 'assets/sfx/enemy2.wav');
    this.load.audio('sfx-enemy3', 'assets/sfx/enemy3.wav');
  }

  create() {
    this.anims.createFromAseprite('kirk');
    this.anims.createFromAseprite('bad-guy');
    this.anims.createFromAseprite('heart');
    this.anims.createFromAseprite('monk');

    this.anims.createFromAseprite('clouds');
    this.anims.createFromAseprite('tree-pine');

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 100, 'M O N K', {
      fontFamily: 'serif',
      color: '#FFF',
      fontSize: '72px'
    }).setOrigin(0.5, 0.5);

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 50, 'A game by Kirk M. (@saricden)', {
      fontFamily: 'sans-serif',
      color: '#AAA',
      fontSize: '15px'
    }).setOrigin(0.5, 0.5);

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 50, 'Tap to begin.', {
      fontFamily: 'sans-serif',
      color: '#FFF',
      fontSize: '18px'
    }).setOrigin(0.5, 0.5);

    // @ts-ignore
    // this.sound.setVolume(0);

    this.input.once('pointerup', () => {
      this.scene.start('scene-game');
    });

  }
}