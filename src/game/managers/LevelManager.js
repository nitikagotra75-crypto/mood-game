import { GROUND_Y, GAME_HEIGHT, CHUNK_WIDTH, CHUNK_CLEANUP_BEHIND } from '../utils/Constants.js';
import { randInt, randFloat, pick, chance, clamp } from '../utils/MathUtils.js';
import Coin from '../entities/Coin.js';
import Obstacle from '../entities/Obstacle.js';
import Walker from '../entities/enemies/Walker.js';
import Bird from '../entities/enemies/Bird.js';
import Crocodile from '../entities/enemies/Crocodile.js';
import Turtle from '../entities/enemies/Turtle.js';

const GROUND_THICKNESS = 140;
const PATTERNS = ['flat', 'gap', 'stairs', 'gauntlet', 'sky', 'water'];

export default class LevelManager {
  constructor(scene, groups) {
    this.scene = scene;
    this.groups = groups; // { grounds, platforms, coins, obstacles, enemies, decor }
    this.nextX = 0;
    this.lastPatternWasGap = false;

    // Guarantee a safe, flat starting runway before anything hazardous.
    this._addGround(0, 700);
    this._addDecor(0, 700);
    this.nextX = 700;
  }

  update() {
    const cam = this.scene.cameras.main;
    const generateUntil = cam.scrollX + cam.width * 2.2;
    while (this.nextX < generateUntil) {
      this._generateChunk();
    }
    this._cleanup(cam.scrollX - CHUNK_CLEANUP_BEHIND);
  }

  _generateChunk() {
    const width = CHUNK_WIDTH + randInt(-100, 150);
    const startX = this.nextX;

    let pattern = pick(PATTERNS);
    if (this.lastPatternWasGap && pattern === 'gap') pattern = 'flat';
    this.lastPatternWasGap = pattern === 'gap';

    switch (pattern) {
      case 'gap': this._buildGapChunk(startX, width); break;
      case 'stairs': this._buildStairsChunk(startX, width); break;
      case 'gauntlet': this._buildGauntletChunk(startX, width); break;
      case 'sky': this._buildSkyChunk(startX, width); break;
      case 'water': this._buildWaterChunk(startX, width); break;
      default: this._buildFlatChunk(startX, width); break;
    }

    this._addDecor(startX, width);
    this.nextX = startX + width;
  }

  // ---------------------------------------------------------- PATTERNS
  _enemySpawnMult() {
    const raw = (this.scene.moodMultipliers && this.scene.moodMultipliers.enemySpawn) || 1;
    return clamp(raw, 0.3, 2.0);
  }

  _buildFlatChunk(startX, width) {
    this._addGround(startX, width);
    if (chance(0.7)) this._addCoinRow(startX + width * 0.3, GROUND_Y - randInt(90, 160), randInt(4, 7));
    if (chance(0.35)) this._addObstacle(startX + width * 0.55);
    if (chance(0.5)) this._addPlatformWithCoins(startX + width * 0.4, GROUND_Y - randInt(110, 170));
    if (chance(Math.min(0.9, 0.45 * this._enemySpawnMult()))) {
      this._spawnGroundEnemy(startX + width * 0.65, startX + width * 0.35, startX + width * 0.85);
    }
  }

  _buildGapChunk(startX, width) {
    const gapWidth = randInt(120, 190);
    const groundWidth = (width - gapWidth) / 2;
    this._addGround(startX, groundWidth);
    this._addGround(startX + groundWidth + gapWidth, groundWidth);

    // floating platform bridging the gap
    const platY = GROUND_Y - randInt(70, 130);
    this._addPlatform(startX + groundWidth - 20, gapWidth + 40, platY);
    this._addCoinArc(startX + groundWidth + gapWidth / 2, platY - 70, gapWidth * 0.7);

    if (chance(0.4)) this._addObstacle(startX + groundWidth + gapWidth + 40);
  }

  _buildStairsChunk(startX, width) {
    this._addGround(startX, width);
    const steps = randInt(3, 5);
    let stepX = startX + 80;
    let stepY = GROUND_Y - 40;
    for (let i = 0; i < steps; i++) {
      this._addPlatform(stepX, 90, stepY);
      if (chance(0.6)) this._addCoin(stepX + 45, stepY - 34);
      stepX += 110;
      stepY -= 42;
    }
    if (chance(0.5)) this._spawnFlyingEnemy(startX + width * 0.7, stepY - 40);
  }

  _buildGauntletChunk(startX, width) {
    this._addGround(startX, width);
    const count = clamp(Math.round(randInt(2, 3) * this._enemySpawnMult()), 1, 5);
    for (let i = 0; i < count; i++) {
      const ex = startX + width * (0.25 + i * 0.18);
      this._spawnGroundEnemy(ex, startX + 60, startX + width - 60, true);
    }
    this._addCoinRow(startX + width * 0.15, GROUND_Y - 150, 3);
  }

