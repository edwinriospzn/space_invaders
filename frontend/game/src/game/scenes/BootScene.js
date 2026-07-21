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
    this.enemies = []
    const rows = 3
    const columns = 5

    const startX = 180
    const startY = 100

    const spacingX = 100
    const spacingY = 70

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const x = startX + column * spacingX
            const y = startY + row * spacingY
            const enemy = new Enemy(this, x, y)
            this.enemies.push(enemy)
        }
    }
  }

  update() {
      this.frameCount++
      this.player.update()
      for (const enemy of this.enemies) {
          enemy.update()
      }
      if (this.frameCount % 120 === 0) {
          console.log(`Frame: ${this.frameCount}`)
      }
  }
}