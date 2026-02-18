# 04-APIS - Plano de Implementação

## Visão Geral

Módulo didático para ensinar APIs REST com Python, FastAPI, PostgreSQL, Redis e Nginx através de um **Pet Shop Virtual** interativo.

---

## Stack

| Componente | Tecnologia |
|------------|------------|
| Backend | Python 3.12 + UV + FastAPI |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Frontend | React 19 + TypeScript + Vite |
| Servidor | Nginx (reverse proxy + estáticos) |
| Container | Docker Compose |

---

## Estrutura de Pastas

```
04-APIS/
├── README.md
├── PLAN.md                      # Este arquivo
├── IMPROVEMENTS_V2.md           # Melhorias futuras
├── PROMPTS_INDEX.md             # Índice das mini-aulas
├── lessons/
│   ├── 00_o_que_e_api.md
│   ├── 01_http_verbs.md
│   ├── 02_status_codes.md
│   ├── 03_fastapi_pydantic.md
│   ├── 04_crud_completo.md
│   ├── 05_nginx_reverse_proxy.md
│   └── 06_redis_cache.md
├── practice/
│   └── practice_httpx.py
└── petshop/
    ├── docker-compose.yml
    ├── nginx/
    │   └── nginx.conf
    ├── api/
    │   ├── Dockerfile
    │   ├── pyproject.toml
    │   └── src/
    │       ├── main.py
    │       ├── config.py
    │       ├── database.py
    │       ├── models.py
    │       └── routes/
    │           ├── pets.py
    │           ├── actions.py
    │           └── stats.py
    ├── db/
    │   └── init.sql
    └── frontend/
        ├── Dockerfile
        ├── package.json
        ├── vite.config.ts
        └── src/
            ├── App.tsx
            ├── main.tsx
            └── pages/
                ├── Dashboard.tsx
                ├── PetManager.tsx
                └── ApiExplorer.tsx
```

---

## Mini-Aulas

| # | Título | Duração | Tipo | Status |
|---|--------|---------|------|--------|
| 4.0 | O que é uma API? | 15min | Teórico | [x] |
| 4.1 | Verbos HTTP | 20min | Teórico | [x] |
| 4.2 | Status Codes | 15min | Teórico | [x] |
| 4.3 | FastAPI + Pydantic | 30min | Misto | [x] |
| 4.4 | CRUD Completo | 35min | Hands-on | [x] |
| 4.5 | Nginx & Reverse Proxy | 25min | Misto | [x] |
| 4.6 | Redis Cache | 20min | Hands-on | [x] |
| **TOTAL** | | **~2h30** | | **COMPLETE** |

---

## Tópicos por Aula

### 4.0 O que é uma API?
- Definição: Application Programming Interface
- Analogia do restaurante (API = garçom)
- REST: Representational State Transfer
- Request/Response cycle

### 4.1 Verbos HTTP
- GET, POST, PUT, PATCH, DELETE
- Idempotência e segurança
- Correlação com CRUD

### 4.2 Status Codes
- 2xx: Sucesso (200, 201, 204)
- 4xx: Erro do cliente (400, 401, 403, 404, 422)
- 5xx: Erro do servidor (500, 502, 503)
- **Caixa didática: 429 Too Many Requests (Rate Limiting)**

### 4.3 FastAPI + Pydantic
- Framework assíncrono moderno
- **Pydantic models para validação de input**
- **Response models (contrato JSON)**
- Diferença: model do banco vs model de resposta
- 422 Unprocessable Entity automático

### 4.4 CRUD Completo
- SQLModel/SQLAlchemy para ORM
- **Query params: ?species=dog&min_age=2&sort_by=happiness**
- **Paginação: ?limit=10&offset=0**
- Como vira SQL
- **Erros padronizados: {"detail": "Pet not found"}**
- **Diferença: 400 vs 404 vs 422**

### 4.5 Nginx & Reverse Proxy
- Servidor web + reverse proxy + load balancer
- Arquitetura: Cliente → Nginx → FastAPI
- Múltiplos papéis: estáticos, SSL, rate limiting, WebSocket
- **Nginx + Filas (Celery/Redis)**
- Configuração prática

