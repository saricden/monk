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
    this.load.image('tree-bonsai', 'assets/maps/scenery/tree-bonsai.png');
    this.load.aseprite('star', 'assets/maps/scenery/star.png', 'assets/maps/scenery/star.json');
    this.load.aseprite('grass', 'assets/maps/scenery/grass.png', 'assets/maps/scenery/grass.json');

    // Enemies
    this.load.aseprite('mushroom-sm-red', 'assets/sprites/mushroom-sm-red.png', 'assets/sprites/mushroom-sm-red.json');

    // Music
    this.load.audio('ost1', 'assets/music/ost-fast-loop1.mp3');

    // SFX
    this.load.audio('sfx-jump1', 'assets/sfx/jump1.wav');
    this.load.audio('sfx-jump2', 'assets/sfx/jump2.wav');
    this.load.audio('sfx-jump3', 'assets/sfx/jump3.wav');
    this.load.audio('sfx-hurt1', 'assets/sfx/hurt1.wav');
    this.load.audio('sfx-hurt2', 'assets/sfx/hurt2.wav');
    this.load.audio('sfx-hurt3', 'assets/sfx/hurt3.wav');
    this.load.audio('sfx-mushroom-sm-jump', 'assets/sfx/mushroom-jump.wav');
    this.load.audio('sfx-mushroom-sm-die', 'assets/sfx/mushroom-die.wav');
  }

  create() {
    this.anims.createFromAseprite('kirk');
    this.anims.createFromAseprite('bad-guy');
    this.anims.createFromAseprite('heart');
    this.anims.createFromAseprite('monk');

    this.anims.createFromAseprite('mushroom-sm-red');

    this.anims.createFromAseprite('clouds');
    this.anims.createFromAseprite('tree-pine');
    this.anims.createFromAseprite('star');
    this.anims.createFromAseprite('grass');

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 100, 'MONK', {
      fontFamily: 'Silkscreen',
      color: '#FFF',
      fontSize: '72px'
    }).setOrigin(0.5, 0.5);

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 40, 'A game by\nKirk M. (@saricden)', {
      fontFamily: 'Silkscreen',
      color: '#AAA',
      fontSize: '15px',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 50, 'Tap to begin.', {
      fontFamily: 'Silkscreen',
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