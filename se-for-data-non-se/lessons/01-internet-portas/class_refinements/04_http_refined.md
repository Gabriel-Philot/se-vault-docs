# HTTP: A Língua Franca da Internet

Se as aulas anteriores cobriram **onde** os serviços vivem (portas) e **como proteger** a comunicação (TLS), esta aula foca no **que** realmente está sendo dito. HTTP é o protocolo que rege quase toda comunicação na web moderna, e entendê-lo em profundidade é o que separa "usar uma API" de "debugar por que ela não funciona".

---

## 📋 Tabela Diagnóstica (vs. Fontes Originais)

| Seção | Veredicto | Detalhe |
|:------|:---------:|:--------|
| §1 O que é HTTP | ✅ | Fiel à MDN |
| §2 Anatomia do Request | ✅ | Diagrama ASCII mantido |
| §2.1 Métodos HTTP | ✅ | Tabela com idempotência mantida |
| §2.2 URL | ✅ | Decomposição clara |
| §2.3 Headers | ✅ | Prático |
| §3 Response | ✅ | Mantido |
| §3.1 Status Codes | 🔵 | Adicionado: **1xx Informational** e **Content Negotiation** |
| §4 Body/JSON | ✅ | Floating point warning mantido |
| §5 Ferramentas | ✅ | Código prático |
| §6 Paginação/Rate Limit | ✅ | Mantido |
| §7 HTTP versions | 🔵 | Adicionado: **QUIC** explicado em profundidade |
| **Proxies** | 🟡→✅ | **Adicionado** — forward vs reverse proxy (MDN) |
| **1xx Status Codes** | 🟡→✅ | **Adicionado** |
| **Checkpoint** | 🟡→✅ | **Adicionado** |
| **Aplicação Imediata** | 🟡→✅ | **Adicionado** |

---

## 1. O que é HTTP, afinal?

**HTTP (HyperText Transfer Protocol)** é um protocolo de **camada de aplicação** que define como um cliente (browser, script Python, app mobile) pede coisas a um servidor, e como o servidor responde.

Características fundamentais:
- **Textual:** Diferente de protocolos binários (gRPC, Postgres wire protocol), HTTP é legível por humanos. Você pode literalmente ler um request HTTP como um texto.
- **Stateless:** O servidor não lembra de você entre requests. Cada pedido é independente. (É por isso que existem tokens e cookies — para "lembrar" quem é você.)
- **Request/Response:** Sempre segue o padrão pergunta → resposta. O cliente inicia, o servidor reage.

### Uma conversa HTTP real

```
# O que o seu browser REALMENTE envia quando você acessa google.com:

GET / HTTP/1.1
Host: www.google.com
User-Agent: Mozilla/5.0
Accept: text/html
Accept-Language: pt-BR

# O que o servidor responde:

HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 14523

<!doctype html><html>... (a página HTML) ...</html>
```

Isso é tudo. HTTP é, na essência, um envelope de texto com regras de formatação.

### Proxies: Os Intermediários Invisíveis

A MDN destaca que entre o cliente e o servidor existem **proxies** — computadores intermediários que interceptam, modificam ou encaminham requests. Existem dois tipos:

| Tipo | Direção | O que faz | Exemplo no dia a dia |
|:-----|:--------|:----------|:--------------------|
| **Forward Proxy** | Cliente → Internet | Intercepta requests do cliente antes de sair | Proxy corporativo que bloqueia sites, VPN |
| **Reverse Proxy** | Internet → Servidor | Intercepta requests antes de chegar no backend | Load Balancer, Nginx, API Gateway |

```
Forward Proxy:
  Browser → [Proxy Corporativo] → Internet → Servidor

Reverse Proxy (mais comum para DE):
  Browser → Internet → [Nginx/ALB] → FastAPI Backend → PostgreSQL
```

> **Para DE:** Quando você debuga "minha API retorna headers estranhos", pode ser o reverse proxy (Nginx, ALB) adicionando/modificando headers. O `X-Forwarded-For` e `X-Real-IP` são headers que o reverse proxy injeta para preservar o IP original do cliente.

---

## 2. Anatomia de um Request

Todo request HTTP tem 4 partes:

