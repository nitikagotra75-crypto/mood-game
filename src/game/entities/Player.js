import Phaser from 'phaser';
import { PLAYER, DEPTHS } from '../utils/Constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle_0');
    this.scene = scene;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(PLAYER.WIDTH, PLAYER.HEIGHT - 4);
    this.setOffset((48 - PLAYER.WIDTH) / 2, 6);
    this.setDepth(DEPTHS.PLAYER);
    this.setDragX(PLAYER.DRAG_X);
    this.setMaxVelocity(PLAYER.MAX_SPEED + 300, 1400);
    this.setCollideWorldBounds(false);

    this.health = PLAYER.MAX_HEALTH;
    this.maxHealth = PLAYER.MAX_HEALTH;
    this.jumpsUsed = 0;
    this.isAttacking = false;
    this.isInvulnerable = false;
    this.isDead = false;
    this.facing = 1; // 1 = right, -1 = left
    this._attackTimer = null;
    this._attackCooldownUntil = 0;
    this.attackHitbox = new Phaser.Geom.Rectangle(0, 0, PLAYER.ATTACK_RANGE_W, PLAYER.ATTACK_RANGE_H);

    // Granted periodically while the detected mood is "Sad" (see
    // GameScene's mood-adaptation logic). A shield absorbs exactly one
    // hit instead of losing health.
    this.shieldCount = 0;

    this._currentAnim = null;
    this.play('player-idle');
  }

  // currentSpeed is the forward auto-scroll speed (already includes the
  // mood-driven heroSpeedMult, applied by GameScene before calling this).
  update(time, delta, input, currentSpeed) {
    if (this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.jumpsUsed = 0;

    // --- Horizontal movement: constant forward auto-scroll, plus a
    // player-controlled lateral offset layered on top so steering still
    // feels responsive even though the hero always drifts forward.
    let vx = currentSpeed;
    if (input.left && !input.right) {
      vx = currentSpeed - PLAYER.LATERAL_SPEED;
      this.facing = -1;
    } else if (input.right && !input.left) {
      vx = currentSpeed + PLAYER.LATERAL_SPEED * 0.6;
      this.facing = 1;
    } else {
      this.facing = 1;
    }
    vx = Math.max(currentSpeed * 0.15, vx); // never fully stop / go backward off-screen
    this.setVelocityX(vx);
    this.setFlipX(this.facing === -1);

    // --- Jump (supports a double jump) ---
    if (input.jumpPressed && this.jumpsUsed < PLAYER.MAX_JUMPS) {
      const vy = this.jumpsUsed === 0 ? PLAYER.JUMP_VELOCITY : PLAYER.DOUBLE_JUMP_VELOCITY;
      this.setVelocityY(vy);
      this.jumpsUsed++;
      this.scene.soundManager.playJump();
      this.scene.spawnDustPuff(this.x, this.y + PLAYER.HEIGHT / 2);
    }

    // --- Attack ---
    if (input.attackPressed && time > this._attackCooldownUntil && !this.isAttacking) {
      this._startAttack(time);
    }

    if (this.isAttacking) {
      const hbX = this.facing === 1 ? this.x + 10 : this.x - 10 - PLAYER.ATTACK_RANGE_W;
      this.attackHitbox.setPosition(hbX, this.y - PLAYER.ATTACK_RANGE_H / 2);
    }

    this._updateAnimation(onGround);

    if (this.isInvulnerable) {
      this.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.35 : 1);
    } else {
      this.setAlpha(1);
    }
  }

  _startAttack(time) {
    this.isAttacking = true;
    this._attackCooldownUntil = time + PLAYER.ATTACK_COOLDOWN_MS;
    this.scene.soundManager.playAttack();
    this.play('player-attack', true);
    if (this._attackTimer) this._attackTimer.remove();
    this._attackTimer = this.scene.time.delayedCall(PLAYER.ATTACK_DURATION_MS, () => {
      this.isAttacking = false;
    });
  }

  _updateAnimation(onGround) {
    if (this.isAttacking) {
      if (this._currentAnim !== 'player-attack') this.play('player-attack', true);
      this._currentAnim = 'player-attack';
      return;
    }
    if (!onGround) {
      const key = this.body.velocity.y < 0 ? 'player-jump' : 'player-fall';
      if (this._currentAnim !== key) this.play(key, true);
      this._currentAnim = key;
      return;
    }
    const moving = Math.abs(this.body.velocity.x) > 40;
    const key = moving ? 'player-run' : 'player-idle';
    if (this._currentAnim !== key) this.play(key, true);
    this._currentAnim = key;
  }

  takeDamage(amount, knockbackDir = -1) {
    if (this.isInvulnerable || this.isDead) return;

    // A shield (granted during sustained Sad mood) absorbs one hit
    // entirely - no health lost, brief invulnerability still applies so
    // the player isn't immediately re-hit by the same enemy.
    if (this.shieldCount > 0) {
      this.shieldCount--;
      this.isInvulnerable = true;
      this.scene.soundManager.playShieldBreak();
      this.scene.spawnHitPuff(this.x, this.y);
      this.scene.time.delayedCall(500, () => { this.isInvulnerable = false; this.setAlpha(1); });
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    this.setVelocity(PLAYER.KNOCKBACK_X * knockbackDir * -1, PLAYER.KNOCKBACK_Y);
    this.scene.soundManager.playHit();
    this.scene.cameras.main.shake(150, 0.006);

    this.scene.time.delayedCall(PLAYER.INVULNERABLE_MS, () => {
      this.isInvulnerable = false;
      this.setAlpha(1);
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  // Slow passive regeneration, used while the detected mood is "Sad" to
  // make the game gently more forgiving (see GameScene).
  healPassive(amount) {
    if (this.isDead || amount <= 0) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addShield() {
    this.shieldCount++;
    this.scene.soundManager.playShieldGain();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.setTint(0xff8080);
    this.setVelocity(-100, -300);
    this.scene.soundManager.playGameOver();
    this.scene.onPlayerDied();
  }
}
