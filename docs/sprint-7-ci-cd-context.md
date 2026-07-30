# Sprint 7 — CI/CD (Jenkins) Context

Resume point for continuing Sprint 7 work in a new session. Written after implementing stories 7.4–7.10 and debugging the pipeline against a real, running Jenkins instance.

## What Sprint 7 covers

Building a Jenkins CI pipeline (`Jenkinsfile` at repo root) for this project, story by story:

| Story | What it added |
| --- | --- |
| 7.1–7.3 (prior sprint work) | Jenkins environment (`infrastructure/jenkins/`), initial pipeline skeleton, backend `pytest` stage |
| 7.4 | `Frontend Build` stage (`npm ci` + `npm run build`) |
| 7.5 | `Build Frontend/Backend/Airflow Image` stages (`docker build`, tagged `:${BUILD_NUMBER}`) |
| 7.6 | Integration stages: `docker compose up` (full stack) → `Run Health Checks` (FastAPI `/health`, `pg_isready`, Airflow `/api/v2/monitor/health`) → `Run API Tests` (pytest against the live stack) → `Shutdown` |
| 7.7 | Pipeline quality: `timestamps()`, `ansiColor('xterm')`, per-stage `timeout`, `retry(...)` on flaky/network steps, clearer stage names |
| 7.8 | Artifacts: `archiveArtifacts` for `frontend/game/dist/**` and `backend/api/coverage-reports/**`; `junit` step publishes JUnit XML from both `Backend Tests` and `Run API Tests` |
| 7.9 | `post { success/failure/always }` console summary (build status, duration, failing stage) |
| 7.10 | `infrastructure/jenkins/README.md` — full pipeline docs (prerequisites, setup, plugins, running builds, stage table, troubleshooting) |

All of this is committed on branch **`feature/devops-platform`** and pushed to `origin` (GitHub: `edwinriospzn/space_invaders`). Commit range: `de2a1d8`…`b2e31ef`.

## Bugs found and fixed while validating against a real Jenkins run

The user has a real Jenkins controller running locally (`docker compose` in `infrastructure/jenkins/`, UI at http://localhost:8090). Running the actual pipeline (not just local shell reproductions) surfaced three environment gaps that unit-testing commands on the host couldn't catch, since they're specific to running *inside* the Jenkins controller container:

1. **No Docker CLI / no daemon access** (`infrastructure/jenkins/Dockerfile`, `docker-compose.yml`) — the controller runs `docker build`/`docker compose` shell steps directly (`agent any`), but never had the Docker CLI installed or the host's socket mounted. Fixed: copy the `docker` binary in from `docker:27-cli`, install the Compose v2 plugin binary, bind-mount `/var/run/docker.sock`, and add the `jenkins` user to the socket's group via `group_add: ["${DOCKER_GID}"]` (must `export DOCKER_GID=$(getent group docker | cut -d: -f3)` before `docker compose up`). Commit `3c221d8`.

2. **No Node.js/npm** — `Frontend Build` runs `npm ci`/`npm run build` directly on the controller too; only Python was installed. Fixed: `apt-get install nodejs npm` added to the `Dockerfile`. Commit `1cdd1b0`.

3. **Docker-outside-of-Docker (DooD) bind-mount path mismatch** — `infrastructure/docker/docker-compose.yml`'s `api`/`frontend` services bind-mount live source (`../../backend/api:/app`, etc.) for local hot-reload. Since Jenkins runs `docker compose` against the **host's** daemon via the mounted socket (not its own filesystem), those relative paths resolved against the Jenkins container's workspace path but were evaluated by the host daemon — which mounted an *empty* directory over `/app`, so `uvicorn` had no app code and the `api` container came up unhealthy, blocking `docker compose up --wait`. Fixed with a **CI-only override file**, `infrastructure/docker/docker-compose.ci.yml`, that drops the dev bind-mounts/entrypoint and runs `api`/`frontend` from their already-built images instead (via Compose's `!reset`/`!override` YAML tags). The Jenkinsfile's `docker compose up` stage now runs `docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --build --wait --wait-timeout 300`. Local dev (`docker compose up` with no `-f` flags) is completely unaffected. Commit `b2e31ef`.

