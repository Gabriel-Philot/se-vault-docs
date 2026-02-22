# Diagrama Completo: A Anatomia de um Request em Produção

Este guia conecta todas as peças — do clique do usuário até o dado persistido — passando por cada camada que vimos neste curso.

---

## 0. O Arco Completo do Curso

| Aula | O que aprendemos | Camada |
|------|------------------|--------|
| **01** | Internet, DNS, TCP/IP, portas | Rede e transporte |
| **02** | Python, como a máquina executa código | Linguagem e runtime |
| **03** | OOP, SOLID, Design Patterns | Organização do código |
| **04** | HTTP, REST, FastAPI, status codes | Protocolo e framework |
| **05** | Web server, cache, filas, frontend | Infraestrutura de produção |

Agora vamos ver como tudo funciona junto.

---

## 1. O Diagrama: Um Request do Início ao Fim

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USUÁRIO                                       │
│  Abre o browser, digita app.empresa.com                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │      DNS        │  ← Aula 01
                    │ app.empresa.com │
                    │  → 34.56.78.90  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   TCP + TLS     │  ← Aula 01
                    │ Handshake na    │
                    │ porta 443       │
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │          NGINX              │  ← Aula 04 + 05
              │  (Web Server / Reverse Proxy)│
              │                              │
              │  • SSL/TLS termination       │
              │  • /static → serve do disco  │
              │  • /api → proxy para :8000   │
              │  • Rate limiting             │
              │  • Load balancing            │
              └──────┬──────────────┬───────┘
                     │              │
            Estáticos│              │ Dinâmicos
            (HTML/   │              │ (API)
             CSS/JS) │              │
                     ▼              ▼
              Browser        ┌──────────────┐
              renderiza      │   GUNICORN    │  ← Aula 05
                             │  4× Uvicorn  │
                             │  workers     │
                             └──────┬───────┘
                                    │
                             ┌──────▼───────┐
                             │   FastAPI    │  ← Aula 03 + 04
                             │              │
                             │ • Routing    │
                             │ • Validação  │  (Pydantic — OOP)
                             │ • Lógica     │  (SOLID, Patterns)
                             │ • Serializa  │
                             └──┬───┬───┬───┘
                                │   │   │
                    ┌───────────┘   │   └───────────┐
                    │               │               │
             ┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
             │    REDIS    │ │  POSTGRES  │ │    FILA     │
             │   (Cache)   │ │   (DB)     │ │  (Celery/   │
             │             │ │            │ │   RabbitMQ) │
             │ Cache hit?  │ │ Source of  │ │ Tarefas     │
             │ → retorna   │ │ truth      │ │ assíncronas │
             │ Cache miss? │ │            │ │             │
             │ → vai no DB │ │            │ │             │
             └─────────────┘ └────────────┘ └──────┬──────┘
                                                    │
                                             ┌──────▼──────┐
                                             │   WORKER    │
                                             │  (Celery)   │
                                             │             │
                                             │ Processa    │
                                             │ em background│
                                             └─────────────┘
```

---

## 2. Rastreando um Request Real

### Cenário: Usuário consulta relatório de vendas

```
1. Browser → DNS
   "Qual IP de dashboard.empresa.com?"
   DNS responde: 34.56.78.90

2. Browser → Nginx (porta 443)
   GET /api/vendas?mes=2025-01
   TLS handshake, request criptografado

3. Nginx → Gunicorn (porta 8000)
   Nginx decifra SSL, encaminha HTTP puro internamente
   Header X-Real-IP preserva IP do cliente

4. Gunicorn → FastAPI
   Worker Uvicorn pega o request
   FastAPI valida query params com Pydantic

5. FastAPI → Redis
   Chave: "vendas:2025-01"
   CACHE HIT → retorna em <1ms, pula para passo 8

6. FastAPI → PostgreSQL (cache miss)
   SELECT region, SUM(total) FROM vendas
   WHERE mes = '2025-01' GROUP BY region
   → 800ms

7. FastAPI → Redis
   Salva resultado com TTL 300s (5 min)

8. FastAPI → Gunicorn → Nginx → Browser
   Response JSON com dados agregados
   Browser renderiza gráfico
```

### Cenário: Usuário dispara re-processamento de dados

```
1-4. Mesmo fluxo até FastAPI

5. FastAPI → Fila (Redis/RabbitMQ)
   Cria mensagem: {"task": "reprocessar", "mes": "2025-01"}
   Retorna 202 Accepted com task_id

