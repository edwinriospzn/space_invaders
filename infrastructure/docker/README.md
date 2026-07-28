# Docker Images

How to build and run each containerized component of the platform.

## Running the Full Platform (Docker Compose)

`infrastructure/docker/docker-compose.yml` orchestrates the whole stack — Postgres, FastAPI, the frontend, and Airflow (its own metadata Postgres, scheduler, dag-processor, triggerer, and API server) — on one shared `space_invaders` Docker network.

**Prerequisites**

- Docker Engine with the Compose plugin (`docker compose version`).
- Nothing else already bound to ports `5432`, `8000`, `8081`, `8080` on the host (or override `API_PORT` / `FRONTEND_PORT` / `AIRFLOW_PORT` in `.env` — see below).
- `infrastructure/docker/.env` present (already checked in). It holds every configurable value — Postgres credentials, service ports, Airflow secrets — so the stack can be reconfigured without touching `docker-compose.yml`.

**Build**

```bash
cd infrastructure/docker
docker compose build
```

Builds the `api`, `frontend`, and Airflow images. `postgres` and `airflow-postgres` use upstream images and don't need building.

**Startup**

```bash
docker compose up -d
```

`depends_on` + health checks enforce the correct order automatically: `postgres` and `airflow-postgres` start first; `api` waits for `postgres` to be healthy; `frontend` waits for `api` to be healthy; every Airflow service waits for `airflow-init`, which itself waits for both Postgres instances to be healthy. Once it settles:

- Game: http://localhost:8081 (or `${FRONTEND_PORT}`)
- API / Swagger: http://localhost:8000/docs (or `${API_PORT}`)
- Airflow UI: http://localhost:8080 (or `${AIRFLOW_PORT}`), login `airflow` / `airflow` (from `_AIRFLOW_WWW_USER_USERNAME` / `_AIRFLOW_WWW_USER_PASSWORD`)

**Shutdown**

```bash
docker compose down
```

Stops and removes containers, but named volumes (`postgres_data`, `airflow_postgres_data`) are preserved — your data survives.

**Logs**

```bash
docker compose logs -f            # every service, follow mode
docker compose logs -f api        # just one service
```

**Rebuild**

