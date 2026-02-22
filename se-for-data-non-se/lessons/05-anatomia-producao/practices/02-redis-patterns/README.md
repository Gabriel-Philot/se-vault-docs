# Prática 02 — Redis Patterns para Dados

## O que você vai ver

4 padrões de Redis que aparecem em aplicações de dados:

1. **Cache com TTL** — cache-aside, invalidação, TTL restante
2. **Rate limiting** — limitar requests por IP usando INCR + EXPIRE
3. **Feature store** — features pré-computadas para ML em tempo real
4. **Leaderboard** — contadores e ranking com sorted sets

## Subir

```bash
docker compose up --build
```

Swagger UI: http://localhost:8000/docs

## Testar

### 1. Cache com TTL

```bash
# Primeiro request — cache MISS (demora ~500ms)
curl -s http://localhost:8000/products | python3 -m json.tool
# source: "database_slow"

# Segundo request — cache HIT (instantâneo)
curl -s http://localhost:8000/products | python3 -m json.tool
# source: "redis_cache", ttl_remaining: 28

# Invalidar cache (simula write no banco)
curl -s -X DELETE http://localhost:8000/products/cache | python3 -m json.tool

# Próximo request — cache MISS de novo
curl -s http://localhost:8000/products | python3 -m json.tool
```

### 2. Rate limiting

```bash
# 5 requests permitidos por minuto
for i in {1..7}; do
  echo "Request $i:"
  curl -s http://localhost:8000/limited | python3 -m json.tool
  echo
done
# Requests 6 e 7 retornam 429 Too Many Requests
```

### 3. Feature store (ML)

```bash
# Ler features pré-computadas de um usuário
curl -s http://localhost:8000/features/1 | python3 -m json.tool
curl -s http://localhost:8000/features/4 | python3 -m json.tool

# Predição usando features do Redis
curl -s -X POST http://localhost:8000/predict/1 | python3 -m json.tool
curl -s -X POST http://localhost:8000/predict/4 | python3 -m json.tool
# Alice (compra muito, recente) → baixo churn
# Dave (compra pouco, 45 dias sem comprar) → alto churn
```

### 4. Leaderboard

```bash
# Registrar eventos
curl -s -X POST http://localhost:8000/events/page_view | python3 -m json.tool
curl -s -X POST http://localhost:8000/events/page_view | python3 -m json.tool
curl -s -X POST http://localhost:8000/events/add_to_cart | python3 -m json.tool
curl -s -X POST http://localhost:8000/events/purchase | python3 -m json.tool
curl -s -X POST http://localhost:8000/events/page_view | python3 -m json.tool

# Ver ranking
curl -s http://localhost:8000/leaderboard | python3 -m json.tool
```

### 5. Debug — ver todas as chaves do Redis

```bash
curl -s http://localhost:8000/debug/keys | python3 -m json.tool
```

Mostra todas as chaves, seus tipos e TTLs.

## Limpar

```bash
docker compose down
```

## O que aprender

| Padrão | Estrutura Redis | Caso de uso em dados |
|--------|----------------|---------------------|
| Cache-aside | STRING + TTL | Dashboard queries, API responses |
| Rate limiting | STRING + INCR + EXPIRE | Proteger APIs de ML |
| Feature store | HASH | Features pré-computadas para inferência |
| Leaderboard | SORTED SET | Contadores de eventos, rankings |
