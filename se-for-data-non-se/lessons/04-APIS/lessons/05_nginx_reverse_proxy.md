# Nginx & Reverse Proxy: O Porteiro da Arquitetura

Este guia explica Nginx, reverse proxy e como ele se encaixa em arquiteturas modernas.

---

## 0. Por Que Isso Importa?

Você não expõe FastAPI direto para a internet. Nginx é o padrão da indústria para:
*   Servir arquivos estáticos (frontend)
*   Proxy reverso para APIs
*   Load balancing
*   SSL/TLS termination
*   Rate limiting

33%+ dos sites usam Nginx.

---

## 1. O Que é Nginx?

Servidor web criado por Igor Sysoev (2004) para resolver o "problema C10K" (10k conexões simultâneas).

### Características

| Feature | Descrição |
|---------|-----------|
| Event-driven | Uma thread trata milhares de conexões |
| Non-blocking | Não espera I/O travar |
| Reverse proxy | Encaminha requests para outros servidores |
| Load balancer | Distribui carga entre servidores |

### Nginx vs Apache

| Aspecto | Nginx | Apache |
|---------|-------|--------|
| Arquitetura | Event-driven | Thread/process per request |
| Conexões | 10k+ por worker | Limitado por RAM |
| Estáticos | Muito rápido | Lento |
| .htaccess | Não suporta | Suporta |
| Config | Centralizada | Por diretório |

---

## 2. Reverse Proxy - O Conceito

### Forward Proxy vs Reverse Proxy

```
FORWARD PROXY (proxy tradicional):
Cliente → Proxy → Internet → Servidor
   ↑
   Esconde o cliente

REVERSE PROXY:
Cliente → Internet → Reverse Proxy → Servidor
                          ↑
                    Esconde o servidor
```

### Analogia: Recepcionista

```
┌─────────┐     "Quero falar com vendas"     ┌──────────────┐
│ Cliente │ ─────────────────────────────────▶│ Recepcionista│
└─────────┘                                    └──────┬───────┘
     ◀─────────────────────────────────────────────────┘
                      Encaminha para setor correto
                                                │
                    ┌───────────────────────────┼───────────────────┐
                    ▼                           ▼                   ▼
              ┌──────────┐              ┌──────────┐         ┌──────────┐
              │  Vendas  │              │   RH     │         │   API    │
              └──────────┘              └──────────┘         └──────────┘
```

**Recepcionista = Nginx (Reverse Proxy)**

---

## 3. Arquitetura Pet Shop

```
                       ┌─────────────────────────────────────┐
                       │           Nginx (:80)               │
                       │                                     │
     Browser ─────────▶│  /              → React Static      │
     (porta 80)        │  /api/*         → FastAPI :8000     │
                       │  /api/stats     → FastAPI :8000     │
                       └──────────────┬──────────────────────┘
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

### Benefícios

| Benefício | Explicação |
|-----------|------------|
| **Segurança** | FastAPI não exposto diretamente |
| **SSL** | Nginx gerencia HTTPS, API fica HTTP interno |
| **Cache** | Nginx pode cachear responses |
| **Compressão** | Gzip automático |
| **Rate Limiting** | Limita requests por IP |

---

## 4. Múltiplos Papéis do Nginx

### 4.1 Servidor Web Estático

```nginx
server {
    listen 80;
    server_name petshop.local;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;  # SPA support
    }
}
```

### 4.2 Reverse Proxy para API

```nginx
location /api/ {
    proxy_pass http://api:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 4.3 Load Balancer

```nginx
upstream api_servers {
    least_conn;  # Algoritmo: least connections
    server api1:8000;
    server api2:8000;
    server api3:8000;
}

location /api/ {
    proxy_pass http://api_servers/;
}
```

### 4.4 SSL Termination

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    location /api/ {
        proxy_pass http://api:8000/;  # HTTP interno
    }
}
```

### 4.5 Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://api:8000/;
}
```

### 4.6 WebSocket Proxy