  _buildSkyChunk(startX, width) {
    this._addGround(startX, width);
    const birdCount = clamp(Math.round(randInt(1, 3) * this._enemySpawnMult()), 0, 4);
    for (let i = 0; i < birdCount; i++) {
      this._spawnFlyingEnemy(startX + width * (0.2 + i * 0.2), GROUND_Y - randInt(150, 260));
    }
    this._addCoinArc(startX + width * 0.5, GROUND_Y - 220, width * 0.55);
    if (chance(0.5)) this._addPlatformWithCoins(startX + width * 0.75, GROUND_Y - 120);
  }

  _buildWaterChunk(startX, width) {
    this._addGround(startX, width, true);
    this._spawnCrocodile(startX + width * 0.5, startX + width * 0.2, startX + width * 0.8);
    if (chance(0.6)) this._addCoinRow(startX + width * 0.2, GROUND_Y - 120, 4);
    if (chance(0.3)) this._addPlatform(startX + width * 0.65, 130, GROUND_Y - 110);
  }

  // -------------------------------------------------------- BUILDERS
  _addGround(x, width, isWater = false) {
    const scene = this.scene;
    const cy = GROUND_Y + GROUND_THICKNESS / 2;
    const tile = scene.add.tileSprite(x + width / 2, cy, width, GROUND_THICKNESS, 'ground_tile');
    scene.physics.add.existing(tile, true);
    tile.body.updateFromGameObject();
    this.groups.grounds.add(tile);

    if (isWater) {
      const water = scene.add.tileSprite(x + width / 2, GROUND_Y - 4, width, 24, 'water_tile');
      water.setDepth(tile.depth + 1);
      this.groups.decor.add(water);
    }
  }

  _addPlatform(x, width, y) {
    const scene = this.scene;
    const tile = scene.add.tileSprite(x + width / 2, y, width, 32, 'stone_block');
    scene.physics.add.existing(tile, true);
    tile.body.updateFromGameObject();
    this.groups.platforms.add(tile);
    return tile;
  }

  _addPlatformWithCoins(x, y) {
    const width = randInt(100, 170);
    this._addPlatform(x, width, y);
    const coinCount = randInt(2, 4);
    for (let i = 0; i < coinCount; i++) {
      this._addCoin(x + (width / (coinCount + 1)) * (i + 1), y - 34);
    }
  }

  _addCoin(x, y) {
    const coin = new Coin(this.scene, x, y);
    this.groups.coins.add(coin);
  }

  _addCoinRow(x, y, count) {
    for (let i = 0; i < count; i++) {
      this._addCoin(x + i * 40, y);
    }
  }

  _addCoinArc(centerX, topY, spread) {
    const count = randInt(5, 8);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = centerX - spread / 2 + spread * t;
      const y = topY + Math.sin(t * Math.PI) * -50 + 50;
      this._addCoin(x, y);
    }
  }

  _addObstacle(x) {
    const obstacle = new Obstacle(this.scene, x, GROUND_Y - 10, 'spike');
    this.groups.obstacles.add(obstacle);
  }

  _spawnGroundEnemy(x, minX, maxX, preferTough = false) {
    const EnemyClass = preferTough ? pick([Walker, Turtle, Walker]) : pick([Walker, Turtle]);
    const enemy = new EnemyClass(this.scene, x, GROUND_Y - 30, minX, maxX);
    this.groups.enemies.add(enemy);
  }

  _spawnFlyingEnemy(x, y) {
    const enemy = new Bird(this.scene, x, y);
    this.groups.enemies.add(enemy);
  }

  _spawnCrocodile(x, minX, maxX) {
    const enemy = new Crocodile(this.scene, x, GROUND_Y - 20, minX, maxX);
    this.groups.enemies.add(enemy);
  }

  _addDecor(startX, width) {
    const scene = this.scene;
    const treeCount = randInt(0, 2);
    for (let i = 0; i < treeCount; i++) {
      const key = pick(['tree_0', 'tree_1', 'tree_2']);
      const x = startX + randFloat(0, width);
      const tex = scene.textures.get(key).getSourceImage();
      const img = scene.add.image(x, GROUND_Y - tex.height / 2 + 10, key);
      img.setDepth(4);
      this.groups.decor.add(img);
    }
    if (chance(0.6)) {
      const key = pick(['bush_0', 'bush_1']);
      const x = startX + randFloat(0, width);
      const tex = scene.textures.get(key).getSourceImage();
      const img = scene.add.image(x, GROUND_Y - tex.height / 2 + 6, key);
      img.setDepth(5);
      this.groups.decor.add(img);
    }
  }

  // ------------------------------------------------------------ CLEANUP
  _cleanup(minX) {
    const groupsToClean = [this.groups.grounds, this.groups.platforms, this.groups.coins, this.groups.obstacles, this.groups.decor];
    groupsToClean.forEach((group) => {
      group.getChildren().slice().forEach((child) => {
        const rightEdge = child.x + (child.displayWidth || 0) / 2;
        if (rightEdge < minX) {
          group.remove(child, true, true);
        }
      });
    });

    this.groups.enemies.getChildren().slice().forEach((enemy) => {
      if (enemy.x < minX) {
        this.groups.enemies.remove(enemy, true, true);
      }
    });
  }
}
