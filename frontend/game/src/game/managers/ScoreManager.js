export class ScoreManager {

    constructor(scene) {

        this.scene = scene

        this.score = 0

        this.scoreText = this.scene.add.text(
            20,
            20,
            'Score: 0',
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        )

    }

    addPoints(points) {

        this.score += points

        this.scoreText.setText(
            `Score: ${this.score}`
        )

    }

    getScore() {

        return this.score

    }

}