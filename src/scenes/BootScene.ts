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

    // UI
    this.load.aseprite('ui-heart', 'assets/ui/ui-heart.png', 'assets/ui/ui-heart.json');

    // Maps
    this.load.image('tiles', 'assets/maps/tiles-ex.png');
    this.load.tilemapTiledJSON('map', 'assets/maps/map1.map.json');

    // Music
    this.load.audio('ost1', 'assets/music/ost1.mp3');
  }

  create() {
    this.anims.createFromAseprite('kirk');
    this.anims.createFromAseprite('bad-guy');
    this.anims.createFromAseprite('heart');

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 100, 'K I R K', {
      fontFamily: 'serif',
      color: '#FFF',
      fontSize: '72px'
    }).setOrigin(0.5, 0.5);

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 50, 'A game by Kirk', {
      fontFamily: 'sans-serif',
      color: '#FFF',
      fontSize: '22px'
    }).setOrigin(0.5, 0.5);

    this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 50, 'Tap to begin.', {
      fontFamily: 'sans-serif',
      color: '#FFF',
      fontSize: '18px'
    }).setOrigin(0.5, 0.5);

    this.input.once('pointerup', () => {
      this.scene.start('scene-game');
    });

  }
}