import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/Constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Creates and returns a new Phaser.Game instance mounted into `parent`.
// Kept as a small factory function (rather than a module-level singleton)
// so React can safely create/destroy it as the component mounts/unmounts.
export function createGame(parent) {
  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#1a2e1f',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: true
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene, GameOverScene]
  };

  return new Phaser.Game(config);
}
