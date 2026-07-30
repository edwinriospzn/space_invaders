# Getting Started

How to spin up the full Space Invaders Analytics Platform locally: app stack + Jenkins CI.

## Prerequisites

- Docker Engine with the Compose plugin (`docker compose version`)
- Nothing else already bound to ports `5432`, `8000`, `8081`, `8080`, `8090`, `50000` on the host

## 1. Run the app stack

```bash
cd infrastructure/docker
docker compose up -d --build
```

Once containers settle (`docker compose ps` to check health):

| Service | URL |
| --- | --- |
| Game | http://localhost:8081 |
| API / Swagger | http://localhost:8000/docs |
| Airflow UI | http://localhost:8080 (login `airflow` / `airflow`) |

Stop with `docker compose down` (add `-v` to also wipe volumes/data).

See `infrastructure/docker/README.md` for per-service build/run/troubleshooting details.

## 2. Run Jenkins (CI)

```bash
cd infrastructure/jenkins
export DOCKER_GID=$(getent group docker | cut -d: -f3)
docker compose up -d
```

`DOCKER_GID` must be exported every time you rebuild/recreate the Jenkins container — it grants the `jenkins` user access to the bind-mounted Docker socket.

Jenkins UI: **http://localhost:8090**

**Get the admin password:**

```bash
docker exec space_invaders_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Login is `admin` / that password (it's permanent — the setup wizard was completed with "Continue as admin").

Pipeline job: `space_invaders_test01` (Pipeline script from SCM, branch `feature/devops-platform`, script path `Jenkinsfile`). Trigger a run with **Build Now** in the UI, or via the REST API:

```bash
JENKINS_PW=$(docker exec space_invaders_jenkins cat /var/jenkins_home/secrets/initialAdminPassword)
COOKIES=$(mktemp)
CRUMB_JSON=$(curl -s -c "$COOKIES" -u admin:"$JENKINS_PW" "http://localhost:8090/crumbIssuer/api/json")
CRUMB=$(echo "$CRUMB_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['crumb'])")
FIELD=$(echo "$CRUMB_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['crumbRequestField'])")
curl -s -b "$COOKIES" -u admin:"$JENKINS_PW" -H "$FIELD: $CRUMB" -X POST "http://localhost:8090/job/space_invaders_test01/build"
rm -f "$COOKIES"
```

See `infrastructure/jenkins/README.md` and `docs/sprint-7-ci-cd-context.md` for full pipeline docs, stage breakdown, and known DooD (Docker-outside-of-Docker) gotchas.

## Where to look next

- `README.md` — project overview
- `docs/architecture.md` — platform architecture (frontend/API/Postgres/Airflow)
- `docs/sprint-7-ci-cd-context.md` — CI/CD implementation history and known environment specifics
- `infrastructure/docker/README.md` — per-service Docker details
- `infrastructure/jenkins/README.md` — Jenkins pipeline details