```
┌──────────────────────────────────────────────┐
│  1. LINHA DE REQUEST                         │
│     GET /api/vendas?mes=janeiro HTTP/1.1      │
│     ─── ──────────────────────── ────────     │
│     │          │                    │          │
│     Método     URL (path + query)   Versão    │
├──────────────────────────────────────────────┤
│  2. HEADERS (metadados)                      │
│     Host: api.empresa.com                    │
│     Authorization: Bearer eyJhbGci...        │
│     Content-Type: application/json           │
│     Accept: application/json                 │
├──────────────────────────────────────────────┤
│  3. LINHA EM BRANCO (separador obrigatório)  │
│                                              │
├──────────────────────────────────────────────┤
│  4. BODY (opcional, depende do método)       │
│     {"filtro": "eletrônicos", "limit": 50}   │
└──────────────────────────────────────────────┘
```

### 2.1 Métodos HTTP (os "verbos")

Os métodos dizem **o que você quer fazer** com o recurso.

| Método | Significado | Tem Body? | Idempotente? | Uso típico em Dados |
|:-------|:------------|:---------:|:------------:|:--------------------|
| **GET** | "Me dá isso" | Não | Sim | Consultar API, buscar dados |
| **POST** | "Toma isso, processa" | Sim | Não | Enviar dados, criar recursos |
| **PUT** | "Substitui isso inteiro" | Sim | Sim | Atualizar registro completo |
| **PATCH** | "Atualiza só esse pedaço" | Sim | Não | Atualizar campo específico |
| **DELETE** | "Remove isso" | Raro | Sim | Deletar recurso |
| **HEAD** | "Só me dá os headers" | Não | Sim | Checar se arquivo existe (S3!) |
| **OPTIONS** | "O que posso fazer aqui?" | Não | Sim | CORS preflight (browsers) |

**Idempotente** = fazer 1 vez ou 100 vezes dá o mesmo resultado. `DELETE /user/42` remove o user 42; chamar de novo não muda nada (ele já não existe). `POST /pedidos` cria um pedido novo a cada chamada — não é idempotente.

**Na vida real de dados:**
- `GET` é 90% do seu dia: `requests.get("https://api.dados.gov.br/...")`
- `POST` é para ingestão reversa: enviar dados para webhooks, APIs de parceiros
- `HEAD` é o que o Spark usa no S3 para listar metadados sem baixar o arquivo inteiro

### 2.2 A URL decomposta

```
https://api.empresa.com:443/v2/vendas/2024?regiao=sul&limit=100
──────  ───────────────  ───  ───────────── ──────────────────
  │          │            │        │                 │
Scheme     Host         Porta   Path           Query Params
(protocolo)                    (o recurso)    (filtros/opções)
```

**Path params vs Query params:**

| Tipo | Exemplo | Quando usar |
|:-----|:--------|:------------|
| **Path** | `/vendas/2024` | Identificar um recurso específico |
| **Query** | `?regiao=sul&limit=100` | Filtrar, paginar, configurar |

```python
# Em Python com requests:
import requests

# Path param: o ano faz parte da "identidade" do recurso
response = requests.get("https://api.empresa.com/v2/vendas/2024",
    params={"regiao": "sul", "limit": 100}  # query params
)
# URL final: /v2/vendas/2024?regiao=sul&limit=100
```

### 2.3 Headers importantes

Headers são **metadados** sobre o request ou response. São pares chave-valor.

| Header | Direção | O que faz | Exemplo |
|:-------|:--------|:----------|:--------|
| `Host` | Request | Qual servidor (obrigatório desde HTTP/1.1) | `api.empresa.com` |
| `Authorization` | Request | Quem é você (autenticação) | `Bearer eyJhbGci...` |
| `Content-Type` | Ambos | Formato do body | `application/json` |
| `Accept` | Request | Formato que você quer receber | `application/json` |
| `User-Agent` | Request | Quem está pedindo | `python-requests/2.31.0` |
| `Content-Length` | Ambos | Tamanho do body em bytes | `1024` |
| `Cache-Control` | Response | Regras de cache | `max-age=3600` |
| `Location` | Response | Para onde redirecionar (3xx) | `https://novo-url.com` |
| `Retry-After` | Response | Quando tentar de novo (429) | `60` (segundos) |
| `X-Request-Id` | Ambos | ID único para rastreamento | `uuid-abc-123` |

