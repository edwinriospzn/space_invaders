export class Enemy {

    constructor(scene, x, y) {

        this.scene = scene

        this.x = x
        this.y = y

        this.create()
    }

    create() {

        this.sprite = this.scene.add.sprite(
            this.x,
            this.y,
            'enemy'
        )

        this.sprite.setScale(2)

        console.log('Enemy created')
    }

    update() {

    }

}