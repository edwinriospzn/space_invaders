import Phaser from 'phaser'
import { Player } from '../objects/Player'
import { Enemy } from '../objects/Enemy'
import { ScoreManager } from '../managers/ScoreManager'
import { TimerManager } from '../managers/TimerManager'
import { GAME_CONFIG } from '../config/gameConstants.js'
import { EnemyFormation } from '../objects/EnemyFormation'

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene')

        this.frameCount = 0
        this.enemyDirection = 1
        this.enemySpeed = GAME_CONFIG.FORMATION_SPEED
        this.enemyStepDown = 20
        this.gameFinished = false
        this.endGameText = null
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
        this.gameFinished = false
        this.endGameText = null

        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        )
        this.restartKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.R
        )
        this.player = new Player(this)
        this.scoreManager = new ScoreManager(this)
        this.timerManager = new TimerManager(
            this,
            () => this.gameOver()
        )
        this.enemyFormation = new EnemyFormation(this)
    }

    moveEnemies(delta) {
        let leftMost = Infinity
        let rightMost = -Infinity
        for (const enemy of this.enemyFormation.enemies) {
            leftMost = Math.min(leftMost, enemy.sprite.x)
            rightMost = Math.max(rightMost, enemy.sprite.x)
        }
        if (rightMost >= GAME_CONFIG.SCREEN_WIDTH - 20 && this.enemyDirection === 1) {
            this.enemyDirection = -1
            for (const enemy of this.enemyFormation.enemies) {
                enemy.sprite.y += this.enemyStepDown
            }
        }

        if (leftMost <= 20 && this.enemyDirection === -1) {
            this.enemyDirection = 1
            for (const enemy of this.enemyFormation.enemies) {
                enemy.sprite.y += this.enemyStepDown
            }
        }
        const distance = this.enemySpeed * (delta / 1000)
        for (const enemy of this.enemyFormation.enemies) {
            enemy.sprite.x += distance * this.enemyDirection
        }
    }

    checkCollisions() {
        for (const bullet of this.player.bullets) {
            for (const enemy of this.enemyFormation.enemies) {
                if (!this.isColliding(bullet, enemy)) {
                    continue
                }
                bullet.destroy()
                enemy.destroy()
                this.scoreManager.addPoints(GAME_CONFIG.ENEMY_POINTS)
                return
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

    checkVictory() {
        if (this.gameFinished) {
            return
        }
        if (this.enemyFormation.enemies.length === 0) {
            this.gameFinished = true
            this.timerManager.stop()
            this.showEndGameMessage("YOU WIN!")
            console.log("YOU WIN!")
        }
    }
    gameOver() {
        if (this.gameFinished) {
            return
        }
        this.gameFinished = true
        this.timerManager.stop()
        this.showEndGameMessage("GAME OVER")
        console.log("GAME OVER!")
    }
    showEndGameMessage(message) {
        this.endGameText = this.add.text(
            400,
            300,
            `${message}\n\nPress R to Restart`,
            {
                fontSize: '36px',
                color: '#ffffff',
                align: 'center'
            }
        )
        this.endGameText.setOrigin(0.5)
    }
    update(time, delta) {
        if (this.gameFinished) {
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.scene.restart()
            }
            return
        }
        this.frameCount++
        this.player.update(delta)
        this.moveEnemies(delta)
        this.checkCollisions()
        this.enemyFormation.enemies = this.enemyFormation.enemies.filter(enemy => !enemy.destroyed)
        this.checkVictory()
        for (const enemy of this.enemyFormation.enemies) {
            enemy.update()
        }
        if (this.frameCount % 120 === 0) {
            console.log(`Frame: ${this.frameCount}`)
        }
    }
}
