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

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -f infrastructure/docker/frontend/Dockerfile -t space-invaders-frontend:${BUILD_NUMBER} frontend/game'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -f infrastructure/docker/backend/Dockerfile -t space-invaders-api:${BUILD_NUMBER} backend/api'
            }
        }

        stage('Build Airflow Image') {
            steps {
                sh 'docker build -f infrastructure/docker/airflow/Dockerfile -t space-invaders-airflow:${BUILD_NUMBER} infrastructure/docker/airflow'
            }
        }
    }

    post {
        success {
            echo 'Success'
        }
    }
}
