# Jenkins CI Pipeline

How the `Jenkinsfile` at the repo root builds, tests, and validates the Space Invaders platform, and how to run/troubleshoot it.

## Prerequisites

- Docker Engine with the Compose plugin (`docker compose version`) on the host running Jenkins.
- Nothing else already bound to host ports `8090` (Jenkins UI) or `50000` (agent JNLP) — or override the port mapping in `infrastructure/jenkins/docker-compose.yml`.
- The pipeline's `docker build` / `docker compose` stages run as shell steps directly on the Jenkins controller (`agent any`), so the controller itself needs a `docker` CLI and access to a Docker daemon. The current `infrastructure/jenkins/Dockerfile` does **not** install the Docker CLI or mount `/var/run/docker.sock`, so those stages will fail with `docker: command not found` until you add both to the Jenkins image/Compose service (see Troubleshooting below).
- Nothing already bound to the ports the platform stack itself needs while `docker compose up` runs during a build: `5432`, `8000`, `8081`, `8080` (see `infrastructure/docker/README.md`).

## Jenkins setup

1. Build and start the Jenkins controller:

   ```bash
   cd infrastructure/jenkins
   docker compose up -d --build
   ```

   This builds `space-invaders-jenkins` from the `Dockerfile` (`jenkins/jenkins:lts-jdk17` + `python3`/`pip`, since the `Backend Tests` and `Run API Tests` stages run Python directly on the controller) and starts two containers:
   - `space_invaders_jenkins` — the controller, UI on http://localhost:8090.
   - `jenkins_test_postgres` — an isolated Postgres instance the pipeline's unit-test stage (`Backend Tests`) runs against, kept separate from the app's own Postgres in `infrastructure/docker/` so CI never touches real data.

2. Get the initial admin password and finish the setup wizard at http://localhost:8090:

   ```bash
   docker exec space_invaders_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```

3. Skip "Install suggested plugins" — the plugins the pipeline needs are already baked into the image (see below). Create your admin user when prompted.

4. Create a new Pipeline job (or a Multibranch Pipeline, if you want every branch built) pointing at this repository, with "Script Path" set to `Jenkinsfile` (the default, since it lives at the repo root).

## Plugin installation

