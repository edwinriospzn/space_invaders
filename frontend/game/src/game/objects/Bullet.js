import { GAME_CONFIG } from '../config/gameConstants.js'

export class Bullet {

    constructor(scene, x, y) {
        this.scene = scene

        this.speed = GAME_CONFIG.BULLET_SPEED

        this.sprite = this.scene.add.rectangle(
            x,
            y,
            4,
            12,
            0xffff00
        )
    }

    destroy() {
        this.sprite.destroy()
        this.destroyed = true
    }

    update(delta) {

        this.sprite.y -= this.speed * (delta / 1000)

    }

    isOffScreen() {

        return this.sprite.y < 0

    }

}