# Redis Cache: Acelerando APIs

Este guia explica como usar Redis para cachear responses e reduzir latência.

---

## 0. O Problema Primeiro

Antes de adicionar cache, vamos medir.

### Medindo Latência Sem Cache

```python
import time
import httpx

def benchmark_get_pets(n: int = 100):
    times = []
    for _ in range(n):
        start = time.perf_counter()
        response = httpx.get("http://localhost:8000/pets")
        times.append(time.perf_counter() - start)
    
    avg = sum(times) / len(times)
    print(f"Average: {avg*1000:.2f}ms")
    print(f"Min: {min(times)*1000:.2f}ms")
    print(f"Max: {max(times)*1000:.2f}ms")

benchmark_get_pets()
# Output:
# Average: 45.23ms
# Min: 38.12ms
# Max: 67.89ms
```

### O Que Acontece a Cada Request

```
GET /pets
    ↓
FastAPI processa
    ↓
SELECT * FROM pets LIMIT 10  ← Query no banco
    ↓
Serializa para JSON
    ↓
Retorna

~45ms por request, toda vez.
```

**Cache pode reduzir isso para ~2ms.**

---

## 1. O Que é Redis?

**RE**mote **DI**ctionary **S**erver - in-memory data store criado por Salvatore Sanfilippo (2009).

### Características

| Feature | Descrição |
|---------|-----------|
| In-memory | Dados em RAM (rápido) |
| Key-Value | Estrutura simples |
| Persistência | Opcional (RDB, AOF) |
| Estruturas | Strings, Hashes, Lists, Sets, Sorted Sets |
| Pub/Sub | Mensageria simples |

### Por Que Redis para Cache?

*   **Latência:** < 1ms para GET/SET
*   **Throughput:** 100k+ ops/segundo
*   **Simplicidade:** GET key, SET key value
*   **TTL:** Expiração automática

---

## 2. Instalação e Conexão

### Docker

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Python

```bash
uv add redis
```

```python
# services/cache.py
import redis.asyncio as redis
import json
from typing import Optional, Any

REDIS_URL = "redis://localhost:6379"

class CacheService:
    def __init__(self):
        self.client: Optional[redis.Redis] = None
    
    async def connect(self):
        self.client = redis.from_url(REDIS_URL, decode_responses=True)
    
    async def disconnect(self):
        if self.client:
            await self.client.close()
    
    async def get(self, key: str) -> Optional[Any]:
        value = await self.client.get(key)
        if value:
            return json.loads(value)
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 5):
        await self.client.setex(key, ttl, json.dumps(value))
    
    async def delete(self, pattern: str):
        keys = await self.client.keys(pattern)
        if keys:
            await self.client.delete(*keys)

cache = CacheService()
```

---

## 3. Estratégias de Cache

### Cache-Aside (Lazy Loading)

```
┌─────────┐     GET      ┌─────────┐     GET      ┌─────────┐
│ Cliente │ ────────────▶│   API   │ ────────────▶│  Redis  │
└─────────┘              └────┬────┘              └────┬────┘
     ◀────────────────────────┘                        │
                              Cache MISS               │
                              (null)                   ▼
                              │                   ┌─────────┐
                              │                   │   DB    │
                              └──────────────────▶│         │
                                        Query     └────┬────┘
                                                       │
                                                       ▼
                              SET cache               ┌─────────┐
                              ◀───────────────────────│  Redis  │
                                                       └─────────┘
```

**Aplicação gerencia o cache.** Mais comum para APIs.

### Write-Through

```
Write → API → DB
              ↓
           Redis (cache atualizado junto)
```

### Write-Behind

```
Write → Redis → API (async) → DB
```

**Foco deste guia: Cache-Aside**

---

## 4. Implementação no FastAPI

### Decorator de Cache

```python
import functools
import hashlib

def cache_response(ttl: int = 5):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Gera chave única baseada nos argumentos
            cache_key = _generate_cache_key(func.__name__, kwargs)
            
            # Tenta buscar do cache
            cached = await cache.get(cache_key)
            if cached is not None:
                cached["cached"] = True
                return cached
            
            # Executa função original
            result = await func(*args, **kwargs)
            result["cached"] = False
            
            # Salva no cache
            await cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

def _generate_cache_key(prefix: str, params: dict) -> str:
    sorted_params = sorted(params.items())
    param_str = str(sorted_params)
    hash_obj = hashlib.md5(param_str.encode())
    return f"{prefix}:{hash_obj.hexdigest()}"
```

### Aplicando nos Endpoints

```python
@router.get("/")
@cache_response(ttl=5)
async def list_pets(
    species: Optional[str] = None,
    min_age: Optional[int] = None,
    limit: int = 10,
    offset: int = 0,
    session: AsyncSession = Depends(get_session)
):
    query = select(Pet)
    
    if species:
        query = query.where(Pet.species == species)
    if min_age is not None:
        query = query.where(Pet.age >= min_age)
    
    query = query.offset(offset).limit(limit)
    result = await session.execute(query)
    pets = result.scalars().all()
    
    return {"pets": pets, "total": len(pets)}
```

### Response com Campo cached

```json
{
  "pets": [
    {"id": 1, "name": "Rex", "species": "dog"},
    {"id": 2, "name": "Luna", "species": "cat"}
  ],
  "total": 2,
  "cached": true
}
```

---

## 5. Invalidation em Escrita

Cache deve ser invalidado quando dados mudam.

### Padrão: Invalidate on Write

