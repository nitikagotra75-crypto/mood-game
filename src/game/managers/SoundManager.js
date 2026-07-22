// All audio in this game is synthesized at runtime with the Web Audio API.
// This avoids shipping/loading external binary asset files while still
// providing full SFX + looping background music support.
export default class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = null;
    this.muted = false;
    this._unlocked = false;
  }

  // Must be called after a user gesture (browser autoplay policy).
  unlock() {
    if (this._unlocked) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.masterGain);

    this._unlocked = true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.8;
    }
  }

  _tone(freq, duration, { type = 'sine', gain = 0.3, destination, sweepTo, delay = 0 } = {}) {
    if (!this.ctx) return;
    const dest = destination || this.sfxGain;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), now + duration);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  _noiseBurst(duration, { gain = 0.2, delay = 0 } = {}) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    src.connect(g);
    g.connect(this.sfxGain);
    src.start(now);
  }

  playJump() {
    this._tone(420, 0.18, { type: 'square', gain: 0.22, sweepTo: 760 });
  }

  playDoubleJump() {
    this._tone(520, 0.16, { type: 'square', gain: 0.2, sweepTo: 900 });
  }

  playCoin() {
    this._tone(880, 0.09, { type: 'triangle', gain: 0.25, sweepTo: 1400 });
    this._tone(1320, 0.12, { type: 'triangle', gain: 0.18, delay: 0.05 });
  }

  playAttack() {
    this._tone(220, 0.08, { type: 'sawtooth', gain: 0.2, sweepTo: 120 });
    this._noiseBurst(0.08, { gain: 0.12 });
  }

  playHit() {
    this._tone(160, 0.22, { type: 'sawtooth', gain: 0.28, sweepTo: 60 });
    this._noiseBurst(0.15, { gain: 0.18 });
  }

  playEnemyDeath() {
    this._tone(300, 0.2, { type: 'square', gain: 0.22, sweepTo: 80 });
  }

  playShieldGain() {
    this._tone(660, 0.14, { type: 'sine', gain: 0.24, sweepTo: 1100 });
    this._tone(990, 0.18, { type: 'sine', gain: 0.16, delay: 0.06 });
  }

  playShieldBreak() {
    this._tone(500, 0.12, { type: 'triangle', gain: 0.22, sweepTo: 220 });
    this._noiseBurst(0.1, { gain: 0.1 });
  }

  playMoodChange() {
    this._tone(700, 0.1, { type: 'sine', gain: 0.15, sweepTo: 900 });
  }

  playGameOver() {
    if (!this.ctx) return;
    [440, 370, 300, 220].forEach((f, i) => {
      this._tone(f, 0.35, { type: 'sawtooth', gain: 0.22, delay: i * 0.18 });
    });
  }

  playStart() {
    [440, 660, 880].forEach((f, i) => {
      this._tone(f, 0.15, { type: 'triangle', gain: 0.2, delay: i * 0.09 });
    });
  }

  // Simple looping ambient forest melody built from a small note pattern,
  // scheduled continually via setInterval while music is enabled.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const pattern = [
      196.0, 220.0, 246.94, 220.0,
      196.0, 174.61, 196.0, 220.0,
      261.63, 246.94, 220.0, 196.0,
      174.61, 196.0, 220.0, 246.94
    ];
    let step = 0;
    const stepDuration = 420; // ms
    const playStep = () => {
      if (!this.ctx) return;
      const freq = pattern[step % pattern.length];
      this._tone(freq, 0.38, { type: 'sine', gain: 0.12, destination: this.musicGain });
      this._tone(freq / 2, 0.5, { type: 'sine', gain: 0.06, destination: this.musicGain });
      step++;
    };
    playStep();
    this.musicTimer = setInterval(playStep, stepDuration);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
