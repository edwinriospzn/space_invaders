export class GameStateManager {

    constructor(scene) {
        this.scene = scene
        this.gameFinished = false
        this.endGameText = null
    }
    isGameFinished() {
        return this.gameFinished
    }
    setGameFinished(value) {
        this.gameFinished = value
    }
    showEndGameMessage(message) {
        this.endGameText = this.scene.add.text(
            400,
            300,
            `${message}\n\nPress R to Restart`,
            {
                fontSize: '36px',
                color: '#ffffff',
                align: 'center'
            }
        )
        this.endGameText.setOrigin(0.5)
    }
    showMessage(message) {
        this.showEndGameMessage(message)
    }
    gameOver() {
        if (this.isGameFinished()) {
            return
        }
        this.setGameFinished(true)
        this.scene.timerManager.stop()
        this.showMessage("GAME OVER")
        console.log("GAME OVER!")
    }
    checkVictory() {
        if (this.isGameFinished()) {
            return
        }
        if (this.scene.enemyFormation.getAliveCount() === 0) {
            this.setGameFinished(true)
            this.scene.timerManager.stop()
            this.showMessage("YOU WIN!")
            console.log("YOU WIN!")
        }
    }
}