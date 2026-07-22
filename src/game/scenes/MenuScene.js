import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, STORAGE_KEY } from '../utils/Constants.js';
import SoundManager from '../managers/SoundManager.js';
import MoodDetector from '../managers/MoodDetector.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT * 0.55, GAME_WIDTH * 2, 260, 'forest_far').setAlpha(0.7);
    this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT * 0.68, GAME_WIDTH * 2, 300, 'forest_near').setAlpha(0.9);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 320, 0x14261a, 0.55).setStrokeStyle(3, 0x4caf50);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118, 'EMERALD RUN', {
      fontFamily: 'Trebuchet MS', fontSize: '54px', color: '#eafbea', fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(2, 3, '#0e1b12', 4, true, true);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 66, 'An endless forest platformer', {
      fontFamily: 'Trebuchet MS', fontSize: '18px', color: '#cdeccd'
    }).setOrigin(0.5);

    let best = 0;
    try {
      best = parseInt(window.localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
    } catch (e) { /* ignore */ }
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `Best score: ${best}`, {
      fontFamily: 'Trebuchet MS', fontSize: '16px', color: '#ffd54a'
    }).setOrigin(0.5);

    const startBtn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 220, 56, 0x4caf50).setStrokeStyle(3, 0x2f6b3f).setInteractive({ useHandCursor: true });
    const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'START RUN', {
      fontFamily: 'Trebuchet MS', fontSize: '22px', color: '#0e1b12', fontStyle: 'bold'
    }).setOrigin(0.5);

    const pulse = this.tweens.add({ targets: [startBtn, startText], scale: 1.05, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90,
      'Desktop: A/D or ←/→ to move, SPACE/W to jump (x2), F to attack\nMobile: use the on-screen buttons', {
      fontFamily: 'Trebuchet MS', fontSize: '13px', color: '#bcd9bc', align: 'center'
    }).setOrigin(0.5);

    const moodStatus = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 138,
      '🎭 Mood detection uses your webcam to adapt difficulty (optional)', {
      fontFamily: 'Trebuchet MS', fontSize: '12px', color: '#8fae8f', align: 'center',
      wordWrap: { width: 620 }
    }).setOrigin(0.5);

    const startGame = () => {
      if (!this.game.registry.get('soundManager')) {
        const sm = new SoundManager();
        this.game.registry.set('soundManager', sm);
      }
      const soundManager = this.game.registry.get('soundManager');
      soundManager.unlock();
      soundManager.playStart();

      // Fire the webcam permission request + model load from this click
      // (a genuine user gesture) but never block the transition to
      // GameScene on it - detection comes online whenever it's ready.
      // Full step-by-step failure diagnostics (which step failed, exact
      // browser error) are surfaced by the always-on <MoodStatusBanner/>
      // React overlay via MoodBus 'mood-error', not hidden anywhere.
      if (!this.game.registry.get('moodDetector')) {
        const detector = new MoodDetector();
        this.game.registry.set('moodDetector', detector);
        moodStatus.setText('🎥 Requesting camera...');
        detector.init().then((ok) => {
          if (!this.scene.isActive('MenuScene')) return;
          moodStatus.setText(ok ? '✅ Mood detection active' : '⚠️ Mood detection unavailable (see banner above)');
        });
      }

      pulse.stop();
      this.cameras.main.fadeOut(250, 14, 38, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    };

    startBtn.on('pointerdown', startGame);
    startText.setInteractive({ useHandCursor: true }).on('pointerdown', startGame);
    this.input.keyboard.once('keydown-SPACE', startGame);
    this.input.keyboard.once('keydown-ENTER', startGame);
  }
}
