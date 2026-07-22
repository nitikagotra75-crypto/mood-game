import * as faceapi from 'face-api.js';
import MoodBus from '../utils/MoodBus.js';
import { MOOD } from '../utils/Constants.js';

// Detects the player's real-time facial mood from their webcam and
// buckets it into exactly three states: 'happy' | 'neutral' | 'sad'.
//
// This class runs its startup as an explicit, ordered checklist. Each
// step is isolated in its own try/catch and labeled, so when something
// fails we know EXACTLY which step failed and why - the raw
// DOMException/name/message is logged to the console and also emitted
// on MoodBus as 'mood-error' so the UI can show it. Nothing is ever
// swallowed into a silent "just use Neutral" - gameplay still needs a
// defined multiplier state while detection is broken (that's what
// currentMood='neutral' means: all multipliers = 1, i.e. a no-op), but
// the failure itself is always visible on screen until it's fixed.
//
// Startup order matters and is intentional:
//   1. Confirm the camera API exists at all
//   2. Confirm we're in a secure context (https/localhost) and not an
//      iframe that blocks camera permission
//   3. (best-effort) Check the Permissions API for a quick read on
//      whether camera access is already denied
//   4. Request the camera stream - and ONLY the camera stream, with the
//      simplest possible constraints ({ video: true }) so a constraint
//      mismatch (OverconstrainedError) can't masquerade as "no camera"
//   5. Attach the stream to a <video> element with autoplay/playsInline/
//      muted set as BOTH properties and attributes (Safari/iOS needs
//      the attribute form), and wait until the stream is verifiably
//      producing frames (readyState + a real 'playing' event), not just
//      until play() resolves
//   6. Only once the camera is confirmed live do we load the face-api
//      models - so a slow/broken CDN can never look like a camera bug
export default class MoodDetector {
  constructor() {
    this.video = null;
    this.stream = null;
    this.modelsLoaded = false;
    this.isRunning = false;
    this.intervalId = null;
    this.history = [];
    this.currentMood = 'neutral';
    this.lastError = null;
    this.failedStep = null;
    this._busy = false;
  }

  // Must be called from a user-gesture context (e.g. a button click) so
  // the browser's getUserMedia permission prompt is allowed to appear.
  async init() {
    if (this.isRunning) return true;
    this.lastError = null;
    this.failedStep = null;

    try {
      this._step('check-api');
      this._checkMediaDevicesSupport();

      this._step('check-context');
      this._checkSecureContext();

      this._step('check-permission');
      await this._checkPermissionState(); // best-effort, never throws

      this._step('request-camera');
      await this._requestCameraStream();

      this._step('attach-video');
      this._attachVideoElement();

      this._step('wait-stream-start');
      await this._waitForStreamToStart();

      this._step('load-models');
      await this._loadModels();

      this._step('start-loop');
      this._startLoop();

      this.isRunning = true;
      this.failedStep = null;
      MoodBus.emit('mood-ready');
      return true;
    } catch (err) {
      this.lastError = err;
      // Full structured diagnostic in the console - exact step, exact
      // DOMException name, exact message, full stack.
      // eslint-disable-next-line no-console
      console.error(
        `[MoodDetector] FAILED at step "${this.failedStep}":`,
        `\n  name: ${err?.name}`,
        `\n  message: ${err?.message}`,
        err
      );
      this.currentMood = 'neutral';
      MoodBus.emit('mood-error', {
        step: this.failedStep,
        name: err?.name || 'Error',
        message: err?.message || String(err)
      });
      return false;
    }
  }

  _step(name) {
    this.failedStep = name;
  }

  // --- STEP 1: does the browser even expose the camera API? -----------
  _checkMediaDevicesSupport() {
    if (!navigator.mediaDevices) {
      throw new Error('navigator.mediaDevices is undefined. This browser build has no media API, or the page is not in a context that exposes it.');
    }
    if (typeof navigator.mediaDevices.getUserMedia !== 'function') {
      throw new Error('navigator.mediaDevices.getUserMedia is not a function. Update your browser (Chrome, Edge, or Firefox all support it).');
    }
  }

