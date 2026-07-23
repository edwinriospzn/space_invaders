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
}