# Caching com Redis: A Memória Rápida da Aplicação

Este guia explica o conceito de cache, por que Redis é o padrão da indústria, e onde profissionais de dados já usam cache sem saber.

> **Nota:** Na aula 04 você viu Redis na prática (cache de endpoints). Aqui vamos entender o **porquê arquitetural** e os cenários além de APIs.

---

## 0. O Problema: Por Que Cache Existe

Toda aplicação tem operações caras:
*   Query no banco: ~50ms
*   Chamar API externa: ~200ms
*   Agregação de dados: ~500ms
*   Inferência de modelo ML: ~100ms

Se 1000 usuários pedem a mesma coisa no mesmo minuto, você executa a operação 1000 vezes? **Não.** Você guarda o resultado e reutiliza.

### A analogia

Imagine que você trabalha num escritório e precisa consultar um arquivo no arquivo morto (banco de dados) — demora 5 minutos cada ida. Se 10 pessoas pedem o mesmo documento no mesmo dia, você vai 10 vezes? Ou xeroca o documento e deixa na sua mesa (cache)?

---

## 1. O Que é Redis

**Redis** = **Re**mote **Di**ctionary **S**erver

*   **Key-value store** que roda em memória (RAM).
*   Acesso em **<1ms** (vs ~50ms de um banco relacional).
*   Suporta estruturas de dados: strings, hashes, listas, sets, sorted sets.
*   Single-threaded por design — sem problemas de concorrência no acesso.
*   Persistência opcional (snapshots RDB, append-only file AOF).

### Redis vs Banco Relacional

| Aspecto | Redis | PostgreSQL |
|---------|-------|------------|
| Armazenamento | RAM | Disco |
| Latência | <1ms | ~5-50ms |
| Modelo | Key-value | Relacional |
| Durabilidade | Opcional | Garantida |
| Capacidade | Limitada pela RAM | Limitada pelo disco |
| Queries complexas | Não | Sim (SQL) |

**Trade-off fundamental:** Redis é rápido porque vive na memória. Mas memória é cara e finita. Você não coloca "tudo" no Redis — só o que é acessado frequentemente e caro de computar.

---

## 2. Padrões de Cache

### Cache-Aside (Lazy Loading) — O mais comum

```
1. App recebe request
2. Verifica Redis: "tem a chave X?"
   → SIM (cache hit): retorna direto
   → NÃO (cache miss): consulta o banco, salva no Redis, retorna
```

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

def get_produto(produto_id: int):
    # Tenta o cache primeiro
    cache_key = f"produto:{produto_id}"
    cached = r.get(cache_key)

    if cached:
        return json.loads(cached)  # Cache hit — <1ms

    # Cache miss — vai no banco
    produto = db.query(f"SELECT * FROM produtos WHERE id = {produto_id}")

    # Salva no cache com TTL de 5 minutos
    r.setex(cache_key, 300, json.dumps(produto))

    return produto
```

### Write-Through — Atualiza cache junto com o banco

```
1. App escreve no banco
2. Imediatamente atualiza o Redis
3. Próxima leitura já encontra cache fresco
```

### Cache Invalidation — "O Problema Difícil"

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

Quando o dado muda, o cache fica **stale** (obsoleto). Estratégias:
*   **TTL (Time-To-Live):** Cache expira automaticamente após N segundos. Simples, mas há janela de inconsistência.
*   **Invalidação explícita:** Quando escreve no banco, deleta a chave no Redis. Mais complexo, mais consistente.
*   **Versioning:** Chave inclui versão (`produto:42:v3`). Nova versão = nova chave.

---

## 3. Casos de Uso Além de APIs

### Feature Store para ML

```
Modelo precisa de features do usuário para inferência em tempo real.
Calcular features on-the-fly = lento (~200ms de queries + agregações).

