# Memory - 04-APIS Pet Shop

## [2026-02-18] (Mem-0001) UI Improvements e Docker Compose Unificado

### Adicionado
- **Frontend Dockerfile multi-stage**: Build Node.js + Nginx em uma imagem
- **Executor microservice**: Python sandbox para Code Lab (porta 8001)
- **Database Explorer**: Página com editor SQL e queries de exemplo
- **SQL endpoint**: POST /api/sql para executar queries read-only
- **Cores pastel**: Verde sálvia, salmon, violet (removido branco puro)
- **Sidebar navigation**: Menu com links para todas as páginas

### Modificado
- **docker-compose.yml**: Agora sobe tudo com `docker compose up --build`
  - frontend (Nginx + React build)
  - api (FastAPI)
  - executor (Python sandbox)
  - db (PostgreSQL)
  - redis (Cache)
- **Architecture.tsx**: Adicionado Executor no diagrama

### Estrutura final
```
docker compose up --build   # Sobe tudo do zero
├── frontend:80 (Nginx)
│   ├── React app
│   └── proxy /api/ → api:8000
│   └── proxy /executor/ → executor:8001
├── api:8000 (FastAPI)
├── executor:8001 (Python sandbox)
├── db:5432 (PostgreSQL)
└── redis:6379 (Cache)
```

### Páginas do frontend
- Dashboard: Stats e visão geral
- Meus Pets: CRUD com cards animados
- API Explorer: Teste de endpoints
- Database: Editor SQL
- Arquitetura: Diagrama interativo
- Code Lab: Executor Python real

### Segurança
- SQL endpoint: apenas SELECT, bloqueia INSERT/UPDATE/DELETE/DROP/etc
- Executor: timeout 5s, sandbox /tmp, read-only filesystem