```python
async def invalidate_pets_cache():
    """Remove todos os caches relacionados a pets."""
    await cache.delete("list_pets:*")

@router.post("/", status_code=201)
async def create_pet(
    pet_data: PetCreate,
    session: AsyncSession = Depends(get_session)
):
    pet = Pet(**pet_data.model_dump())
    session.add(pet)
    await session.commit()
    await session.refresh(pet)
    
    # Invalida cache
    await invalidate_pets_cache()
    
    return pet

@router.patch("/{pet_id}")
async def update_pet(
    pet_id: int,
    pet_data: PetUpdate,
    session: AsyncSession = Depends(get_session)
):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    for key, value in pet_data.model_dump(exclude_unset=True).items():
        setattr(pet, key, value)
    
    await session.commit()
    
    # Invalida cache
    await invalidate_pets_cache()
    
    return pet

@router.delete("/{pet_id}", status_code=204)
async def delete_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    await session.delete(pet)
    await session.commit()
    
    # Invalida cache
    await invalidate_pets_cache()
```

---

## 6. Cache no Pet Shop

### GET /pets

```python
@router.get("/")
@cache_response(ttl=5)
async def list_pets(...):
    ...
```

### GET /stats

```python
@router.get("/stats")
@cache_response(ttl=10)
async def get_stats(session: AsyncSession = Depends(get_session)):
    total = await session.execute(select(func.count(Pet.id)))
    avg_happiness = await session.execute(select(func.avg(Pet.happiness)))
    
    return {
        "total_pets": total.scalar(),
        "avg_happiness": round(avg_happiness.scalar(), 2),
        "cached": False
    }
```

---

## 7. Benchmark: Antes vs Depois

```python
import time
import httpx

def benchmark_with_cache():
    # Primeiro request (cache MISS)
    start = time.perf_counter()
    r1 = httpx.get("http://localhost:8000/pets")
    t1 = time.perf_counter() - start
    
    # Segundo request (cache HIT)
    start = time.perf_counter()
    r2 = httpx.get("http://localhost:8000/pets")
    t2 = time.perf_counter() - start
    
    print(f"First request (MISS):  {t1*1000:.2f}ms - cached: {r1.json()['cached']}")
    print(f"Second request (HIT):  {t2*1000:.2f}ms - cached: {r2.json()['cached']}")
    print(f"Speedup: {t1/t2:.1f}x faster")

benchmark_with_cache()
# Output:
# First request (MISS):  45.23ms - cached: False
# Second request (HIT):  1.87ms - cached: True
# Speedup: 24.2x faster
```

### Resultado Esperado

| Cenário | Latência | Cached |
|---------|----------|--------|
| Primeiro GET | ~45ms | False |
| GET subsequente | ~2ms | True |
| Após POST/PUT/DELETE | ~45ms | False |
| GET subsequente | ~2ms | True |

---

## 8. TTL: Time To Live

### Escolhendo TTL

| Tipo de Dado | TTL Recomendado | Razão |
|--------------|-----------------|-------|
| Dados estáticos | 1h+ | Raramente muda |
| Lista paginada | 5-30s | Muda com frequência |
| Stats agregados | 10-60s | OK ter stale |
| User session | 24h | Login time |

### Trade-offs

| TTL Curto | TTL Longo |
|-----------|-----------|
| Mais fresco | Mais stale |
| Mais DB hits | Menos DB hits |
| Menos memória | Mais memória |

---

## 9. Redis como Message Broker (Bônus)

Além de cache, Redis pode ser message broker para Celery.

```
┌─────────┐     Task     ┌─────────┐     Push     ┌─────────┐
│ FastAPI │ ────────────▶│  Redis  │ ◀────────────│ Celery  │
└─────────┘              │ (Queue) │     Pull     │ Worker  │
                         └─────────┘              └─────────┘
```

### Configuração Celery

```python
# tasks.py
from celery import Celery

celery_app = Celery(
    "worker",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/1"
)

@celery_app.task
def process_large_dataset(file_path: str):
    # Processamento pesado
    ...
```

---

## 10. Checklist de Implementação

- [ ] Redis container rodando
- [ ] CacheService conectado
- [ ] Decorator `@cache_response` implementado
- [ ] TTL configurado por endpoint
- [ ] Invalidation em POST/PUT/DELETE
- [ ] Campo `cached` nas responses
- [ ] Benchmark comparando antes/depois

---

## 11. Cheat Sheet

| Comando Redis | Função |
|---------------|--------|
| `SET key value` | Armazena valor |
| `GET key` | Recupera valor |
| `SETEX key ttl value` | Armazena com TTL |
| `DEL key` | Remove chave |
| `KEYS pattern` | Lista chaves por padrão |
| `TTL key` | Tempo restante |
| `FLUSHALL` | Limpa tudo (cuidado!) |

---

## Conclusão

Cache é uma das otimizações mais impactantes:
*   **~20x mais rápido** para leituras repetidas
*   **Menos carga no banco**
*   **Melhor experiência do usuário**

A chave é balancear:
*   TTL adequado (não muito longo, não muito curto)
*   Invalidação correta (nunca stale demais)
*   Observabilidade (saber quando está funcionando)

---

## Projeto Completo

Você agora tem todos os componentes do Pet Shop API:
*   FastAPI com CRUD completo
*   PostgreSQL para persistência
*   Redis para cache
*   Nginx como reverse proxy
*   Frontend React para interação

Explore o projeto em `petshop/` e pratique consumindo a API com `practice/practice_httpx.py`.
