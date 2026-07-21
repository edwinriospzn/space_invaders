import Phaser from 'phaser'
import { Player } from '../objects/Player'
import { Enemy } from '../objects/Enemy'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')

    this.frameCount = 0
  }

preload() {

    console.log('BootScene: preload')

    this.load.image(
        'player',
        'sprites/player.png'
    )

    this.load.image(
        'enemy',
        'sprites/enemy.png'
    )

    }

  create() {
    console.log('BootScene: create')

    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )

    this.player = new Player(this)
    this.enemy = new Enemy(
    this,
    400,
    120
    )
  }

  update() {
    this.frameCount++
    
    this.player.update()
    this.enemy.update()
    if (this.frameCount % 120 === 0) {
      console.log(`Frame: ${this.frameCount}`)
    }
  }
}