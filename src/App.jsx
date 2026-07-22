import React from 'react';
import GameContainer from './components/GameContainer.jsx';
import TouchControls from './components/TouchControls.jsx';
import MoodStatusBanner from './components/MoodStatusBanner.jsx';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <div className="game-stage">
        <GameContainer />
        <TouchControls />
        <MoodStatusBanner />
      </div>
    </div>
  );
}
