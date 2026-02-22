from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .config import settings

try:
    import psycopg
except Exception:  # pragma: no cover - optional until dependency is installed/rebuilt
    psycopg = None


@dataclass(slots=True)
class DatabaseConfig:
    url: str


db_config = DatabaseConfig(url=settings.database_url)


def _connect():
    if psycopg is None:
        raise RuntimeError("psycopg is not installed")
    return psycopg.connect(db_config.url, autocommit=True)


def execute(query: str, params: tuple[Any, ...] | None = None) -> None:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())


def fetch_all(query: str, params: tuple[Any, ...] | None = None) -> list[dict[str, Any]]:
    with _connect() as conn:
        with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(query, params or ())
            rows = cur.fetchall()
    return [dict(row) for row in rows]


def ping() -> bool:
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return True
    except Exception:
        return False
