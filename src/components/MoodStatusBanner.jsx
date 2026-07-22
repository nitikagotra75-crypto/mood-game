import React, { useEffect, useState, useCallback } from 'react';
import MoodBus from '../game/utils/MoodBus.js';
import MoodDetector from '../game/managers/MoodDetector.js';
import GameInstanceRef from '../game/utils/GameInstance.js';
import './MoodStatusBanner.css';

const STEP_LABELS = {
  'check-api': 'Checking camera API availability',
  'check-context': 'Checking secure context (HTTPS/localhost)',
  'check-permission': 'Checking camera permission status',
  'request-camera': 'Requesting camera access',
  'attach-video': 'Attaching camera stream to video element',
  'wait-stream-start': 'Waiting for camera stream to start',
  'load-models': 'Loading face detection models',
  'start-loop': 'Starting detection loop'
};

export default function MoodStatusBanner() {
  const [state, setState] = useState({ visible: false, kind: 'info', text: '' });
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const onError = ({ step, name, message }) => {
      const stepLabel = STEP_LABELS[step] || step || 'unknown step';
      setState({
        visible: true,
        kind: 'error',
        text: `Mood detection failed at "${stepLabel}": ${message}${name ? ` (${name})` : ''}`
      });
    };
    const onReady = () => {
      setState({ visible: true, kind: 'success', text: '✅ Mood detection is live.' });
      // Auto-hide the success banner after a few seconds; errors stay
      // on screen until the person retries or dismisses them.
      setTimeout(() => setState((s) => (s.kind === 'success' ? { ...s, visible: false } : s)), 3500);
    };
    const onUnavailable = () => {
      // Deprecated alias - only acts if no richer 'mood-error' already fired.
      setState((s) => (s.kind === 'error' ? s : { visible: true, kind: 'error', text: 'Mood detection is unavailable.' }));
    };

    MoodBus.on('mood-error', onError);
    MoodBus.on('mood-ready', onReady);
    MoodBus.on('mood-unavailable', onUnavailable);
    return () => {
      MoodBus.off('mood-error', onError);
      MoodBus.off('mood-ready', onReady);
      MoodBus.off('mood-unavailable', onUnavailable);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    const game = GameInstanceRef.current;
    if (!game || retrying) return;

    setRetrying(true);
    setState({ visible: true, kind: 'info', text: '🎥 Retrying camera access...' });

    const previous = game.registry.get('moodDetector');
    if (previous) previous.destroy();

    const detector = new MoodDetector();
    game.registry.set('moodDetector', detector);
    await detector.init(); // MoodBus 'mood-ready' or 'mood-error' will update the banner
    setRetrying(false);
  }, [retrying]);

  const handleDismiss = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  if (!state.visible) return null;

  return (
    <div className={`mood-banner mood-banner-${state.kind}`} role="alert">
      <span className="mood-banner-text">{state.text}</span>
      <div className="mood-banner-actions">
        {state.kind === 'error' && (
          <button className="mood-banner-btn" onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Retrying…' : 'Retry camera'}
          </button>
        )}
        <button className="mood-banner-close" onClick={handleDismiss} aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}
