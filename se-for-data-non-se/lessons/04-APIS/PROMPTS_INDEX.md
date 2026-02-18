# Módulo 04: APIs e CRUD

## Visão Geral

| Mini-Aula | Tema | Duração | Tipo | Status |
|-----------|------|---------|------|--------|
| 4.0 | O que é uma API? | 15min | Teórico | [ ] |
| 4.1 | Verbos HTTP | 20min | Teórico | [ ] |
| 4.2 | Status Codes | 15min | Teórico | [ ] |
| 4.3 | FastAPI + Pydantic | 30min | Misto | [ ] |
| 4.4 | CRUD Completo | 35min | Hands-on | [ ] |
| 4.5 | Nginx & Reverse Proxy | 25min | Misto | [ ] |
| 4.6 | Redis Cache | 20min | Hands-on | [ ] |
| **TOTAL** | | **~2h30** | | |

---

## Objetivo do Módulo

- Entender REST APIs e verbos HTTP
- Construir CRUD completo com FastAPI + PostgreSQL
- Implementar cache com Redis
- Entender Nginx como reverse proxy
- Criar frontend que consome a API
- Consumir APIs programaticamente com Python

---

## Projeto: Pet Shop API

Um sistema de Pet Shop virtual onde cada pet tem:
- Atributos básicos (nome, espécie, idade)
- Estado dinâmico (fome, felicidade, sono)
- Histórico de ações

### Stack
- Backend: Python 3.12 + UV + FastAPI
- Database: PostgreSQL 16
- Cache: Redis 7
- Frontend: React 19 + TypeScript + Vite
- Servidor: Nginx

---

## PROMPTS PARA PRÓXIMAS SESSÕES

### Mini-Aula 4.0: O que é uma API?

**Prompt:**
```
Crie a mini-aula 04.0 (O que é uma API?) para o módulo 04-APIS.

Estrutura:
1. Definição: Application Programming Interface
2. API como "garçom" de restaurante (analogia)
3. REST: Representational State Transfer
4. Endpoints como "cardápio"
5. Request/Response cycle
6. Por que APIs são fundamentais para dados

Formato:
- Seguir padrão das mini-aulas do módulo 02
- Analogias para engenheiros de dados
- Máximo 150 linhas, conciso

Salvar em: lessons/00_o_que_e_api.md
```

---

### Mini-Aula 4.1: Verbos HTTP

**Prompt:**
```
Crie a mini-aula 04.1 (Verbos HTTP) para o módulo 04-APIS.

Estrutura:
1. HTTP: Hypertext Transfer Protocol
2. Verbos principais:
   - GET: buscar dados (idempotente, seguro)
   - POST: criar recursos
   - PUT: atualizar recurso completo
   - PATCH: atualizar recurso parcial
   - DELETE: remover recurso
3. Idempotência e segurança
4. Correlação com operações CRUD
5. Exemplos práticos com curl

Formato:
- Tabela comparativa dos verbos
- Conexão com contexto de dados
- Máximo 180 linhas

Salvar em: lessons/01_http_verbs.md
```

---

### Mini-Aula 4.2: Status Codes

**Prompt:**
```
Crie a mini-aula 04.2 (Status Codes HTTP) para o módulo 04-APIS.

Estrutura:
1. Estrutura dos códigos (XYZ)
   - X: classe da resposta
   - YZ: código específico
2. Classes principais:
   - 2xx: Sucesso (200, 201, 204)
   - 3xx: Redirecionamento (301, 304)
   - 4xx: Erro do cliente (400, 401, 403, 404, 422)
   - 5xx: Erro do servidor (500, 502, 503)
3. Quando usar cada código
4. Boas práticas de error handling
5. CAIXA DIDÁTICA: 429 Too Many Requests (Rate Limiting)
   - Exemplos de rate limits em APIs de dados (Snowflake, Salesforce, HubSpot)
   - Headers X-RateLimit-Limit, X-RateLimit-Remaining
   - Padrão: retry com exponential backoff

Formato:
- Tabela com códigos mais comuns
- Exemplos de quando usar cada um
- Máximo 180 linhas

Salvar em: lessons/02_status_codes.md
```

---

### Mini-Aula 4.3: FastAPI + Pydantic

**Prompt:**
```
Crie a mini-aula 04.3 (FastAPI + Pydantic) para o módulo 04-APIS.

Estrutura:
1. O que é FastAPI?
   - Framework assíncrono moderno
   - Type hints nativos
   - Documentação automática (OpenAPI/Swagger)
2. Pydantic para validação:
   - BaseModel para input
   - Validação automática
   - 422 Unprocessable Entity
3. Response Models:
   - Definir contrato de resposta
   - Diferença entre model do banco e model de resposta
   - Exemplo: não expor updated_at se não necessário
4. Conceitos fundamentais:
   - Path operations (@app.get, @app.post)
   - Path parameters
   - Query parameters
   - Request body
5. Estrutura básica de projeto
6. Execução com Uvicorn

Formato:
- Código executável em cada seção
- Conexão com o projeto petshop
- Máximo 220 linhas

Salvar em: lessons/03_fastapi_pydantic.md
```

---

### Mini-Aula 4.4: CRUD Completo

