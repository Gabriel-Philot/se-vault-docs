# Python Production Patterns

## Introduction

This guide covers essential Python patterns for building production-grade data engineering applications. As a data engineer with foundational knowledge of OOP, memory management, and basic design patterns, you're ready to level up your skills with patterns specifically designed for maintainable, observable, and resilient production systems.

These patterns address common challenges in data engineering:
- Managing complex configurations across environments (dev, staging, production)
- Building APIs that handle data pipeline orchestration
- Debugging and monitoring distributed data processing systems
- Ensuring graceful handling of long-running data jobs during deployments
- Structuring large codebases with proper dependency management

---

## 1. FastAPI Dependency Injection Patterns

### What is it?

Dependency Injection (DI) is a design pattern where objects receive their dependencies from external sources rather than creating them internally. FastAPI implements DI through its `Depends()` mechanism, allowing path operation functions to declare what they need, with FastAPI automatically providing those dependencies.

In FastAPI, a "dependency" is simply a callable (function or class) that returns a value needed by your endpoint. Dependencies can have their own sub-dependencies, forming a dependency tree that FastAPI resolves automatically.

### Why it matters for Data Engineers

- **Database Connection Management**: Share database connections (PostgreSQL, Snowflake, BigQuery clients) across endpoints without connection pool exhaustion
- **Authentication/Authorization**: Secure data API endpoints with reusable auth dependencies
- **Pipeline Configuration**: Inject pipeline configurations, feature flags, or A/B test parameters
- **Resource Cleanup**: Automatically release resources (file handles, connections) when requests complete
- **Testing**: Easily mock external services (S3, data warehouses) during testing

### Prerequisites

- Understanding of Python type hints and `Annotated` type
- Basic knowledge of async/await patterns
- Familiarity with the Factory pattern

### Implementation Example

```python
"""
FastAPI Dependency Injection for Data Engineering APIs

This example demonstrates a data pipeline API with proper DI patterns
for database connections, authentication, and configuration.
"""
from contextlib import asynccontextmanager
from typing import Annotated, AsyncGenerator
from dataclasses import dataclass
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker


# =============================================================================
# Configuration Dependency
# =============================================================================

@dataclass
class PipelineConfig:
    """Configuration for data pipeline operations."""
    batch_size: int = 10000
    max_retries: int = 3
    timeout_seconds: int = 300
    warehouse: str = "COMPUTE_WH"


def get_pipeline_config() -> PipelineConfig:
    """Factory function for pipeline configuration."""
    return PipelineConfig(
        batch_size=int(os.getenv("BATCH_SIZE", "10000")),
        max_retries=int(os.getenv("MAX_RETRIES", "3")),
        timeout_seconds=int(os.getenv("TIMEOUT_SECONDS", "300")),
        warehouse=os.getenv("WAREHOUSE", "COMPUTE_WH"),
    )

# Type alias for reusability
PipelineConfigDep = Annotated[PipelineConfig, Depends(get_pipeline_config)]


# =============================================================================
# Database Session Dependency (Yield Dependency for Cleanup)
# =============================================================================

DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/datawarehouse"
engine = create_async_engine(DATABASE_URL, pool_size=20, max_overflow=10)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield dependency that provides a database session with automatic cleanup.

    The code after `yield` executes after the response is sent,
    ensuring proper resource cleanup even if an exception occurs.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Type alias for database session dependency
DbSessionDep = Annotated[AsyncSession, Depends(get_db_session)]


# =============================================================================
# Authentication Dependency Chain
# =============================================================================

@dataclass
class User:
    """Represents an authenticated user."""
    user_id: str
    email: str
    roles: list[str]
    organization_id: str


async def get_current_user(
    # In production: token: str = Depends(oauth2_scheme)
) -> User:
    """
    Validate JWT token and return current user.
    In production, this would validate against your auth provider.
    """
    # Simplified for demonstration
    return User(
        user_id="user_123",
        email="data-engineer@company.com",
        roles=["data_engineer", "pipeline_admin"],
        organization_id="org_456"
    )


async def require_pipeline_admin(
    user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Sub-dependency that enforces pipeline admin role.
    Demonstrates hierarchical dependency pattern.
    """
    if "pipeline_admin" not in user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pipeline admin role required"
        )
    return user

# Type aliases for auth dependencies
CurrentUserDep = Annotated[User, Depends(get_current_user)]
PipelineAdminDep = Annotated[User, Depends(require_pipeline_admin)]


# =============================================================================
# Class-Based Dependencies (for complex state)
# =============================================================================

class DataQualityChecker:
    """
    Class-based dependency for data quality validation.
    Useful when dependency needs initialization parameters.
    """

    def __init__(self, threshold: float = 0.95):
        self.threshold = threshold
        self.checks_performed = 0

    def __call__(self, config: PipelineConfigDep) -> "DataQualityChecker":
        """
        When a class defines __call__, it becomes callable.
        FastAPI will instantiate and call it for each request.
        """
        self.batch_size = config.batch_size
        return self

    async def validate_completeness(self, record_count: int, expected: int) -> bool:
        """Check if data completeness meets threshold."""
        self.checks_performed += 1
        return (record_count / expected) >= self.threshold


# Dependency instance with custom threshold
quality_checker = DataQualityChecker(threshold=0.98)
QualityCheckerDep = Annotated[DataQualityChecker, Depends(quality_checker)]


# =============================================================================
# FastAPI Application with Dependencies
# =============================================================================

app = FastAPI(title="Data Pipeline API")


@app.post("/pipelines/{pipeline_id}/trigger")
async def trigger_pipeline(
    pipeline_id: str,
    db: DbSessionDep,
    config: PipelineConfigDep,
    user: PipelineAdminDep,  # Requires pipeline_admin role
    quality: QualityCheckerDep,
):
    """
    Trigger a data pipeline execution.

    This endpoint demonstrates multiple injected dependencies:
    - Database session with automatic cleanup
    - Pipeline configuration from environment
    - Authentication with role-based access control
    - Data quality checker instance
    """
    # All dependencies are automatically injected and typed
    execution = {
        "pipeline_id": pipeline_id,
        "triggered_by": user.email,
        "organization_id": user.organization_id,
        "config": {
            "batch_size": config.batch_size,
            "warehouse": config.warehouse,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Database operations use the injected session
    # await db.execute(insert(PipelineExecution).values(**execution))

    return {"status": "triggered", "execution": execution}


@app.get("/pipelines/{pipeline_id}/status")
async def get_pipeline_status(
    pipeline_id: str,
    db: DbSessionDep,
    user: CurrentUserDep,  # Any authenticated user
):
    """
    Get pipeline status - accessible to any authenticated user.
    Demonstrates using different auth dependency than trigger endpoint.
    """
    return {
        "pipeline_id": pipeline_id,
        "status": "running",
        "requested_by": user.email
    }
```

### Real-world Application

**Data Pipeline Orchestration API**: Build an API that orchestrates Airflow DAGs, dbt runs, or Spark jobs. Use DI to:
- Inject different warehouse clients (Snowflake, BigQuery, Redshift) based on configuration
- Share connection pools across endpoints
- Implement organization-level data isolation through auth dependencies
- Mock external services during integration testing

**Feature Store API**: Serve ML features with dependencies that:
- Cache frequently accessed features
- Validate feature freshness
- Track feature access for lineage

### Learning Resources

| Resource | Type | Link |
|----------|------|------|
| FastAPI Dependencies Documentation | Official Docs | https://fastapi.tiangolo.com/tutorial/dependencies/ |
| FastAPI Advanced Dependencies | Official Docs | https://fastapi.tiangolo.com/advanced/advanced-dependencies/ |
| Dependency Injection in Python | Talk | PyCon talks on DI patterns |
| FastAPI Best Practices | GitHub | https://github.com/zhanymkanov/fastapi-best-practices |

### Difficulty Level

**Intermediate** - Requires understanding of Python callables, type hints, and async patterns.

---

## 2. Configuration Management (Pydantic Settings)

### What is it?

Pydantic Settings is a configuration management library that leverages Pydantic's validation capabilities to load, validate, and type-check application settings from environment variables, `.env` files, secrets files, and other sources. It provides a declarative way to define configuration schemas with automatic validation and type coercion.

