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
        this.sprite = this.scene.add.sprite(
            this.x,
            this.y,
            'player'
        )
        this.sprite.setScale(2)

        console.log('Player rendered')
    }

    shoot() {

        const bullet = new Bullet(
            this.scene,
            this.sprite.x,
            this.sprite.y - 20
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
        this.sprite.x = Math.max(
            this.sprite.x - this.speed,
            this.width / 2
            )
        }
    if (this.cursors.right.isDown) {
        this.sprite.x = Math.min(
            this.sprite.x + this.speed,
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
                bullet.sprite.destroy()
                return false
            }
            return true
        })
    }
}