import Phaser from 'phaser';
import TextureGenerator from '../managers/TextureGenerator.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create() {
    const barW = 320, barH = 18;
    const bx = GAME_WIDTH / 2 - barW / 2, by = GAME_HEIGHT / 2 - barH / 2;

    this.add.text(GAME_WIDTH / 2, by - 40, 'Emerald Run', {
      fontFamily: 'Trebuchet MS', fontSize: '38px', color: '#e9f5ea', fontStyle: 'bold'
    }).setOrigin(0.5);

    const bg = this.add.rectangle(bx + barW / 2, by + barH / 2, barW, barH, 0x14261a).setStrokeStyle(2, 0x4caf50);
    const fill = this.add.rectangle(bx + 4, by + barH / 2, 4, barH - 8, 0x4caf50).setOrigin(0, 0.5);

    this.cameras.main.setBackgroundColor('#1a2e1f');

    // Generate textures across a couple of frames so the loading bar is
    // visibly meaningful even though generation itself is near-instant.
    this.tweens.add({
      targets: fill,
      width: barW - 8,
      duration: 350,
      ease: 'Sine.easeInOut'
    });

    this.time.delayedCall(60, () => {
      TextureGenerator.generateAll(this);
      this._createAnimations();
    });

    this.time.delayedCall(420, () => {
      this.scene.start('MenuScene');
    });
  }

  _createAnimations() {
    const anims = this.anims;

    anims.create({
      key: 'player-idle',
      frames: [{ key: 'player_idle_0' }, { key: 'player_idle_1' }],
      frameRate: 3,
      repeat: -1
    });
    anims.create({
      key: 'player-run',
      frames: [{ key: 'player_run_0' }, { key: 'player_run_1' }, { key: 'player_run_2' }, { key: 'player_run_3' }],
      frameRate: 12,
      repeat: -1
    });
    anims.create({
      key: 'player-jump',
      frames: [{ key: 'player_jump_0' }],
      frameRate: 1,
      repeat: 0
    });
    anims.create({
      key: 'player-fall',
      frames: [{ key: 'player_fall_0' }],
      frameRate: 1,
      repeat: 0
    });
    anims.create({
      key: 'player-attack',
      frames: [{ key: 'player_attack_0' }, { key: 'player_attack_1' }],
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'coin-spin',
      frames: [{ key: 'coin_0' }, { key: 'coin_1' }, { key: 'coin_2' }, { key: 'coin_1' }],
      frameRate: 8,
      repeat: -1
    });
  }
}
