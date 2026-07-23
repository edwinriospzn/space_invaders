import { GAME_CONFIG } from '../config/gameConstants'

export class Enemy {

    constructor(scene, x, y, type = 'BASIC') {

        this.scene = scene

        this.x = x
        this.y = y

        this.type = type
        this.config = GAME_CONFIG.ENEMY_TYPES[type]

        this.create()
    }

    create() {

        this.sprite = this.scene.add.sprite(
            this.x,
            this.y,
            this.config.texture
        )

        this.sprite.setScale(2)

        console.log('Enemy created')
    }

    destroy() {
        this.sprite.destroy()
        this.destroyed = true
    }


    update() {

    }

}