import Phaser from 'phaser';
import InputBus from '../utils/InputBus.js';

// Merges keyboard input (desktop) and the InputBus events fired by the
// React <TouchControls/> component (mobile) into one simple state object
// that Player.js reads every frame.
//
//   state.left / state.right  -> level-triggered (true while held)
//   state.jumpPressed         -> edge-triggered, cleared every frame
//   state.attackPressed       -> edge-triggered, cleared every frame
export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    this.state = {
      left: false,
      right: false,
      jumpPressed: false,
      attackPressed: false
    };

    this._touchLeft = false;
    this._touchRight = false;
    this._pendingJump = false;
    this._pendingAttack = false;

    this._setupKeyboard();
    this._setupTouchBus();
  }

  _setupKeyboard() {
    const keyboard = this.scene.input.keyboard;
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      jumpW: Phaser.Input.Keyboard.KeyCodes.W,
      attack: Phaser.Input.Keyboard.KeyCodes.F
    });

    this.keys.jump.on('down', () => { this._pendingJump = true; });
    this.keys.jumpW.on('down', () => { this._pendingJump = true; });
    this.cursors.up.on('down', () => { this._pendingJump = true; });
    this.keys.attack.on('down', () => { this._pendingAttack = true; });
  }

  _setupTouchBus() {
    this._onLeftDown = () => { this._touchLeft = true; };
    this._onLeftUp = () => { this._touchLeft = false; };
    this._onRightDown = () => { this._touchRight = true; };
    this._onRightUp = () => { this._touchRight = false; };
    this._onJumpDown = () => { this._pendingJump = true; };
    this._onAttackDown = () => { this._pendingAttack = true; };

    InputBus.on('left-down', this._onLeftDown);
    InputBus.on('left-up', this._onLeftUp);
    InputBus.on('right-down', this._onRightDown);
    InputBus.on('right-up', this._onRightUp);
    InputBus.on('jump-down', this._onJumpDown);
    InputBus.on('attack-down', this._onAttackDown);
  }

  // Call once per frame at the START of GameScene.update(), before Player
  // reads the state.
  update() {
    this.state.left = this.cursors.left.isDown || this.keys.left.isDown || this._touchLeft;
    this.state.right = this.cursors.right.isDown || this.keys.right.isDown || this._touchRight;
    this.state.jumpPressed = this._pendingJump;
    this.state.attackPressed = this._pendingAttack;

    // Clear edge triggers immediately after copying them into state;
    // Player.update() runs synchronously right after this and will see
    // the true value exactly once.
    this._pendingJump = false;
    this._pendingAttack = false;
  }

  destroy() {
    InputBus.off('left-down', this._onLeftDown);
    InputBus.off('left-up', this._onLeftUp);
    InputBus.off('right-down', this._onRightDown);
    InputBus.off('right-up', this._onRightUp);
    InputBus.off('jump-down', this._onJumpDown);
    InputBus.off('attack-down', this._onAttackDown);
  }
}
