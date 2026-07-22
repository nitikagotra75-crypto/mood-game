import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEPTHS, MOOD } from '../utils/Constants.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    this.healthBarWidth = 200;

    const panelY = 18;
    this.add.rectangle(18, panelY, this.healthBarWidth + 20, 34, COLORS.UI_PANEL, 0.55)
      .setOrigin(0, 0).setDepth(DEPTHS.UI).setScrollFactor(0);

    this.add.text(24, panelY + 4, 'HEALTH', {
      fontFamily: 'Trebuchet MS', fontSize: '11px', color: '#bcd9bc'
    }).setDepth(DEPTHS.UI).setScrollFactor(0);

    this.healthBarBg = this.add.rectangle(24, panelY + 18, this.healthBarWidth, 12, COLORS.HEALTH_BG)
      .setOrigin(0, 0).setDepth(DEPTHS.UI).setScrollFactor(0).setStrokeStyle(1, 0x000000, 0.4);
    this.healthBarFill = this.add.rectangle(25, panelY + 19, this.healthBarWidth - 2, 10, COLORS.HEALTH_FILL)
      .setOrigin(0, 0).setDepth(DEPTHS.UI).setScrollFactor(0);

    this.scoreText = this.add.text(GAME_WIDTH - 18, 18, 'Score: 0', {
      fontFamily: 'Trebuchet MS', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(DEPTHS.UI).setScrollFactor(0).setShadow(1, 2, '#0e1b12', 3, true, true);

    this.distanceText = this.add.text(GAME_WIDTH - 18, 46, 'Distance: 0m', {
      fontFamily: 'Trebuchet MS', fontSize: '15px', color: '#cdeccd'
    }).setOrigin(1, 0).setDepth(DEPTHS.UI).setScrollFactor(0);

    this.speedText = this.add.text(GAME_WIDTH - 18, 68, 'Speed: 0', {
      fontFamily: 'Trebuchet MS', fontSize: '13px', color: '#9fd39f'
    }).setOrigin(1, 0).setDepth(DEPTHS.UI).setScrollFactor(0);

    this.shieldText = this.add.text(GAME_WIDTH - 18, 88, '', {
      fontFamily: 'Trebuchet MS', fontSize: '13px', color: '#7ab3ff'
    }).setOrigin(1, 0).setDepth(DEPTHS.UI).setScrollFactor(0);

    // --- Mood badge: small, always-visible indicator in a corner of the
    // screen showing the currently detected/smoothed mood.
    const badgeX = 18, badgeY = GAME_HEIGHT - 54;
    this.moodBadgeBg = this.add.rectangle(badgeX, badgeY, 150, 40, COLORS.UI_PANEL, 0.6)
      .setOrigin(0, 0).setDepth(DEPTHS.UI).setScrollFactor(0).setStrokeStyle(2, COLORS.HEALTH_FILL, 0.8);
    this.moodEmojiText = this.add.text(badgeX + 10, badgeY + 8, '😐', {
      fontFamily: 'Trebuchet MS', fontSize: '22px'
    }).setDepth(DEPTHS.UI).setScrollFactor(0);
    this.moodLabelText = this.add.text(badgeX + 46, badgeY + 6, 'Mood:', {
      fontFamily: 'Trebuchet MS', fontSize: '10px', color: '#9fd39f'
    }).setDepth(DEPTHS.UI).setScrollFactor(0);
    this.moodValueText = this.add.text(badgeX + 46, badgeY + 18, 'Neutral', {
      fontFamily: 'Trebuchet MS', fontSize: '15px', color: '#eafbea', fontStyle: 'bold'
    }).setDepth(DEPTHS.UI).setScrollFactor(0);

    // --- Toast notification: pops up centered near the top whenever the
    // mood (or a mood-triggered bonus like a shield) changes, then fades.
    this.moodToast = this.add.text(GAME_WIDTH / 2, 100, '', {
      fontFamily: 'Trebuchet MS', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#14261a', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1).setScrollFactor(0).setAlpha(0);
    this._toastTween = null;

    this._onHudUpdate = (payload) => this._refresh(payload);
    this._onMoodNotification = (payload) => this._showMoodToast(payload);
    this.gameScene.events.on('hud-update', this._onHudUpdate);
    this.gameScene.events.on('mood-notification', this._onMoodNotification);

    this.events.once('shutdown', () => {
      this.gameScene.events.off('hud-update', this._onHudUpdate);
      this.gameScene.events.off('mood-notification', this._onMoodNotification);
    });
  }

  _refresh({ health, maxHealth, score, distance, speed, mood, moodLabel, moodEmoji, moodColor, shieldCount }) {
    const ratio = Phaser.Math.Clamp(health / maxHealth, 0, 1);
    this.healthBarFill.width = (this.healthBarWidth - 2) * ratio;
    this.healthBarFill.fillColor = ratio > 0.3 ? COLORS.HEALTH_FILL : COLORS.HEALTH_LOW;

    this.scoreText.setText(`Score: ${score}`);
    this.distanceText.setText(`Distance: ${distance}m`);
    this.speedText.setText(`Speed: ${speed}`);
    this.shieldText.setText(shieldCount > 0 ? `🛡️ Shield x${shieldCount}` : '');

    if (moodLabel) {
      this.moodEmojiText.setText(moodEmoji || '😐');
      this.moodValueText.setText(moodLabel);
      this.moodBadgeBg.setStrokeStyle(2, moodColor || COLORS.HEALTH_FILL, 0.9);
    }
  }

  _showMoodToast({ label, emoji, color }) {
    this.moodToast.setText(`${emoji || ''}  Mood: ${label}`.trim());
    this.moodToast.setColor('#ffffff');
    this.moodToast.setBackgroundColor(Phaser.Display.Color.ValueToColor(color || COLORS.HEALTH_FILL).rgba);

    if (this._toastTween) this._toastTween.stop();
    this.moodToast.setAlpha(1);
    this.moodToast.y = 100;

    this._toastTween = this.tweens.add({
      targets: this.moodToast,
      y: 80,
      alpha: 0,
      delay: MOOD.NOTIFICATION_MS - 400,
      duration: 400,
      ease: 'Sine.easeIn'
    });
  }
}
