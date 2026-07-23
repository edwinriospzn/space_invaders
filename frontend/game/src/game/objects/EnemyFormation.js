import { Enemy } from './Enemy'
import { GAME_CONFIG } from '../config/gameConstants'

export class EnemyFormation {

    constructor(scene) {

        this.scene = scene

        this.enemies = []

        this.enemyDirection = 1
        this.enemySpeed = GAME_CONFIG.FORMATION_SPEED
        this.enemyStepDown = GAME_CONFIG.FORMATION_STEP_DOWN
        this.createFormation()
    }
    createFormation() {

        const rows = GAME_CONFIG.FORMATION_ROWS
        const columns = GAME_CONFIG.FORMATION_COLUMNS

        const startX = GAME_CONFIG.FORMATION_START_X
        const startY = GAME_CONFIG.FORMATION_START_Y

        const spacingX = GAME_CONFIG.FORMATION_SPACING_X
        const spacingY = GAME_CONFIG.FORMATION_SPACING_Y

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {

                const x = startX + column * spacingX
                const y = startY + row * spacingY

                const enemy = new Enemy(this.scene, x, y)

                this.enemies.push(enemy)

            }
        }

    }
    getEnemies() { 
        return this.enemies 
    }
    removeDestroyedEnemies() {
        this.enemies = this.enemies.filter(
            enemy => !enemy.destroyed
        )
    }
    getAliveCount() {
        return this.enemies.length
    }
    move(delta) {
        let leftMost = Infinity
        let rightMost = -Infinity
        for (const enemy of this.enemies) {
            leftMost = Math.min(leftMost, enemy.sprite.x)
            rightMost = Math.max(rightMost, enemy.sprite.x)
        }
        if (rightMost >= GAME_CONFIG.SCREEN_WIDTH - 20 && this.enemyDirection === 1) {
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
        const distance = this.enemySpeed * (delta / 1000)
        for (const enemy of this.enemies) {
            enemy.sprite.x += distance * this.enemyDirection
        }
    }
    update(delta) {
        this.move(delta)
            for (const enemy of this.enemies) {
            enemy.update()
        }
    }

}