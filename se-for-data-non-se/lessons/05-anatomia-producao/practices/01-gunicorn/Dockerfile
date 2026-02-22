FROM python:3.12-slim

WORKDIR /app

# Instala uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copia dependências e instala
COPY pyproject.toml .
RUN uv sync --no-dev

COPY main.py .

# Gunicorn com Uvicorn workers — o padrão de produção
# - 4 workers (simula múltiplos processos)
# - bind em 0.0.0.0:8000
CMD ["uv", "run", "gunicorn", "main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "4", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-"]