#### Content Negotiation: O `Accept` em profundidade

O `Accept` header permite que o cliente **negocie** qual formato quer receber. Is so é chamado **Content Negotiation**:

```
# "Quero JSON, mas aceito XML se não tiver JSON":
Accept: application/json, application/xml;q=0.9

# "Quero CSV especificamente":
Accept: text/csv

# O q=0.9 é um peso (quality factor): 1.0 = preferido, 0.0 = inaceitável
```

> **Para DE:** Se uma API retorna HTML em vez de JSON, pode ser que você esqueceu de enviar `Accept: application/json`. A API "negociou" o formato padrão (HTML para browsers).

**Para engenheiros de dados:**
- `Content-Type` é crucial: se a API retorna CSV (`text/csv`) e você trata como JSON, vai quebrar
- `Authorization` é o header que carrega seu token (visto na aula de segurança)
- `Retry-After` aparece quando APIs de rate limit te bloqueiam (muito comum em ingestão)
- Headers com `X-` são customizados (não padronizados)

---

## 3. Anatomia de um Response

```
┌──────────────────────────────────────────────┐
│  1. STATUS LINE                              │
│     HTTP/1.1 200 OK                          │
│     ──────── ─── ──                          │
│       │       │   │                          │
│     Versão  Code Reason (humano)             │
├──────────────────────────────────────────────┤
│  2. HEADERS                                  │
│     Content-Type: application/json           │
│     Content-Length: 2048                      │
│     X-RateLimit-Remaining: 95                │
├──────────────────────────────────────────────┤
│  3. LINHA EM BRANCO                          │
│                                              │
├──────────────────────────────────────────────┤
│  4. BODY                                     │
│     {"vendas": [...], "total": 1523}         │
└──────────────────────────────────────────────┘
```

### 3.1 Status Codes: O vocabulário essencial

O status code é um número de 3 dígitos que diz **o que aconteceu**. A primeira cifra define a família:

#### 1xx - Informacional

| Code | Nome | Significado | Quando você vê |
|:-----|:-----|:------------|:---------------|
| **100** | Continue | "Pode continuar enviando o body" | Upload grande com `Expect: 100-continue` |
| **101** | Switching Protocols | "Mudando de protocolo" | Upgrade para WebSocket |

> **Na prática:** O `100 Continue` é útil para uploads grandes. O cliente envia primeiro os headers com `Expect: 100-continue`. Se o servidor aceita (100), o cliente envia o body pesado. Se rejeita (413 Payload Too Large), economiza banda — o body nunca é enviado.

#### 2xx - Deu certo

| Code | Nome | Significado | Quando você vê |
|:-----|:-----|:------------|:---------------|
| **200** | OK | Sucesso genérico | `GET` retornou dados |
| **201** | Created | Recurso criado | `POST` criou um registro |
| **204** | No Content | Sucesso, sem body | `DELETE` removeu algo |

#### 3xx - Redirecionamento

| Code | Nome | Significado | Quando você vê |
|:-----|:-----|:------------|:---------------|
| **301** | Moved Permanently | URL mudou pra sempre | API migrou de domínio |
| **302** | Found | Redirecionamento temporário | Login redirect |
| **304** | Not Modified | Use o cache | Nada mudou desde último request |

#### 4xx - Erro do cliente (culpa sua)

| Code | Nome | Significado | Debug |
|:-----|:-----|:------------|:------|
| **400** | Bad Request | Request malformado | JSON inválido, campo faltando |
| **401** | Unauthorized | Não **autenticado** | Token expirou, sem header Auth |
| **403** | Forbidden | Autenticado mas sem **permissão** | Seu user não tem acesso a esse recurso |
| **404** | Not Found | Recurso não existe | URL errada, ID inexistente |
| **405** | Method Not Allowed | Método errado | Fez POST onde só aceita GET |
| **409** | Conflict | Conflito de estado | Tentou criar algo que já existe |
| **422** | Unprocessable Entity | Dados inválidos (semântica) | Email sem @, data no futuro |
| **429** | Too Many Requests | Rate limit estourou | Muitos requests em pouco tempo |

> **Nuance da MDN:** O nome "401 Unauthorized" é tecnicamente enganoso. Semanticamente significa "**unauthenticated**" (não autenticado), não "unauthorized" (não autorizado). Para "não autorizado", o correto é 403 Forbidden.