### Why it matters for Data Engineers

- **Environment Parity**: Ensure consistent configuration structure across dev, staging, and production
- **Validation at Startup**: Catch misconfiguration immediately rather than runtime failures
- **Secret Management**: Securely load credentials for databases, cloud services, and APIs
- **Documentation**: Self-documenting configuration through type hints and descriptions
- **12-Factor App Compliance**: Properly separate configuration from code

### Prerequisites

- Understanding of Pydantic models and validation
- Familiarity with environment variables and `.env` files
- Basic knowledge of Python dataclasses or attrs

### Implementation Example

```python
"""
Configuration Management with Pydantic Settings

This example demonstrates a comprehensive configuration setup for
a data engineering application with multiple environments and services.
"""
from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# =============================================================================
# Environment Enumeration
# =============================================================================

class Environment(str, Enum):
    """Deployment environment enumeration."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


# =============================================================================
# Nested Configuration Models
# =============================================================================

class DatabaseSettings(BaseSettings):
    """Database connection configuration."""

    model_config = SettingsConfigDict(
        env_prefix="DB_",  # All vars prefixed with DB_
        extra="ignore"
    )

    host: str = Field(default="localhost", description="Database host")
    port: int = Field(default=5432, ge=1, le=65535)
    name: str = Field(..., description="Database name")  # Required field
    user: str = Field(...)
    password: SecretStr = Field(...)  # Masked in logs/repr
    pool_size: int = Field(default=10, ge=1, le=100)
    max_overflow: int = Field(default=20, ge=0)

    @property
    def async_url(self) -> str:
        """Construct async database URL."""
        password = self.password.get_secret_value()
        return f"postgresql+asyncpg://{self.user}:{password}@{self.host}:{self.port}/{self.name}"

    @property
    def sync_url(self) -> str:
        """Construct sync database URL."""
        password = self.password.get_secret_value()
        return f"postgresql://{self.user}:{password}@{self.host}:{self.port}/{self.name}"


class SnowflakeSettings(BaseSettings):
    """Snowflake data warehouse configuration."""

    model_config = SettingsConfigDict(env_prefix="SNOWFLAKE_")

    account: str = Field(..., description="Snowflake account identifier")
    user: str = Field(...)
    password: SecretStr = Field(...)
    warehouse: str = Field(default="COMPUTE_WH")
    database: str = Field(...)
    schema_name: str = Field(default="PUBLIC", alias="schema")  # 'schema' is reserved
    role: str = Field(default="DATA_ENGINEER")

    @field_validator("account")
    @classmethod
    def validate_account_format(cls, v: str) -> str:
        """Ensure account follows expected format."""
        if not v or len(v) < 3:
            raise ValueError("Invalid Snowflake account identifier")
        return v.lower()


class RedisSettings(BaseSettings):
    """Redis cache configuration."""

    model_config = SettingsConfigDict(env_prefix="REDIS_")

    host: str = Field(default="localhost")
    port: int = Field(default=6379)
    password: SecretStr | None = Field(default=None)
    db: int = Field(default=0, ge=0, le=15)
    ssl: bool = Field(default=False)

    @property
    def url(self) -> str:
        """Construct Redis URL."""
        auth = ""
        if self.password:
            auth = f":{self.password.get_secret_value()}@"
        protocol = "rediss" if self.ssl else "redis"
        return f"{protocol}://{auth}{self.host}:{self.port}/{self.db}"


class ObservabilitySettings(BaseSettings):
    """Observability and monitoring configuration."""

    model_config = SettingsConfigDict(env_prefix="OTEL_")

    enabled: bool = Field(default=True)
    service_name: str = Field(default="data-pipeline-api")
    exporter_endpoint: str = Field(default="http://localhost:4317")
    sampling_rate: float = Field(default=1.0, ge=0.0, le=1.0)
    log_level: str = Field(default="INFO")

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level is valid."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper_v = v.upper()
        if upper_v not in valid_levels:
            raise ValueError(f"Invalid log level. Must be one of: {valid_levels}")
        return upper_v


# =============================================================================
# Main Application Settings
# =============================================================================

class Settings(BaseSettings):
    """
    Main application settings aggregating all configuration.

    Settings are loaded in this priority order (highest to lowest):
    1. Environment variables
    2. .env file (if exists)
    3. Default values

    For secrets in production, consider using:
    - AWS Secrets Manager
    - HashiCorp Vault
    - Kubernetes secrets mounted as files
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",  # Allows DB__HOST for nested settings
        case_sensitive=False,
        extra="ignore",  # Ignore extra env vars
    )

    # Application metadata
    app_name: str = Field(default="Data Pipeline API")
    environment: Environment = Field(default=Environment.DEVELOPMENT)
    debug: bool = Field(default=False)
    api_version: str = Field(default="v1")

    # Nested configurations
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    snowflake: SnowflakeSettings = Field(default_factory=SnowflakeSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    observability: ObservabilitySettings = Field(default_factory=ObservabilitySettings)

    # Feature flags
    enable_caching: bool = Field(default=True)
    enable_rate_limiting: bool = Field(default=True)
    max_batch_size: int = Field(default=100000, ge=1000, le=1000000)

    # API Keys (loaded from environment)
    openai_api_key: SecretStr | None = Field(default=None, alias="OPENAI_API_KEY")

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """Ensure production has required security settings."""
        if self.environment == Environment.PRODUCTION:
            if self.debug:
                raise ValueError("Debug mode must be disabled in production")
            if self.observability.sampling_rate < 0.1:
                raise ValueError("Sampling rate too low for production observability")
        return self

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == Environment.PRODUCTION


# =============================================================================
# Settings Factory with Caching
# =============================================================================

@lru_cache()
def get_settings() -> Settings:
    """
    Factory function for settings with caching.

    Using lru_cache ensures settings are only loaded once,
    improving performance and ensuring consistency.

    To reload settings (e.g., in tests):
        get_settings.cache_clear()
    """
    return Settings()


# =============================================================================
# Environment-Specific Configuration Files
# =============================================================================

def get_settings_for_environment(env: Environment) -> Settings:
    """
    Load settings from environment-specific .env file.

    Example file structure:
    - .env.development
    - .env.staging
    - .env.production
    """
    env_file = Path(f".env.{env.value}")

    class EnvironmentSettings(Settings):
        model_config = SettingsConfigDict(
            env_file=env_file if env_file.exists() else ".env",
            env_file_encoding="utf-8",
        )

    return EnvironmentSettings()


# =============================================================================
# Usage Example
# =============================================================================

if __name__ == "__main__":
    # Load settings
    settings = get_settings()

    print(f"Application: {settings.app_name}")
    print(f"Environment: {settings.environment.value}")
    print(f"Database URL: {settings.database.async_url}")

    # SecretStr values are masked
    print(f"DB Password: {settings.database.password}")  # Outputs: SecretStr('**********')

    # Access actual secret value when needed
    actual_password = settings.database.password.get_secret_value()

    # Check environment
    if settings.is_production:
        print("Running in production mode")
```

**Example `.env` file:**

```bash
# .env file for development
ENVIRONMENT=development
DEBUG=true

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pipeline_db
DB_USER=developer
DB_PASSWORD=local_dev_password
DB_POOL_SIZE=5

# Snowflake configuration
SNOWFLAKE_ACCOUNT=xy12345.us-east-1
SNOWFLAKE_USER=data_engineer
SNOWFLAKE_PASSWORD=snowflake_secret
SNOWFLAKE_DATABASE=ANALYTICS
SNOWFLAKE_WAREHOUSE=DEV_WH

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Observability
OTEL_ENABLED=true
OTEL_SERVICE_NAME=data-pipeline-api-dev
OTEL_LOG_LEVEL=DEBUG

# Feature flags
ENABLE_CACHING=true
MAX_BATCH_SIZE=50000
```

### Real-world Application

**Multi-tenant Data Platform**: Configuration management for a platform serving multiple organizations:
- Environment-specific database credentials
- Organization-specific feature flags
- Cloud provider credentials (AWS, GCP, Azure) with automatic validation
- Data retention policies per environment

