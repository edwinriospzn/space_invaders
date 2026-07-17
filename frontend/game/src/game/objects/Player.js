export class Player {

    constructor(scene) {

        this.scene = scene

        this.x = 400
        this.y = 520

        this.width = 40
        this.height = 20
        this.speed = 5
        this.cursors = this.scene.input.keyboard.createCursorKeys()   
        this.create()
    }

    create() {

        this.graphics = this.scene.add.rectangle(
            this.x,
            this.y,
            this.width,
            this.height,
            0x00ff00
        )

        console.log('Player rendered')
    }
    update() {
        if (this.cursors.left.isDown) {
            this.graphics.x = Math.max(
                this.graphics.x - this.speed,
                this.width / 2
            )
        }
        if (this.cursors.right.isDown) {
            this.graphics.x = Math.min(
                this.graphics.x + this.speed,
                800 - this.width / 2
            )
        }
    }

}