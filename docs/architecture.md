# Project Architecture & Airflow DAGs

How the Space Invaders telemetry platform fits together, and what each Airflow DAG does.

## Access & sign-in

Default credentials for local Compose stack (`infrastructure/docker/.env`) — change these before deploying anywhere shared.

| Service | URL | Username | Password |
| --- | --- | --- | --- |
| Game (frontend) | http://localhost:8081 | — (no login) | — |
| FastAPI Swagger UI | http://localhost:8000/docs | — (no login) | — |
| Airflow UI | http://localhost:8080 | `airflow` | `airflow` |
| PostgreSQL (app DB) | `localhost:5432`, db `space_invaders` | `space_invaders` | `space_invaders` |
| PostgreSQL (Airflow metadata) | internal only, not published to host | `airflow` | `airflow` |

Env vars behind these: `_AIRFLOW_WWW_USER_USERNAME` / `_AIRFLOW_WWW_USER_PASSWORD` (Airflow UI), `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (app DB) — all in `infrastructure/docker/.env`. The Airflow-metadata Postgres credentials are hardcoded in `docker-compose.yml`'s `airflow-postgres` service (not externalized, since that database is internal-only and never accessed directly).

Quick connect example:

```bash
docker exec -it space_invaders_postgres psql -U space_invaders -d space_invaders
```

## How the project currently works

The game reports telemetry events to a FastAPI backend, which persists them in PostgreSQL. Airflow runs on a schedule against that same database, aggregating raw events into an `analytics` schema that downstream tools (dashboards, reports) can read without touching the live application tables.

```
                     Browser
                        │
                        ▼
              ┌───────────────────┐
              │  Frontend (Vite)  │   http://localhost:8081
              │   Phaser game     │
              └─────────┬─────────┘
                        │  POST /telemetry (HTTP/JSON)
                        ▼
              ┌───────────────────┐
              │  FastAPI Backend  │   http://localhost:8000/docs
              │  (Uvicorn)        │
              └─────────┬─────────┘
                        │  SQLAlchemy
                        ▼
              ┌───────────────────┐
              │    PostgreSQL     │   space_invaders_postgres:5432
              │  sessions         │
              │  telemetry_events │
              │  analytics.*      │◄──────────────┐
              └───────────────────┘                │
                                                     │ PostgresHook
                                                     │ (conn_id: telemetry_postgres)
                                          ┌──────────┴──────────┐
                                          │   Apache Airflow    │  http://localhost:8080
                                          │ scheduler / triggerer│
                                          │ dag-processor / api  │
                                          └──────────────────────┘
```

Everything runs as one Docker Compose stack (`infrastructure/docker/docker-compose.yml`) on a single `space_invaders` network:

- **`postgres`** — the game's database (`sessions`, `telemetry_events`, and the `analytics` schema Airflow writes to).
- **`api`** — FastAPI, exposes `/telemetry` (ingest) and `/health`.
- **`frontend`** — serves the Phaser game and posts telemetry to `api` from the browser.
- **`airflow-postgres`** — a *separate* Postgres instance, used only for Airflow's own metadata (DAG runs, task state, users). It never sees game data.
- **`airflow-init` / `airflow-scheduler` / `airflow-dag-processor` / `airflow-triggerer` / `airflow-apiserver`** — the Airflow services. They connect to the game's `postgres` via the `telemetry_postgres` Airflow Connection (`AIRFLOW_CONN_TELEMETRY_POSTGRES` in `.env`) to read raw tables and write the `analytics.*` tables.

Airflow only **reads and aggregates** — it never touches `sessions`/`telemetry_events` directly except via `SELECT`, and the API/frontend never read from Airflow.

## DAGs and their triggers

All DAGs live in `backend/airflow/dags/`. "Trigger" here means the DAG's `schedule` — none of them are triggered by sensors, webhooks, or `TriggerDagRunOperator`; they're either time-based (cron-style presets) or manual-only.

| DAG id | File | Trigger (`schedule`) | Purpose | Writes to |
| --- | --- | --- | --- | --- |
| `extract_telemetry` | `extract_telemetry.py` | `@hourly` | Smoke-checks connectivity by counting `telemetry_events` rows and logging it | — (read-only) |
| `daily_session_metrics` | `daily_session_metrics.py` | `@hourly` | Extract → Transform → Load: computes per-session duration/score/event count | `analytics.daily_sessions` |
| `event_statistics` | `event_statistics.py` | `@hourly` | Aggregates events by day + event type | `analytics.event_statistics` |
| `player_performance` | `player_performance.py` | `@hourly` | Computes player KPIs (avg/max score, avg session duration, avg shots fired, avg enemies destroyed) | `analytics.player_performance` |
| `parallel_analytics_pipeline` | `parallel_analytics_pipeline.py` | `@hourly` | Shared extract → data-quality validation → session/event ETL branches run **in parallel** → validates both loads | `analytics.daily_sessions`, `analytics.event_statistics` |
| `check_telemetry_connection` | `check_telemetry_connection_dag.py` | `None` (manual only) | Smoke test — runs `SELECT 1` against `telemetry_postgres` | — |
| `hello_world` | `hello_world_dag.py` | `None` (manual only) | No-op — verifies the Airflow environment itself works | — |

All DAGs are **paused by default** on creation (`AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'`), so after a fresh startup you need to unpause a DAG (toggle in the UI, or `airflow dags unpause <dag_id>`) before its `@hourly` schedule starts firing.

### `parallel_analytics_pipeline` in detail

This is the most structurally interesting DAG — it demonstrates fan-out/fan-in with a data-quality gate in between:

```
extract()
   │
   ▼
validate_data_quality()   ← asserts: sessions exist, no negative scores,
   │                         no null event types, timestamps present
   ├─────────────┐
   ▼             ▼
session_etl()   event_etl()      ← run in parallel (both depend only on validate_data_quality)
   │             │
   └──────┬──────┘
          ▼
      validate()               ← fails the DAG if either branch loaded 0 rows
```

### Shared conventions across the ETL DAGs

- **Retries**: `retries: 2`, `retry_delay: 5 minutes` (`default_args` in every ETL DAG).
- **Failure notification**: a `notify_failure` callback logs `dag_id`/`task_id`/`run_id`/exception on failure (log-only for now — no external alerting yet).
- **Connection**: all DAGs use `PostgresHook(postgres_conn_id="telemetry_postgres")`, which resolves to the `AIRFLOW_CONN_TELEMETRY_POSTGRES` env var pointing at the `postgres` service (the app's database), not `airflow-postgres`.
- **`catchup=False`**: DAGs don't backfill missed runs since `start_date`; only new intervals from "now" run.

## Where to look next

- `infrastructure/docker/README.md` — how to build/run/troubleshoot each container and the full Compose stack.
- `backend/airflow/dags/` — the DAG source files described above.
- `backend/api/app/api/routes/telemetry.py` — the ingest endpoint the frontend posts to.