#### 5xx - Erro do servidor (culpa deles)

| Code | Nome | Significado | Debug |
|:-----|:-----|:------------|:------|
| **500** | Internal Server Error | Bug no servidor | Algo quebrou lá dentro |
| **502** | Bad Gateway | Proxy não conseguiu falar com backend | Nginx não alcança o app |
| **503** | Service Unavailable | Serviço fora do ar | Deploy, manutenção, overload |
| **504** | Gateway Timeout | Proxy esperou demais | Backend travou, query lenta |

**O mapa mental para debug:**

```
Não funcionou?
├── 4xx → O problema é no SEU request
│   ├── 401/403 → Autenticação/Autorização
│   ├── 404 → URL errada
│   ├── 429 → Diminua a velocidade
│   └── 400/422 → Seu JSON/payload está errado
└── 5xx → O problema é no SERVIDOR
    ├── 502/504 → Infraestrutura (proxy, rede)
    └── 500/503 → Aplicação (bug, deploy, sobrecarga)
```

---

## 4. O Body: JSON como padrão

Na era moderna, o body de requests e responses é quase sempre **JSON**.

### JSON (JavaScript Object Notation)

```json
{
  "id": 42,
  "produto": "Sensor IoT",
  "preco": 149.90,
  "tags": ["iot", "hardware"],
  "fornecedor": {
    "nome": "TechCorp",
    "cnpj": "12.345.678/0001-90"
  },
  "ativo": true,
  "descontinuado_em": null
}
```

**Tipos suportados:** string, number, boolean, null, array, object. Note: **não tem data**, **não tem decimal preciso** (tudo é floating point). Isso causa problemas reais:

```python
# Cuidado com valores monetários em JSON!
import json

# O JSON transmite 0.1, mas floating point não é exato
dados = json.loads('{"preco": 19.99}')
print(dados["preco"] * 100)  # 1998.9999999999998, não 1999

# Solução: APIs financeiras enviam como string
# {"preco": "19.99"} e você converte com Decimal
from decimal import Decimal
preco = Decimal("19.99")
```

### Outros formatos (menos comuns, mas existem)

| Content-Type | Formato | Onde você vê |
|:-------------|:--------|:-------------|
| `application/json` | JSON | 90% das APIs modernas |
| `text/csv` | CSV | APIs de exportação de dados |
| `application/xml` | XML | APIs legadas (SOAP, governo) |
| `application/x-ndjson` | NDJSON (JSON por linha) | Elasticsearch bulk, logs |
| `multipart/form-data` | Binário + metadados | Upload de arquivos |
| `application/octet-stream` | Binário puro | Download de arquivos |

**NDJSON** é especialmente relevante para dados — cada linha é um JSON independente, ideal para streaming:

```
{"timestamp": "2024-01-15T10:00:00Z", "sensor": "A1", "valor": 23.5}
{"timestamp": "2024-01-15T10:00:01Z", "sensor": "A1", "valor": 23.7}
{"timestamp": "2024-01-15T10:00:02Z", "sensor": "A2", "valor": 18.1}
```

---

## 5. HTTP na Prática: Ferramentas do dia a dia

### 5.1 curl (Terminal)

O canivete suíço. Todo servidor tem `curl` instalado.

```bash
# GET simples
curl https://api.github.com/users/octocat

# GET com headers customizados
curl -H "Authorization: Bearer MEU_TOKEN" \
     -H "Accept: application/json" \
     https://api.empresa.com/dados

# POST enviando JSON
curl -X POST https://api.empresa.com/ingestao \
     -H "Content-Type: application/json" \
     -d '{"sensor": "A1", "valor": 23.5}'

# Ver headers da resposta (-I = HEAD, -i = headers + body)
curl -i https://api.empresa.com/health

# Seguir redirects (-L) e mostrar progresso (-v = verbose)
curl -Lv https://url-que-redireciona.com

# Salvar resposta em arquivo
curl -o dados.json https://api.empresa.com/export
```

**Flags essenciais:**

