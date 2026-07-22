import BaseEnemy from './BaseEnemy.js';
import { ENEMY } from '../../utils/Constants.js';

export default class Bird extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'bird_0', ENEMY.BIRD);
    this.enemyType = 'bird';
    this.baseY = y;
    this.spawnTime = scene.time.now;
    this.setSize(32, 22);
    this.setOffset(4, 6);
    this.body.setAllowGravity(false);
    this._animTimer = 0;
    this._frame = 0;
  }

  update(time, delta) {
    if (this.isDead) return;

    const elapsed = time - this.spawnTime;
    this.y = this.baseY + Math.sin(elapsed * this.config.frequency) * this.config.amplitude;
    this.setVelocityX(-this.config.speed * this.getSpeedMultiplier());

    this._animTimer += delta;
    if (this._animTimer > 120) {
      this._animTimer = 0;
      this._frame = 1 - this._frame;
      this.setTexture(`bird_${this._frame}`);
    }
  }
}
