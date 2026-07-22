import BaseEnemy from './BaseEnemy.js';
import { ENEMY } from '../../utils/Constants.js';

export default class Walker extends BaseEnemy {
  constructor(scene, x, y, patrolMinX, patrolMaxX) {
    super(scene, x, y, 'walker_0', ENEMY.WALKER);
    this.enemyType = 'walker';
    this.direction = -1;
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.setSize(30, 26);
    this.setOffset(6, 12);
    this.body.setAllowGravity(true);
    this._animTimer = 0;
    this._frame = 0;
  }

  update(time, delta) {
    if (this.isDead) return;

    if (this.x <= this.patrolMinX) this.direction = 1;
    else if (this.x >= this.patrolMaxX) this.direction = -1;

    this.setVelocityX(this.direction * this.config.speed * this.getSpeedMultiplier());
    this.setFlipX(this.direction > 0);

    this._animTimer += delta;
    if (this._animTimer > 220) {
      this._animTimer = 0;
      this._frame = 1 - this._frame;
      this.setTexture(`walker_${this._frame}`);
    }
  }
}
