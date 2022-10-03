import './style.css'
import { Game, WEBGL } from 'phaser';

// Scenes
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HUD } from './scenes/HUD';

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
    GameScene,

    HUD
  ]
}

new Game(config);