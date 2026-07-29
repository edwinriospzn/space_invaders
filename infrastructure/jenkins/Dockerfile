# Build context: infrastructure/jenkins
# docker build -f infrastructure/jenkins/Dockerfile -t space-invaders-jenkins infrastructure/jenkins

FROM jenkins/jenkins:lts-jdk17

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
