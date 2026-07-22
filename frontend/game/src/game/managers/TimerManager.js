export class TimerManager {

    constructor(scene) {
        this.scene = scene
        this.timeRemaining = 10
        this.timerText = this.scene.add.text(
            620,
            20,
            `Time: ${this.timeRemaining}`,
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        )
        this.startTimer()

    }
    startTimer() {
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        })
    }
    updateTimer() {
        this.timeRemaining--
        this.timerText.setText(
            `Time: ${this.timeRemaining}`
        )
    }
}