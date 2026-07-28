import logging
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import DAG, task

logger = logging.getLogger(__name__)


@task
def create_player_performance_table():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    hook.run("CREATE SCHEMA IF NOT EXISTS analytics")
    hook.run(
        """
        CREATE TABLE IF NOT EXISTS analytics.player_performance (
            avg_score NUMERIC,
            max_score INTEGER,
            avg_session_duration NUMERIC,
            avg_shots_fired NUMERIC,
            avg_enemies_destroyed NUMERIC
        )
        """
    )


@task
def build_player_performance():
    hook = PostgresHook(postgres_conn_id="telemetry_postgres")
    hook.run("TRUNCATE TABLE analytics.player_performance")
    hook.run(
        """
        INSERT INTO analytics.player_performance (
            avg_score, max_score, avg_session_duration, avg_shots_fired, avg_enemies_destroyed
        )
        WITH session_shots AS (
            SELECT session_id, COUNT(*) AS shots
            FROM telemetry_events
            WHERE event_type = 'PLAYER_SHOT'
            GROUP BY session_id
        ),
        session_kills AS (
            SELECT session_id, COUNT(*) AS kills
            FROM telemetry_events
            WHERE event_type = 'ENEMY_DESTROYED'
            GROUP BY session_id
        )
        SELECT
            AVG(s.score) AS avg_score,
            MAX(s.score) AS max_score,
            AVG(EXTRACT(EPOCH FROM (s.ended_at - s.started_at))) AS avg_session_duration,
            AVG(COALESCE(ss.shots, 0)) AS avg_shots_fired,
            AVG(COALESCE(sk.kills, 0)) AS avg_enemies_destroyed
        FROM sessions s
        LEFT JOIN session_shots ss ON ss.session_id = s.id
        LEFT JOIN session_kills sk ON sk.session_id = s.id
        """
    )
    logger.info("analytics.player_performance rebuilt")


with DAG(
    dag_id="player_performance",
    description="Computes player KPIs (avg/max score, avg session duration, avg shots fired, avg enemies destroyed) into analytics.player_performance.",
    start_date=datetime(2026, 1, 1),
    schedule="@hourly",
    catchup=False,
    tags=["sprint-4", "etl"],
) as dag:
    create_player_performance_table() >> build_player_performance()
