import { Enemy } from './Enemy'
import { GAME_CONFIG } from '../config/gameConstants'

export class EnemyFormation {

    constructor(scene) {

        this.scene = scene

        this.enemies = []

        this.enemyDirection = 1
        this.enemySpeed = GAME_CONFIG.FORMATION_SPEED
        this.enemyStepDown = 20
        this.createFormation()
    }
    createFormation() {

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

                const enemy = new Enemy(this.scene, x, y)

                this.enemies.push(enemy)

            }
        }

    }
}