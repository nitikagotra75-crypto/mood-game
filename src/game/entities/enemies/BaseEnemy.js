import Phaser from 'phaser';
import { DEPTHS } from '../../utils/Constants.js';

export default class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, config) {
    super(scene, x, y, texture);
    this.scene = scene;
    this.config = config;
    this.health = config.health;
    this.maxHealth = config.health;
    this.damage = config.damage;
    this.scoreValue = config.scoreValue;
    this.isDead = false;
    this.enemyType = 'base';

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTHS.ENEMIES);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });

    if (this.health <= 0) {
      this.onDeath();
    }
  }

  onDeath() {
    if (this.isDead) return;
    this.isDead = true;
    this.scene.soundManager.playEnemyDeath();
    this.scene.onEnemyKilled(this);

    // simple death pop: scale down + fade, then destroy
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 220,
      ease: 'Back.easeIn',
      onComplete: () => this.destroy()
    });
  }

  // Called by GameScene cleanup when an enemy scrolls far behind the camera.
  despawn() {
    this.destroy();
  }

  // Reads the current mood-driven speed multiplier from the scene
  // (1.0 = Neutral/default, >1 = Happy makes enemies faster, <1 = Sad
  // makes them slower). Falls back to 1 if the scene hasn't set one yet.
  getSpeedMultiplier() {
    return (this.scene.moodMultipliers && this.scene.moodMultipliers.enemySpeed) || 1;
  }

  update(time, delta, playerX) {
    // overridden by subclasses
  }
}
