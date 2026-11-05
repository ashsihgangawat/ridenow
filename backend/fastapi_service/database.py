"""
RideNow Platform - Database Engine & Session Management
Supports Supabase PostgreSQL as primary with automatic fallback and connection health checks.
"""

import os
import time
from typing import Generator, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

# Resolve Database URL from environment variables
RAW_DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

# Supabase / Render compatibility: convert 'postgres://' to 'postgresql://'
if RAW_DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = RAW_DATABASE_URL

_engine = None
_SessionLocal = None


def get_engine():
    global _engine, _SessionLocal
    if _engine is not None:
        return _engine

    if not DATABASE_URL:
        return None

    try:
        connect_args = {}
        if DATABASE_URL.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
            _engine = create_engine(
                DATABASE_URL,
                connect_args=connect_args,
            )
        else:
            # PostgreSQL (Supabase / Render)
            _engine = create_engine(
                DATABASE_URL,
                poolclass=QueuePool,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=300,
                connect_args={"connect_timeout": 10},
            )

        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        return _engine
    except Exception as e:
        print(f"[DB] Error creating database engine: {e}")
        return None


def get_session() -> Optional[Session]:
    global _SessionLocal
    if _SessionLocal is None:
        get_engine()
    if _SessionLocal is None:
        return None
    return _SessionLocal()


def get_db() -> Generator[Optional[Session], None, None]:
    """FastAPI Dependency for database sessions with automatic cleanup."""
    db = get_session()
    if db is None:
        yield None
        return
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """Verifies live database connectivity and measures response latency."""
    engine = get_engine()
    if engine is None:
        return {
            "status": "UNCONFIGURED",
            "connected": False,
            "engine": "JSON_FALLBACK",
            "message": "DATABASE_URL not configured. Operating in JSON backup mode.",
            "latencyMs": 0,
        }

    start = time.time()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            latency = round((time.time() - start) * 1000, 2)
            dialect = engine.dialect.name
            return {
                "status": "HEALTHY" if result == 1 else "DEGRADED",
                "connected": result == 1,
                "engine": dialect.upper(),
                "latencyMs": latency,
                "pool": {
                    "size": getattr(engine.pool, "size", lambda: 0)(),
                    "checkedin": getattr(engine.pool, "checkedin", lambda: 0)(),
                    "checkedout": getattr(engine.pool, "checkedout", lambda: 0)(),
                },
                "message": f"Successfully connected to {dialect.upper()} database."
            }
    except Exception as e:
        latency = round((time.time() - start) * 1000, 2)
        return {
            "status": "ERROR",
            "connected": False,
            "engine": engine.dialect.name.upper(),
            "latencyMs": latency,
            "error": str(e),
            "message": "Database connection failed. Check host, credentials, or network permissions."
        }

