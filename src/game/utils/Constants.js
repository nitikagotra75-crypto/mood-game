export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const GROUND_Y = 430; // baseline y for the ground surface
export const WORLD_DEATH_Y = GAME_HEIGHT + 200; // falling past this = game over

export const GRAVITY_Y = 1400;

export const PLAYER = {
  START_X: 160,
  START_Y: GROUND_Y - 80,
  WIDTH: 44,
  HEIGHT: 58,
  START_SPEED: 220,
  MAX_SPEED: 560,
  SPEED_PER_DISTANCE: 0.045, // speed gained per meter traveled
  JUMP_VELOCITY: -620,
  DOUBLE_JUMP_VELOCITY: -520,
  MAX_JUMPS: 2,
  DRAG_X: 900,
  MAX_HEALTH: 100,
  HIT_DAMAGE: 20,
  FALL_DAMAGE_OBSTACLE: 25,
  INVULNERABLE_MS: 1200,
  ATTACK_DURATION_MS: 320,
  ATTACK_COOLDOWN_MS: 380,
  ATTACK_RANGE_W: 46,
  ATTACK_RANGE_H: 50,
  KNOCKBACK_X: -220,
  KNOCKBACK_Y: -260,
  LATERAL_SPEED: 260 // manual left/right nudge speed relative to auto-scroll
};

export const ENEMY = {
  WALKER: { width: 40, height: 40, speed: 60, health: 30, damage: 15, scoreValue: 50 },
  BIRD: { width: 38, height: 30, speed: 140, amplitude: 55, frequency: 0.0028, health: 20, damage: 15, scoreValue: 60 },
  CROCODILE: { width: 64, height: 32, speed: 40, health: 50, damage: 25, scoreValue: 80 },
  TURTLE: { width: 40, height: 32, speed: 30, health: 60, damage: 10, scoreValue: 70 }
};

export const CHUNK_WIDTH = 900;
export const CHUNK_LOOKAHEAD = 2; // how many chunks ahead of camera to keep generated
export const CHUNK_CLEANUP_BEHIND = 1400; // px behind camera to despawn objects

export const COIN = { RADIUS: 12, VALUE: 10 };

export const SCORE = {
  DISTANCE_DIVISOR: 10 // 1 point per 10px traveled
};

export const DEPTHS = {
  SKY: 0,
  CLOUDS_FAR: 1,
  CLOUDS_NEAR: 2,
  TREES_FAR: 3,
  TREES_NEAR: 4,
  BUSHES: 5,
  GROUND: 6,
  PLATFORMS: 6,
  OBSTACLES: 7,
  COINS: 7,
  ENEMIES: 8,
  PLAYER: 9,
  UI: 20
};

export const COLORS = {
  SKY_TOP: 0xbfe3c8,
  SKY_BOTTOM: 0xe9f5ea,
  CLOUD: 0xf4faf3,
  MIST: 0xd7ead9,
  TREE_TRUNK: 0x5b3a24,
  TREE_TRUNK_DARK: 0x452a19,
  TREE_LEAF_DARK: 0x2f5d3a,
  TREE_LEAF: 0x3f7d4a,
  TREE_LEAF_LIGHT: 0x5aa363,
  BUSH: 0x3f7d4a,
  BUSH_LIGHT: 0x5aa363,
  GROUND_TOP: 0x4f8a52,
  GROUND_TOP_LIGHT: 0x63a668,
  GROUND_BODY: 0x6b4423,
  GROUND_BODY_DARK: 0x53341b,
  STONE: 0x8a8f8a,
  STONE_DARK: 0x686d68,
  STONE_LIGHT: 0xa6aba6,
  COIN: 0xffd54a,
  COIN_DARK: 0xc79a1e,
  SPIKE: 0x6d6d6d,
  SPIKE_DARK: 0x3f3f3f,
  WATER: 0x3f8f95,
  WATER_LIGHT: 0x63b3ba,
  PLAYER_SKIN: 0xe8b98a,
  PLAYER_HAIR: 0x3a2317,
  PLAYER_TUNIC: 0x2f6b3f,
  PLAYER_TUNIC_DARK: 0x214d2c,
  PLAYER_BELT: 0x6b4423,
  PLAYER_SWORD: 0xd6d9dc,
  WALKER_BODY: 0x7a4b8a,
  WALKER_DARK: 0x552f61,
  BIRD_BODY: 0x8a3f3f,
  BIRD_DARK: 0x5e2929,
  CROC_BODY: 0x4a7d3f,
  CROC_DARK: 0x30521f,
  TURTLE_SHELL: 0x5b7a3f,
  TURTLE_SHELL_DARK: 0x3d5429,
  TURTLE_BODY: 0x8fae5a,
  HEALTH_BG: 0x2b2b2b,
  HEALTH_FILL: 0x4caf50,
  HEALTH_LOW: 0xd0453a,
  UI_PANEL: 0x14261a
};

export const STORAGE_KEY = 'emerald-run-best-score';

// ------------------------------------------------------- MOOD DETECTION
export const MOOD = {
  DETECT_INTERVAL_MS: 1500,   // how often we sample the webcam (1-2s window)
  HISTORY_SIZE: 8,            // smoothing window: last N raw samples, majority vote
  MODEL_URI: 'https://justadudewhohacks.github.io/face-api.js/models',
  NOTIFICATION_MS: 2200
};

// Gameplay multipliers applied live based on the smoothed mood.
// Neutral is always the neutral/default (1.0) baseline.
export const MOOD_PROFILES = {
  happy: {
    enemySpeedMult: 1.25,
    enemySpawnMult: 1.35,
    heroSpeedMult: 1.08,
    scoreMult: 1.2,
    healthRegenPerSec: 0,
    shieldIntervalMs: 0,
    label: 'Happy',
    emoji: '🙂',
    color: 0xffd54a
  },
  neutral: {
    enemySpeedMult: 1.0,
    enemySpawnMult: 1.0,
    heroSpeedMult: 1.0,
    scoreMult: 1.0,
    healthRegenPerSec: 0,
    shieldIntervalMs: 0,
    label: 'Neutral',
    emoji: '😐',
    color: 0x9fd39f
  },
  sad: {
    enemySpeedMult: 0.75,
    enemySpawnMult: 0.65,
    heroSpeedMult: 1.0,
    scoreMult: 1.0,
    healthRegenPerSec: 1.5,
    shieldIntervalMs: 20000,
    label: 'Sad',
    emoji: '😢',
    color: 0x7ab3ff
  }
};
