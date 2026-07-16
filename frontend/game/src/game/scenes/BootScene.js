import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    console.log('BootScene: preload')
  }

  create() {
    console.log('BootScene: create')
  }

  update() {
    // Game loop
  }
}