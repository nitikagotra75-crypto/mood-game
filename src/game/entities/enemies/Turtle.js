import BaseEnemy from './BaseEnemy.js';
import { ENEMY } from '../../utils/Constants.js';

export default class Turtle extends BaseEnemy {
  constructor(scene, x, y, patrolMinX, patrolMaxX) {
    super(scene, x, y, 'turtle_0', ENEMY.TURTLE);
    this.enemyType = 'turtle';
    this.direction = -1;
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.setSize(32, 24);
    this.setOffset(6, 8);
    this.body.setAllowGravity(true);
    this._animTimer = 0;
    this._frame = 0;
    this.isRetracted = false;
  }

  takeDamage(amount) {
    // Being hit briefly retracts the turtle into its shell, halving
    // incoming damage while retracted, then resumes walking.
    if (this.isDead) return;
    const dmg = this.isRetracted ? Math.ceil(amount * 0.5) : amount;
    super.takeDamage(dmg);
    if (this.isDead) return;

    this.isRetracted = true;
    this.setVelocityX(0);
    this.scene.time.delayedCall(900, () => {
      if (this.active) this.isRetracted = false;
    });
  }

  update(time, delta) {
    if (this.isDead) return;

    if (this.isRetracted) {
      this._animTimer += delta;
      if (this._animTimer > 300) {
        this._animTimer = 0;
        this.setTexture('turtle_0');
      }
      return;
    }

    if (this.x <= this.patrolMinX) this.direction = 1;
    else if (this.x >= this.patrolMaxX) this.direction = -1;

    this.setVelocityX(this.direction * this.config.speed * this.getSpeedMultiplier());
    this.setFlipX(this.direction > 0);

    this._animTimer += delta;
    if (this._animTimer > 320) {
      this._animTimer = 0;
      this._frame = 1 - this._frame;
      this.setTexture(`turtle_${this._frame}`);
    }
  }
}