**ETL Pipeline Configuration**: Manage complex pipeline settings:
- Source and destination connection strings
- Transformation parameters (batch sizes, parallelism)
- Error handling thresholds
- Scheduling parameters

### Learning Resources

| Resource | Type | Link |
|----------|------|------|
| Pydantic Settings Documentation | Official Docs | https://docs.pydantic.dev/latest/concepts/pydantic_settings/ |
| 12-Factor App Configuration | Methodology | https://12factor.net/config |
| Python Configuration Management | Article | Real Python articles on config management |
| Pydantic V2 Migration Guide | Official Docs | https://docs.pydantic.dev/latest/migration/ |

### Difficulty Level

**Beginner to Intermediate** - Straightforward for those familiar with Pydantic models.

---

## 3. Logging, Monitoring, and Observability

### What is it?

Observability is the ability to understand a system's internal state by examining its outputs. The three pillars are:

1. **Logs**: Discrete events describing what happened
2. **Metrics**: Numerical measurements over time (counters, gauges, histograms)
3. **Traces**: Request flow across distributed services

**structlog** is a Python logging library that produces structured (JSON) logs, making them parseable and queryable. **OpenTelemetry** is a vendor-neutral standard for collecting telemetry data (traces, metrics, logs).

### Why it matters for Data Engineers

- **Pipeline Debugging**: Trace data flow through complex ETL/ELT pipelines
- **Performance Optimization**: Identify bottlenecks in data transformations
- **Data Quality Monitoring**: Track record counts, schema violations, null rates
- **SLA Compliance**: Measure and alert on pipeline latencies
- **Cost Attribution**: Track resource usage by pipeline, team, or customer

### Prerequisites

- Understanding of logging levels and concepts
- Basic knowledge of distributed systems
- Familiarity with JSON and log aggregation tools (ELK, Datadog, etc.)

### Implementation Example

```python
"""
Observability Setup with structlog and OpenTelemetry

This example demonstrates a production-ready observability configuration
for data engineering applications.
"""
import logging
import sys
from contextvars import ContextVar
from datetime import datetime
from typing import Any
from uuid import uuid4

import structlog
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor


# =============================================================================
# Context Variables for Request Correlation
# =============================================================================

# Context variables maintain state across async boundaries
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")
pipeline_id_ctx: ContextVar[str] = ContextVar("pipeline_id", default="")
organization_id_ctx: ContextVar[str] = ContextVar("organization_id", default="")


# =============================================================================
# structlog Configuration
# =============================================================================

def add_correlation_context(
    logger: logging.Logger,
    method_name: str,
    event_dict: dict[str, Any]
) -> dict[str, Any]:
    """
    structlog processor that adds correlation IDs to every log entry.
    This enables tracing related logs across distributed systems.
    """
    # Add context variables if set
    if correlation_id := correlation_id_ctx.get():
        event_dict["correlation_id"] = correlation_id
    if pipeline_id := pipeline_id_ctx.get():
        event_dict["pipeline_id"] = pipeline_id
    if organization_id := organization_id_ctx.get():
        event_dict["organization_id"] = organization_id

    # Add OpenTelemetry trace context
    span = trace.get_current_span()
    if span.is_recording():
        ctx = span.get_span_context()
        event_dict["trace_id"] = format(ctx.trace_id, "032x")
        event_dict["span_id"] = format(ctx.span_id, "016x")

    return event_dict


def add_service_context(
    logger: logging.Logger,
    method_name: str,
    event_dict: dict[str, Any]
) -> dict[str, Any]:
    """Add service-level context to logs."""
    event_dict["service"] = "data-pipeline-api"
    event_dict["version"] = "1.0.0"
    event_dict["environment"] = "production"
    return event_dict


def configure_structlog(json_logs: bool = True, log_level: str = "INFO"):
    """
    Configure structlog for production use.

    Args:
        json_logs: If True, output JSON (for production).
                   If False, output colored console (for development).
        log_level: Minimum log level to output.
    """
    # Shared processors for all configurations
    shared_processors = [
        structlog.contextvars.merge_contextvars,  # Merge context vars
        structlog.stdlib.add_log_level,           # Add level to event dict
        structlog.stdlib.add_logger_name,         # Add logger name
        structlog.processors.TimeStamper(fmt="iso"),  # ISO 8601 timestamps
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
        add_correlation_context,                   # Custom: correlation IDs
        add_service_context,                       # Custom: service context
    ]

    if json_logs:
        # Production: JSON output for log aggregation
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development: Colored console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(log_level)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging to use structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.getLevelName(log_level),
    )


# =============================================================================
# OpenTelemetry Configuration
# =============================================================================

def configure_opentelemetry(
    service_name: str = "data-pipeline-api",
    service_version: str = "1.0.0",
    otlp_endpoint: str = "localhost:4317",
):
    """
    Configure OpenTelemetry for distributed tracing and metrics.

    This setup sends telemetry to an OTLP-compatible backend
    (Jaeger, Grafana Tempo, Datadog, etc.)
    """
    # Create resource describing this service
    resource = Resource.create({
        SERVICE_NAME: service_name,
        SERVICE_VERSION: service_version,
        "deployment.environment": "production",
    })

    # ===================
    # Tracing Setup
    # ===================
    trace_provider = TracerProvider(resource=resource)

    # Export spans to OTLP endpoint
    otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
    trace_provider.add_span_processor(
        BatchSpanProcessor(otlp_exporter)
    )

    trace.set_tracer_provider(trace_provider)

    # ===================
    # Metrics Setup
    # ===================
    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(endpoint=otlp_endpoint, insecure=True),
        export_interval_millis=60000,  # Export every 60 seconds
    )

    meter_provider = MeterProvider(
        resource=resource,
        metric_readers=[metric_reader],
    )

    metrics.set_meter_provider(meter_provider)

    # ===================
    # Auto-instrumentation
    # ===================
    # Automatically trace database queries
    SQLAlchemyInstrumentor().instrument()

    # Automatically trace HTTP client requests
    HTTPXClientInstrumentor().instrument()

    return trace.get_tracer(service_name), metrics.get_meter(service_name)


# =============================================================================
# Custom Metrics for Data Engineering
# =============================================================================

class PipelineMetrics:
    """
    Custom metrics for data pipeline monitoring.

    Metrics types:
    - Counter: Cumulative values that only increase (records processed)
    - Histogram: Distribution of values (processing duration)
    - Gauge: Point-in-time values (queue depth)
    """

    def __init__(self, meter):
        # Counters
        self.records_processed = meter.create_counter(
            name="pipeline.records.processed",
            description="Total records processed",
            unit="records",
        )

        self.records_failed = meter.create_counter(
            name="pipeline.records.failed",
            description="Total records that failed processing",
            unit="records",
        )

        # Histograms
        self.batch_duration = meter.create_histogram(
            name="pipeline.batch.duration",
            description="Time to process a batch",
            unit="seconds",
        )

        self.batch_size = meter.create_histogram(
            name="pipeline.batch.size",
            description="Number of records in each batch",
            unit="records",
        )

        # Gauges (using observable gauge)
        self._queue_depth = 0
        meter.create_observable_gauge(
            name="pipeline.queue.depth",
            description="Current queue depth",
            unit="messages",
            callbacks=[lambda options: [
                metrics.Observation(self._queue_depth)
            ]],
        )

    def record_batch_processed(
        self,
        pipeline_id: str,
        record_count: int,
        duration_seconds: float,
        success: bool = True,
    ):
        """Record metrics for a processed batch."""
        attributes = {
            "pipeline_id": pipeline_id,
            "status": "success" if success else "failure",
        }

        if success:
            self.records_processed.add(record_count, attributes)
        else:
            self.records_failed.add(record_count, attributes)

        self.batch_duration.record(duration_seconds, attributes)
        self.batch_size.record(record_count, attributes)

    def set_queue_depth(self, depth: int):
        """Update current queue depth."""
        self._queue_depth = depth


# =============================================================================
# Logging Utility Functions
# =============================================================================

def get_logger(name: str = __name__) -> structlog.BoundLogger:
    """Get a configured structlog logger."""
    return structlog.get_logger(name)


class PipelineLogger:
    """
    High-level logging interface for data pipelines.

    Provides semantic logging methods that ensure consistent
    log structure across the application.
    """

    def __init__(self, pipeline_id: str, pipeline_name: str):
        self.logger = get_logger("pipeline")
        self.pipeline_id = pipeline_id
        self.pipeline_name = pipeline_name
        # Set context for all subsequent logs
        pipeline_id_ctx.set(pipeline_id)

    def pipeline_started(self, config: dict[str, Any]):
        """Log pipeline start event."""
        self.logger.info(
            "Pipeline started",
            pipeline_name=self.pipeline_name,
            config=config,
            event_type="pipeline.started",
        )

    def batch_processed(
        self,
        batch_id: str,
        record_count: int,
        duration_seconds: float,
    ):
        """Log successful batch processing."""
        self.logger.info(
            "Batch processed successfully",
            batch_id=batch_id,
            record_count=record_count,
            duration_seconds=round(duration_seconds, 3),
            records_per_second=round(record_count / duration_seconds, 2),
            event_type="batch.processed",
        )

    def batch_failed(
        self,
        batch_id: str,
        error: Exception,
        record_count: int,
    ):
        """Log batch processing failure."""
        self.logger.error(
            "Batch processing failed",
            batch_id=batch_id,
            record_count=record_count,
            error_type=type(error).__name__,
            error_message=str(error),
            event_type="batch.failed",
            exc_info=True,
        )

    def data_quality_issue(
        self,
        issue_type: str,
        affected_records: int,
        details: dict[str, Any],
    ):
        """Log data quality issues."""
        self.logger.warning(
            "Data quality issue detected",
            issue_type=issue_type,
            affected_records=affected_records,
            details=details,
            event_type="data_quality.issue",
        )

    def pipeline_completed(
        self,
        total_records: int,
        total_duration_seconds: float,
        status: str,
    ):
        """Log pipeline completion."""
        self.logger.info(
            "Pipeline completed",
            pipeline_name=self.pipeline_name,
            total_records=total_records,
            total_duration_seconds=round(total_duration_seconds, 3),
            status=status,
            event_type="pipeline.completed",
        )


# =============================================================================
# Tracing Decorator
# =============================================================================

def traced(
    span_name: str | None = None,
    record_args: bool = False,
):
    """
    Decorator to add OpenTelemetry tracing to functions.

    Usage:
        @traced("process_batch")
        async def process_batch(records: list[dict]) -> int:
            ...
    """
    def decorator(func):
        tracer = trace.get_tracer(__name__)
        name = span_name or func.__name__

        async def async_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(name) as span:
                if record_args:
                    span.set_attribute("args.count", len(args))
                    span.set_attribute("kwargs.keys", list(kwargs.keys()))
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("status", "error")
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise

        def sync_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(name) as span:
                if record_args:
                    span.set_attribute("args.count", len(args))
                    span.set_attribute("kwargs.keys", list(kwargs.keys()))
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("status", "error")
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# =============================================================================
# Usage Example
# =============================================================================

if __name__ == "__main__":
    import asyncio
    import time

    # Initialize observability
    configure_structlog(json_logs=False, log_level="DEBUG")  # Console for demo
    tracer, meter = configure_opentelemetry()
    pipeline_metrics = PipelineMetrics(meter)

    # Create pipeline logger
    pipeline_logger = PipelineLogger(
        pipeline_id="pipeline_123",
        pipeline_name="sales_data_etl"
    )

    # Set correlation ID for request
    correlation_id_ctx.set(str(uuid4()))

    # Log pipeline lifecycle
    pipeline_logger.pipeline_started({
        "source": "postgres",
        "destination": "snowflake",
        "batch_size": 10000,
    })

    # Simulate batch processing
    start_time = time.time()

    # Log batch processed
    duration = time.time() - start_time + 0.5
    pipeline_logger.batch_processed(
        batch_id="batch_001",
        record_count=10000,
        duration_seconds=duration,
    )

    # Record metrics
    pipeline_metrics.record_batch_processed(
        pipeline_id="pipeline_123",
        record_count=10000,
        duration_seconds=duration,
    )

    # Log completion
    pipeline_logger.pipeline_completed(
        total_records=10000,
        total_duration_seconds=duration,
        status="success",
    )
```

