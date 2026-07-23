import Phaser from 'phaser'
import { Player } from '../objects/Player'
import { Enemy } from '../objects/Enemy'
import { ScoreManager } from '../managers/ScoreManager'
import { TimerManager } from '../managers/TimerManager'
import { GAME_CONFIG } from '../config/gameConstants.js'
import { EnemyFormation } from '../objects/EnemyFormation'
import { GameStateManager } from '../managers/GameStateManager'
import { CollisionManager } from '../managers/CollisionManager'

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene')
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
        this.scoreManager = new ScoreManager(this)
        this.timerManager = new TimerManager(
            this,
            () => this.gameStateManager.gameOver()
        )
        this.enemyFormation = new EnemyFormation(this)
        this.collisionManager = new CollisionManager(this)
        this.gameStateManager = new GameStateManager(this)
    }

    checkCollisions() {
        for (const bullet of this.player.bullets) {
            for (const enemy of this.enemyFormation.getEnemies()) {
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



    update(time, delta) {

        this.gameStateManager.update()

        if (this.gameStateManager.isGameFinished()) {
            return
        }

        this.frameCount++

        this.player.update(delta)

        this.enemyFormation.update(delta)

        this.checkCollisions()

        this.enemyFormation.removeDestroyedEnemies()

        this.gameStateManager.checkVictory()

        if (this.frameCount % 120 === 0) {
            console.log(`Frame: ${this.frameCount}`)
        }
    }
}
