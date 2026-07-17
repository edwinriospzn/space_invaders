export class Player {

    constructor(scene) {

        this.scene = scene

        this.x = 400
        this.y = 520

        this.width = 40
        this.height = 20

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

}