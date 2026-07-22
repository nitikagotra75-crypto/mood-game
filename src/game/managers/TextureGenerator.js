import Phaser from 'phaser';
import { COLORS } from '../utils/Constants.js';

// Every visual in the game is rasterized once, here, from vector shapes
// drawn with Phaser.GameObjects.Graphics, then baked into a texture with
// generateTexture(). This gives us a complete, original art set with no
// external image files, while still allowing real frame-by-frame sprite
// animation (each "frame" is simply its own baked texture key, and
// Phaser animations can reference frames across different texture keys).
export default class TextureGenerator {
  static generateAll(scene) {
    const g = scene.add.graphics();

    TextureGenerator._genSky(scene, g);
    TextureGenerator._genClouds(scene, g);
    TextureGenerator._genTrees(scene, g);
    TextureGenerator._genBushes(scene, g);
    TextureGenerator._genGround(scene, g);
    TextureGenerator._genStone(scene, g);
    TextureGenerator._genCoin(scene, g);
    TextureGenerator._genSpike(scene, g);
    TextureGenerator._genWater(scene, g);
    TextureGenerator._genForestSilhouettes(scene, g);

    TextureGenerator._genPlayerFrames(scene, g);
    TextureGenerator._genWalkerFrames(scene, g);
    TextureGenerator._genBirdFrames(scene, g);
    TextureGenerator._genCrocodileFrames(scene, g);
    TextureGenerator._genTurtleFrames(scene, g);

    TextureGenerator._genParticles(scene, g);

    g.destroy();
  }

  static _bake(scene, g, key, w, h) {
    g.generateTexture(key, w, h);
    g.clear();
  }