Solução:
Pipeline batch calcula features → salva no Redis → API lê do Redis em <1ms
```

```python
# Pipeline batch (roda 1x/hora via Airflow)
def atualiza_feature_store():
    usuarios = db.query("SELECT user_id, avg(valor) as ticket_medio FROM compras GROUP BY user_id")
    for u in usuarios:
        r.hset(f"features:{u.user_id}", mapping={
            "ticket_medio": u.ticket_medio,
            "atualizado_em": datetime.now().isoformat()
        })

# API de predição (tempo real)
def predizer(user_id: int):
    features = r.hgetall(f"features:{user_id}")
    return modelo.predict(features)
```

### Cache de Queries Caras (Dashboards)

```
Dashboard Superset: 50 usuários abrem o mesmo relatório.
Query de agregação: SELECT region, SUM(sales) ... GROUP BY region → 3 segundos.

Sem cache: 50 × 3s = 150s de banco.
Com cache (TTL 5min): 1 × 3s + 49 × <1ms ≈ 3s total.
```

### Session Store

```
Aplicação web com autenticação.
Onde guardar "usuário X está logado"?

Opções:
- Cookie (limitado, inseguro para dados sensíveis)
- Banco de dados (lento para verificar a cada request)
- Redis (rápido, com TTL = sessão expira automaticamente)
```

### Rate Limiting

```python
# Limitar 100 requests/minuto por IP
def check_rate_limit(ip: str) -> bool:
    key = f"rate:{ip}"
    current = r.incr(key)
    if current == 1:
        r.expire(key, 60)  # TTL de 60 segundos
    return current <= 100
```

---

## 4. Onde Você Já Usa Redis (Sem Saber)

| Ferramenta | Uso do Redis/Cache |
|------------|-------------------|
| **Airflow** | Celery broker (fila de tasks), result backend |
| **Superset** | Cache de queries e dashboards |
| **MLflow** | Pode usar Redis para cache de artifacts metadata |
| **Spark** | `.cache()` e `.persist()` são cache em memória (conceito similar) |
| **Pandas** | `@lru_cache` em funções de transformação — mesmo princípio, escala menor |

### O `lru_cache` do Python é um "mini-Redis"

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def calcular_feature_cara(user_id: int):
    # Só executa 1x por user_id
    return db.query(f"SELECT ... WHERE user_id = {user_id}")
```

Diferença: `lru_cache` é local ao processo. Redis é compartilhado entre processos/servidores.

---

## 5. Anti-Padrão: Cache Sem TTL

```python
# ERRADO — cache vive para sempre
r.set(f"produto:{id}", json.dumps(produto))

# CORRETO — cache expira em 5 minutos
r.setex(f"produto:{id}", 300, json.dumps(produto))
```

**Por quê?** Sem TTL, dados ficam stale indefinidamente. Usuário vê preço antigo, estoque errado, feature desatualizada. E a memória do Redis só cresce até estourar.

---

## 6. Checkpoint

> **Pergunta:** Seu dashboard mostra métricas de vendas atualizadas a cada hora. Um colega sugere cache com TTL de 24 horas. Qual o risco? Qual TTL faz mais sentido?

> **Aplicação imediata:** Se você usa Airflow com CeleryExecutor, verifique se o broker é Redis ou RabbitMQ. Rode `airflow config get-value celery broker_url`.

---

## Resumo

| Conceito | O que é | Quando usar |
|----------|---------|-------------|
| **Cache** | Guardar resultado para reutilizar | Operação cara + resultado reutilizável |
| **Redis** | Key-value em memória, <1ms | Cache compartilhado, sessions, rate limiting |
| **TTL** | Tempo de vida do cache | Sempre. Sem TTL = bug esperando acontecer |
| **Cache-aside** | Consulta cache → miss → banco → salva cache | Padrão mais comum e seguro |
| **Feature store** | Cache de features para ML em tempo real | Quando inferência precisa de features pré-computadas |

A regra de ouro: **Cache é uma otimização, não uma fonte de verdade. O banco é quem manda.**
