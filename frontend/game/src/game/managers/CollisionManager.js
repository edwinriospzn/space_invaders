import Phaser from 'phaser'
import { GAME_CONFIG } from '../config/gameConstants'

export class CollisionManager {

    constructor(scene) {
        this.scene = scene
    }

    update() {
        this.checkCollisions()
    }

    checkCollisions() {
        for (const bullet of this.scene.player.bullets) {
            for (const enemy of this.scene.enemyFormation.getEnemies()) {
                if (!this.isColliding(bullet, enemy)) {
                    continue
                }
                bullet.destroy()
                enemy.destroy()
                this.scene.scoreManager.addPoints(GAME_CONFIG.ENEMY_POINTS)
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

}
