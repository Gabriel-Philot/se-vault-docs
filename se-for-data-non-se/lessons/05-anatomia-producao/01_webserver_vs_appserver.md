# Web Server vs App Server: Quem Faz o Quê

Este guia explica por que aplicações em produção precisam de duas camadas de servidor e como elas se conectam.

---

## 0. O Problema: Por que não expor o FastAPI direto?

Na aula 04 você viu Nginx como reverse proxy. Mas ficou no ar: **por que não rodar o FastAPI direto na porta 80 e pronto?**

Imagine que você é dono de um restaurante:
*   O **garçom** (web server) recebe os clientes, anota pedidos, entrega pratos prontos, lida com múltiplas mesas simultaneamente.
*   O **cozinheiro** (app server) executa a lógica — cozinha o prato de fato.

Se o cozinheiro tivesse que atender mesas, anotar pedidos E cozinhar, o restaurante travaria. Cada um tem seu papel.

---

## 1. Web Server — Nginx (O Garçom)

### O que faz
*   **Recebe conexões HTTP/HTTPS** de milhares de clientes simultaneamente.
*   **Serve arquivos estáticos** (HTML, CSS, JS, imagens) direto do disco — sem envolver Python.
*   **Proxy reverso:** encaminha requests dinâmicos para o app server.
*   **Load balancing:** distribui requests entre múltiplas instâncias do app server.
*   **SSL/TLS termination:** lida com HTTPS e repassa HTTP simples internamente.

### Por que é bom nisso
Nginx é escrito em C, event-driven, non-blocking. Uma única thread trata milhares de conexões. Python não consegue isso — o GIL e o modelo de execução impedem.

### O que NÃO faz
Nginx não roda código Python. Ele não sabe o que é FastAPI, Django, ou Flask. Ele só sabe encaminhar requests.

---

## 2. App Server — Gunicorn / Uvicorn (O Cozinheiro)

### O que faz
*   **Executa o código Python** da sua aplicação.
*   **Gerencia workers:** múltiplos processos/threads que processam requests em paralelo.
*   **Traduz o protocolo:** converte a request HTTP num formato que o framework Python entende.

### Gunicorn vs Uvicorn

| Aspecto | Gunicorn | Uvicorn |
|---------|----------|---------|
| Protocolo | WSGI (síncrono) | ASGI (assíncrono) |
| Frameworks | Flask, Django | FastAPI, Starlette |
| Workers | Processos (fork) | Event loop (asyncio) |
| Uso típico | Apps legadas, Django | APIs modernas, WebSockets |

### O combo em produção

O padrão mais comum para FastAPI:

```
Gunicorn (gerenciador de processos)
  └── Uvicorn workers (executam o código async)
```

```bash
# Comando real de produção
gunicorn main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 4 \
    --bind 0.0.0.0:8000
```

Gunicorn cuida de spawnar/matar workers, lidar com crashes, e reiniciar processos. Uvicorn cuida de executar o código async do FastAPI.

---

## 3. O Fluxo Completo: Nginx → Gunicorn → FastAPI

```
Internet
    │
    ▼
┌──────────┐
│  Nginx   │  porta 80/443
│  (web)   │  - SSL termination
│          │  - Serve /static direto
│          │  - Proxy /api → :8000
└────┬─────┘
     │ HTTP (interno, sem SSL)
     ▼
┌──────────┐
│ Gunicorn │  porta 8000
│ (app)    │  - 4 workers Uvicorn
│          │  - Process management
└────┬─────┘
     │ ASGI protocol
     ▼
┌──────────┐
│ FastAPI  │  Seu código Python
│          │  - Rotas, validação, lógica
│          │  - Consulta DB, Redis, etc.
└──────────┘
```

### Configuração Nginx típica

```nginx
# /etc/nginx/sites-available/minha-api
server {
    listen 80;
    server_name api.meusite.com;

    # Arquivos estáticos — Nginx serve direto, sem Python
    location /static/ {
        alias /var/www/static/;
    }

    # Tudo mais → Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 4. Conexão com Dados: Onde Você Já Usa Isso

| Ferramenta | Web Server | App Server | Observação |
|------------|-----------|------------|------------|
| **Airflow** | Nginx (em prod) | Gunicorn + Flask | `airflow webserver` roda Gunicorn por baixo |
| **MLflow** | Nginx (em prod) | Gunicorn + Flask | Tracking server usa o mesmo padrão |
| **Jupyter Hub** | Nginx/Traefik | Tornado | Configurable HTTP proxy na frente |
| **Superset** | Nginx | Gunicorn + Flask | Dashboard tool usa Gunicorn com workers |
| **API de ML** | Nginx | Uvicorn + FastAPI | Servir modelos com TensorFlow Serving ou similar |

### Cenário real: API de predição em produção

```
Usuário solicita predição
    │
    ▼
Nginx (rate limit: 100 req/min por IP)
    │
    ▼
Gunicorn (4 workers, cada um com modelo carregado em memória)
    │
    ▼
FastAPI endpoint: model.predict(features)
    │
    ▼
Retorna JSON com predição
```

**Trade-off:** Mais workers = mais memória (cada um carrega o modelo). Se o modelo ocupa 2GB, 4 workers = 8GB de RAM só pro modelo.

---

## 5. Anti-Padrão: O Que NÃO Fazer

### Rodar Uvicorn solo em produção

```bash
# DEV — OK
uvicorn main:app --reload

# PROD — NÃO faça isso
uvicorn main:app --host 0.0.0.0 --port 80
```

**Por quê?**
*   Sem process management (se o worker morre, ninguém reinicia).
*   Sem load balancing entre workers.
*   Sem SSL termination.
*   Sem serving de estáticos.
*   Sem proteção contra slow clients (Nginx bufferiza; Uvicorn solo fica preso).

---

## 6. Checkpoint

> **Pergunta:** Um colega diz "vou colocar a API em produção rodando `uvicorn main:app` direto com `--host 0.0.0.0`". Quais são os 3 maiores riscos?

> **Aplicação imediata:** Verifique como o Airflow webserver está configurado no seu ambiente. Rode `airflow config get-value webserver workers` para ver quantos Gunicorn workers estão rodando.

---

## Resumo

| Componente | Papel | Analogia |
|-----------|-------|----------|
| **Nginx** | Recebe conexões, serve estáticos, proxy, SSL | Garçom do restaurante |
| **Gunicorn** | Gerencia processos Python, reinicia workers | Chef de cozinha (coordena) |
| **Uvicorn** | Executa código async (FastAPI) | Cozinheiro (executa) |
| **FastAPI** | Sua lógica de negócio | A receita |

A regra de ouro: **Nginx na frente, app server atrás, seu código dentro.**