  // ---------------------------------------------------------------- SKY
  static _genSky(scene, g) {
    const w = 960, h = 540;
    for (let i = 0; i < h; i++) {
      const t = i / h;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(COLORS.SKY_TOP),
        Phaser.Display.Color.ValueToColor(COLORS.SKY_BOTTOM),
        h, i
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, i, w, 1);
    }
    TextureGenerator._bake(scene, g, 'sky', w, h);
  }

  // ------------------------------------------------------------- CLOUDS
  static _genClouds(scene, g) {
    [{ key: 'cloud_small', s: 0.6 }, { key: 'cloud_med', s: 0.9 }, { key: 'cloud_big', s: 1.3 }].forEach(({ key, s }) => {
      const w = Math.round(160 * s), h = Math.round(70 * s);
      g.fillStyle(COLORS.CLOUD, 0.85);
      g.fillEllipse(w * 0.3, h * 0.6, w * 0.5, h * 0.55);
      g.fillEllipse(w * 0.55, h * 0.45, w * 0.55, h * 0.6);
      g.fillEllipse(w * 0.75, h * 0.6, w * 0.4, h * 0.45);
      g.fillEllipse(w * 0.45, h * 0.65, w * 0.7, h * 0.4);
      TextureGenerator._bake(scene, g, key, w, h);
    });
  }

  // -------------------------------------------------------------- TREES
  static _genTrees(scene, g) {
    [{ key: 'tree_0', w: 90, h: 200 }, { key: 'tree_1', w: 110, h: 240 }, { key: 'tree_2', w: 75, h: 170 }].forEach(({ key, w, h }) => {
      const trunkW = w * 0.16;
      g.fillStyle(COLORS.TREE_TRUNK_DARK, 1);
      g.fillRect(w / 2 - trunkW / 2, h * 0.55, trunkW, h * 0.45);
      g.fillStyle(COLORS.TREE_TRUNK, 1);
      g.fillRect(w / 2 - trunkW / 2 + 2, h * 0.55, trunkW - 4, h * 0.45);

      g.fillStyle(COLORS.TREE_LEAF_DARK, 1);
      g.fillCircle(w * 0.5, h * 0.32, w * 0.5);
      g.fillCircle(w * 0.22, h * 0.5, w * 0.32);
      g.fillCircle(w * 0.78, h * 0.5, w * 0.32);

      g.fillStyle(COLORS.TREE_LEAF, 1);
      g.fillCircle(w * 0.5, h * 0.24, w * 0.44);
      g.fillCircle(w * 0.25, h * 0.42, w * 0.26);
      g.fillCircle(w * 0.75, h * 0.42, w * 0.26);

      g.fillStyle(COLORS.TREE_LEAF_LIGHT, 1);
      g.fillCircle(w * 0.4, h * 0.16, w * 0.22);

      TextureGenerator._bake(scene, g, key, w, h);
    });
  }

  // ------------------------------------------------------------- BUSHES
  static _genBushes(scene, g) {
    [{ key: 'bush_0', w: 70, h: 40 }, { key: 'bush_1', w: 95, h: 50 }].forEach(({ key, w, h }) => {
      g.fillStyle(COLORS.TREE_LEAF_DARK, 1);
      g.fillEllipse(w * 0.3, h * 0.65, w * 0.5, h * 0.6);
      g.fillEllipse(w * 0.7, h * 0.65, w * 0.5, h * 0.6);
      g.fillStyle(COLORS.BUSH, 1);
      g.fillEllipse(w * 0.5, h * 0.5, w * 0.65, h * 0.65);
      g.fillStyle(COLORS.BUSH_LIGHT, 1);
      g.fillEllipse(w * 0.42, h * 0.4, w * 0.3, h * 0.32);
      TextureGenerator._bake(scene, g, key, w, h);
    });
  }

  // ------------------------------------------------------------- GROUND
  static _genGround(scene, g) {
    const w = 64, h = 64;
    g.fillStyle(COLORS.GROUND_BODY_DARK, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(COLORS.GROUND_BODY, 1);
    g.fillRect(0, 10, w, h - 10);
    g.fillStyle(COLORS.GROUND_TOP, 1);
    g.fillRect(0, 0, w, 14);
    g.fillStyle(COLORS.GROUND_TOP_LIGHT, 1);
    g.fillRect(0, 0, w, 6);
    // little texture flecks
    g.fillStyle(COLORS.GROUND_BODY_DARK, 0.5);
    for (let i = 0; i < 6; i++) {
      g.fillRect((i * 11) % w, 18 + ((i * 17) % (h - 24)), 3, 3);
    }
    TextureGenerator._bake(scene, g, 'ground_tile', w, h);
  }

  // -------------------------------------------------------------- STONE
  static _genStone(scene, g) {
    const w = 64, h = 32;
    g.fillStyle(COLORS.STONE_DARK, 1);
    g.fillRoundedRect(0, 0, w, h, 4);
    g.fillStyle(COLORS.STONE, 1);
    g.fillRoundedRect(1, 1, w - 2, h - 4, 4);
    g.fillStyle(COLORS.STONE_LIGHT, 1);
    g.fillRect(3, 3, w - 6, 4);
    g.lineStyle(1, COLORS.STONE_DARK, 0.6);
    g.strokeRect(10, 8, 16, 8);
    g.strokeRect(34, 10, 18, 8);
    TextureGenerator._bake(scene, g, 'stone_block', w, h);
  }

  // --------------------------------------------------------------- COIN
  static _genCoin(scene, g) {
    [{ key: 'coin_0', rx: 12 }, { key: 'coin_1', rx: 7 }, { key: 'coin_2', rx: 2 }].forEach(({ key, rx }) => {
      const w = 26, h = 26;
      g.fillStyle(COLORS.COIN_DARK, 1);
      g.fillEllipse(w / 2, h / 2, rx + 2, 12);
      g.fillStyle(COLORS.COIN, 1);
      g.fillEllipse(w / 2, h / 2, rx, 10);
      g.fillStyle(0xfff3c4, 0.9);
      g.fillEllipse(w / 2 - rx * 0.2, h / 2 - 3, Math.max(1, rx * 0.35), 3);
      TextureGenerator._bake(scene, g, key, w, h);
    });
  }

  // -------------------------------------------------------------- SPIKE
  static _genSpike(scene, g) {
    const w = 48, h = 36;
    g.fillStyle(COLORS.SPIKE_DARK, 1);
    for (let i = 0; i < 3; i++) {
      const x = i * 16;
      g.fillTriangle(x, h, x + 8, h - 30, x + 16, h);
    }
    g.fillStyle(COLORS.SPIKE, 1);
    for (let i = 0; i < 3; i++) {
      const x = i * 16;
      g.fillTriangle(x + 2, h, x + 8, h - 24, x + 14, h);
    }
    TextureGenerator._bake(scene, g, 'spike', w, h);
  }

  // -------------------------------------------------------------- WATER
  static _genWater(scene, g) {
    const w = 64, h = 24;
    g.fillStyle(COLORS.WATER, 0.85);
    g.fillRect(0, 4, w, h - 4);
    g.fillStyle(COLORS.WATER_LIGHT, 0.7);
    g.fillEllipse(w * 0.25, 6, 20, 5);
    g.fillEllipse(w * 0.7, 10, 24, 5);
    TextureGenerator._bake(scene, g, 'water_tile', w, h);
  }

  // ---------------------------------------------- FOREST SILHOUETTES
  // Tileable strips used as scrolling TileSprite backgrounds so the
  // parallax layers repeat seamlessly forever.
  static _genForestSilhouettes(scene, g) {
    [
      { key: 'forest_far', w: 400, h: 220, color: COLORS.MIST, count: 7, minH: 90, maxH: 160 },
      { key: 'forest_near', w: 400, h: 260, color: COLORS.TREE_LEAF_DARK, count: 6, minH: 130, maxH: 220 }
    ].forEach(({ key, w, h, color, count, minH, maxH }) => {
      g.fillStyle(color, 1);
      for (let i = 0; i < count; i++) {
        const cx = (w / count) * i + (w / count) / 2;
        const treeH = minH + ((i * 37) % (maxH - minH));
        const treeW = treeH * 0.65;
        g.fillRect(cx - treeW * 0.08, h - treeH * 0.4, treeW * 0.16, treeH * 0.4);
        g.fillTriangle(cx - treeW / 2, h - treeH * 0.3, cx, h - treeH, cx + treeW / 2, h - treeH * 0.3);
        g.fillTriangle(cx - treeW * 0.4, h - treeH * 0.55, cx, h - treeH * 1.15 + treeH * 0.15, cx + treeW * 0.4, h - treeH * 0.55);
      }
      TextureGenerator._bake(scene, g, key, w, h);
    });
  }

  // ================================================================
  // PLAYER — hero with idle / run / jump / attack frame sets
  // ================================================================
  static _genPlayerFrames(scene, g) {
    const w = 48, h = 60;
    const draw = (legOffset, armAngle, crouch, attacking) => {
      g.clear();
      const bodyTop = 14 + crouch;
      const bodyBottom = 42 + crouch * 0.5;

      // back leg
      g.fillStyle(COLORS.PLAYER_TUNIC_DARK, 1);
      g.fillRoundedRect(20 - legOffset, bodyBottom, 8, 16 - crouch, 3);
      // front leg
      g.fillStyle(COLORS.PLAYER_BELT, 1);
      g.fillRoundedRect(20 + legOffset, bodyBottom, 8, 16 - crouch, 3);

      // tunic body
      g.fillStyle(COLORS.PLAYER_TUNIC, 1);
      g.fillRoundedRect(12, bodyTop, 24, bodyBottom - bodyTop + 6, 6);
      g.fillStyle(COLORS.PLAYER_TUNIC_DARK, 1);
      g.fillRect(12, bodyBottom - 4, 24, 4);
      // belt
      g.fillStyle(COLORS.PLAYER_BELT, 1);
      g.fillRect(12, bodyBottom - 2, 24, 3);

      // head
      g.fillStyle(COLORS.PLAYER_SKIN, 1);
      g.fillCircle(24, bodyTop - 6, 10);
      // hair
      g.fillStyle(COLORS.PLAYER_HAIR, 1);
      g.fillEllipse(24, bodyTop - 13, 20, 10);
      g.fillRect(14, bodyTop - 13, 20, 5);

      // back arm
      g.fillStyle(COLORS.PLAYER_TUNIC_DARK, 1);
      g.fillRoundedRect(11, bodyTop + 4, 6, 16, 3);

      // front arm (+ sword when attacking)
      const armPivotX = 34, armPivotY = bodyTop + 6;
      g.fillStyle(COLORS.PLAYER_SKIN, 1);
      const armLen = 16;
      const rad = Phaser.Math.DegToRad(armAngle);
      const armEndX = armPivotX + Math.cos(rad) * armLen;
      const armEndY = armPivotY + Math.sin(rad) * armLen;
      g.fillRoundedRect(armPivotX - 3, armPivotY - 3, 6, 6, 3);
      g.lineStyle(7, COLORS.PLAYER_SKIN, 1);
      g.beginPath();
      g.moveTo(armPivotX, armPivotY);
      g.lineTo(armEndX, armEndY);
      g.strokePath();

      if (attacking) {
        g.lineStyle(4, COLORS.PLAYER_SWORD, 1);
        g.beginPath();
        g.moveTo(armEndX, armEndY);
        g.lineTo(armEndX + Math.cos(rad) * 22, armEndY + Math.sin(rad) * 22);
        g.strokePath();
        g.fillStyle(COLORS.PLAYER_SWORD, 1);
        g.fillCircle(armEndX, armEndY, 3);
      }
    };

    // idle: gentle bob, 2 frames
    draw(0, 100, 0, false);
    TextureGenerator._bake(scene, g, 'player_idle_0', w, h);
    draw(0, 100, 2, false);
    TextureGenerator._bake(scene, g, 'player_idle_1', w, h);

    // run cycle: 4 frames, alternating leg offset
    draw(6, 60, 0, false);
    TextureGenerator._bake(scene, g, 'player_run_0', w, h);
    draw(0, 90, 0, false);
    TextureGenerator._bake(scene, g, 'player_run_1', w, h);
    draw(-6, 120, 0, false);
    TextureGenerator._bake(scene, g, 'player_run_2', w, h);
    draw(0, 90, 0, false);
    TextureGenerator._bake(scene, g, 'player_run_3', w, h);

    // jump: single frame, legs tucked
    draw(3, 40, -4, false);
    TextureGenerator._bake(scene, g, 'player_jump_0', w, h);
    // fall: legs extended
    draw(-2, 140, 0, false);
    TextureGenerator._bake(scene, g, 'player_fall_0', w, h);

    // attack: 2 frames, sword swing
    draw(2, -10, 0, true);
    TextureGenerator._bake(scene, g, 'player_attack_0', w, h);
    draw(2, 80, 0, true);
    TextureGenerator._bake(scene, g, 'player_attack_1', w, h);

    // hit / damage flash frame
    draw(0, 100, 0, false);
    TextureGenerator._bake(scene, g, 'player_hit_0', w, h);
  }

  // ================================================================
  // WALKER enemy — mushroom-like ground creature, 2-frame waddle
  // ================================================================
  static _genWalkerFrames(scene, g) {
    const w = 42, h = 40;
    const draw = (legOffset) => {
      g.clear();
      g.fillStyle(COLORS.WALKER_DARK, 1);
      g.fillRoundedRect(10 - legOffset, 30, 8, 8, 2);
      g.fillRoundedRect(24 + legOffset, 30, 8, 8, 2);
      g.fillStyle(COLORS.WALKER_BODY, 1);
      g.fillEllipse(21, 20, 30, 22);
      g.fillStyle(0x9c6cae, 1);
      g.fillEllipse(21, 14, 22, 12);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(15, 18, 4);
      g.fillCircle(27, 18, 4);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(15, 18, 2);
      g.fillCircle(27, 18, 2);
    };
    draw(4);
    TextureGenerator._bake(scene, g, 'walker_0', w, h);
    draw(-4);
    TextureGenerator._bake(scene, g, 'walker_1', w, h);
  }

  // ================================================================
  // BIRD enemy — flapping flyer, 2-frame wing cycle
  // ================================================================
  static _genBirdFrames(scene, g) {
    const w = 46, h = 36;
    const draw = (wingUp) => {
      g.clear();
      g.fillStyle(COLORS.BIRD_DARK, 1);
      g.fillEllipse(23, 20, 26, 16);
      g.fillStyle(COLORS.BIRD_BODY, 1);
      g.fillEllipse(23, 18, 24, 14);
      // wings
      g.fillStyle(COLORS.BIRD_DARK, 1);
      if (wingUp) {
        g.fillTriangle(14, 18, 2, 2, 20, 14);
        g.fillTriangle(32, 18, 44, 2, 26, 14);
      } else {
        g.fillTriangle(14, 18, 2, 30, 20, 20);
        g.fillTriangle(32, 18, 44, 30, 26, 20);
      }
      // head + beak
      g.fillStyle(COLORS.BIRD_BODY, 1);
      g.fillCircle(36, 14, 7);
      g.fillStyle(0xe0a83a, 1);
      g.fillTriangle(41, 14, 48, 16, 41, 19);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(38, 12, 1.6);
    };
    draw(true);
    TextureGenerator._bake(scene, g, 'bird_0', w, h);
    draw(false);
    TextureGenerator._bake(scene, g, 'bird_1', w, h);
  }

  // ================================================================
  // CROCODILE enemy — long low body, 2-frame leg cycle
  // ================================================================
  static _genCrocodileFrames(scene, g) {
    const w = 74, h = 34;
    const draw = (legOffset) => {
      g.clear();
      g.fillStyle(COLORS.CROC_DARK, 1);
      g.fillRoundedRect(14 - legOffset, 26, 8, 7, 2);
      g.fillRoundedRect(50 + legOffset, 26, 8, 7, 2);
      g.fillStyle(COLORS.CROC_BODY, 1);
      g.fillRoundedRect(6, 10, 56, 18, 8);
      g.fillTriangle(58, 12, 74, 17, 58, 26);
      g.fillStyle(COLORS.CROC_DARK, 1);
      for (let i = 0; i < 4; i++) {
        g.fillTriangle(14 + i * 10, 10, 19 + i * 10, 3, 24 + i * 10, 10);
      }
      g.fillStyle(0xffffff, 1);
      g.fillCircle(12, 14, 3);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(12, 14, 1.4);
    };
    draw(3);
    TextureGenerator._bake(scene, g, 'crocodile_0', w, h);
    draw(-3);
    TextureGenerator._bake(scene, g, 'crocodile_1', w, h);
  }

  // ================================================================
  // TURTLE enemy — shelled walker, 2-frame leg cycle
  // ================================================================
  static _genTurtleFrames(scene, g) {
    const w = 44, h = 36;
    const draw = (legOffset) => {
      g.clear();
      g.fillStyle(COLORS.TURTLE_BODY, 1);
      g.fillEllipse(12 - legOffset, 30, 8, 6);
      g.fillEllipse(32 + legOffset, 30, 8, 6);
      g.fillEllipse(38, 20, 8, 6);
      g.fillStyle(COLORS.TURTLE_SHELL_DARK, 1);
      g.fillEllipse(22, 18, 34, 22);
      g.fillStyle(COLORS.TURTLE_SHELL, 1);
      g.fillEllipse(22, 16, 30, 18);
      g.lineStyle(1.5, COLORS.TURTLE_SHELL_DARK, 0.8);
      g.strokeEllipse(22, 16, 30, 18);
      g.strokeEllipse(22, 16, 16, 10);
      g.fillStyle(COLORS.TURTLE_BODY, 1);
      g.fillCircle(6, 18, 6);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(4, 16, 1.4);
    };
    draw(3);
    TextureGenerator._bake(scene, g, 'turtle_0', w, h);
    draw(-3);
    TextureGenerator._bake(scene, g, 'turtle_1', w, h);
  }

  // ================================================================
  // PARTICLES — small shapes for coin sparkle / hit impact / footstep dust
  // ================================================================
  static _genParticles(scene, g) {
    g.fillStyle(0xffe38a, 1);
    g.fillCircle(4, 4, 4);
    TextureGenerator._bake(scene, g, 'particle_spark', 8, 8);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(5, 5, 5);
    TextureGenerator._bake(scene, g, 'particle_dust', 10, 10);

    g.fillStyle(0xff5a5a, 1);
    g.fillCircle(4, 4, 4);
    TextureGenerator._bake(scene, g, 'particle_hit', 8, 8);
  }
}
