import BaseEnemy from './BaseEnemy.js';
import { ENEMY } from '../../utils/Constants.js';

export default class Crocodile extends BaseEnemy {
  constructor(scene, x, y, patrolMinX, patrolMaxX) {
    super(scene, x, y, 'crocodile_0', ENEMY.CROCODILE);
    this.enemyType = 'crocodile';
    this.direction = -1;
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.setSize(56, 20);
    this.setOffset(8, 10);
    this.body.setAllowGravity(true);
    this._animTimer = 0;
    this._frame = 0;
    this._lungeCooldown = 0;
  }

  update(time, delta, playerX, playerY) {
    if (this.isDead) return;

    if (this.x <= this.patrolMinX) this.direction = 1;
    else if (this.x >= this.patrolMaxX) this.direction = -1;

    let speed = this.config.speed;

    // Lunge toward the player if close and cooldown has elapsed.
    const dist = Math.abs(playerX - this.x);
    if (dist < 160 && time > this._lungeCooldown) {
      speed = this.config.speed * 3.2;
      this.direction = playerX < this.x ? -1 : 1;
      this._lungeCooldown = time + 1400;
    }

    this.setVelocityX(this.direction * speed * this.getSpeedMultiplier());
    this.setFlipX(this.direction > 0);

    this._animTimer += delta;
    if (this._animTimer > 260) {
      this._animTimer = 0;
      this._frame = 1 - this._frame;
      this.setTexture(`crocodile_${this._frame}`);
    }
  }
}
