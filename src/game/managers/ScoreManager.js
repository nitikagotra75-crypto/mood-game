import { SCORE, STORAGE_KEY } from '../utils/Constants.js';

export default class ScoreManager {
  constructor() {
    this.distance = 0; // meters (derived from player x)
    this.coins = 0;
    this.enemyScore = 0;
    this.best = this._loadBest();
    // Set by GameScene from the current mood profile (1.0 = normal,
    // >1.0 = Happy bonus). Applied to points *earned from actions*
    // (coins, enemy kills) - distance itself is left unscaled since
    // it's a raw measure of progress, not a rewarded action.
    this.scoreMultiplier = 1;
  }

  setScoreMultiplier(multiplier) {
    this.scoreMultiplier = multiplier;
  }

  _loadBest() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  saveBestIfNeeded() {
    const total = this.getScore();
    if (total > this.best) {
      this.best = total;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(this.best));
      } catch (e) {
        // localStorage unavailable (private mode etc) - ignore silently
      }
    }
    return this.best;
  }

  updateDistanceFromX(playerX, startX) {
    this.distance = Math.max(0, Math.floor((playerX - startX) / SCORE.DISTANCE_DIVISOR));
  }

  addCoin(value) {
    this.coins += Math.round(value * this.scoreMultiplier);
  }

  addEnemyScore(value) {
    this.enemyScore += Math.round(value * this.scoreMultiplier);
  }

  getScore() {
    return this.distance + this.coins + this.enemyScore;
  }

  reset() {
    this.distance = 0;
    this.coins = 0;
    this.enemyScore = 0;
  }
}
