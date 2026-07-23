import { Bullet } from './Bullet.js'
import { GAME_CONFIG } from '../config/gameConstants.js'
import { GameEventFactory } from '../events/GameEventFactory'

export class Player {

    constructor(scene) {
        this.bullets = []
        this.scene = scene

        this.x = 400
        this.y = 520

        this.width = 40
        this.height = 20
        this.speed = GAME_CONFIG.PLAYER_SPEED
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

        this.scene.telemetryManager.track(
            GameEventFactory.createPlayerShot(
                this.scene.sessionId,
                {
                    x: this.sprite.x,
                    y: this.sprite.y - 20
                }
            )
        )

    }

    update(delta) {

        this.handleMovement(delta)

        this.handleShooting()

        this.updateBullets(delta)

    }

    handleMovement(delta) {

        const distance = this.speed * (delta / 1000)

        if (this.cursors.left.isDown) {
            this.sprite.x = Math.max(
                this.sprite.x - distance,
                this.width / 2
            )
            this.scene.telemetryManager.track(
                GameEventFactory.createPlayerMove(
                    this.scene.sessionId,
                    {
                        x: this.sprite.x,
                        y: this.sprite.y,
                        direction: 'left'
                    }
                )
            )
        }
        if (this.cursors.right.isDown) {
            this.sprite.x = Math.min(
                this.sprite.x + distance,
                GAME_CONFIG.SCREEN_WIDTH - this.width / 2
            )
            this.scene.telemetryManager.track(
                GameEventFactory.createPlayerMove(
                    this.scene.sessionId,
                    {
                        x: this.sprite.x,
                        y: this.sprite.y,
                        direction: 'right'
                    }
                )
            )
        }
    }

    handleShooting() {

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.shoot()
        }
    }

    updateBullets(delta) {
        for (const bullet of this.bullets) {
            bullet.update(delta)
        }
        this.bullets = this.bullets.filter(bullet => {
            if (bullet.destroyed) {
                return false
            }
            if (bullet.isOffScreen()) {
                bullet.destroy()
                return false
            }
            return true
        })
    }
}
