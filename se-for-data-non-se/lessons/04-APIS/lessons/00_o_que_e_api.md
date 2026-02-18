# O que é uma API?

Este guia explica o conceito de API e REST para engenheiros de dados que precisam criar ou consumir serviços.

---

## 0. Por Que Isso Importa?

Você provavelmente já usou `requests.get()` ou `pd.read_json()`. Mas:
*   O que realmente acontece quando você chama uma API?
*   Por que APIs são a forma padrão de sistemas falarem entre si?
*   O que é "REST" e por que todo mundo fala disso?

A resposta começa com um garçom.

---

## 1. A Analogia do Restaurante

Imagine um restaurante:

| Restaurante | Sistema de Software |
|-------------|---------------------|
| Você (cliente) | Aplicação que quer dados |
| Cozinha | Banco de dados / Sistema interno |
| Garçom | **API** |
| Cardápio | Endpoints disponíveis |
| Pedido | Request HTTP |
| Prato entregue | Response JSON |

**Por que não ir direto na cozinha?**
*   Segurança: você não deve acessar o estoque
*   Organização: a cozinha tem protocolos
*   Controle: o garçom anota, prioriza, entrega

**O garçom é a API.** Ele:
*   Recebe seu pedido (request)
*   Valida se faz sentido (404 se não tem o prato)
*   Entrega na cozinha (backend/database)
*   Traz a resposta (response)

---

## 2. API: Definição Formal

**A**pplication **P**rogramming **I**nterface

É um conjunto de regras que permite que programas se comuniquem.

### Tipos de API

| Tipo | Exemplo | Uso |
|------|---------|-----|
| **REST API** | Twitter API, Stripe | Web, HTTP, JSON |
| **GraphQL** | GitHub API, Shopify | Queries flexíveis |
| **gRPC** | Kubernetes, microserviços | Alta performance, protobuf |
| **SDK/Libraries** | boto3, pandas | Código nativo |

Foco deste módulo: **REST APIs** (o mais comum em dados).

---

## 3. REST: O Que Significa

**RE**presentational **S**tate **T**ransfer

É um estilo arquitetural, não um protocolo. Criado por Roy Fielding (2000).

### Princípios REST

| Princípio | O Que Significa |
|-----------|-----------------|
| **Stateless** | Cada request tem tudo que precisa. Sem sessão no servidor. |
| **Client-Server** | Separação clara entre quem pede e quem serve. |
| **Cacheable** | Responses podem ser cacheadas (GET principalmente). |
| **Uniform Interface** | URLs padronizadas, verbos consistentes. |
| **Layered System** | Cliente não sabe se fala com servidor direto ou via proxy. |

### Recursos e Representações

*   **Recurso:** O "objeto" (ex: um pet no petshop)
*   **Representação:** Como chega no cliente (JSON, XML, etc.)

```
Recurso no banco:  {id: 1, name: "Rex", species: "dog"}
Representação API: {"id": 1, "name": "Rex", "species": "dog"}
```

---

## 4. O Ciclo Request/Response

```
┌──────────┐    Request     ┌──────────┐    Query     ┌──────────┐
│  Cliente │ ───────────────▶│   API    │ ────────────▶│   DB     │
│ (Python) │                │ (FastAPI)│              │ (Postgres)│
└──────────┘    Response    └──────────┘    Result    └──────────┘
     ◀───────────────────────     ◀──────────────────────
```

### Estrutura do Request

```
GET /api/pets/1 HTTP/1.1
Host: petshop.local
Accept: application/json
```

| Parte | Exemplo | Função |
|-------|---------|--------|
| **Método** | GET | O que fazer |
| **URL** | /api/pets/1 | Qual recurso |
| **Headers** | Accept: application/json | Metadados |
| **Body** | (vazio em GET) | Dados extras |

### Estrutura do Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{"id": 1, "name": "Rex", "species": "dog", "hunger_level": 50}
```

| Parte | Exemplo | Função |
|-------|---------|--------|
| **Status Code** | 200 | Como foi |
| **Headers** | Content-Type | Metadados |
| **Body** | JSON | Os dados |

---

## 5. Endpoints: O Cardápio da API

Endpoints são as URLs disponíveis. No nosso Pet Shop:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /pets | Lista todos os pets |
| GET | /pets/{id} | Busca um pet específico |
| POST | /pets | Cria um novo pet |
| PUT | /pets/{id} | Atualiza pet completo |
| PATCH | /pets/{id} | Atualiza pet parcial |
| DELETE | /pets/{id} | Remove um pet |
| POST | /pets/{id}/feed | Alimenta o pet |

### Convenção RESTful

*   Substantivos no plural: `/pets` (não `/pet`)
*   Hierarquia clara: `/pets/{id}/actions`
*   Verbos no método, não na URL: `DELETE /pets/1` (não `/pets/1/delete`)

---

## 6. Por Que APIs Para Dados?

| Cenário | Sem API | Com API |
|---------|---------|---------|
| **Acesso a dados** | VPN + credenciais de banco | HTTPS + token |
| **Integração** | ETL que acessa banco direto | Pipeline chama endpoint |
| **Segurança** | Usuário tem acesso total | API controla o que cada um vê |
| **Scale** | Conexões diretas sobrecarregam | Cache + rate limiting |
| **Governança** | Sem log de quem acessou | Request logging |

### Exemplos Reais em Engenharia de Dados

*   **Salesforce API:** Extrai dados de CRM
*   **Stripe API:** Consome transações financeiras
*   **Snowflake REST API:** Executa queries via HTTP
*   **OpenAI API:** Envia prompts, recebe embeddings

---

## 7. Cheat Sheet

| Termo | Definição |
|-------|-----------|
| **API** | Interface que permite programas se comunicarem |
| **REST** | Estilo arquitetural para APIs sobre HTTP |
| **Endpoint** | URL específica de um recurso |
| **Request** | Mensagem do cliente para a API |
| **Response** | Mensagem da API para o cliente |
| **Resource** | O "objeto" manipulado (pet, user, order) |
| **Stateless** | Cada request é independente |

---

## Próximos Passos

Agora que você sabe o que é uma API, vamos entender os **Verbos HTTP** — como dizer à API o que fazer.

→ [01_http_verbs.md](01_http_verbs.md)
