# Build context: infrastructure/jenkins
# docker build -f infrastructure/jenkins/Dockerfile -t space-invaders-jenkins infrastructure/jenkins

FROM docker:27-cli AS docker-cli

FROM jenkins/jenkins:lts-jdk17

USER root

# Pipeline stages install backend dependencies and run pytest directly on
# this controller node (agent any), so it needs a Python runtime.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# The pipeline's Build/Compose stages run `docker build` / `docker compose`
# directly on this controller (agent any), so it needs the Docker CLI and
# Compose plugin itself. The container still talks to the *host's* Docker
# daemon via the socket bind-mounted in docker-compose.yml — this only adds
# the client tooling, not a daemon.
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
ARG COMPOSE_VERSION=2.32.4
RUN mkdir -p /usr/libexec/docker/cli-plugins && \
    curl -fSL "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
        -o /usr/libexec/docker/cli-plugins/docker-compose && \
    chmod +x /usr/libexec/docker/cli-plugins/docker-compose

USER jenkins

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
