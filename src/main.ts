import './style.css'
import { Game, WEBGL } from 'phaser';

// Scenes
import { BootScene } from './scenes/BootScene';
import { HUD } from './scenes/HUD';

// Maps
import { TempleLevel } from './levels/TempleLevel';
import { CloudHillsLevel } from './levels/CloudHillsLevel';

const canvas = document.getElementById('game') as HTMLCanvasElement;

const config = {
  type: WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  canvas,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 775 },
      debug: (new URLSearchParams(window.location.search).get('debug') === 'true')
    }
  },
  pixelArt: true,
  scene: [
    BootScene,
    TempleLevel,
    CloudHillsLevel,

    HUD
  ]
}

new Game(config);