Plugins are declared in `infrastructure/jenkins/plugins.txt` and installed automatically at image build time via `jenkins-plugin-cli` (see the `Dockerfile`'s last `RUN` step) — no manual installation needed through the UI.

| Plugin | Why the pipeline needs it |
| --- | --- |
| `git` | Checks out this repository (`checkout scm`). |
| `docker-plugin` | Docker integration for Jenkins. |
| `workflow-aggregator` | Bundles the core Pipeline (declarative + scripted) steps used throughout the `Jenkinsfile` — `dir`, `retry`, `timeout`, `sh`, etc. — and transitively pulls in the JUnit plugin, which provides the `junit` step used to publish test results. |
| `blueocean` | Visual pipeline run view. |
| `github` | GitHub integration (webhooks, status, etc.). |
| `ansicolor` | Backs the `ansiColor('xterm')` pipeline option — renders colored console output (from `pytest`, `npm`, `docker`, etc.) instead of raw ANSI escape codes. |
| `timestamper` | Backs the `timestamps()` pipeline option — prefixes every console log line with a wall-clock timestamp. |

To add a plugin: append its plugin ID to `plugins.txt`, then rebuild the image (`docker compose up -d --build` from `infrastructure/jenkins/`).

## Running builds

- **From the UI**: open the job → "Build Now". For a Multibranch Pipeline, Jenkins picks up any branch containing a `Jenkinsfile` automatically.
- **Manually reproducing a stage locally**: every stage is a plain `sh` command (`pip install`, `pytest`, `npm ci`, `npm run build`, `docker build`, `docker compose up`), so you can copy a stage's command out of the `Jenkinsfile` and run it directly from the repo root to reproduce a failure without waiting on Jenkins.
- The pipeline has a 60-minute overall timeout (`options { timeout(time: 60, unit: 'MINUTES') }`) and a shorter per-stage timeout (5–10 minutes) on every stage that does real work, so a hung step fails the build instead of hanging Jenkins indefinitely.
- Flaky, network-dependent steps (`pip install`, `npm ci`, each `docker build`, `docker compose up`, the health checks) are wrapped in `retry(...)` and will automatically re-attempt a few times before failing the stage.

## Pipeline stages

The `Jenkinsfile` runs these stages in order:

| # | Stage | What it does |
| --- | --- | --- |
| 1 | `Checkout` | Checks out the repository (`checkout scm`). |
| 2 | `Install Backend Dependencies` | `pip install` for `backend/api` (`requirements.txt` + `requirements-dev.txt`). |
| 3 | `Backend Tests` | Runs `alembic upgrade head` then `pytest` against `jenkins_test_postgres`, producing a JUnit report and a coverage report (published/archived in `post`). |
| 4 | `Frontend Build` | `npm ci` + `npm run build` in `frontend/game`; archives the built `dist/` output. |
| 5 | `Build Frontend Image` | `docker build` of `infrastructure/docker/frontend/Dockerfile`, tagged `space-invaders-frontend:${BUILD_NUMBER}`. |
| 6 | `Build Backend Image` | `docker build` of `infrastructure/docker/backend/Dockerfile`, tagged `space-invaders-api:${BUILD_NUMBER}`. |
| 7 | `Build Airflow Image` | `docker build` of `infrastructure/docker/airflow/Dockerfile`, tagged `space-invaders-airflow:${BUILD_NUMBER}`. |
| 8 | `docker compose up` | Starts the full platform stack (`infrastructure/docker/docker-compose.yml`) with `--wait`, so the stage only succeeds once every service's own health check reports healthy. |
| 9 | `Run Health Checks` | Verifies the live stack: `curl /health` (FastAPI), `pg_isready` (database connectivity), `curl /api/v2/monitor/health` (Airflow availability). |
| 10 | `Run API Tests` | Re-runs the backend `pytest` suite, this time against the live stack's own Postgres (`localhost:5432`), producing a separate JUnit/coverage report. |
| 11 | `Shutdown` | `docker compose down -v` — tears down the stack and its volumes. |

After the stages, the `post` block runs regardless of outcome: it always tears the stack down again (a safety net, in case an earlier stage failed before reaching `Shutdown`), prints a one-line build summary (`status` + `durationString`), and on failure names the stage that failed.

## Troubleshooting

- **`docker: command not found` in a `Build * Image` / `docker compose up` / `Shutdown` stage**: the Jenkins controller image doesn't currently ship the Docker CLI. Install it in `infrastructure/jenkins/Dockerfile` (e.g. `apt-get install docker-ce-cli` or copy the static `docker` binary) and give the controller access to a Docker daemon — typically by bind-mounting the host's socket (`/var/run/docker.sock:/var/run/docker.sock`) in `infrastructure/jenkins/docker-compose.yml`.
- **`permission denied` connecting to the Docker socket**: the `jenkins` user inside the container needs to be in the same group as the mounted socket (usually `docker`, gid varies by host) — add the group and user in the `Dockerfile`, or run the container with `--group-add`/matching GID.
- **`Backend Tests` fails with a connection error to Postgres**: `jenkins_test_postgres` isn't healthy yet or isn't reachable. Check `docker compose -f infrastructure/jenkins/docker-compose.yml ps` and `docker compose -f infrastructure/jenkins/docker-compose.yml logs postgres` — the stage's `DATABASE_URL` (`postgres:5432`, set at the pipeline level) only resolves if the Jenkins controller is on the same Compose network as that Postgres container.
- **`docker compose up` stage times out waiting for services to become healthy**: check `docker compose -f infrastructure/docker/docker-compose.yml logs` for the specific service — most often `airflow-init` failing (see `infrastructure/docker/README.md`'s own troubleshooting section) or a port already bound on the host.
- **`Run Health Checks` fails even though `docker compose up` succeeded**: a service can report "healthy" and still not be reachable from the controller's shell if it's on a different network namespace than expected — rerun `docker compose ps` inside `infrastructure/docker/` to confirm the port mappings (`8000`, `8080`) are actually published to the host.
- **Build hits the 60-minute pipeline timeout or a stage's own timeout**: usually a stuck `docker compose up --wait` (a service never becomes healthy) or a hung test. Check the Blue Ocean view or console log for the last stage that started — the `post { always }` summary also names the failing stage.
- **No colors / no timestamps in the console log**: confirm `ansicolor` and `timestamper` are present in `plugins.txt` and the image was rebuilt after adding them (`docker compose up -d --build`).
- **Archived artifacts missing from the build page**: `archiveArtifacts` steps use `allowEmptyArchive: true`, so a missing coverage report doesn't fail the build by itself — check the stage's own console output to see if `pytest`/`npm run build` actually produced the files.
- **`junit` step fails the stage with "no test report files were found"**: the `junit` calls in this pipeline don't set `allowEmptyResults`, so if `pytest` failed before writing its `--junitxml` output, publishing the (nonexistent) report fails the stage on top of the original test failure. Fix the underlying test failure first — the report step failing is a symptom, not the cause.
