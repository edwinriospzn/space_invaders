pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        DATABASE_URL = 'postgresql://space_invaders:space_invaders@postgres:5432/space_invaders'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                retry(3) {
                    dir('backend/api') {
                        sh 'pip install --no-cache-dir --break-system-packages -r requirements.txt -r requirements-dev.txt'
                    }
                }
            }
        }

        stage('Backend Tests') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                dir('backend/api') {
                    sh 'python3 -m alembic upgrade head'
                    sh 'python3 -m pytest --junitxml=test-reports/backend-tests.xml --cov=app --cov-report=xml:coverage-reports/backend-coverage.xml --cov-report=html:coverage-reports/backend-html'
                }
            }
            post {
                always {
                    junit 'backend/api/test-reports/backend-tests.xml'
                    archiveArtifacts artifacts: 'backend/api/coverage-reports/**', allowEmptyArchive: true
                }
            }
        }

        stage('Frontend Build') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                retry(3) {
                    dir('frontend/game') {
                        sh 'npm ci'
                    }
                }
                dir('frontend/game') {
                    sh 'npm run build'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'frontend/game/dist/**', allowEmptyArchive: true
                }
            }
        }

        stage('Build Frontend Image') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                retry(3) {
                    sh 'docker build -f infrastructure/docker/frontend/Dockerfile -t space-invaders-frontend:${BUILD_NUMBER} frontend/game'
                }
            }
        }

        stage('Build Backend Image') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                retry(3) {
                    sh 'docker build -f infrastructure/docker/backend/Dockerfile -t space-invaders-api:${BUILD_NUMBER} backend/api'
                }
            }
        }

        stage('Build Airflow Image') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                retry(3) {
                    sh 'docker build -f infrastructure/docker/airflow/Dockerfile -t space-invaders-airflow:${BUILD_NUMBER} infrastructure/docker/airflow'
                }
            }
        }

        stage('docker compose up') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                retry(2) {
                    dir('infrastructure/docker') {
                        sh 'docker compose up -d --build --wait --wait-timeout 300'
                    }
                }
            }
        }

        stage('Run Health Checks') {
            options {
                timeout(time: 5, unit: 'MINUTES')
            }
            steps {
                dir('infrastructure/docker') {
                    retry(3) {
                        sh 'curl --fail http://localhost:8000/health'
                    }
                    retry(3) {
                        sh 'docker compose exec -T postgres pg_isready -U space_invaders'
                    }
                    retry(3) {
                        sh 'curl --fail http://localhost:8080/api/v2/monitor/health'
                    }
                }
            }
        }

        stage('Run API Tests') {
            environment {
                DATABASE_URL = 'postgresql://space_invaders:space_invaders@localhost:5432/space_invaders'
            }
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                dir('backend/api') {
                    sh 'python3 -m alembic upgrade head'
                    sh 'python3 -m pytest --junitxml=test-reports/integration-tests.xml --cov=app --cov-report=xml:coverage-reports/integration-coverage.xml --cov-report=html:coverage-reports/integration-html'
                }
            }
            post {
                always {
                    junit 'backend/api/test-reports/integration-tests.xml'
                    archiveArtifacts artifacts: 'backend/api/coverage-reports/**', allowEmptyArchive: true
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