```nginx
location /ws/ {
    proxy_pass http://api:8000/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

## 5. Nginx + Filas (Celery/Redis)

### Arquitetura Completa

```
┌─────────┐     POST /import     ┌─────────┐     Enqueue      ┌─────────┐
│ Cliente │ ────────────────────▶│  Nginx  │ ────────────────▶│ FastAPI │
└─────────┘                      └─────────┘                  └────┬────┘
     ◀──────────────────────────────────────────────────────────────┘
              {"job_id": "abc", "status": "pending"}
                                                    │
                                                    ▼
                                              ┌─────────┐
                                              │  Redis  │
                                              │ (Queue) │
                                              └────┬────┘
                                                   │ Dequeue
                                                   ▼
                                              ┌─────────┐
                                              │ Celery  │
                                              │ Worker  │
                                              └────┬────┘
                                                   │
                                                   ▼
                                              ┌─────────┐
                                              │PostgreSQL│
                                              └─────────┘
```

### Por Que Nginx Não Fala Direto com Filas?

| Camada | Protocolo | Função |
|--------|-----------|--------|
| Browser ↔ Nginx | HTTP | Web standard |
| Nginx ↔ FastAPI | HTTP | Application logic |
| FastAPI ↔ Redis | Redis Protocol | Queue operations |
| Celery ↔ Redis | Redis Protocol | Job processing |

**Nginx só fala HTTP.** Redis usa protocolo próprio. FastAPI é a ponte.

### Padrão Job Status

```python
@app.post("/import")
async def start_import(file: str):
    job = import_task.delay(file)
    return {"job_id": job.id, "status": "pending"}

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = AsyncResult(job_id)
    return {
        "job_id": job_id,
        "status": job.status,  # PENDING, STARTED, SUCCESS, FAILURE
        "result": job.result if job.ready() else None
    }
```

---

## 6. Configuração Prática (nginx.conf)

```nginx
# nginx/nginx.conf

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    upstream api_backend {
        server api:8000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Frontend estático (React)
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Cache para assets
            location ~* \.(js|css|png|jpg|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
        
        # API backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api_backend/;
            proxy_http_version 1.1;
            
            # Headers importantes
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Health check
        location /health {
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 7. Checklist de Benefícios

| Feature | Sem Nginx | Com Nginx |
|---------|-----------|-----------|
| **Exposição** | FastAPI na porta 8000 | Porta 80/443 padrão |
| **SSL** | Certbot manual ou manual em código | Nginx gerencia |
| **Estáticos** | FastAPI serve (lento) | Nginx serve (rápido) |
| **Rate Limit** | Implementar na mão | Config simples |
| **Load Balance** | Não tem | Nativo |
| **Gzip** | Middleware manual | Automático |
| **Logs** | Logs da aplicação | Access logs separados |
| **SPA Routing** | Configurar no FastAPI | try_files |

---

## 8. Debugging Nginx

### Comandos Úteis

```bash
# Testar configuração
nginx -t

# Recarregar config sem restart
nginx -s reload

# Ver logs
tail -f /var/log/nginx/error.log
```

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| 502 Bad Gateway | FastAPI não responde | Verificar se container está rodando |
| 403 Forbidden | Permissão de arquivo | `chown -R nginx:nginx /path` |
| 404 Not Found | Rota não configurada | Verificar location blocks |
| Connection refused | Upstream down | `docker ps` para verificar containers |

---

## 9. Cheat Sheet

| Diretiva | Função |
|----------|--------|
| `listen` | Porta que Nginx escuta |
| `server_name` | Domínio |
| `location` | Roteamento por path |
| `proxy_pass` | Encaminha para backend |
| `root` | Diretório de arquivos estáticos |
| `try_files` | Fallback para SPA |
| `upstream` | Define servidores backend |
| `limit_req` | Rate limiting |

---

## Próximos Passos

Agora vamos adicionar **Redis Cache** para melhorar performance.

→ [06_redis_cache.md](06_redis_cache.md)
