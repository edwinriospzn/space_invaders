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

        stage('docker compose up') {
            steps {
                dir('infrastructure/docker') {
                    sh 'docker compose up -d --build --wait --wait-timeout 300'
                }
            }
        }

        stage('Run Health Checks') {
            steps {
                dir('infrastructure/docker') {
                    sh 'curl --fail http://localhost:8000/health'
                    sh 'docker compose exec -T postgres pg_isready -U space_invaders'
                    sh 'curl --fail http://localhost:8080/api/v2/monitor/health'
                }
            }
        }

        stage('Run API Tests') {
            environment {
                DATABASE_URL = 'postgresql://space_invaders:space_invaders@localhost:5432/space_invaders'
            }
            steps {
                dir('backend/api') {
                    sh 'python3 -m alembic upgrade head'
                    sh 'python3 -m pytest'
                }
            }
        }

        stage('Shutdown') {
            steps {
                dir('infrastructure/docker') {
                    sh 'docker compose down -v'
                }
            }
        }
    }

    post {
        success {
            echo 'Success'
        }
        always {
            dir('infrastructure/docker') {
                sh 'docker compose down -v || true'
            }
        }
    }
}
