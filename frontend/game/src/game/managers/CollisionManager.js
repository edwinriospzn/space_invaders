import Phaser from 'phaser'

export class CollisionManager {

    constructor(scene) {
        this.scene = scene
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
