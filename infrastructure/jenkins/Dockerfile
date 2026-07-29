# Build context: infrastructure/jenkins
# docker build -f infrastructure/jenkins/Dockerfile -t space-invaders-jenkins infrastructure/jenkins

FROM jenkins/jenkins:lts-jdk17

USER root

# Pipeline stages install backend dependencies and run pytest directly on
# this controller node (agent any), so it needs a Python runtime.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

USER jenkins

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
