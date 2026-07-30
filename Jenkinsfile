pipeline {
    agent any

    environment {
        DATABASE_URL = 'postgresql://space_invaders:space_invaders@postgres:5432/space_invaders'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('backend/api') {
                    sh 'pip install --no-cache-dir --break-system-packages -r requirements.txt -r requirements-dev.txt'
                }
            }
        }

        stage('pytest') {
            steps {
                dir('backend/api') {
                    sh 'python3 -m alembic upgrade head'
                    sh 'python3 -m pytest'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend/game') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }
    }

    post {
        success {
            echo 'Success'
        }
    }
}