6. Celery Worker pega a mensagem
   Lê dados do S3, transforma, salva no Data Lake
   Atualiza status: "completed"

7. Frontend faz polling: GET /api/task/{id}
   Quando status = completed, mostra resultado
```

---

## 3. Onde Pipelines de Dados Se Encaixam

```
┌─────────────────────────────────────────────────────────┐
│                 APLICAÇÃO WEB                            │
│  (Nginx → Gunicorn → FastAPI → Redis/DB)                │
│                                                          │
│  Produz dados:    Consome dados:                        │
│  • Logs de acesso  • Features do modelo                 │
│  • Eventos         • Agregações pré-computadas          │
│  • Uploads         • Resultados de pipelines            │
└─────────────┬────────────────────────┬──────────────────┘
              │                        ▲
              │ Produz                 │ Consome
              ▼                        │
┌─────────────────────────────────────────────────────────┐
│                PIPELINES DE DADOS                        │
│                                                          │
│  Airflow (orquestração)                                  │
│    │                                                     │
│    ├── Task: Ingestão (S3/API → Data Lake)               │
│    ├── Task: Transformação (dbt/Spark)                   │
│    ├── Task: Treinar modelo (MLflow)                     │
│    └── Task: Publicar features no Redis                  │
│                                                          │
│  Broker: Redis/RabbitMQ (CeleryExecutor)                 │
│  Workers: Celery workers executando tasks                │
└─────────────────────────────────────────────────────────┘
```

**Insight chave:** A aplicação web e os pipelines de dados compartilham a mesma infraestrutura (Redis, filas, bancos). Entender como a aplicação funciona ajuda você a entender por que seus pipelines se comportam de determinada forma.

---

## 4. O Mapa Mental: Cada Peça e Sua Função

| Camada | Tecnologia | Função | Se falhar... |
|--------|-----------|--------|--------------|
| DNS | Route53, Cloudflare | Nome → IP | Ninguém acessa |
| Web Server | Nginx | Proxy, SSL, estáticos | Site fora do ar |
| App Server | Gunicorn + Uvicorn | Roda Python | API fora do ar |
| Framework | FastAPI | Lógica de negócio | Erros 500 |
| Cache | Redis | Acesso rápido | Latência alta (mas funciona) |
| Banco | PostgreSQL | Persistência | Dados perdidos |
| Fila | RabbitMQ/Redis | Tasks async | Tasks não executam |
| Worker | Celery | Processa background | Fila cresce infinitamente |

### Degradação Graciosa

Note que **cache e fila são opcionais** — se Redis cai, a app fica mais lenta mas funciona (vai direto no banco). Se a fila cai, tasks novas não são enfileiradas mas as existentes não se perdem.

Isso é **design intencional**: componentes opcionais devem falhar sem derrubar o sistema.

---

## 5. Fechando o Arco com Aula 01

Na primeira aula, você aprendeu:
*   Como a internet funciona (cabos, roteadores, TCP/IP)
*   O que é DNS (nome → IP)
*   O que são portas (porta 80, 443, 8000)
*   O que é HTTP

Agora você vê o caminho **completo**:

```
Aula 01: Como o dado viaja (rede)
    │
    ▼
Aula 02: Como a máquina executa o código (runtime)
    │
    ▼
Aula 03: Como organizar o código (OOP/SOLID)
    │
    ▼
Aula 04: Como expor o código via HTTP (APIs)
    │
    ▼
Aula 05: Como tudo funciona junto em produção
```

Da request do usuário até o dado no banco, passando por cada camada. Você agora entende o fluxo inteiro.

---

## 6. Checkpoint

> **Pergunta:** Um colega diz que o dashboard está lento. Com o que você sabe agora, quais camadas você investigaria e em que ordem?

> **Aplicação imediata:** Desenhe (papel ou draw.io) o diagrama da aplicação mais importante do seu time. Identifique: onde está o web server? O app server? Tem cache? Tem fila? Quais bancos? Compartilhe com o time e valide.

---

## Resumo

O request de um usuário percorre:

**DNS → Nginx → Gunicorn → FastAPI → Redis/DB/Fila → Worker**

Cada peça tem um papel claro. Nenhuma é opcional sem motivo — cada camada resolve um problema que a anterior não consegue resolver sozinha.

Entender essa anatomia é a diferença entre "meu pipeline quebrou e não sei por quê" e "o problema está na camada X, vou investigar lá".
