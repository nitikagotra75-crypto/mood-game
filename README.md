# Emerald Run — Endless Forest Platformer

A complete endless 2D platformer built with **React + Vite + Phaser 3** (Arcade Physics).
All art is procedurally drawn with Phaser Graphics at boot time and all audio is
synthesized live with the Web Audio API — there are **zero external binary assets**,
so the project runs from source with nothing extra to download.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`). For a production build:

```bash
npm run build
npm run preview
```

## Controls

- **Desktop:** `A`/`D` or `←`/`→` to move, `SPACE` or `W` to jump (double-jump supported), `F` to attack
- **Mobile / touch:** on-screen Left, Right, Jump, Attack buttons (bottom corners)

## Gameplay

- The hero **auto-scrolls forward**; speed increases gradually with distance traveled (capped).
- Left/Right nudge your lateral position on top of the auto-scroll — you can slow down relative to the
  world or push ahead of it.
- Jump onto enemies from above, or press Attack to swing your sword.
- Collect coins, avoid spikes, and watch your health bar — it's game over at 0 HP or if you fall into a pit.
- The level is **infinite**: platforms, gaps, stairs, enemy gauntlets, sky sections with birds, and
  water/crocodile sections are procedurally chosen and stitched together forever, with objects behind the
  camera cleaned up for performance.

## Real-time AI Mood Detection

The game watches the player's webcam (after asking permission) and adapts difficulty live based on
their facial mood — **Happy**, **Neutral**, or **Sad**:

| Mood | Enemies | Hero speed | Score | Player assist |
|---|---|---|---|---|
| 🙂 Happy | +25% speed, +35% spawn rate | +8% | +20% | — |
| 😐 Neutral | default | default | default | — |
| 😢 Sad | −25% speed, −35% spawn rate | default | default | slow health regen + a shield every 20s |

- **Detection:** `face-api.js` (TinyFaceDetector + expression net), sampled every 1.5s off the render
  path so it never competes with the 60 FPS game loop.
- **Smoothing:** the last 8 raw samples are majority-voted before gameplay actually changes, so one
  noisy webcam frame can't flip difficulty back and forth.
- **Fail-safe:** no webcam, permission denied, or no face in frame → always falls back to Neutral.
- **Where it lives:** `src/game/managers/MoodDetector.js` (detection) and `src/game/utils/MoodBus.js`
  (event bus) are fully decoupled from gameplay — `GameScene` just reads `this.moodMultipliers` each
  frame and `Player`/enemies/`LevelManager` apply it, none of them know mood detection exists.
- **On screen:** a small mood badge sits in the bottom-left corner at all times, and a toast pops up
  top-center whenever the smoothed mood changes (or a Sad-mode shield is granted).
- Camera permission is requested when you click **START RUN** (a real user gesture, as required by
  browsers) but never blocks the game from starting — detection just comes online whenever it's ready.

## Project structure

```
src/
  App.jsx / App.css              Root layout, composes the game canvas + touch overlay
  main.jsx                       React entry point
  components/
    GameContainer.jsx            Mounts/destroys the Phaser.Game instance
    TouchControls.jsx / .css     Mobile on-screen Left/Right/Jump/Attack buttons
  game/
    main.js                      Phaser game config/factory (Arcade physics, scale manager)
    utils/
      Constants.js                Every tunable value (speeds, physics, colors, depths, mood profiles)
      MathUtils.js                Small random/clamp/lerp helpers
      InputBus.js                 Shared EventEmitter bridging React buttons -> Phaser input
      MoodBus.js                  Shared EventEmitter bridging MoodDetector -> Phaser scenes
    managers/
      InputManager.js             Merges keyboard + touch input into one state object
      SoundManager.js             Synthesizes all SFX + looping music via Web Audio API
      ScoreManager.js             Score, distance, coin totals, mood score multiplier, best-score persistence
      MoodDetector.js             Webcam capture + face-api.js emotion detection, smoothed over time
      TextureGenerator.js         Procedurally draws every sprite/tile/background texture
      LevelManager.js             Endless chunk-based procedural level generation + cleanup
    entities/
      Player.js                   Movement, jumping, attacking, health, animation state machine
      Coin.js / Obstacle.js       Collectibles and hazards
      enemies/
        BaseEnemy.js               Shared health/damage/death logic
        Walker.js / Bird.js / Crocodile.js / Turtle.js   Enemy-specific AI
    scenes/
      BootScene.js                Minimal bootstrap
      PreloadScene.js             Generates textures, registers animations
      MenuScene.js                Title screen
      GameScene.js                Core gameplay loop
      UIScene.js                  HUD overlay (health/score/distance/speed)
      GameOverScene.js            Game over screen + restart
```

## Notes on implementation choices

- **No placeholder assets:** every sprite (hero idle/run/jump/attack frames, walker, bird, crocodile,
  turtle, coins, trees, bushes, stone blocks, spikes, clouds, forest silhouettes) is generated at runtime
  from vector shapes and baked into textures, then animated with real Phaser `anims` frame sequences.
- **Sound:** `SoundManager` synthesizes jump/attack/hit/coin/enemy-death/game-over SFX and a looping
  ambient melody with oscillators — no `.mp3`/`.wav` files needed, and it unlocks correctly on first
  user interaction (browser autoplay policy compliant).
- **Endless generation:** `LevelManager` generates ahead of the camera in chunks (~900px) using several
  patterns (flat ground, gaps + bridging platforms, staircases, enemy gauntlets, sky/bird sections, and
  water/crocodile sections), and despawns anything sufficiently far behind the camera.
