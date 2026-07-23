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
}