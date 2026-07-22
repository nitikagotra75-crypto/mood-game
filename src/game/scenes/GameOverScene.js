import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalDistance = data.distance || 0;
    this.best = data.best || 0;
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0e1b12, 0.55);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 480, 320, 0x14261a, 0.85).setStrokeStyle(3, 0xd0453a);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118, 'GAME OVER', {
      fontFamily: 'Trebuchet MS', fontSize: '46px', color: '#ff8a8a', fontStyle: 'bold'
    }).setOrigin(0.5);

    const isNewBest = this.finalScore >= this.best && this.finalScore > 0;

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, `Score: ${this.finalScore}`, {
      fontFamily: 'Trebuchet MS', fontSize: '26px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 14, `Distance: ${this.finalDistance}m`, {
      fontFamily: 'Trebuchet MS', fontSize: '17px', color: '#cdeccd'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 14, isNewBest ? 'New Best Score!' : `Best: ${this.best}`, {
      fontFamily: 'Trebuchet MS', fontSize: '16px', color: isNewBest ? '#ffd54a' : '#9fd39f'
    }).setOrigin(0.5);

    const restartBtn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 220, 54, 0x4caf50)
      .setStrokeStyle(3, 0x2f6b3f).setInteractive({ useHandCursor: true });
    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'RUN AGAIN', {
      fontFamily: 'Trebuchet MS', fontSize: '20px', color: '#0e1b12', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({ targets: [restartBtn, restartText], scale: 1.05, yoyo: true, repeat: -1, duration: 700 });

    const restart = () => {
      const soundManager = this.game.registry.get('soundManager');
      if (soundManager) soundManager.playStart();
      this.cameras.main.fadeOut(220, 14, 38, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    };

    restartBtn.on('pointerdown', restart);
    restartText.setInteractive({ useHandCursor: true }).on('pointerdown', restart);
    this.input.keyboard.once('keydown-SPACE', restart);
    this.input.keyboard.once('keydown-ENTER', restart);
  }
}
