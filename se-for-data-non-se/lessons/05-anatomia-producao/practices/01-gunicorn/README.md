# Prática 01 — Web Server vs App Server

## O que você vai ver

- Gunicorn gerenciando 4 workers Uvicorn (processo master + workers)
- Nginx na frente como reverse proxy
- Diferença entre acessar via Nginx (porta 80) e direto no Gunicorn (porta 8000)
- Load balancing entre workers (PIDs diferentes a cada request)

## Subir

```bash
docker compose up --build
```

## Testar

### 1. Ver worker PID alternando (load balancing)

```bash
# Faça vários requests e observe o worker_pid mudando
for i in {1..8}; do
  curl -s http://localhost/workers | python3 -m json.tool | grep worker_pid
done
```

Os PIDs vão alternar entre os 4 workers.

### 2. Comparar Nginx vs direto

```bash
# Via Nginx (produção)
curl -s http://localhost/

# Direto no Gunicorn (bypass — não faça em prod)
curl -s http://localhost:8000/
```

Mesmo resultado, mas via Nginx você tem rate limiting, logs, headers extras.

### 3. Testar resiliência com endpoint lento

```bash
# Em um terminal: request lento (2s)
curl http://localhost/slow &

# Em outro terminal: request normal (deve responder imediato)
curl http://localhost/
```

Com 4 workers, o request lento ocupa 1 worker, mas os outros 3 continuam atendendo.

### 4. Ver rate limiting do Nginx

```bash
# Dispara 30 requests rápidos — Nginx vai bloquear após burst
for i in {1..30}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost/
done
```

Vai começar a retornar `503` quando exceder o rate limit.

### 5. Ver logs do Nginx

```bash
docker compose logs nginx
```

Observe o formato do log com upstream response time.

## Limpar

```bash
docker compose down
```

## O que aprender

| Observação | Conclusão |
|------------|-----------|
| PIDs alternando | Gunicorn distribui requests entre workers |
| `/slow` não trava tudo | Múltiplos workers = resiliência |
| Rate limit 503 | Nginx protege o app server |
| Logs com upstream time | Nginx mede tempo do backend |