**Example JSON Log Output:**

```json
{
  "event": "Batch processed successfully",
  "timestamp": "2025-01-15T14:30:45.123456Z",
  "level": "info",
  "logger": "pipeline",
  "service": "data-pipeline-api",
  "version": "1.0.0",
  "environment": "production",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "pipeline_id": "pipeline_123",
  "trace_id": "1234567890abcdef1234567890abcdef",
  "span_id": "1234567890abcdef",
  "batch_id": "batch_001",
  "record_count": 10000,
  "duration_seconds": 2.345,
  "records_per_second": 4264.39,
  "event_type": "batch.processed"
}
```

### Real-world Application

**Distributed ETL Pipeline Monitoring**: For a pipeline spanning multiple services:
- Trace data flow from ingestion through transformation to warehouse loading
- Correlate logs across Airflow workers, Spark executors, and API services
- Alert on SLA breaches with precise root cause identification
- Build dashboards showing pipeline health and throughput

**Data Quality Observability**: Monitor data quality in real-time:
- Log schema violations with affected records
- Track null rates, duplicate rates, and value distributions
- Alert when quality metrics fall below thresholds
- Trace quality issues back to source systems

### Learning Resources

| Resource | Type | Link |
|----------|------|------|
| structlog Documentation | Official Docs | https://www.structlog.org/en/stable/ |
| OpenTelemetry Python | Official Docs | https://opentelemetry.io/docs/languages/python/ |
| Distributed Tracing Guide | Article | https://opentelemetry.io/docs/concepts/signals/traces/ |
| Grafana LGTM Stack | Tutorial | https://grafana.com/docs/grafana/latest/getting-started/ |
| Netflix Data Platform Observability | Engineering Blog | Netflix Tech Blog |

### Difficulty Level

**Intermediate to Advanced** - Requires understanding of distributed systems and observability concepts.

---

## 4. Graceful Shutdown and Lifecycle Management

### What is it?

Graceful shutdown is the process of cleanly terminating an application by:
1. Stopping acceptance of new work
2. Completing in-progress operations
3. Releasing resources (connections, file handles)
4. Persisting necessary state

Lifecycle management encompasses the entire application lifecycle: startup initialization, runtime health checks, and shutdown procedures. In Python async applications, this involves proper handling of asyncio tasks, signal handlers, and resource cleanup.

### Why it matters for Data Engineers

- **Data Integrity**: Prevent partial writes or corrupted data during deployments
- **Zero-Downtime Deployments**: Roll out updates without dropping requests or jobs
- **Resource Management**: Properly close database connections and file handles
- **Checkpoint Recovery**: Save pipeline state for resumption after restarts
- **Cost Optimization**: Clean shutdown prevents orphaned cloud resources

### Prerequisites

- Understanding of Python async/await and asyncio
- Familiarity with Unix signals (SIGTERM, SIGINT)
- Basic knowledge of context managers

### Implementation Example

