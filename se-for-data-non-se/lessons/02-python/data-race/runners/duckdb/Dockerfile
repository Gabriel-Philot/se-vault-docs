FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY base/tracker.py /app/tracker.py
COPY duckdb/pyproject.toml .
RUN uv pip install --system fastapi uvicorn duckdb
COPY duckdb/racer.py .
CMD ["uvicorn", "racer:app", "--host", "0.0.0.0", "--port", "8004"]