### 4.6 Redis Cache
- **Antes: medir latência do GET /pets sem cache**
- In-memory data store
- Estratégias: cache-aside
- Implementação com TTL
- Invalidação em escrita
- Campo `cached: true/false` na response

---

## Fases de Implementação

### Fase 1: Fundação [COMPLETE]
- [x] Criar estrutura de pastas
- [x] Escrever aulas 4.0, 4.1, 4.2 (teóricas)
- [x] Setup docker-compose básico
- [x] Criar db/init.sql com schema

### Fase 2: Backend CRUD [COMPLETE]
- [x] Escrever aula 4.3 (FastAPI + Pydantic)
- [x] Implementar api/ com UV + FastAPI
- [x] Escrever aula 4.4 (CRUD Completo)
- [x] Endpoints: GET, POST, PUT, PATCH, DELETE /pets
- [x] Query params e filtros
- [x] Tratamento de erros

### Fase 3: Interatividade [COMPLETE]
- [x] Sistema de fome/felicidade dos pets
- [x] Endpoints: /feed, /play, /sleep, /wake
- [x] Activity log
- [ ] Background job para decair status (opcional - ver IMPROVEMENTS_V2.md)

### Fase 4: Nginx [COMPLETE]
- [x] Escrever aula 4.5 (Nginx)
- [x] Configurar nginx.conf
- [x] Testar reverse proxy

### Fase 5: Cache [COMPLETE]
- [x] Medir latência sem cache (documentado na aula 4.6)
- [x] Escrever aula 4.6 (Redis)
- [x] Implementar cache em GET /pets
- [x] Invalidação em escrita
- [x] Endpoint /stats

### Fase 6: Frontend [COMPLETE]
- [x] Setup React + Vite
- [x] Página Dashboard
- [x] Página PetManager
- [x] Página ApiExplorer

### Fase 7: Prática [COMPLETE]
- [x] Criar practice/practice_httpx.py
- [x] Demonstrar consumo via httpx
- [x] Tratamento de erros
- [x] Retry com tenacity
- [x] Conversão para DataFrame

---

## Schema PostgreSQL

```sql
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    age INTEGER,
    hunger_level INTEGER DEFAULT 50,
    happiness INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'awake',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_activity_pet ON activity_log(pet_id);
```

---

## Endpoints da API

### CRUD Pets
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /pets | Lista todos (paginação + filtros) |
| GET | /pets/{id} | Busca por ID |
| POST | /pets | Cria novo pet |
| PUT | /pets/{id} | Atualiza completo |
| PATCH | /pets/{id} | Atualiza parcial |
| DELETE | /pets/{id} | Remove pet |

### Query Parameters (GET /pets)
| Parâmetro | Tipo | Exemplo |
|-----------|------|---------|
| limit | int | ?limit=10 |
| offset | int | ?offset=20 |
| species | str | ?species=dog |
| min_age | int | ?min_age=2 |
| sort_by | str | ?sort_by=happiness |
| order | str | ?order=desc |

### Ações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /pets/{id}/feed | Alimenta (diminui fome) |
| POST | /pets/{id}/play | Brinca (aumenta felicidade) |
| POST | /pets/{id}/sleep | Coloca pra dormir |

### Estatísticas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /stats | Métricas gerais |
| GET | /activity | Log de atividades |

---

## Páginas Frontend