```python
"""
Graceful Shutdown and Lifecycle Management

This example demonstrates production-ready lifecycle management
for a data engineering application with proper shutdown handling.
"""
import asyncio
import signal
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Coroutine

import structlog
from fastapi import FastAPI

logger = structlog.get_logger()


# =============================================================================
# Application State Management
# =============================================================================

class AppState(Enum):
    """Application lifecycle states."""
    STARTING = "starting"
    RUNNING = "running"
    SHUTTING_DOWN = "shutting_down"
    STOPPED = "stopped"


@dataclass
class ApplicationContext:
    """
    Centralized application context managing all resources.

    This pattern ensures consistent resource management and
    provides a single source of truth for application state.
    """
    state: AppState = AppState.STARTING
    started_at: datetime | None = None

    # Resource references (initialized during startup)
    db_pool: Any = None
    redis_client: Any = None
    kafka_producer: Any = None

    # Background tasks tracking
    background_tasks: set[asyncio.Task] = field(default_factory=set)

    # Shutdown coordination
    shutdown_event: asyncio.Event = field(default_factory=asyncio.Event)
    shutdown_timeout: float = 30.0  # seconds

    # Health check state
    is_healthy: bool = True
    health_details: dict[str, Any] = field(default_factory=dict)


# Global application context
app_context = ApplicationContext()


# =============================================================================
# Resource Lifecycle Management
# =============================================================================

class DatabasePool:
    """Simulated async database pool with lifecycle methods."""

    def __init__(self, connection_string: str, pool_size: int = 10):
        self.connection_string = connection_string
        self.pool_size = pool_size
        self.active_connections = 0
        self._closed = False

    async def initialize(self):
        """Initialize the connection pool."""
        logger.info(
            "Initializing database pool",
            pool_size=self.pool_size,
        )
        # Simulate pool initialization
        await asyncio.sleep(0.1)
        self.active_connections = self.pool_size
        logger.info("Database pool initialized")

    async def close(self):
        """
        Close all connections gracefully.
        Wait for active queries to complete before closing.
        """
        if self._closed:
            return

        logger.info(
            "Closing database pool",
            active_connections=self.active_connections,
        )

        # Wait for active connections to be released
        timeout = 10.0
        start = asyncio.get_event_loop().time()

        while self.active_connections > 0:
            if asyncio.get_event_loop().time() - start > timeout:
                logger.warning(
                    "Timeout waiting for connections to close",
                    remaining_connections=self.active_connections,
                )
                break
            await asyncio.sleep(0.1)

        self._closed = True
        logger.info("Database pool closed")

    async def health_check(self) -> bool:
        """Check if pool is healthy."""
        return not self._closed and self.active_connections > 0


class KafkaProducerWrapper:
    """Kafka producer with graceful shutdown support."""

    def __init__(self, bootstrap_servers: str):
        self.bootstrap_servers = bootstrap_servers
        self.pending_messages: list = []
        self._closed = False

    async def initialize(self):
        """Initialize Kafka producer."""
        logger.info("Initializing Kafka producer")
        await asyncio.sleep(0.1)
        logger.info("Kafka producer initialized")

    async def send(self, topic: str, message: dict):
        """Send message to Kafka topic."""
        if self._closed:
            raise RuntimeError("Producer is closed")
        self.pending_messages.append((topic, message))
        # Simulate send
        await asyncio.sleep(0.01)
        self.pending_messages.pop()

    async def flush(self, timeout: float = 5.0):
        """Flush all pending messages before shutdown."""
        logger.info(
            "Flushing Kafka producer",
            pending_messages=len(self.pending_messages),
        )

        start = asyncio.get_event_loop().time()
        while self.pending_messages:
            if asyncio.get_event_loop().time() - start > timeout:
                logger.warning(
                    "Timeout flushing Kafka messages",
                    dropped_messages=len(self.pending_messages),
                )
                break
            await asyncio.sleep(0.1)

        logger.info("Kafka producer flushed")

    async def close(self):
        """Close producer after flushing."""
        if self._closed:
            return
        await self.flush()
        self._closed = True
        logger.info("Kafka producer closed")


# =============================================================================
# Background Task Management
# =============================================================================

async def run_background_task(
    coro: Coroutine,
    name: str,
    context: ApplicationContext = app_context,
):
    """
    Run a coroutine as a tracked background task.

    Tasks are tracked so they can be properly cancelled during shutdown.
    """
    task = asyncio.create_task(coro, name=name)
    context.background_tasks.add(task)

    def on_done(t: asyncio.Task):
        context.background_tasks.discard(t)
        if t.cancelled():
            logger.info(f"Background task cancelled: {name}")
        elif t.exception():
            logger.error(
                f"Background task failed: {name}",
                error=str(t.exception()),
            )

    task.add_done_callback(on_done)
    return task


async def cancel_background_tasks(
    context: ApplicationContext,
    timeout: float = 10.0,
):
    """
    Cancel all background tasks with timeout.

    Gives tasks a chance to complete gracefully before forcing cancellation.
    """
    if not context.background_tasks:
        return

    logger.info(
        "Cancelling background tasks",
        task_count=len(context.background_tasks),
    )

    # Request cancellation for all tasks
    for task in context.background_tasks:
        task.cancel()

    # Wait for tasks to complete with timeout
    try:
        await asyncio.wait_for(
            asyncio.gather(*context.background_tasks, return_exceptions=True),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        logger.warning(
            "Timeout waiting for background tasks to cancel",
            remaining_tasks=len([t for t in context.background_tasks if not t.done()]),
        )


# =============================================================================
# Periodic Health Checker (Background Task Example)
# =============================================================================

async def health_check_loop(context: ApplicationContext):
    """
    Periodic health check that runs in the background.

    Demonstrates a background task that respects shutdown signals.
    """
    logger.info("Starting health check loop")

    while not context.shutdown_event.is_set():
        try:
            # Check all resources
            checks = {}

            if context.db_pool:
                checks["database"] = await context.db_pool.health_check()

            # Update health status
            context.is_healthy = all(checks.values())
            context.health_details = {
                "checks": checks,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Wait before next check, but wake up on shutdown
            try:
                await asyncio.wait_for(
                    context.shutdown_event.wait(),
                    timeout=30.0,  # Check every 30 seconds
                )
                break  # Shutdown signal received
            except asyncio.TimeoutError:
                continue  # Normal timeout, continue checking

        except Exception as e:
            logger.error("Health check failed", error=str(e))
            context.is_healthy = False
            await asyncio.sleep(5.0)

    logger.info("Health check loop stopped")


# =============================================================================
# Signal Handlers
# =============================================================================

def setup_signal_handlers(context: ApplicationContext):
    """
    Set up Unix signal handlers for graceful shutdown.

    SIGTERM: Kubernetes/Docker graceful shutdown signal
    SIGINT: Ctrl+C in terminal
    """
    loop = asyncio.get_event_loop()

    def handle_shutdown_signal(sig: signal.Signals):
        logger.info(f"Received shutdown signal: {sig.name}")
        context.shutdown_event.set()
        context.state = AppState.SHUTTING_DOWN

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(
            sig,
            lambda s=sig: handle_shutdown_signal(s)
        )

    logger.info("Signal handlers registered")


# =============================================================================
# FastAPI Lifespan Management
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for startup and shutdown.

    This is the recommended pattern for FastAPI applications
    (replacing the deprecated on_event decorators).
    """
    context = app_context

    # ===================
    # STARTUP
    # ===================
    logger.info("Application starting")
    context.state = AppState.STARTING
    context.started_at = datetime.utcnow()

    try:
        # Initialize resources in dependency order

        # 1. Database pool (no dependencies)
        context.db_pool = DatabasePool(
            connection_string="postgresql://localhost/data",
            pool_size=20,
        )
        await context.db_pool.initialize()

        # 2. Kafka producer (no dependencies)
        context.kafka_producer = KafkaProducerWrapper(
            bootstrap_servers="localhost:9092",
        )
        await context.kafka_producer.initialize()

        # 3. Set up signal handlers
        setup_signal_handlers(context)

        # 4. Start background tasks
        await run_background_task(
            health_check_loop(context),
            name="health_check",
        )

        # Mark as running
        context.state = AppState.RUNNING
        logger.info(
            "Application started successfully",
            started_at=context.started_at.isoformat(),
        )

        yield  # Application runs here

    finally:
        # ===================
        # SHUTDOWN
        # ===================
        logger.info("Application shutting down")
        context.state = AppState.SHUTTING_DOWN

        # Signal shutdown to all components
        context.shutdown_event.set()

        # 1. Cancel background tasks first
        await cancel_background_tasks(context, timeout=10.0)

        # 2. Close resources in reverse dependency order

        # Close Kafka producer (flush pending messages)
        if context.kafka_producer:
            await context.kafka_producer.close()

        # Close database pool (wait for active queries)
        if context.db_pool:
            await context.db_pool.close()

        context.state = AppState.STOPPED
        logger.info("Application shutdown complete")


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="Data Pipeline API",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check():
    """
    Health check endpoint for Kubernetes probes.

    Returns:
        - 200 if healthy
        - 503 if unhealthy or shutting down
    """
    context = app_context

    if context.state == AppState.SHUTTING_DOWN:
        return {
            "status": "shutting_down",
            "message": "Application is shutting down",
        }

    if not context.is_healthy:
        return {
            "status": "unhealthy",
            "details": context.health_details,
        }

    return {
        "status": "healthy",
        "uptime_seconds": (
            datetime.utcnow() - context.started_at
        ).total_seconds() if context.started_at else 0,
        "details": context.health_details,
    }


@app.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes.

    Indicates if the application is ready to receive traffic.
    """
    context = app_context

    # Not ready if shutting down
    if context.state != AppState.RUNNING:
        return {"ready": False, "state": context.state.value}

    # Check if all resources are available
    ready = (
        context.db_pool is not None and
        context.kafka_producer is not None and
        context.is_healthy
    )

    return {"ready": ready, "state": context.state.value}


# =============================================================================
# Pipeline Execution with Checkpoint Support
# =============================================================================

@dataclass
class PipelineCheckpoint:
    """Checkpoint for resumable pipeline execution."""
    pipeline_id: str
    last_processed_offset: int
    last_checkpoint_time: datetime
    state: dict[str, Any]


class CheckpointManager:
    """
    Manages pipeline checkpoints for crash recovery.

    In production, checkpoints would be stored in a durable store
    (Redis, database, S3) rather than in-memory.
    """

    def __init__(self):
        self.checkpoints: dict[str, PipelineCheckpoint] = {}

    async def save_checkpoint(
        self,
        pipeline_id: str,
        offset: int,
        state: dict[str, Any],
    ):
        """Save checkpoint to durable storage."""
        checkpoint = PipelineCheckpoint(
            pipeline_id=pipeline_id,
            last_processed_offset=offset,
            last_checkpoint_time=datetime.utcnow(),
            state=state,
        )
        self.checkpoints[pipeline_id] = checkpoint
        logger.info(
            "Checkpoint saved",
            pipeline_id=pipeline_id,
            offset=offset,
        )

    async def load_checkpoint(
        self,
        pipeline_id: str,
    ) -> PipelineCheckpoint | None:
        """Load checkpoint from storage."""
        return self.checkpoints.get(pipeline_id)


async def run_pipeline_with_graceful_shutdown(
    pipeline_id: str,
    total_records: int,
    context: ApplicationContext = app_context,
):
    """
    Example pipeline that handles graceful shutdown.

    Key patterns:
    1. Check shutdown signal regularly
    2. Save checkpoints at batch boundaries
    3. Clean up resources on shutdown
    """
    checkpoint_manager = CheckpointManager()

    # Load checkpoint if exists (for recovery)
    checkpoint = await checkpoint_manager.load_checkpoint(pipeline_id)
    start_offset = checkpoint.last_processed_offset if checkpoint else 0

    logger.info(
        "Starting pipeline",
        pipeline_id=pipeline_id,
        start_offset=start_offset,
    )

    batch_size = 1000
    current_offset = start_offset

    try:
        while current_offset < total_records:
            # Check for shutdown signal before processing each batch
            if context.shutdown_event.is_set():
                logger.info(
                    "Shutdown signal received, saving checkpoint",
                    pipeline_id=pipeline_id,
                    current_offset=current_offset,
                )
                await checkpoint_manager.save_checkpoint(
                    pipeline_id=pipeline_id,
                    offset=current_offset,
                    state={"status": "interrupted"},
                )
                return {"status": "interrupted", "offset": current_offset}

            # Process batch
            batch_end = min(current_offset + batch_size, total_records)

            # Simulate processing
            await asyncio.sleep(0.1)

            logger.info(
                "Batch processed",
                pipeline_id=pipeline_id,
                batch_start=current_offset,
                batch_end=batch_end,
            )

            current_offset = batch_end

            # Save checkpoint after each batch
            await checkpoint_manager.save_checkpoint(
                pipeline_id=pipeline_id,
                offset=current_offset,
                state={"status": "in_progress"},
            )

        # Pipeline completed successfully
        return {"status": "completed", "total_processed": current_offset}

    except Exception as e:
        # Save checkpoint on error for recovery
        await checkpoint_manager.save_checkpoint(
            pipeline_id=pipeline_id,
            offset=current_offset,
            state={"status": "error", "error": str(e)},
        )
        raise


# =============================================================================
# Run Application
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        # Uvicorn will forward SIGTERM to the application
        # and wait for graceful shutdown
        timeout_graceful_shutdown=30,
    )
```

