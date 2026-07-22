import Phaser from 'phaser';

// Shared EventEmitter that broadcasts mood-detection state to whoever
// cares (GameScene for gameplay multipliers, UIScene for the HUD badge
// and toast notification). Kept separate from InputBus so mood-detection
// concerns never mix with movement/attack input concerns.
//
// Events emitted:
//   'mood-changed'      -> ({ mood, previousMood })            fires only when the
//                           SMOOTHED mood actually changes (not every sample)
//   'mood-sample'       -> ({ raw, smoothed })                 fires every detection tick
//   'mood-ready'        -> ()                                  fires once camera+models are fully live
//   'mood-error'        -> ({ step, name, message })            fires if init() fails at any
//                           step - always shown on screen, never silently swallowed
//   'mood-unavailable'  -> ()                                  deprecated alias, kept for
//                           any external listener still using it
class MoodBusClass extends Phaser.Events.EventEmitter {}

const MoodBus = new MoodBusClass();
export default MoodBus;
