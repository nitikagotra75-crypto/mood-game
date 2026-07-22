import Phaser from 'phaser';
import { DEPTHS, PLAYER } from '../utils/Constants.js';

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'spike') {
    super(scene, x, y, texture);
    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setDepth(DEPTHS.OBSTACLES);
    this.setSize(this.width - 8, this.height - 10);
    this.setOffset(4, 10);
    this.damage = PLAYER.FALL_DAMAGE_OBSTACLE;
  }
}
