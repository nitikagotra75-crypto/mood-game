import Phaser from 'phaser';

// A single EventEmitter instance shared between the React UI (touch buttons)
// and the Phaser game (InputManager). This decouples the DOM buttons from
// the canvas so either side can be swapped without touching the other.
//
// Events emitted:
//   'left-down' / 'left-up'
//   'right-down' / 'right-up'
//   'jump-down'
//   'attack-down'
//   'restart' (tapped from the game-over overlay button, if used)
class InputBusClass extends Phaser.Events.EventEmitter {}

const InputBus = new InputBusClass();
export default InputBus;
