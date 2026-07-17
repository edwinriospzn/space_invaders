import { Bullet } from './Bullet.js'

export class Player {

    constructor(scene) {
        this.bullets = []
        this.scene = scene

        this.x = 400
        this.y = 520

        this.width = 40
        this.height = 20
        this.speed = 5
        this.cursors = this.scene.input.keyboard.createCursorKeys()
        this.spaceKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        )
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

    shoot() {

        const bullet = new Bullet(
            this.scene,
            this.graphics.x,
            this.graphics.y - 20
        )

        this.bullets.push(bullet)

    }

    update() {

    this.handleMovement()

    this.handleShooting()

    this.updateBullets()

    }

    handleMovement() {

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
    handleShooting() {

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.shoot()
        }
    }
    updateBullets() {
        for (const bullet of this.bullets) {
            bullet.update()
        }
        this.bullets = this.bullets.filter(bullet => {
            if (bullet.isOffScreen()) {
                bullet.graphics.destroy()
                return false
            }
            return true
        })
    }
}