  // --- STEP 2: secure context + not blocked by an embedding iframe ----
  _checkSecureContext() {
    if (window.isSecureContext === false) {
      const origin = window.location.origin;
      throw new Error(`Camera requires a secure context (https:// or http://localhost). Current origin "${origin}" is not secure - serve the app over HTTPS or via "npm run dev" (localhost).`);
    }
    if (window.self !== window.top) {
      throw new Error('This page is running inside an embedded iframe that does not grant camera permission (common in sandboxed previews). Open the app directly in its own browser tab.');
    }
  }

  // --- STEP 3: best-effort read of current permission state -----------
  // Never throws - this is purely informational logging so we can see,
  // BEFORE even calling getUserMedia, whether the browser has already
  // recorded a "denied" decision for this origin.
  async _checkPermissionState() {
    try {
      if (!navigator.permissions || !navigator.permissions.query) return;
      const status = await navigator.permissions.query({ name: 'camera' });
      // eslint-disable-next-line no-console
      console.info(`[MoodDetector] camera permission state: ${status.state}`);
      if (status.state === 'denied') {
        throw new Error('Camera permission was previously denied for this site. Click the camera/lock icon in the address bar, allow access, then reload.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Camera permission was previously denied')) {
        throw err; // real denial - propagate as a real failure
      }
      // Permissions API not supported for 'camera' in this browser
      // (e.g. Safari) - that's fine, just skip the pre-check.
    }
  }

