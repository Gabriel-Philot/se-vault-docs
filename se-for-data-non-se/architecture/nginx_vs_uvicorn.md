# Nginx vs Uvicorn: Entendendo a Arquitetura Web

> **Objetivo:** Entender a diferença entre servidor de aplicação e proxy reverso — e por que você precisa dos dois em produção.

---

## A Diferença Fundamental

| Componente | Tipo | Função Principal |
|------------|------|------------------|
| **Uvicorn** | Servidor de Aplicação | Executa seu código Python |
| **Nginx** | Servidor Web / Proxy Reverso | Recebe tráfego, protege, distribui |

---

## 1. Uvicorn: O Especialista em Python

O Uvicorn **entende Python**. Ele traduz requisições HTTP para o formato que o Python entende (ASGI) e executa seu código FastAPI.

### O que ele faz

- Traduz requisições HTTP → formato ASGI
- Gerencia funções `async`
- Gera respostas dinâmicas (JSON, HTML, etc.)

### Limitações

- ❌ Não é bom em segurança pesada
- ❌ Lento para servir arquivos estáticos (imagens, CSS, JS)
- ❌ Distribuir carga entre processos não é sua especialidade

```
┌─────────────────────────────────────────────────────────────────────┐
│  UVICORN                                                            │
│                                                                     │
│  Requisição HTTP                                                    │
│       ↓                                                             │
│  Traduz para ASGI                                                   │
│       ↓                                                             │
│  Executa: async def get_users() → [lista de usuários]              │
│       ↓                                                             │
│  Resposta JSON                                                      │
│                                                                     │
│  Analogia: O COZINHEIRO do restaurante                              │
│  (Sabe preparar o prato, mas não atende clientes)                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Nginx: O Segurança/Porteiro

O Nginx **não faz ideia do que é Python**. Ele é um monstro de performance para lidar com tráfego de rede bruto.

### O que ele faz

- Recebe conexões do "mundo exterior" (porta 80/443)
- Cuida do certificado SSL (HTTPS)
- Serve arquivos estáticos ultrarrápido
- Protege o Uvicorn de ataques
- Funciona como **Proxy Reverso**: recebe a requisição e "passa a bola" pro Uvicorn

### Por que é tão bom nisso?

- Escrito em **C** (baixo nível, super rápido)
- Arquitetura **event-driven** (lida com milhares de conexões simultâneas)
- Décadas de otimização para tráfego de rede

```
┌─────────────────────────────────────────────────────────────────────┐
│  NGINX                                                              │
│                                                                     │
│  Internet (usuários)                                                │
│       ↓                                                             │
│  ┌─────────────────────────────────────┐                            │
│  │  Porta 443 (HTTPS)                  │                            │
│  │  • Valida certificado SSL           │                            │
│  │  • Rate limiting (anti-DDoS)        │                            │
│  │  • Bloqueia IPs maliciosos          │                            │
│  └─────────────────────────────────────┘                            │
│       ↓                                                             │
│  É arquivo estático? (imagem, CSS, JS)                              │
│       ├── SIM → Serve direto (velocidade da luz)                    │
│       └── NÃO → Proxy para Uvicorn (requisição dinâmica)            │
│                                                                     │
│  Analogia: O GARÇOM + SEGURANÇA do restaurante                      │
│  (Atende o cliente, filtra quem entra, mas não cozinha)             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Arquitetura Padrão em Produção

**⚠️ Nunca deixe Uvicorn exposto direto para a internet em produção.**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ARQUITETURA DE PRODUÇÃO                         │
└─────────────────────────────────────────────────────────────────────┘

                    Internet (Usuários)
                           │
                           ▼
               ┌───────────────────────┐
               │       NGINX           │ ← Porta 80/443 (pública)
               │                       │
               │  • SSL/HTTPS          │
               │  • Rate limiting      │
               │  • Arquivos estáticos │
               │  • Load balancing     │
               └───────────────────────┘
                           │
              ┌────────────┴────────────┐
              │      Proxy Reverso      │
              │  (repassa para Uvicorn) │
              └────────────┬────────────┘
                           ▼
               ┌───────────────────────┐
               │      UVICORN          │ ← Porta 8000 (interna)
               │                       │
               │  • Executa FastAPI    │
               │  • Processa lógica    │
               │  • Retorna JSON       │
               └───────────────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │     PostgreSQL        │
               │     Redis, etc.       │
               └───────────────────────┘
```

---

## 4. Tabela Comparativa

| Característica | Nginx | Uvicorn |
|----------------|-------|---------|
| **Papel** | Proxy Reverso / Web Server | Servidor de Aplicação (ASGI) |
| **Linguagem** | C (baixo nível/Rede) | Python (aplicação) |
| **Arquivos Estáticos** | Excelente (imagens/JS/CSS) | Lento, não recomendado |
| **SSL/HTTPS** | Gerencia certificados nativamente | Faz, mas não é especialidade |
| **Segurança** | Filtra ataques, Rate Limit | Focado apenas em rodar código |
| **Concorrência** | Milhares de conexões | Limitado pelo Python/GIL |

---

## 5. Quando Usar Cada Um?

### Desenvolvimento Local
```bash
# Só Uvicorn basta
uvicorn app:app --reload
```

### Produção
```
Nginx na frente (porta 80/443)
    └── Proxy para Uvicorn (porta 8000, interna)
```

### Docker Compose Típico

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./static:/var/www/static  # Arquivos estáticos
    depends_on:
      - api

  api:
    build: .
    expose:
      - "8000"  # NÃO exposto para fora, só para nginx
    command: uvicorn app:app --host 0.0.0.0 --port 8000
```

---

## 6. Resumo

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   UVICORN = O cara que sabe COZINHAR (executa o código)             │
│                                                                     │
│   NGINX = O GARÇOM + SEGURANÇA da porta                             │
│           (recebe o cliente, entrega o prato,                       │
│            garante que ninguém quebre o restaurante)                │
│                                                                     │
│   Em DEV: só Uvicorn                                                │
│   Em PROD: Nginx na frente, Uvicorn atrás                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Conexões

- **Relacionado:** Deploy de APIs Python
- **Próximo:** Gunicorn vs Uvicorn (workers síncronos vs assíncronos)