**Prompt:**
```
Crie a mini-aula 04.4 (CRUD Completo) para o módulo 04-APIS.

Estrutura:
1. O que é CRUD?
   - Create, Read, Update, Delete
2. SQLModel/SQLAlchemy para ORM
3. Conexão com PostgreSQL
4. Implementação de cada operação:
   - CREATE: POST /pets
   - READ: GET /pets, GET /pets/{id}
   - UPDATE: PUT /pets/{id}, PATCH /pets/{id}
   - DELETE: DELETE /pets/{id}
5. Query Parameters e Filtros:
   - species, min_age, sort_by, order
   - Como isso vira SQL
   - Paginação (limit, offset)
6. Tratamento de Erros:
   - Erros padronizados: {"detail": "Pet not found"}
   - Diferença: 400 (input ruim) vs 404 (não existe) vs 422 (validação)

Formato:
- Código completo e comentado
- Diagramas de fluxo
- Máximo 280 linhas

Salvar em: lessons/04_crud_completo.md
```

---

### Mini-Aula 4.5: Nginx & Reverse Proxy

**Prompt:**
```
Crie a mini-aula 04.5 (Nginx & Reverse Proxy) para o módulo 04-APIS.

Estrutura:
1. O que é Nginx?
   - Servidor web + reverse proxy + load balancer
   - História e importância (33%+ dos sites)
2. Reverse Proxy - O Conceito:
   - Cliente → Nginx → Aplicação
   - Diferença de forward proxy
   - Analogia: recepcionista que encaminha chamadas
3. Múltiplos papéis do Nginx:
   - Servidor web estático
   - Reverse proxy para APIs
   - Load balancer
   - SSL/TLS termination
   - Rate limiting
   - WebSocket proxy
4. Nginx + Filas (Celery/Redis):
   - Arquitetura: Nginx → FastAPI → Redis → Celery
   - Por que Nginx não fala direto com filas
   - Padrão: POST cria tarefa, GET verifica status
5. Configuração prática (nginx.conf):
   - location / (frontend estático)
   - location /api (backend)
   - Headers importantes
   - try_files para SPA
6. Checklist de benefícios (tabela comparativa)

Formato:
- Diagramas ASCII de arquitetura
- Configurações práticas comentadas
- Máximo 250 linhas

Salvar em: lessons/05_nginx_reverse_proxy.md
```

---

### Mini-Aula 4.6: Redis Cache

**Prompt:**
```
Crie a mini-aula 04.6 (Redis Cache) para o módulo 04-APIS.

Estrutura:
1. O problema primeiro:
   - Medir latência do GET /pets sem cache
   - Mostrar que cada request bate no banco
2. O que é Redis?
   - In-memory data store
   - Estruturas: strings, hashes, lists, sets
3. Por que usar cache?
   - Reduz latência
   - Diminui carga no banco
4. Estratégias de cache:
   - Cache-aside (lazy loading) - foco principal
   - Write-through (menção)
   - Write-behind (menção)
5. Implementação no FastAPI:
   - Decorator de cache
   - Chaves e TTL
   - Invalidação de cache em POST/PUT/DELETE
6. Cache no Pet Shop:
   - Cache GET /pets (5s TTL)
   - Campo "cached: true/false" na response
   - Comparar latência antes/depois
7. Redis como message broker (bônus - menção)

Formato:
- Código prático com exemplos
- Diagrama de fluxo cache-aside
- Benchmark de latência
- Máximo 200 linhas

Salvar em: lessons/06_redis_cache.md
```

---

### Mini-Prática: Consumindo APIs com Python

**Prompt:**
```
Crie o arquivo de prática practice/practice_httpx.py para o módulo 04-APIS.

Objetivo: Demonstrar como consumir a API Pet Shop via Python

Conteúdo:
1. GET com filtros (query params)
2. POST para criar recurso
3. Tratamento de erros (try/except com HTTPStatusError)
4. Retry com tenacity (exponential backoff)
5. Conversão para DataFrame (pandas)

Formato:
- Código executável e comentado
- Funções reutilizáveis
- Exemplos de uso no __main__
- Pré-requisitos no docstring

Salvar em: practice/practice_httpx.py
```

---

### Projeto Prático: Pet Shop API

**Prompt:**
```
Implemente o projeto Pet Shop API completo em petshop/.

Requisitos:
1. Backend FastAPI com UV
   - CRUD de pets com validação Pydantic
   - Query params e filtros
   - Tratamento de erros padronizado
   - Response models definidos
   - Endpoints de ação (feed, play, sleep)
   - Sistema de fome/felicidade
   - Cache Redis
   - Activity log

2. PostgreSQL
   - Schema conforme PLAN.md
   - Índices para performance

3. Redis
   - Cache GET /pets
   - Cache GET /stats
   - Invalidação correta

4. Nginx
   - Reverse proxy para API
   - Serve frontend estático
   - Configuração para SPA

5. Frontend React
   - Dashboard
   - PetManager
   - ApiExplorer

Estrutura de pastas conforme PLAN.md.
Usar padrões do projeto data-race (02-python).
```

---

## Checklist de Criação

- [ ] 4.0 - O que é uma API?
- [ ] 4.1 - Verbos HTTP
- [ ] 4.2 - Status Codes
- [ ] 4.3 - FastAPI + Pydantic
- [ ] 4.4 - CRUD Completo
- [ ] 4.5 - Nginx & Reverse Proxy
- [ ] 4.6 - Redis Cache
- [ ] practice/practice_httpx.py
- [ ] Projeto petshop/ implementado
