export class Bullet {

    constructor(scene, x, y) {
        this.scene = scene

        this.speed = 8

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

    update() {

        this.sprite.y -= this.speed

    }

    isOffScreen() {

        return this.sprite.y < 0

    }

}