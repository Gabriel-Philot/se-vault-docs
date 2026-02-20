FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd -m -s /bin/bash sandbox \
    && mkdir -p /tmp/sandbox \
    && chown sandbox:sandbox /tmp/sandbox

COPY main.py .

RUN chmod 444 /app/main.py

EXPOSE 8001

USER sandbox

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
