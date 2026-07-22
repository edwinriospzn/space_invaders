export class TimerManager {

    constructor(scene, onTimeUp) {
        this.scene = scene
        this.onTimeUp = onTimeUp
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
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0
            this.timerText.setText(
                "Time: 0"
            )
            this.timerEvent.remove()
            if (this.onTimeUp) {
                this.onTimeUp()
            }
        }
    }
    stop() {
        if (this.timerEvent) {
            this.timerEvent.remove()
        }
    }
}