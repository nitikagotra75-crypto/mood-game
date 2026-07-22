import React, { useCallback, useRef } from 'react';
import InputBus from '../game/utils/InputBus.js';
import './TouchControls.css';

// Each directional button emits *-down on press and *-up on release so
// InputManager can treat them as level-triggered (held), exactly like a
// keyboard key. Jump/Attack are momentary, so they only emit *-down.
function useHoldButton(downEvent, upEvent) {
  const activeRef = useRef(false);

  const start = useCallback((e) => {
    e.preventDefault();
    if (activeRef.current) return;
    activeRef.current = true;
    InputBus.emit(downEvent);
  }, [downEvent]);

  const end = useCallback((e) => {
    e.preventDefault();
    if (!activeRef.current) return;
    activeRef.current = false;
    if (upEvent) InputBus.emit(upEvent);
  }, [upEvent]);

  return {
    onPointerDown: start,
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
    onContextMenu: (e) => e.preventDefault()
  };
}

function ControlButton({ label, className, handlers, children }) {
  return (
    <button className={`touch-btn ${className}`} {...handlers} aria-label={label}>
      {children}
    </button>
  );
}

export default function TouchControls() {
  const leftHandlers = useHoldButton('left-down', 'left-up');
  const rightHandlers = useHoldButton('right-down', 'right-up');
  const jumpHandlers = useHoldButton('jump-down', null);
  const attackHandlers = useHoldButton('attack-down', null);

  return (
    <div className="touch-controls" role="group" aria-label="Game controls">
      <div className="touch-controls-side left">
        <ControlButton label="Move left" className="btn-left" handlers={leftHandlers}>
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </ControlButton>
        <ControlButton label="Move right" className="btn-right" handlers={rightHandlers}>
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </ControlButton>
      </div>
      <div className="touch-controls-side right">
        <ControlButton label="Attack" className="btn-attack" handlers={attackHandlers}>
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 21l6-2 10-10-4-4-10 10-2 6z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /></svg>
        </ControlButton>
        <ControlButton label="Jump" className="btn-jump" handlers={jumpHandlers}>
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 4l7 8h-4v8h-6v-8H5l7-8z" fill="currentColor" /></svg>
        </ControlButton>
      </div>
    </div>
  );
}