| Flag | O que faz |
|:-----|:----------|
| `-X METHOD` | Define o método (POST, PUT, DELETE) |
| `-H "Key: Value"` | Adiciona header |
| `-d '...'` | Envia body (implica POST se não tiver -X) |
| `-i` | Mostra headers da resposta |
| `-v` | Verbose (mostra tudo: request + response) |
| `-o arquivo` | Salva output em arquivo |
| `-L` | Segue redirects (3xx) |
| `-s` | Silent (sem barra de progresso) |
| `--connect-timeout N` | Timeout de conexão em segundos |

### 5.2 Python requests

A forma mais natural para engenheiros de dados.

```python
import requests

# GET com query params
response = requests.get(
    "https://api.empresa.com/vendas",
    params={"ano": 2024, "regiao": "sul"},
    headers={"Authorization": "Bearer MEU_TOKEN"},
    timeout=30  # SEMPRE defina timeout!
)

# Checando o resultado
print(response.status_code)      # 200
print(response.headers)          # dict com todos os headers
print(response.json())           # parse automático do JSON
print(response.text)             # body como string crua
print(response.elapsed)          # tempo que levou

# POST enviando JSON
response = requests.post(
    "https://api.empresa.com/ingestao",
    json={"sensor": "A1", "valor": 23.5},  # json= já seta Content-Type
    timeout=30
)

# Tratamento robusto de erros
response = requests.get("https://api.empresa.com/dados", timeout=30)
response.raise_for_status()  # Levanta exceção se 4xx ou 5xx
dados = response.json()
```

**Erros comuns e o que significam:**

```python
# ConnectionError → Servidor não encontrado / DNS falhou / porta fechada
# Timeout → Servidor não respondeu a tempo (SEMPRE use timeout!)
# HTTPError (via raise_for_status) → 4xx ou 5xx
# JSONDecodeError → Response não é JSON válido

try:
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    dados = r.json()
except requests.ConnectionError:
    print("Servidor inacessível - checar DNS, rede, VPN")
except requests.Timeout:
    print("Timeout - servidor lento ou rede congestionada")
except requests.HTTPError as e:
    print(f"Erro HTTP {e.response.status_code}")
except requests.JSONDecodeError:
    print(f"Resposta não é JSON: {r.text[:200]}")
```

### 5.3 Browser DevTools (F12)

A aba **Network** do browser é seu melhor amigo para entender APIs:

1. Abra F12 → aba **Network**
2. Filtre por **Fetch/XHR** (só chamadas de API, sem imagens/CSS)
3. Clique em qualquer request para ver:
   - **Headers** tab: todos os headers enviados e recebidos
   - **Payload** tab: o body do request
   - **Response** tab: o body da resposta
   - **Timing** tab: quanto tempo cada fase levou

---

## 6. Padrões e convenções do mundo real

### 6.1 Paginação

APIs com muitos dados nunca retornam tudo de uma vez.

```python
# Paginação por offset (mais comum)
# GET /vendas?page=1&per_page=100
# GET /vendas?page=2&per_page=100

# Paginação por cursor (mais eficiente em datasets grandes)
# GET /vendas?cursor=eyJpZCI6MTAwfQ==&limit=100
# O cursor é um token opaco que aponta para "onde parou"

# Coletando todas as páginas:
todos_os_dados = []
url = "https://api.empresa.com/vendas"
params = {"per_page": 100, "page": 1}

while True:
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    dados = response.json()

    if not dados["results"]:
        break

    todos_os_dados.extend(dados["results"])
    params["page"] += 1
```

### 6.2 Rate Limiting

APIs limitam quantos requests você pode fazer por período para evitar sobrecarga.

```python
# Response headers típicos de rate limit:
# X-RateLimit-Limit: 1000        (máximo por hora)
# X-RateLimit-Remaining: 42      (quanto ainda pode)
# X-RateLimit-Reset: 1705334400  (timestamp Unix de quando reseta)
# Retry-After: 60                (espere 60 segundos)

import time

response = requests.get(url, timeout=30)

if response.status_code == 429:
    wait = int(response.headers.get("Retry-After", 60))
    print(f"Rate limited. Esperando {wait}s...")
    time.sleep(wait)
    response = requests.get(url, timeout=30)  # tenta de novo
```

### 6.3 Versionamento de API

APIs mudam com o tempo. Versionamento evita que seu pipeline quebre.

