import React, { useEffect, useRef } from 'react';
import { createGame } from '../game/main.js';
import GameInstanceRef from '../game/utils/GameInstance.js';

export default function GameContainer() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = createGame(containerRef.current);
    GameInstanceRef.current = gameRef.current;

    return () => {
      if (gameRef.current) {
        // MoodDetector owns a live camera MediaStream + setInterval loop
        // that live outside Phaser's own lifecycle (it's stored in the
        // registry, not a scene). Phaser.Game.destroy() does NOT know to
        // stop it, so we explicitly tear it down first to make sure the
        // webcam light actually turns off when the app unmounts.
        const moodDetector = gameRef.current.registry.get('moodDetector');
        if (moodDetector) moodDetector.destroy();

        gameRef.current.destroy(true);
        gameRef.current = null;
        GameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  );
}
