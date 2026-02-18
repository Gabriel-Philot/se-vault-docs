# 04-APIS - Melhorias para Versão 2

## 1. Autenticação e Autorização

### API Key
- Header `X-API-Key` para endpoints sensíveis
- Middleware FastAPI para validação
- `401 Unauthorized` quando key inválida
- `403 Forbidden` quando key não tem permissão

```python
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

@app.delete("/pets/{pet_id}", dependencies=[Depends(verify_api_key)])
async def delete_pet(pet_id: int):
    ...
```

### Bearer Token (JWT)
- Login: `POST /auth/login` → retorna token
- Proteger endpoints com `Depends(get_current_user)`
- Refresh token

### Por que importa para dados
| Plataforma | Tipo de Auth |
|------------|--------------|
| Snowflake | OAuth2 |
| Databricks | Personal Access Token |
| dbt Cloud | Service Token |
| Airflow | API Key |
| Fivetran | API Key |

---

## 2. WebSocket

- Updates em tempo real (pet alimentado, status mudou)
- Conexão: `ws://localhost/ws`
- Padrão pub/sub com Redis

```python
from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Echo: {data}")
```

---

## 3. Background Jobs (Celery)

- Tarefa assíncrona: `POST /pets/{id}/export` → gera CSV
- Verificar status: `GET /tasks/{task_id}`
- Redis como broker

```
┌────────┐     ┌────────┐     ┌─────────┐     ┌────────┐
│Cliente │────▶│ Nginx  │────▶│ FastAPI │────▶│ Redis  │
│        │     │        │     │         │     │(Broker)│
└────────┘     └────────┘     └─────────┘     └───┬────┘
                                                  │
                                            ┌─────▼─────┐
                                            │  Celery   │
                                            │  Worker   │
                                            └───────────┘
```

---

## 4. Rate Limiting Real

- Implementar com `slowapi` ou Redis
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Retorno 429 com `Retry-After`

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/pets")
@limiter.limit("10/minute")
async def list_pets(request: Request):
    ...
```

---

## 5. OpenTelemetry

- Tracing distribuído
- Métricas: latência, throughput, erros
- Integração com Jaeger/Zipkin

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter

tracer = trace.get_tracer(__name__)

@app.get("/pets")
async def list_pets():
    with tracer.start_as_current_span("list_pets"):
        ...
```

---

## 6. API Versioning

- `/api/v1/pets` vs `/api/v2/pets`
- Breaking changes sem afetar clientes existentes

```python
from fastapi import APIRouter

v1_router = APIRouter(prefix="/api/v1")
v2_router = APIRouter(prefix="/api/v2")

@v1_router.get("/pets")
async def list_pets_v1():
    ...

@v2_router.get("/pets")
async def list_pets_v2():
    ...
```

---

## Prioridade

| Item | Prioridade | Esforço | Justificativa |
|------|------------|---------|---------------|
| API Key Auth | Alta | Baixo | Essencial para APIs de dados |
| Rate Limiting | Alta | Baixo | Proteção básica |
| Background Jobs | Média | Médio | Caso de uso comum (exports) |
| WebSocket | Baixa | Médio | Nice-to-have |
| OpenTelemetry | Baixa | Alto | Para produção avançada |
| API Versioning | Baixa | Baixo | Bom practice |

---

## Implementação Sugerida

### Fase V2.1: Auth
1. Adicionar tabela `api_keys` no banco
2. Middleware de validação
3. Proteger DELETE e PUT
4. Documentar uso

### Fase V2.2: Rate Limiting
1. Configurar slowapi
2. Aplicar limites por endpoint
3. Headers de resposta
4. Página de erro customizada

### Fase V2.3: Background Jobs
1. Adicionar Celery + worker
2. Endpoint `POST /pets/{id}/export`
3. Endpoint `GET /tasks/{task_id}`
4. Frontend para acompanhar progresso
