FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY base/tracker.py /app/tracker.py
COPY polars/pyproject.toml .
RUN uv pip install --system fastapi uvicorn polars
COPY polars/racer.py .
CMD ["uvicorn", "racer:app", "--host", "0.0.0.0", "--port", "8003"]