### Real-world Application

**Kubernetes Deployment**: Deploy data APIs with zero-downtime updates:
- Configure liveness and readiness probes
- Handle SIGTERM from Kubernetes during pod termination
- Drain connections before shutdown
- Support rolling deployments

**Long-running ETL Jobs**: Manage batch jobs that may be interrupted:
- Checkpoint progress regularly
- Resume from last checkpoint after restart
- Handle spot instance termination warnings
- Clean up partial outputs on failure

### Learning Resources

| Resource | Type | Link |
|----------|------|------|
| FastAPI Lifespan Events | Official Docs | https://fastapi.tiangolo.com/advanced/events/ |
| Kubernetes Pod Lifecycle | Docs | https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ |
| Python asyncio Shutdown | Docs | https://docs.python.org/3/library/asyncio-task.html |
| Graceful Shutdown Guide | Article | https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https |
| Stripe Engineering Blog | Engineering Blog | Stripe's approach to graceful degradation |

### Difficulty Level

**Intermediate to Advanced** - Requires solid understanding of async programming and system signals.

---

## 5. Service Containers and Dependency Injection

### What is it?

A Service Container (also known as IoC Container or DI Container) is a pattern that manages object creation and dependency resolution. Instead of components creating their dependencies directly, they declare what they need, and the container provides the appropriate implementations.

This pattern extends beyond FastAPI's built-in DI by providing:
- Centralized configuration of all services
- Singleton vs. transient lifetime management
- Easy swapping of implementations (production vs. test)
- Lazy initialization
- Circular dependency detection

### Why it matters for Data Engineers

- **Testability**: Swap production databases for test doubles without code changes
- **Flexibility**: Change implementations (e.g., switch from PostgreSQL to Snowflake) via configuration
- **Organization**: Clear service boundaries in large codebases
- **Resource Efficiency**: Share expensive resources (connection pools) as singletons
- **Modularity**: Build reusable data processing components

### Prerequisites

- Strong understanding of OOP and SOLID principles
- Experience with the Factory pattern
- Familiarity with Python typing and generics

### Implementation Example

