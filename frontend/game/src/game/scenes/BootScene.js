import Phaser from 'phaser'
import { Player } from '../objects/Player'
import { Enemy } from '../objects/Enemy'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')

    this.frameCount = 0
    this.enemyDirection = 1
    this.enemySpeed = 1
    this.enemyStepDown = 20
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
  moveEnemies() {
      let leftMost = Infinity
      let rightMost = -Infinity
      for (const enemy of this.enemies) {
          leftMost = Math.min(leftMost, enemy.sprite.x)
          rightMost = Math.max(rightMost, enemy.sprite.x)
      }
      if (rightMost >= 780 && this.enemyDirection === 1) {
          this.enemyDirection = -1
          for (const enemy of this.enemies) {
              enemy.sprite.y += this.enemyStepDown
          }
      }

      if (leftMost <= 20 && this.enemyDirection === -1) {
          this.enemyDirection = 1
          for (const enemy of this.enemies) {
              enemy.sprite.y += this.enemyStepDown
          }
      }
      for (const enemy of this.enemies) {
          enemy.sprite.x += this.enemySpeed * this.enemyDirection
      }
    }
  checkCollisions() {
      for (const bullet of this.player.bullets) {
        for (const enemy of this.enemies) {
          if (this.isColliding(bullet, enemy)) {
            console.log("Collision detected!")
          }
        }
      }
    }

  isColliding(bullet, enemy) {
      const bulletBounds = bullet.sprite.getBounds()
      const enemyBounds = enemy.sprite.getBounds()
      return Phaser.Geom.Intersects.RectangleToRectangle(
          bulletBounds,
          enemyBounds
      )
    }
  update() {
      this.frameCount++
      this.player.update()
      this.moveEnemies()
      this.checkCollisions()
      for (const enemy of this.enemies) {
          enemy.update()
      }
      if (this.frameCount % 120 === 0) {
          console.log(`Frame: ${this.frameCount}`)
      }
  }
}