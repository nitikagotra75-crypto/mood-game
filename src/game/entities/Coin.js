import Phaser from 'phaser';
import { DEPTHS, COIN } from '../utils/Constants.js';

export default class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'coin_0');
    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(DEPTHS.COINS);
    this.setSize(20, 20);
    this.value = COIN.VALUE;
    this.play('coin-spin');
  }

  collect() {
    if (!this.active) return;
    this.scene.scoreManager.addCoin(this.value);
    this.scene.soundManager.playCoin();
    this.scene.spawnSparkle(this.x, this.y);
    this.destroy();
  }
}