Each fix was verified for real (not just read): rebuilt images, ran the exact merged Compose config, confirmed containers became healthy, curled the live endpoints, then tore everything down. The final `Jenkinsfile` was also validated directly against the user's real Jenkins instance via its `/pipeline-model-converter/validate` endpoint after every change.

4. **DooD networking: `localhost` doesn't reach host-published ports** (`infrastructure/jenkins/docker-compose.yml`, `Jenkinsfile`) — surfaced in build #3, after fix #3 got `docker compose up` all the way to healthy. `Run Health Checks`' two `curl http://localhost:8000/health` / `:8080/api/v2/monitor/health` calls, and `Run API Tests`' `DATABASE_URL=...@localhost:5432/...`, all run as plain `sh` steps directly in the Jenkins controller container — not via `docker compose exec`. Since `docker compose up` talks to the **host's** daemon (DooD), those ports are published on the host's network interfaces, not the Jenkins container's; `localhost` inside the Jenkins container is its own loopback, where nothing listens. (The `pg_isready` check in the same stage worked because `docker compose exec` runs inside the target container's own network namespace, regardless of where the Docker client invocation originates.) Fixed by adding `extra_hosts: ["host.docker.internal:host-gateway"]` to the `jenkins` service, then pointing the two curls and the `DATABASE_URL` at `host.docker.internal` instead of `localhost`. Commit `091a4fa`.

## Known environment specifics (this user's machine)

- Jenkins UI: **http://localhost:8090**. Login: username `admin`, password is whatever `docker exec space_invaders_jenkins cat /var/jenkins_home/secrets/initialAdminPassword` returns — the user chose "Continue as admin" in the setup wizard, so that initial password is the permanent one.
- Jenkins job name: `space_invaders_test01` (Pipeline, "Pipeline script from SCM", Git, repo `https://github.com/edwinriospzn/space_invaders.git`, branch `*/feature/devops-platform`, script path `Jenkinsfile`).
- `infrastructure/jenkins/docker-compose.yml` requires `DOCKER_GID` set before `docker compose up`/`--build` (see fix #1 above) — the user needs to `export DOCKER_GID=$(getent group docker | cut -d: -f3)` in whatever shell they run `docker compose` from on the Jenkins host, every time they rebuild/recreate that container.
- `jenkins_test_postgres` (in the same compose file) is a separate, isolated Postgres the `Backend Tests` stage runs against — not the app's own Postgres.

## Current status / next step

**Confirmed green.** Build #4 (commit `091a4fa`) completed with `result: SUCCESS` in ~119s, every stage through `Shutdown` passed. Verified via the Jenkins REST API (no UI access needed): `testReport` shows 18/18 tests passed, 0 failed/skipped, across both the `Backend Tests` and `Run API Tests` JUnit suites (story 7.8's `junit` step); 75 artifacts archived under `backend/api/coverage-reports/**` and `frontend/game/dist/**` (story 7.8's `archiveArtifacts`).

History: build #2 failed at `docker compose up` (bug #3, fixed by `b2e31ef`). Build #3 (after that fix) got `docker compose up` to fully healthy but then failed at `Run Health Checks` — a new DooD networking issue (bug #4 above), fixed by `091a4fa`. Build #4 is the first fully green run.

Sprint 7 (stories 7.4–7.10) is functionally done and pipeline-verified. Nothing outstanding except optionally eyeballing the Blue Ocean UI/console for cosmetic confirmation, which is not load-bearing since the REST API already confirms correctness.

## Where to look next

- `infrastructure/jenkins/README.md` — full pipeline documentation (setup, plugins, stages, troubleshooting) — written in story 7.10, since updated with the fixes above.
- `Jenkinsfile` (repo root) — the pipeline itself.
- `infrastructure/docker/docker-compose.ci.yml` — the CI-only override explained in fix #3.
- `docs/architecture.md` — overall platform architecture (frontend/API/Postgres/Airflow), unrelated to CI but useful background.
