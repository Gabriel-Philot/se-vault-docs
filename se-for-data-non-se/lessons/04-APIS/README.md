# 04-APIS - APIs e CRUD

Módulo didático para ensinar APIs REST com Python, FastAPI, PostgreSQL, Redis e Nginx através de um **Pet Shop Virtual** interativo.

## Objetivo

- Entender REST APIs e verbos HTTP
- Construir CRUD completo com FastAPI + PostgreSQL
- Implementar cache com Redis
- Entender Nginx como reverse proxy
- Criar frontend que consome a API

## Stack

| Componente | Tecnologia |
|------------|------------|
| Backend | Python 3.12 + UV + FastAPI |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Executor | Python 3.12 (sandbox) |
| Frontend | React 19 + TypeScript + Vite |
| Servidor | Nginx (reverse proxy + estáticos) |

## Quick Start

```bash
cd petshop
docker compose up --build
```

Acesse: **http://localhost**

## Arquitetura

```
Browser → Nginx:80 → FastAPI:8000 → PostgreSQL:5432
              ↓           ↓
         Executor:8001  Redis:6379
```

## Páginas do Frontend

| Página | URL | Descrição |
|--------|-----|-----------|
| Dashboard | `/` | Stats e visão geral dos pets |
| Meus Pets | `/pets` | CRUD com cards animados |
| API Explorer | `/explorer` | Teste de endpoints interativo |
| Database | `/database` | Editor SQL com queries de exemplo |
| Arquitetura | `/architecture` | Diagrama interativo do sistema |
| Code Lab | `/codelab` | Executor Python real com httpx |

## Endpoints da API

```
GET    /api/pets           → lista todos
GET    /api/pets/{id}      → busca por ID
POST   /api/pets           → cria novo
PATCH  /api/pets/{id}      → atualiza parcial
DELETE /api/pets/{id}      → remove
POST   /api/pets/{id}/feed → alimenta
POST   /api/pets/{id}/play → brinca
GET    /api/stats          → estatísticas (cacheado)
GET    /api/activity       → log de atividades
POST   /api/sql            → executa SQL read-only
```

## Executor Python

O Code Lab executa código Python real em um sandbox isolado:

```bash
POST /executor/execute
{"code": "import httpx\nprint(httpx.get('http://api:8000/pets').json())"}
```

- Timeout: 5 segundos
- Isolamento: container read-only com tmpfs
- Bibliotecas: httpx, Python padrão

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| [PLAN.md](PLAN.md) | Plano completo de implementação |
| [IMPROVEMENTS_V2.md](IMPROVEMENTS_V2.md) | Melhorias futuras |
| [MEMORY.md](MEMORY.md) | Histórico de mudanças |
| lessons/ | Mini-aulas em markdown |
| petshop/ | Projeto prático completo |