```
# Via URL (mais comum):
GET /v1/vendas
GET /v2/vendas    ← formato de resposta diferente

# Via Header (menos comum):
GET /vendas
Accept: application/vnd.empresa.v2+json
```

**Na prática:** sempre fixe a versão da API nos seus scripts. Se a API é `/v2/vendas` hoje, use `/v2/vendas` explicitamente, não `/vendas` (que pode mudar).

---

## 7. HTTP/1.1 vs HTTP/2 vs HTTP/3

Você vai ouvir falar dessas versões. A diferença prática:

| Aspecto | HTTP/1.1 (1997) | HTTP/2 (2015) | HTTP/3 (2022) |
|:--------|:----------------|:--------------|:--------------|
| **Transporte** | TCP | TCP | **QUIC (sobre UDP)** |
| **Conexões** | 1 request por conexão (ou keep-alive limitado) | Multiplexação: N requests na mesma conexão | Mesma coisa, mas sem TCP |
| **Headers** | Texto puro, repetidos a cada request | Comprimidos (HPACK) | Comprimidos (QPACK) |
| **Bloqueio** | Head-of-line blocking | Resolvido no nível HTTP | Resolvido no nível de transporte |
| **Uso** | APIs simples, curl | gRPC, browsers modernos | CDNs, Google, Cloudflare |

### QUIC: O Protocolo por trás do HTTP/3

**QUIC** é um protocolo de transporte desenvolvido pelo Google que roda sobre **UDP** em vez de TCP:

*   **Por que UDP?** O TCP exige 3-way handshake + TLS handshake = muitas round-trips antes de enviar dados. O QUIC combina tudo em **1 round-trip** (ou 0 com 0-RTT).
*   **Conexões independentes:** No TCP, se um pacote se perde, todos os streams param (head-of-line blocking). No QUIC, streams são independentes — se o pacote do stream A se perde, o stream B continua.
*   **Migração de conexão:** Se você troca de Wi-Fi para 4G, o TCP quebra a conexão (novo IP → novo handshake). O QUIC sobrevive — a conexão tem um ID próprio, não depende do IP.

> **Para DE na prática:** Você raramente precisa se preocupar com a versão. A biblioteca `requests` usa HTTP/1.1, e funciona bem para 99% dos casos de ingestão. Se precisar de HTTP/2 (ex: gRPC), use `httpx` ou `grpcio`.

---

## 8. Conexão com o Port Quest

No Port Quest, HTTP é o protocolo central de toda interação:

- **URLBar**: quando você digita uma URL e clica SEND, está fazendo um `GET` request
- **Status codes**: o response aparece com o código (200, 404, etc.) nos pacotes que trafegam pela cidade
- **Headers**: o Nginx (Gateway) adiciona headers de proxy antes de repassar ao backend
- **JSON**: as respostas da API FastAPI voltam como JSON, visíveis nos detalhes do pacote
- **SSE**: a sidebar de métricas usa Server-Sent Events — uma conexão HTTP que fica aberta enviando dados (tema da aula 05)

A cadeia completa de um request no Port Quest:

```
Browser (você)                Port Quest City
     │                              │
     │── GET /api/city/status ──────│→ Nginx (:80)        ← Reverse Proxy
     │                              │    │ proxy_pass
     │                              │    ▼
     │                              │  FastAPI (:8000)     ← Backend
     │                              │    │ SELECT
     │                              │    ▼
     │                              │  Postgres (:5432)    ← Banco
     │                              │    │
     │◀── 200 OK {json} ───────────│◀───┘
     │                              │
```

Cada salto é um conceito diferente: HTTP (request), reverse proxy (Nginx reescreve headers), protocolo de banco (wire protocol do Postgres), serialização (Python → JSON), e o response viaja o caminho inverso.

---

## Resumo: O Cheat Sheet HTTP

| Conceito | O que é | Dica prática |
|:---------|:--------|:-------------|
| **Método** | O verbo (GET, POST, PUT, DELETE) | GET para ler, POST para enviar |
| **Status Code** | Resultado numérico (200, 404, 500) | 4xx = culpa sua, 5xx = culpa do servidor |
| **Header** | Metadados (chave: valor) | `Content-Type` e `Authorization` são os mais importantes |
| **Body** | O conteúdo em si (geralmente JSON) | Sempre valide o `Content-Type` antes de parsear |
| **Query Param** | Filtros na URL (`?key=value`) | Para filtrar, paginar, configurar |
| **Path Param** | Identidade no caminho (`/users/42`) | Para identificar recursos específicos |
| **Proxy** | Intermediário entre cliente e servidor | Forward (saída) vs Reverse (entrada) |
| **Timeout** | Tempo máximo de espera | **SEMPRE** defina. Sem timeout = script que trava pra sempre |
| **Rate Limit** | Limite de requests por tempo | Respeite o `Retry-After`, implemente backoff |

