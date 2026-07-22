import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, WORLD_DEATH_Y, GRAVITY_Y,
  PLAYER, DEPTHS, MOOD_PROFILES
} from '../utils/Constants.js';
import Player from '../entities/Player.js';
import LevelManager from '../managers/LevelManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import InputManager from '../managers/InputManager.js';
import MoodBus from '../utils/MoodBus.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.isGameOver = false;
    this.soundManager = this.game.registry.get('soundManager');
    this.moodDetector = this.game.registry.get('moodDetector') || null;
    this.scoreManager = new ScoreManager();

    // --- Mood-driven difficulty state -------------------------------
    // moodMultipliers is read every frame by Player/enemies/LevelManager
    // to scale speed, spawn rate, etc. live, without any of them needing
    // to know mood detection exists - they just read a plain number.
    this.currentMood = 'neutral';
    this.currentMoodProfile = MOOD_PROFILES.neutral;
    this.moodMultipliers = { enemySpeed: 1, enemySpawn: 1, heroSpeed: 1 };
    this._sadShieldTimer = 0;

    this.physics.world.gravity.y = GRAVITY_Y;
    this.physics.world.setBounds(0, -400, 1e7, GAME_HEIGHT + 400);

    this._createBackground();
    this._createGroups();

    this.levelManager = new LevelManager(this, {
      grounds: this.grounds,
      platforms: this.platforms,
      coins: this.coins,
      obstacles: this.obstacles,
      enemies: this.enemies,
      decor: this.decor
    });

    this.player = new Player(this, PLAYER.START_X, PLAYER.START_Y);
    this.inputManager = new InputManager(this);

    this._createParticleEmitters();
    this._setupCollisions();
    this._setupCamera();

    this.currentSpeed = PLAYER.START_SPEED;

    // Pick up whatever mood was already detected before this scene
    // existed (e.g. player made a face while still on the menu screen),
    // applied silently - no toast for the very first sync.
    this._applyMoodProfile(this.moodDetector ? this.moodDetector.getCurrentMood() : 'neutral');

    this._onMoodChanged = (payload) => this._handleMoodChanged(payload);
    MoodBus.on('mood-changed', this._onMoodChanged);

    this.scene.launch('UIScene', { gameScene: this });
    this.soundManager.startMusic();

    this.events.once('shutdown', () => this._shutdown());
  }

  _createBackground() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky')
      .setScrollFactor(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(DEPTHS.SKY);

    this.cloudsFar = this.add.tileSprite(GAME_WIDTH / 2, 90, GAME_WIDTH, 90, 'cloud_med')
      .setScrollFactor(0).setAlpha(0.75).setDepth(DEPTHS.CLOUDS_FAR);
    this.cloudsNear = this.add.tileSprite(GAME_WIDTH / 2, 150, GAME_WIDTH, 110, 'cloud_big')
      .setScrollFactor(0).setAlpha(0.55).setDepth(DEPTHS.CLOUDS_NEAR);

    this.forestFar = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT - 190, GAME_WIDTH, 220, 'forest_far')
      .setScrollFactor(0).setAlpha(0.55).setDepth(DEPTHS.TREES_FAR);
    this.forestNear = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT - 130, GAME_WIDTH, 260, 'forest_near')
      .setScrollFactor(0).setAlpha(0.8).setDepth(DEPTHS.TREES_NEAR);
  }

  _createGroups() {
    // Every entity (ground/platform tiles, coins, obstacles, enemies)
    // creates its own Arcade physics body in its own constructor via
    // scene.physics.add.existing(...). These are plain Phaser display
    // groups used purely for tracking/iteration/cleanup - Phaser's
    // collider/overlap happily works against a group's children as long
    // as each child has a body, so we don't need "physics groups" here
    // and avoid any static/dynamic auto-conversion ambiguity.
    this.grounds = this.add.group();
    this.platforms = this.add.group();
    this.coins = this.add.group();
    this.obstacles = this.add.group();
    this.enemies = this.add.group();
    this.decor = this.add.group();
  }

  _createParticleEmitters() {
    this.sparkleEmitter = this.add.particles(0, 0, 'particle_spark', {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 350,
      quantity: 8,
      emitting: false
    }).setDepth(DEPTHS.UI);

    this.dustEmitter = this.add.particles(0, 0, 'particle_dust', {
      speed: { min: 20, max: 70 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      quantity: 5,
      emitting: false
    }).setDepth(DEPTHS.GROUND + 1);

    this.hitEmitter = this.add.particles(0, 0, 'particle_hit', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 10,
      emitting: false
    }).setDepth(DEPTHS.UI);
  }

  spawnSparkle(x, y) { this.sparkleEmitter.explode(8, x, y); }
  spawnDustPuff(x, y) { this.dustEmitter.explode(5, x, y); }
  spawnHitPuff(x, y) { this.hitEmitter.explode(10, x, y); }

  _setupCollisions() {
    this.physics.add.collider(this.player, this.grounds);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.grounds);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.player, this.coins, (player, coin) => coin.collect());

    this.physics.add.overlap(this.player, this.obstacles, (player) => {
      if (!player.isInvulnerable && !player.isDead) {
        player.takeDamage(PLAYER.FALL_DAMAGE_OBSTACLE, player.facing);
      }
    });

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (enemy.isDead || player.isDead) return;

      const playerIsAbove = player.body.velocity.y > 0 && (player.y + player.height / 2) < (enemy.y - enemy.height * 0.15);
      const playerAttackHit = player.isAttacking && Phaser.Geom.Intersects.RectangleToRectangle(
        player.attackHitbox, enemy.getBounds()
      );

      if (playerAttackHit) {
        enemy.takeDamage(34);
        this.spawnHitPuff(enemy.x, enemy.y);
        return;
      }

      if (playerIsAbove && enemy.enemyType !== 'bird') {
        enemy.takeDamage(34);
        this.spawnHitPuff(enemy.x, enemy.y);
        player.setVelocityY(PLAYER.JUMP_VELOCITY * 0.6);
        return;
      }

      if (!player.isInvulnerable) {
        player.takeDamage(enemy.damage, player.facing);
        this.spawnHitPuff(player.x, player.y);
      }
    });
  }

  _setupCamera() {
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.08, 0.08);
    cam.setFollowOffset(-180, 40);
    cam.setDeadzone(80, 140);
    cam.fadeIn(300, 14, 38, 26);
  }

  onEnemyKilled(enemy) {
    this.scoreManager.addEnemyScore(enemy.scoreValue);
  }

  // --------------------------------------------------------- MOOD SYSTEM
  _handleMoodChanged({ mood }) {
    this._applyMoodProfile(mood);
    this.soundManager.playMoodChange();
    this.events.emit('mood-notification', {
      label: this.currentMoodProfile.label,
      emoji: this.currentMoodProfile.emoji,
      color: this.currentMoodProfile.color
    });
  }

  _applyMoodProfile(mood) {
    const profile = MOOD_PROFILES[mood] || MOOD_PROFILES.neutral;
    this.currentMood = mood;
    this.currentMoodProfile = profile;
    this.moodMultipliers.enemySpeed = profile.enemySpeedMult;
    this.moodMultipliers.enemySpawn = profile.enemySpawnMult;
    this.moodMultipliers.heroSpeed = profile.heroSpeedMult;
    this.scoreManager.setScoreMultiplier(profile.scoreMult);
    // Reset the shield-grant timer whenever mood changes so a fresh
    // "Sad" streak always takes a full interval before the first shield,
    // rather than instantly firing off leftover progress from before.
    this._sadShieldTimer = 0;
  }

  // Applies Sad-mode's gentle-assist effects: slow passive healing and a
  // periodic bonus shield. Called every frame; internally no-ops unless
  // the current mood profile actually specifies these values.
  _applyMoodAssist(delta) {
    const profile = this.currentMoodProfile;
    if (profile.healthRegenPerSec > 0 && !this.player.isDead) {
      this.player.healPassive(profile.healthRegenPerSec * (delta / 1000));
    }
    if (profile.shieldIntervalMs > 0 && !this.player.isDead) {
      this._sadShieldTimer += delta;
      if (this._sadShieldTimer >= profile.shieldIntervalMs) {
        this._sadShieldTimer = 0;
        this.player.addShield();
        this.events.emit('mood-notification', { label: 'Shield granted!', emoji: '🛡️', color: profile.color });
      }
    }
  }

  onPlayerDied() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.scoreManager.saveBestIfNeeded();
    this.soundManager.stopMusic();

    this.time.delayedCall(900, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        score: this.scoreManager.getScore(),
        distance: this.scoreManager.distance,
        best: this.scoreManager.best
      });
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;

    this.inputManager.update();

    // Speed ramps up with distance traveled, capped at MAX_SPEED, then
    // scaled by the current mood profile (Happy runs a little faster).
    this.scoreManager.updateDistanceFromX(this.player.x, PLAYER.START_X);
    const baseSpeed = Phaser.Math.Clamp(
      PLAYER.START_SPEED + this.scoreManager.distance * PLAYER.SPEED_PER_DISTANCE,
      PLAYER.START_SPEED,
      PLAYER.MAX_SPEED
    );
    this.currentSpeed = baseSpeed * this.moodMultipliers.heroSpeed;

    this.player.update(time, delta, this.inputManager.state, this.currentSpeed);
    this._applyMoodAssist(delta);

    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) enemy.update(time, delta, this.player.x, this.player.y);
    });

    this.coins.getChildren().forEach((coin) => {
      coin.y += Math.sin((time + coin.x) * 0.004) * 0.15;
    });

    this.levelManager.update();

    // Parallax scroll tied to camera position.
    const scrollX = this.cameras.main.scrollX;
    this.cloudsFar.tilePositionX = scrollX * 0.15;
    this.cloudsNear.tilePositionX = scrollX * 0.28;
    this.forestFar.tilePositionX = scrollX * 0.4;
    this.forestNear.tilePositionX = scrollX * 0.65;

    // Falling off the world = death.
    if (this.player.y > WORLD_DEATH_Y && !this.player.isDead) {
      this.player.health = 0;
      this.player.die();
    }

    this.events.emit('hud-update', {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      score: this.scoreManager.getScore(),
      distance: this.scoreManager.distance,
      speed: Math.round(this.currentSpeed),
      mood: this.currentMood,
      moodLabel: this.currentMoodProfile.label,
      moodEmoji: this.currentMoodProfile.emoji,
      moodColor: this.currentMoodProfile.color,
      shieldCount: this.player.shieldCount
    });
  }

  _shutdown() {
    if (this.inputManager) this.inputManager.destroy();
    if (this._onMoodChanged) MoodBus.off('mood-changed', this._onMoodChanged);
  }
}