```python
"""
Service Container and Dependency Injection Pattern

This example demonstrates a production-ready service container
for managing complex dependencies in data engineering applications.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Generic, Type, TypeVar, get_type_hints
from functools import wraps
import inspect


# =============================================================================
# Service Lifetime Management
# =============================================================================

class ServiceLifetime(Enum):
    """Defines how long a service instance lives."""
    SINGLETON = "singleton"    # One instance for entire application
    TRANSIENT = "transient"    # New instance for each resolution
    SCOPED = "scoped"          # One instance per scope (e.g., per request)


T = TypeVar("T")


@dataclass
class ServiceDescriptor:
    """Describes how to create a service."""
    service_type: Type
    implementation: Type | Callable | Any
    lifetime: ServiceLifetime
    instance: Any = None  # For singletons


# =============================================================================
# Service Container Implementation
# =============================================================================

class ServiceContainer:
    """
    Inversion of Control (IoC) container for dependency management.

    This container handles:
    - Service registration with different lifetimes
    - Automatic dependency resolution
    - Scoped services for request isolation
    - Interface-to-implementation mapping
    """

    def __init__(self):
        self._services: dict[Type, ServiceDescriptor] = {}
        self._scoped_instances: dict[Type, Any] = {}
        self._in_scope: bool = False

    # ===================
    # Registration Methods
    # ===================

    def register_singleton(
        self,
        service_type: Type[T],
        implementation: Type[T] | Callable[..., T] | T | None = None,
    ) -> "ServiceContainer":
        """
        Register a singleton service.

        The same instance is returned for all resolutions.

        Usage:
            container.register_singleton(DatabasePool)
            container.register_singleton(IDataStore, PostgresDataStore)
            container.register_singleton(Config, config_instance)
        """
        impl = implementation or service_type
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            implementation=impl,
            lifetime=ServiceLifetime.SINGLETON,
            instance=impl if not callable(impl) or isinstance(impl, type) is False else None,
        )
        return self

    def register_transient(
        self,
        service_type: Type[T],
        implementation: Type[T] | Callable[..., T] | None = None,
    ) -> "ServiceContainer":
        """
        Register a transient service.

        A new instance is created for each resolution.
        """
        impl = implementation or service_type
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            implementation=impl,
            lifetime=ServiceLifetime.TRANSIENT,
        )
        return self

    def register_scoped(
        self,
        service_type: Type[T],
        implementation: Type[T] | Callable[..., T] | None = None,
    ) -> "ServiceContainer":
        """
        Register a scoped service.

        One instance per scope (e.g., per HTTP request).
        """
        impl = implementation or service_type
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            implementation=impl,
            lifetime=ServiceLifetime.SCOPED,
        )
        return self

    def register_factory(
        self,
        service_type: Type[T],
        factory: Callable[["ServiceContainer"], T],
        lifetime: ServiceLifetime = ServiceLifetime.TRANSIENT,
    ) -> "ServiceContainer":
        """
        Register a factory function for complex initialization.

        The factory receives the container for resolving dependencies.
        """
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            implementation=factory,
            lifetime=lifetime,
        )
        return self

    # ===================
    # Resolution Methods
    # ===================

    def resolve(self, service_type: Type[T]) -> T:
        """
        Resolve a service by type.

        Automatically resolves constructor dependencies.
        """
        if service_type not in self._services:
            raise ServiceNotFoundError(
                f"Service {service_type.__name__} not registered"
            )

        descriptor = self._services[service_type]

        # Handle different lifetimes
        if descriptor.lifetime == ServiceLifetime.SINGLETON:
            if descriptor.instance is not None:
                return descriptor.instance
            instance = self._create_instance(descriptor)
            descriptor.instance = instance
            return instance

        elif descriptor.lifetime == ServiceLifetime.SCOPED:
            if not self._in_scope:
                raise ScopeError(
                    f"Cannot resolve scoped service {service_type.__name__} "
                    "outside of a scope"
                )
            if service_type in self._scoped_instances:
                return self._scoped_instances[service_type]
            instance = self._create_instance(descriptor)
            self._scoped_instances[service_type] = instance
            return instance

        else:  # TRANSIENT
            return self._create_instance(descriptor)

    def _create_instance(self, descriptor: ServiceDescriptor) -> Any:
        """Create an instance, resolving constructor dependencies."""
        impl = descriptor.implementation

        # If it's already an instance, return it
        if not callable(impl):
            return impl

        # If it's a factory function (not a class)
        if not isinstance(impl, type):
            sig = inspect.signature(impl)
            if sig.parameters and list(sig.parameters.keys())[0] in ('container', 'c'):
                return impl(self)
            return impl()

        # It's a class - resolve constructor dependencies
        type_hints = get_type_hints(impl.__init__) if hasattr(impl, '__init__') else {}

        # Remove 'return' from hints if present
        type_hints.pop('return', None)

        # Resolve each dependency
        kwargs = {}
        for param_name, param_type in type_hints.items():
            if param_type in self._services:
                kwargs[param_name] = self.resolve(param_type)

        return impl(**kwargs)

    # ===================
    # Scope Management
    # ===================

    def create_scope(self) -> "ServiceScope":
        """
        Create a new scope for scoped services.

        Usage:
            with container.create_scope() as scope:
                service = scope.resolve(ScopedService)
        """
        return ServiceScope(self)

    def _enter_scope(self):
        """Enter a scope."""
        self._in_scope = True
        self._scoped_instances = {}

    def _exit_scope(self):
        """Exit scope and clean up scoped instances."""
        self._in_scope = False
        self._scoped_instances = {}


class ServiceScope:
    """Context manager for scoped service resolution."""

    def __init__(self, container: ServiceContainer):
        self._container = container

    def __enter__(self) -> ServiceContainer:
        self._container._enter_scope()
        return self._container

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._container._exit_scope()
        return False

    def resolve(self, service_type: Type[T]) -> T:
        return self._container.resolve(service_type)


class ServiceNotFoundError(Exception):
    """Raised when a service is not registered."""
    pass


class ScopeError(Exception):
    """Raised when scope operations are invalid."""
    pass


# =============================================================================
# Abstract Interfaces (Contracts)
# =============================================================================

class IDataStore(ABC):
    """Interface for data storage operations."""

    @abstractmethod
    async def read(self, query: str) -> list[dict]:
        """Execute a read query."""
        pass

    @abstractmethod
    async def write(self, table: str, records: list[dict]) -> int:
        """Write records to a table."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check connection health."""
        pass


class ICache(ABC):
    """Interface for caching operations."""

    @abstractmethod
    async def get(self, key: str) -> Any | None:
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        pass


class IMessageQueue(ABC):
    """Interface for message queue operations."""

    @abstractmethod
    async def publish(self, topic: str, message: dict) -> None:
        pass

    @abstractmethod
    async def subscribe(self, topic: str, handler: Callable) -> None:
        pass


# =============================================================================
# Concrete Implementations
# =============================================================================

class PostgresDataStore(IDataStore):
    """PostgreSQL implementation of IDataStore."""

    def __init__(self, connection_string: str = "postgresql://localhost/data"):
        self.connection_string = connection_string
        self._connected = False

    async def connect(self):
        """Initialize connection pool."""
        # In production: create actual connection pool
        self._connected = True

    async def read(self, query: str) -> list[dict]:
        if not self._connected:
            await self.connect()
        # Simulate query execution
        return [{"id": 1, "data": "sample"}]

    async def write(self, table: str, records: list[dict]) -> int:
        if not self._connected:
            await self.connect()
        # Simulate write
        return len(records)

    async def health_check(self) -> bool:
        return self._connected


class SnowflakeDataStore(IDataStore):
    """Snowflake implementation of IDataStore."""

    def __init__(
        self,
        account: str = "account",
        warehouse: str = "COMPUTE_WH",
    ):
        self.account = account
        self.warehouse = warehouse
        self._connected = False

    async def read(self, query: str) -> list[dict]:
        # Snowflake-specific implementation
        return [{"id": 1, "data": "from_snowflake"}]

    async def write(self, table: str, records: list[dict]) -> int:
        # Snowflake-specific write with staging
        return len(records)

    async def health_check(self) -> bool:
        return True


class RedisCache(ICache):
    """Redis implementation of ICache."""

    def __init__(self, host: str = "localhost", port: int = 6379):
        self.host = host
        self.port = port
        self._cache: dict = {}  # Simulated

    async def get(self, key: str) -> Any | None:
        return self._cache.get(key)

    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        self._cache[key] = value

    async def delete(self, key: str) -> None:
        self._cache.pop(key, None)


class InMemoryCache(ICache):
    """In-memory cache for testing."""

    def __init__(self):
        self._cache: dict = {}

    async def get(self, key: str) -> Any | None:
        return self._cache.get(key)

    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        self._cache[key] = value

    async def delete(self, key: str) -> None:
        self._cache.pop(key, None)


# =============================================================================
# High-Level Services Using Dependencies
# =============================================================================

class DataPipelineService:
    """
    High-level service that depends on abstractions.

    This service doesn't know whether it's using Postgres or Snowflake,
    Redis or in-memory cache - that's determined by container configuration.
    """

    def __init__(
        self,
        data_store: IDataStore,
        cache: ICache,
    ):
        self.data_store = data_store
        self.cache = cache

    async def process_data(
        self,
        source_query: str,
        destination_table: str,
    ) -> dict:
        """
        Read data from source, process it, and write to destination.
        """
        # Check cache first
        cache_key = f"pipeline:{hash(source_query)}"
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            return {"status": "cached", "records": 0}

        # Read from source
        records = await self.data_store.read(source_query)

        # Process records (transformation logic here)
        processed = [
            {**record, "processed_at": "2025-01-15"}
            for record in records
        ]

        # Write to destination
        written = await self.data_store.write(destination_table, processed)

        # Cache result
        await self.cache.set(cache_key, {"written": written}, ttl=3600)

        return {"status": "success", "records": written}


class FeatureStoreService:
    """Feature store service for ML feature serving."""

    def __init__(
        self,
        data_store: IDataStore,
        cache: ICache,
    ):
        self.data_store = data_store
        self.cache = cache

    async def get_features(
        self,
        entity_id: str,
        feature_names: list[str],
    ) -> dict[str, Any]:
        """Get features for an entity."""
        # Try cache first
        cache_key = f"features:{entity_id}:{','.join(sorted(feature_names))}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        # Fetch from feature store
        query = f"SELECT {', '.join(feature_names)} FROM features WHERE entity_id = '{entity_id}'"
        results = await self.data_store.read(query)

        if results:
            features = results[0]
            await self.cache.set(cache_key, features, ttl=300)
            return features

        return {}


# =============================================================================
# Container Configuration
# =============================================================================

def configure_production_container() -> ServiceContainer:
    """Configure container for production environment."""
    container = ServiceContainer()

    # Register implementations for abstractions
    container.register_singleton(
        IDataStore,
        lambda c: PostgresDataStore(
            connection_string="postgresql://prod-host/data"
        ),
    )

    container.register_singleton(
        ICache,
        lambda c: RedisCache(host="redis-prod", port=6379),
    )

    # Register high-level services (auto-resolves dependencies)
    container.register_transient(DataPipelineService)
    container.register_transient(FeatureStoreService)

    return container


def configure_test_container() -> ServiceContainer:
    """Configure container for testing with test doubles."""
    container = ServiceContainer()

    # Use in-memory implementations for testing
    container.register_singleton(IDataStore, PostgresDataStore)  # Could use mock
    container.register_singleton(ICache, InMemoryCache)

    container.register_transient(DataPipelineService)
    container.register_transient(FeatureStoreService)

    return container


def configure_snowflake_container() -> ServiceContainer:
    """Configure container with Snowflake backend."""
    container = ServiceContainer()

    container.register_singleton(
        IDataStore,
        lambda c: SnowflakeDataStore(
            account="xy12345.us-east-1",
            warehouse="ANALYTICS_WH",
        ),
    )

    container.register_singleton(
        ICache,
        lambda c: RedisCache(host="redis-cluster", port=6379),
    )

    container.register_transient(DataPipelineService)
    container.register_transient(FeatureStoreService)

    return container


# =============================================================================
# FastAPI Integration
# =============================================================================

from fastapi import FastAPI, Depends, Request

# Global container (configured at startup)
container: ServiceContainer | None = None


def get_container() -> ServiceContainer:
    """Get the configured container."""
    if container is None:
        raise RuntimeError("Container not configured")
    return container


def get_pipeline_service(
    c: ServiceContainer = Depends(get_container),
) -> DataPipelineService:
    """FastAPI dependency that resolves pipeline service."""
    return c.resolve(DataPipelineService)


def get_feature_service(
    c: ServiceContainer = Depends(get_container),
) -> FeatureStoreService:
    """FastAPI dependency that resolves feature service."""
    return c.resolve(FeatureStoreService)


# FastAPI app with container integration
app = FastAPI(title="Data Platform API")


@app.on_event("startup")
async def startup():
    """Initialize container on startup."""
    global container
    # Could be determined by environment variable
    container = configure_production_container()


@app.post("/pipeline/run")
async def run_pipeline(
    source_query: str,
    destination_table: str,
    pipeline_service: DataPipelineService = Depends(get_pipeline_service),
):
    """Run a data pipeline."""
    result = await pipeline_service.process_data(source_query, destination_table)
    return result


@app.get("/features/{entity_id}")
async def get_features(
    entity_id: str,
    features: str,  # Comma-separated feature names
    feature_service: FeatureStoreService = Depends(get_feature_service),
):
    """Get features for an entity."""
    feature_names = features.split(",")
    return await feature_service.get_features(entity_id, feature_names)


# =============================================================================
# Usage Example
# =============================================================================

async def main():
    """Demonstrate container usage."""
    # Configure for production
    container = configure_production_container()

    # Resolve services - dependencies are automatically injected
    pipeline_service = container.resolve(DataPipelineService)
    feature_service = container.resolve(FeatureStoreService)

    # Use services
    result = await pipeline_service.process_data(
        source_query="SELECT * FROM raw_events",
        destination_table="processed_events",
    )
    print(f"Pipeline result: {result}")

    # For testing - just swap the container
    test_container = configure_test_container()
    test_pipeline = test_container.resolve(DataPipelineService)
    # Same code works with different implementations

    # Scoped services example
    with container.create_scope() as scope:
        # Scoped services are isolated within this scope
        pass


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### Real-world Application

**Multi-Cloud Data Platform**: Build a data platform that can run on different cloud providers:
- Register cloud-specific implementations (AWS S3, GCP GCS, Azure Blob)
- Swap providers via configuration without code changes
- Use interfaces for vendor-agnostic business logic

**Testing Data Pipelines**: Comprehensive testing strategy:
- Swap production databases for in-memory stores
- Mock external APIs (Salesforce, Stripe) with test doubles
- Run integration tests with local containers
- Verify business logic independently of infrastructure

### Learning Resources

| Resource | Type | Link |
|----------|------|------|
| Dependency Injection in Python | Talk | PyCon talks on DI |
| SOLID Principles | Article | https://realpython.com/solid-principles-python/ |
| Dependency Injector Library | GitHub | https://github.com/ets-labs/python-dependency-injector |
| Clean Architecture in Python | Book | Architecture Patterns with Python (O'Reilly) |
| Martin Fowler on DI | Article | https://martinfowler.com/articles/injection.html |

### Difficulty Level

**Advanced** - Requires strong OOP fundamentals and understanding of design patterns.

---

## Summary

This guide covered five essential patterns for building production-grade Python applications in data engineering:

| Pattern | Key Benefit | When to Use |
|---------|-------------|-------------|
| **FastAPI Dependency Injection** | Automatic dependency resolution, testability | Building data APIs, pipeline orchestration |
| **Pydantic Settings** | Type-safe configuration, validation at startup | Any application needing environment-based config |
| **Observability (structlog + OpenTelemetry)** | Debugging distributed systems, SLA monitoring | Production systems requiring visibility |
| **Graceful Shutdown** | Data integrity, zero-downtime deployments | Long-running jobs, Kubernetes deployments |
| **Service Containers** | Loose coupling, swappable implementations | Large codebases, multi-environment deployments |

### Key Takeaways

1. **Start with Configuration**: Use Pydantic Settings from day one. It's low effort and prevents configuration bugs.

2. **Build for Observability**: Structured logging and tracing are essential for debugging production issues. Add them early.

3. **Design for Graceful Shutdown**: Data pipelines must handle interruptions gracefully. Implement checkpointing for long-running jobs.

4. **Use Abstractions**: Depend on interfaces, not implementations. This enables testing and flexibility.

5. **Leverage Type Hints**: Python's type system, combined with these patterns, catches bugs early and improves maintainability.

---

## References

### Official Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [structlog Documentation](https://www.structlog.org/en/stable/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/)
- [Python asyncio](https://docs.python.org/3/library/asyncio.html)

### Engineering Blogs

- [Netflix Tech Blog](https://netflixtechblog.com/) - Observability and resilience patterns
- [Stripe Engineering Blog](https://stripe.com/blog/engineering) - API design and reliability
- [Uber Engineering Blog](https://eng.uber.com/) - Data platform architecture
- [Spotify Engineering Blog](https://engineering.atspotify.com/) - Data infrastructure
- [Airbnb Engineering Blog](https://medium.com/airbnb-engineering) - Data quality and pipelines

### Books

- "Architecture Patterns with Python" by Harry Percival and Bob Gregory (O'Reilly)
- "Robust Python" by Patrick Viafore (O'Reilly)
- "Python Testing with pytest" by Brian Okken (Pragmatic)

### Community Resources

- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [Awesome Python](https://github.com/vinta/awesome-python)
- [Real Python Tutorials](https://realpython.com/)

---

*Last updated: January 2025*
