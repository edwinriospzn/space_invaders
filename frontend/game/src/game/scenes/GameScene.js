import Phaser from 'phaser'
import { Player } from '../objects/Player'
import { Enemy } from '../objects/Enemy'
import { ScoreManager } from '../managers/ScoreManager'
import { TimerManager } from '../managers/TimerManager'
import { EnemyFormation } from '../objects/EnemyFormation'
import { GameStateManager } from '../managers/GameStateManager'
import { CollisionManager } from '../managers/CollisionManager'
import { createSessionId } from '../utils/SessionManager'
import { TelemetryManager } from '../managers/TelemetryManager'
import { GameEventFactory } from '../events/GameEventFactory'
import { HttpTelemetryExporter } from '../telemetry/HttpTelemetryExporter'

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene')
        this.frameCount = 0
    }

    preload() {
        console.log('BootScene: preload')
        this.load.image(
            'player',
            'sprites/player.png'
        )
        this.load.image(
            'enemy',
            'sprites/enemy.png'
        )
    }

    create() {
        console.log('BootScene: create')

        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        )
        this.player = new Player(this)
        this.scoreManager = new ScoreManager(this)
        this.timerManager = new TimerManager(
            this,
            () => this.gameStateManager.gameOver()
        )
        this.enemyFormation = new EnemyFormation(this)
        this.collisionManager = new CollisionManager(this)
        this.gameStateManager = new GameStateManager(this)

        this.sessionId = createSessionId()
        this.telemetryManager = new TelemetryManager(this.sessionId)
        this.gameStartTime = Date.now()
        this.telemetryReported = false

        this.telemetryManager.track(
            GameEventFactory.createGameStart(this.sessionId)
        )
    }



    update(time, delta) {

        this.gameStateManager.update()

        if (this.gameStateManager.isGameFinished()) {
            if (!this.telemetryReported) {
                this.telemetryReported = true

                this.telemetryManager.track(
                    GameEventFactory.createGameEnd(
                        this.sessionId,
                        {
                            score: this.scoreManager.getScore(),
                            elapsedTime: Date.now() - this.gameStartTime,
                            result: this.enemyFormation.getAliveCount() === 0 ? 'WIN' : 'LOSE'
                        }
                    )
                )

                const exporter = new HttpTelemetryExporter()
                exporter.export(this.telemetryManager.getEvents())
            }
            return
        }

        this.frameCount++

        this.player.update(delta)

        this.enemyFormation.update(delta)

        this.collisionManager.update()

        this.enemyFormation.removeDestroyedEnemies()

        this.gameStateManager.checkVictory()

        if (this.frameCount % 120 === 0) {
            console.log(`Frame: ${this.frameCount}`)
        }
    }
}
