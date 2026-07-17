import Phaser from 'phaser'
import { Player } from '../objects/Player'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')

    this.frameCount = 0
  }

  preload() {
    console.log('BootScene: preload')
  }

  create() {
    console.log('BootScene: create')

    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )

    this.player = new Player(this)
  }

  update() {
    this.frameCount++

    if (this.frameCount % 120 === 0) {
      console.log(`Frame: ${this.frameCount}`)
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      console.log('SPACE pressed')
    }
  }
}