After changing a Dockerfile or dependency list (source-code edits alone don't need this — `api` and `frontend` bind-mount their source and reload/HMR automatically, see below):

```bash
docker compose up -d --build
```

**Reset database**

```bash
docker compose down -v
```

The `-v` flag deletes the named volumes, wiping both the app's Postgres data and Airflow's metadata database. Follow with `docker compose up -d` to start clean (Airflow's `airflow-init` will re-run migrations and recreate the admin user).

**Useful commands**

| Command | Purpose |
| --- | --- |
| `docker compose up` | Start the stack (add `-d` to run in the background) |
| `docker compose down` | Stop and remove containers (keeps volumes) |
| `docker compose logs` | View service logs (add `-f` to follow, or a service name to filter) |
| `docker compose ps` | List running services and their health status |
| `docker compose build` | (Re)build the `api`, `frontend`, and Airflow images |

## Frontend (Phaser game)

- Dockerfile: `infrastructure/docker/frontend/Dockerfile`
- Build context: `frontend/game`
- Multi-stage: builds the Vite production bundle with `node:20-alpine`, then serves the static `dist/` output with `nginx:alpine`.

**Build**

```bash
docker build -f infrastructure/docker/frontend/Dockerfile -t space-invaders-frontend frontend/game
```

**Run**

```bash
docker run --rm -p 8081:80 space-invaders-frontend
```

Open http://localhost:8081.

**Exposed ports**: `80` (nginx).

**Environment variables**: none — this is a static build with no runtime configuration.

**Troubleshooting**

- `docker ps` shows the container as `unhealthy`: check the HEALTHCHECK output with `docker inspect --format='{{json .State.Health}}' <container>`. It runs `wget --spider http://localhost:80/`, so this usually means the build stage failed to produce `dist/index.html`.
- Blank page / 404s for assets: rebuild without the Docker layer cache (`docker build --no-cache ...`) to rule out a stale `dist/` copy from an earlier build stage.

## Backend (FastAPI)

- Dockerfile: `infrastructure/docker/backend/Dockerfile`
- Build context: `backend/api`
- Multi-stage: installs dependencies into `/install` in a `build` stage, then copies only the installed packages and the app source into the final image (keeps `pytest`/`httpx` and other dev-only tooling, listed in `requirements-dev.txt`, out of the runtime image).

**Build**

```bash
docker build -f infrastructure/docker/backend/Dockerfile -t space-invaders-api backend/api
```

**Run**

```bash
docker run --rm -p 8000:8000 \
  -e DATABASE_URL=postgresql://space_invaders:space_invaders@host.docker.internal:5432/space_invaders \
  space-invaders-api
```

Swagger UI: http://localhost:8000/docs. Health check: http://localhost:8000/health.

**Exposed ports**: `${API_PORT}` (default `8000`).

**Environment variables** (see `backend/api/.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Space Invaders Telemetry API` | OpenAPI title |
| `API_VERSION` | `0.1.0` | OpenAPI version |
| `DEBUG` | `false` | FastAPI debug mode |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `DATABASE_URL` | `postgresql://space_invaders:space_invaders@localhost:5432/space_invaders` | SQLAlchemy connection string |
| `API_PORT` | `8000` | Port Uvicorn binds to inside the container (also used by `EXPOSE` and the `HEALTHCHECK`) |

**Troubleshooting**

- Container exits immediately: `docker logs <container>` — usually a bad `DATABASE_URL` or the port passed via `-p` not matching `API_PORT`.
- `/docs` loads but telemetry endpoints 500: the API itself started fine; this points to the database being unreachable (wrong host/credentials, or Postgres not running). `localhost` inside the container is the container itself — use `host.docker.internal` (Mac/Windows) or the Postgres container's service/network name (Linux/Compose) instead.
- Changed `API_PORT` but health check still fails: the `HEALTHCHECK` reads `${API_PORT}` from the container's own environment, so it only works if you pass `-e API_PORT=<port>` (matching the port Uvicorn is told to bind to), not just the `-p` host mapping.

## Airflow

- Dockerfile: `infrastructure/docker/airflow/Dockerfile`
- Build context: `infrastructure/docker/airflow`
- Extends `apache/airflow:3.3.0` and bakes in `apache-airflow-providers-postgres` (the provider needed by the telemetry DAGs' `PostgresHook`), instead of installing it at container start via `_PIP_ADDITIONAL_REQUIREMENTS`.

**Build**

```bash
docker build -f infrastructure/docker/airflow/Dockerfile -t space-invaders-airflow infrastructure/docker/airflow
```

**Run**

Airflow is a multi-service application (scheduler, dag-processor, triggerer, api-server, its own Postgres) — it isn't run as a single `docker run`. Use the existing Compose stack in `backend/airflow/docker-compose.yml`, which currently pulls `apache/airflow:3.3.0` directly:

```bash
cd backend/airflow
docker compose up -d
```

To use the custom image instead of the upstream one, set `AIRFLOW_IMAGE_NAME` (in `backend/airflow/.env`) to the tag you built above, e.g. `AIRFLOW_IMAGE_NAME=space-invaders-airflow`.

**Exposed ports**: `8080` (Airflow API server / UI, via the compose file's port mapping).

**Environment variables** (see `backend/airflow/.env`): `AIRFLOW_UID`, `AIRFLOW_IMAGE_NAME`, `FERNET_KEY`, `AIRFLOW__API_AUTH__JWT_SECRET`, `AIRFLOW__API_AUTH__JWT_ISSUER`, `_AIRFLOW_WWW_USER_USERNAME`, `_AIRFLOW_WWW_USER_PASSWORD`, `AIRFLOW_CONN_TELEMETRY_POSTGRES`.

**Troubleshooting**

- `airflow-init` fails or webserver never becomes healthy: check `docker compose logs airflow-init` first — most issues are the metadata Postgres not being ready yet or a missing `FERNET_KEY`.
- DAGs fail with `ModuleNotFoundError` for a provider: confirm the compose stack is actually using the custom image (`AIRFLOW_IMAGE_NAME=space-invaders-airflow`) and not the upstream `apache/airflow:3.3.0`, which won't have your added packages.
- `PostgresHook` can't connect to `telemetry_postgres`: verify `AIRFLOW_CONN_TELEMETRY_POSTGRES` in `backend/airflow/.env` and that the `telemetry` Docker network (`postgres_default`) exists — it's declared `external: true` in the compose file, so the game's Postgres stack must already be running.

## PostgreSQL

- Compose file: `infrastructure/docker/postgres/docker-compose.yml`
- Uses the stock `postgres:17` image (no custom Dockerfile needed).

**Run**

```bash
docker compose -f infrastructure/docker/postgres/docker-compose.yml up -d
```

**Exposed ports**: `5432`.

**Environment variables**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (all set to `space_invaders` in the compose file).

**Troubleshooting**

- Other services report the database as unreachable even though the container is running: check `docker inspect --format='{{json .State.Health}}' space_invaders_postgres` — the `pg_isready` health check needs to report `healthy` before Postgres reliably accepts connections, and other Compose stacks (Airflow) depend on this via `condition: service_healthy`.
- Data seems to reset between runs: the database lives in the named volume `postgres_data`; `docker compose down -v` deletes it, `docker compose down` (no `-v`) does not.