---

## 🧠 Checkpoint: Teste seu Entendimento

1.  **Qual a diferença entre 401 e 403?** Se seu token está correto mas você tenta acessar um recurso que não tem permissão, qual status code recebe?
2.  **Por que `HEAD` é útil para engenheiros de dados?** De que forma o Spark usa `HEAD` requests ao ler dados do S3?
3.  **Você recebe `502 Bad Gateway` ao acessar sua API. O problema está no seu código Python (FastAPI) ou antes dele?** O que fazer para debugar?
4.  **O `requests` do Python usa HTTP/1.1. Isso é um problema para ingestão de dados?** Quando valeria a pena migrar para HTTP/2?

<details>
<summary><strong>Respostas</strong></summary>

1. **401 = não autenticado** (quem é você?), **403 = não autorizado** (sei quem você é, mas não tem permissão). Com token correto mas sem permissão, recebe **403 Forbidden**.

2. `HEAD` retorna apenas os headers (metadados), sem o body. O Spark usa `HEAD` para descobrir o tamanho do arquivo no S3 (`Content-Length`) e quantas partições criar, **sem baixar o arquivo inteiro**. Isso economiza banda e tempo.

3. **502** significa que o **reverse proxy** (Nginx, ALB) não conseguiu se comunicar com o backend. O proxy funciona, mas o backend está inacessível. Debugar: checar se o processo FastAPI está rodando (`ss -tulpn`), se ouve na porta correta, se há erro nos logs do Uvicorn.

4. Para ingestão de dados (poucos requests pesados), HTTP/1.1 é suficiente. HTTP/2 vale quando você faz **muitos requests pequenos simultâneos** (multiplexação) ou quando o overhead de headers repetidos é significativo. gRPC (que exige HTTP/2) é o caso mais comum.

</details>

---

## 🎯 Aplicação Imediata

**Exercício: Debugando HTTP com curl -v (5 min)**

```bash
# 1. Veja a "conversa" HTTP completa (request + response):
curl -v https://httpbin.org/get 2>&1 | head -30
# Identifique: método, host, status code, content-type

# 2. Simule headers customizados e veja o echo:
curl -s https://httpbin.org/headers \
     -H "Authorization: Bearer meu-token-fake" \
     -H "Accept: application/json" | python3 -m json.tool
# httpbin.org echo-a os headers que você enviou

# 3. Teste diferentes status codes:
curl -i https://httpbin.org/status/404  # Veja 404 Not Found
curl -i https://httpbin.org/status/429  # Veja 429 Rate Limited
curl -i https://httpbin.org/status/503  # Veja 503 Unavailable

# 4. Teste redirect:
curl -v https://httpbin.org/redirect/3 2>&1 | grep "< HTTP"
# Sem -L: para no primeiro 302
curl -Lv https://httpbin.org/redirect/3 2>&1 | grep "< HTTP"
# Com -L: segue todas as 3 redireções até o 200
```

---

## 🔗 Conexões com outras aulas deste módulo

| Aula | Como se conecta |
|:-----|:----------------|
| [01 - Internet Fundamentals](../01_internet_fundamentals.md) | HTTP é a camada de **Aplicação** no modelo TCP/IP. Roda sobre TCP (porta 80/443). |
| [02 - Network Ports](../02_network_ports.md) | Portas 80 (HTTP) e 443 (HTTPS) são as mais usadas da internet. Connection Refused = porta sem listener. |
| [03 - Internet Security](../03_internet_security.md) | HTTPS = HTTP + TLS. Headers `Authorization` carregam tokens vistos na aula de segurança. |
| [05 - Deep Dive](../05_internet_deep_dive.md) | gRPC usa HTTP/2, SSE usa HTTP com conexão mantida aberta. REST vs gRPC é detalhado lá. |
