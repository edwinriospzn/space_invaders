export class Bullet {

    constructor(scene, x, y) {
        this.scene = scene

        this.speed = 8

        this.graphics = this.scene.add.rectangle(
            x,
            y,
            4,
            12,
            0xffff00
        )
    }

    update() {

        this.graphics.y -= this.speed

    }

    isOffScreen() {

        return this.graphics.y < 0

    }

}