  // --- STEP 4: request the actual camera stream ------------------------
  async _requestCameraStream() {
    try {
      // Simplest possible constraint on purpose: { video: true }. Overly
      // specific width/height/facingMode constraints can throw
      // OverconstrainedError on webcams that don't support them, which
      // looks identical to "no camera" from the outside. Grab any camera
      // first; the video element will just display it at native size.
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (err) {
      const friendly = {
        NotAllowedError: 'Camera permission was denied. Click the camera icon in the address bar, allow access, then reload.',
        PermissionDeniedError: 'Camera permission was denied. Click the camera icon in the address bar, allow access, then reload.',
        NotFoundError: 'No camera device was found on this machine.',
        DevicesNotFoundError: 'No camera device was found on this machine.',
        NotReadableError: 'The camera is already in use by another application or browser tab. Close it and try again.',
        TrackStartError: 'The camera is already in use by another application or browser tab. Close it and try again.',
        OverconstrainedError: 'No camera matched the requested constraints.',
        AbortError: 'Camera access was aborted before it could start.',
        SecurityError: 'Camera blocked by the browser\'s security policy.',
        TypeError: 'getUserMedia was called with invalid constraints (internal bug).'
      };
      const message = friendly[err.name] || err.message || 'Camera access failed for an unknown reason.';
      const wrapped = new Error(message);
      wrapped.name = err.name;
      throw wrapped;
    }
    if (!this.stream || this.stream.getVideoTracks().length === 0) {
      throw new Error('getUserMedia resolved but returned no video track.');
    }
  }

  // --- STEP 5a: attach the stream to a real <video> element ------------
  _attachVideoElement() {
    const video = document.createElement('video');

    // Set BOTH the JS property and the HTML attribute for each of these.
    // iOS Safari in particular only reliably respects the *attribute*
    // form of playsinline/muted, while some engines only check the
    // property - setting both covers every case.
    video.autoplay = true;
    video.setAttribute('autoplay', '');
    video.muted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;
    video.setAttribute('playsinline', '');

    video.id = 'mood-camera-preview';
    video.width = 240;
    video.height = 180;

    // Real, VISIBLE, mirrored thumbnail (like a selfie camera) so the
    // player can see for themselves that the feed is genuinely live.
    Object.assign(video.style, {
      position: 'fixed', left: '18px', bottom: '96px',
      width: '96px', height: '72px', borderRadius: '10px',
      border: '2px solid rgba(79,138,82,0.85)', objectFit: 'cover',
      transform: 'scaleX(-1)', zIndex: '35',
      boxShadow: '0 2px 10px rgba(0,0,0,0.45)', background: '#14261a'
    });

    document.body.appendChild(video);
    video.srcObject = this.stream;
    this.video = video;

    if (this.video.srcObject !== this.stream) {
      throw new Error('Failed to attach the camera MediaStream to the <video> element (srcObject mismatch after assignment).');
    }
  }

  // --- STEP 5b: wait until frames are ACTUALLY flowing ------------------
  // play() resolving only means playback was not blocked - it does not
  // guarantee a decoded frame exists yet. We wait for both the
  // 'loadedmetadata' event AND readyState reaching HAVE_CURRENT_DATA (2)
  // via the 'playing' event before declaring the camera "ready", so
  // face-api never gets handed an empty/black frame on its first tick.
  async _waitForStreamToStart() {
    const video = this.video;

    await new Promise((resolve, reject) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Camera stream did not start within 10 seconds (loadedmetadata never fired).'));
      }, 10000);

      const onLoadedMetadata = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('The <video> element fired an error event while loading the camera stream.'));
      };
      const cleanup = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
    });

    try {
      await video.play();
    } catch (err) {
      throw new Error(`video.play() was rejected: ${err.message}`);
    }

    // Confirm real decoded frame data is available, not just that
    // playback started. Give it a short grace window since the
    // 'playing' event can fire a frame or two after play() resolves.
    await new Promise((resolve, reject) => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        resolve();
        return;
      }
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Camera opened but never produced a decoded video frame (readyState never reached HAVE_CURRENT_DATA).'));
      }, 4000);
      const onPlaying = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('playing', onPlaying);
      };
      video.addEventListener('playing', onPlaying);
    });
  }

  // --- STEP 6: only now load the ML models -----------------------------
  async _loadModels() {
    if (this.modelsLoaded) return;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MOOD.MODEL_URI),
        faceapi.nets.faceExpressionNet.loadFromUri(MOOD.MODEL_URI)
      ]);
    } catch (err) {
      throw new Error(`Face detection models failed to load from ${MOOD.MODEL_URI}: ${err.message || err}`);
    }
    this.modelsLoaded = true;
  }

  _startLoop() {
    this._tick();
    this.intervalId = setInterval(() => this._tick(), MOOD.DETECT_INTERVAL_MS);
  }

  async _tick() {
    if (this._busy || !this.video) return;
    this._busy = true;

    try {
      const detection = await faceapi
        .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceExpressions();

      const rawMood = detection ? this._bucketExpression(detection.expressions) : 'neutral';
      this._pushSample(rawMood);

      const smoothed = this._smoothedMood();
      MoodBus.emit('mood-sample', { raw: rawMood, smoothed });

      if (smoothed !== this.currentMood) {
        const previousMood = this.currentMood;
        this.currentMood = smoothed;
        MoodBus.emit('mood-changed', { mood: smoothed, previousMood });
      }
    } catch (err) {
      // A single failed inference tick (e.g. a dropped frame) should not
      // tear down the whole detector - log it and continue.
      // eslint-disable-next-line no-console
      console.warn('[MoodDetector] detection tick failed, skipping:', err?.message || err);
      this._pushSample('neutral');
    } finally {
      this._busy = false;
    }
  }

  _bucketExpression(expressions) {
    const { happy = 0, sad = 0, neutral = 0 } = expressions;
    if (happy >= sad && happy >= neutral) return 'happy';
    if (sad >= happy && sad >= neutral) return 'sad';
    return 'neutral';
  }

  _pushSample(mood) {
    this.history.push(mood);
    if (this.history.length > MOOD.HISTORY_SIZE) this.history.shift();
  }

  _smoothedMood() {
    if (this.history.length === 0) return 'neutral';
    const counts = { happy: 0, neutral: 0, sad: 0 };
    this.history.forEach((m) => { counts[m] = (counts[m] || 0) + 1; });
    let winner = 'neutral';
    let best = -1;
    Object.keys(counts).forEach((key) => {
      if (counts[key] > best) { best = counts[key]; winner = key; }
    });
    return winner;
  }

  getCurrentMood() {
    return this.currentMood;
  }

  // Human-readable summary for on-screen error display.
  getDiagnostics() {
    return {
      isRunning: this.isRunning,
      failedStep: this.failedStep,
      errorName: this.lastError?.name || null,
      errorMessage: this.lastError?.message || null
    };
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.remove();
      this.video = null;
    }
    this.isRunning = false;
  }
}
