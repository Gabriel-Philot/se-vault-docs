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
| Frontend | React 19 + TypeScript + Vite |
| Servidor | Nginx (reverse proxy + estáticos) |

## Projeto: Pet Shop API

Um sistema de Pet Shop virtual onde cada pet tem:
- Atributos básicos (nome, espécie, idade)
- Estado dinâmico (fome, felicidade, sono)
- Histórico de ações

### Endpoints

```
GET    /pets           → lista todos
GET    /pets/{id}      → busca por ID
POST   /pets           → cria novo
PUT    /pets/{id}      → atualiza completo
PATCH  /pets/{id}      → atualiza parcial
DELETE /pets/{id}      → remove
POST   /pets/{id}/feed → alimenta
POST   /pets/{id}/play → brinca
POST   /pets/{id}/sleep → dorme
GET    /stats          → estatísticas
```

## Quick Start

```bash
cd petshop
docker compose up --build
```

Acesse http://localhost

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| [PLAN.md](PLAN.md) | Plano completo de implementação |
| [PROMPTS_INDEX.md](PROMPTS_INDEX.md) | Índice das mini-aulas |
| lessons/ | Mini-aulas em markdown |
| petshop/ | Projeto prático completo |