### 1. Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  Pet Shop API Dashboard                        [API Explorer]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Total   │  │ Happy   │  │ Hungry  │  │ Sleeping│           │
│  │   12    │  │    8    │  │    3    │  │    1    │           │
│  │  pets   │  │  🟢     │  │  🟡     │  │  💤     │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Recent Activity                           [View All →]    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Rex was fed                    2 min ago   POST /feed     ││
│  │  New pet "Luna" created         5 min ago   POST /pets     ││
│  │  Max's name updated            10 min ago   PATCH /pets    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Pets Overview                              [+ Add Pet]    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Rex        🟢 Happy    Hunger: 20%   [Feed] [Edit]        ││
│  │  Luna       🟡 Hungry   Hunger: 85%   [Feed] [Edit]        ││
│  │  Max        💤 Sleeping Hunger: 40%   [Wake] [Edit]        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2. Pet Manager (CRUD)
```
┌─────────────────────────────────────────────────────────────────┐
│  Pet Manager                               [Dashboard] [API]    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [+ Create New Pet]                                         ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Name: [____________]  Species: [Dog ▼]  Age: [___]        ││
│  │                                        [Cancel] [Create]    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Filter: [All ▼]  Sort by: [Name ▼]  Search: [______]      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  ID  │ Name   │ Species │ Age │ Happiness │ Actions        ││
│  ├──────┼────────┼─────────┼─────┼───────────┼────────────────││
│  │  1   │ Rex    │ Dog     │ 3   │ ████████░ │ [Feed] [Edit]  ││
│  │  2   │ Luna   │ Cat     │ 2   │ ████░░░░░ │ [Feed] [Edit]  ││
│  │  3   │ Max    │ Dog     │ 5   │ █████████ │ [Feed] [Edit]  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 3. API Explorer (Didático)
```
┌─────────────────────────────────────────────────────────────────┐
│  API Explorer                            [Dashboard] [Manager]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌─────────────────────────────────────┐│
│  │  Endpoints         │  │  Request                            ││
│  ├────────────────────┤  ├─────────────────────────────────────┤│
│  │  Pets              │  │  Method: [GET ▼]  URL: /pets        ││
│  │    GET  /pets      │  │                                     ││
│  │    GET  /pets/:id  │  │  Query Params:                      ││
│  │    POST /pets      │  │  limit: [10___]                     ││
│  │    PUT  /pets/:id  │  │  offset: [0____]                    ││
│  │    DEL  /pets/:id  │  │                                     ││
│  │                    │  │                        [Send]       ││
│  │  Actions           │  └─────────────────────────────────────┘│
│  │    POST /feed/:id  │                                        │
│  │    POST /play/:id  │  ┌─────────────────────────────────────┐│
│  │                    │  │  Response     Status: 200 OK  45ms  ││
│  │  Stats             │  ├─────────────────────────────────────┤│
│  │    GET  /stats     │  │  {                                  ││
│  └────────────────────┘  │    "pets": [...],                  ││
│                          │    "total": 12,                     ││
│                          │    "cached": true                   ││
│                          │  }                                  ││
│                          └─────────────────────────────────────┘│
│                                                                 │
│  Lesson: GET requests should be idempotent and cacheable.      │
│          Notice "cached: true" - Redis served this response!   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura Docker

```
                      ┌─────────────────────────────────┐
                      │            Nginx (:80)          │
                      │                                 │
    Browser ─────────▶│  /           → React Static     │
                      │  /api/*      → FastAPI :8000    │
                      └──────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
   ┌───────────┐              ┌───────────┐              ┌───────────┐
   │  FastAPI  │              │   Redis   │              │ PostgreSQL│
   │  :8000    │◀────────────▶│   :6379   │              │   :5432   │
   │  (API)    │              │  (Cache)  │              │   (DB)    │
   └───────────┘              └───────────┘              └───────────┘
```

---

## docker-compose.yml

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - api
    networks:
      - petshop-net

  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/petshop
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - petshop-net

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: petshop
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - petshop-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d petshop"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    networks:
      - petshop-net

networks:
  petshop-net:

volumes:
  pgdata:
```

---

## Ordem de Execução Recomendada

```
1. Criar 04-APIS/ + subpastas
2. Escrever PLAN.md + PROMPTS_INDEX.md
3. Escrever aulas teóricas (4.0, 4.1, 4.2)
4. Implementar docker-compose + db/init.sql
5. Implementar api/ (FastAPI básico)
6. Escrever aula 4.3 + 4.4
7. Implementar sistema de ações (feed/play/sleep)
8. Escrever aula 4.5 (Nginx)
9. Configurar Nginx
10. Medir latência GET /pets
11. Escrever aula 4.6 (Redis)
12. Implementar cache Redis
13. Implementar frontend
14. Criar practice/practice_httpx.py
```

---

## Dependências Externas

- Docker + Docker Compose
- (Opcional) Node.js 20+ para desenvolvimento local do frontend

---

## Versão 2 (Futuro)

Ver: [IMPROVEMENTS_V2.md](IMPROVEMENTS_V2.md)

Melhorias planejadas:
- Autenticação API Key / Bearer Token
- WebSocket para updates em tempo real
- Background jobs com Celery
- Rate Limiting real
- OpenTelemetry para observabilidade
