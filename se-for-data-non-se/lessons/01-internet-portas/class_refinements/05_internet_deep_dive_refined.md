# Por Baixo dos Panos: Protocolos Avançados e o Mundo Real

Até agora, falamos de HTTP, Portas e Segurança — os blocos fundamentais. Mas o mundo real de Engenharia de Dados vive muito além de REST APIs. Esta aula é o "deep dive" nos protocolos e padrões que você encontra em pipelines, clusters e aplicações de IA modernas.

---

## 📋 Tabela Diagnóstica (vs. Fontes Originais)

| Seção | Veredicto | Detalhe |
|:------|:---------:|:--------|
| §1 gRPC | ✅ | Fiel à doc oficial |
| §1 Thrift | 🔵 | Adicionado: **IDL** (Interface Definition Language) em mais profundidade |
| §2 Spark + S3 | ✅ | Mantido — excelente |
| §3 Front/Back | ✅ | Mantido |
| §3 Serialização | 🔵 | Adicionado: **Protobuf vs JSON vs Avro** comparação para DE |
| §4 SSE | 🔵 | Adicionado: **SSE vs WebSocket** (uni vs bidirecional) |
| §4 Vector Search | 🔵 | Atualizado com conceitos de embedding mais precisos |
| Nota de Rodapé | ✅ | Mantido |
| **WebSocket** | 🟡→✅ | **Adicionado** — explicação básica |
| **REST vs gRPC vs GraphQL** | 🟡→✅ | **Adicionado** — tabela comparativa |
| **Checkpoint** | 🟡→✅ | **Adicionado** |
| **Aplicação Imediata** | 🟡→✅ | **Adicionado** |

---

## 1. Protocolos Binários: gRPC e Thrift

Até agora, tudo que vimos foi HTTP e JSON — texto legível por humanos. Mas quando o volume de dados é gigantesco e a latência precisa ser mínima, texto é muito caro.

### Por que "binário" é mais rápido?

```
JSON (texto):   {"temperatura": 23.5, "sensor": "A1"}
                                         ↓
                        42 bytes, precisa parsear como string

Protobuf (binário): 08 97 01 12 02 41 31
                                         ↓
                        7 bytes, estrutura fixa, parse direto
```

O dado é o mesmo, mas a representação binária é **6x menor** e **10-100x mais rápida** de parsear.

### gRPC (Google Remote Procedure Call)

O gRPC é um framework de comunicação **cliente-servidor** criado pelo Google. É o protocolo que conecta os microserviços internos do Google (Bigtable, Spanner, Gmail, YouTube — tudo se comunica via gRPC internamente).

**Componentes:**

1.  **Protocol Buffers (Protobuf):** O formato de serialização binária. Você define o "contrato" em um arquivo `.proto`:

```protobuf
// sensor.proto — o "contrato" entre cliente e servidor
syntax = "proto3";

service SensorService {
    rpc GetTemperatura (SensorRequest) returns (TemperaturaResponse);
    rpc StreamLeituras (SensorRequest) returns (stream LeituraResponse);
}

message SensorRequest {
    string sensor_id = 1;    // campo 1
    int32 ultimos_minutos = 2; // campo 2
}

message TemperaturaResponse {
    double valor = 1;
    string unidade = 2;
}
```

2.  **HTTP/2 como transporte:** O gRPC roda obrigatoriamente sobre HTTP/2 (multiplexação de streams).
3.  **Geração de código:** O `.proto` gera automaticamente classes em Python, Java, Go, etc. O cliente chama métodos como se fossem funções locais.

**Porta padrão:** `50051` (por convenção, não obrigatório).

**4 tipos de comunicação gRPC:**

| Tipo | Descrição | Caso de uso |
|:-----|:----------|:------------|
| **Unary** | 1 request → 1 response | Consulta pontual (como REST) |
| **Server Streaming** | 1 request → N responses | Stream de métricas |
| **Client Streaming** | N requests → 1 response | Upload de batch de dados |
| **Bidirectional Streaming** | N requests ↔ N responses | Chat em tempo real |

### Apache Thrift

Similar ao gRPC em conceito, mas nasceu no Facebook:
*   Usa uma **IDL (Interface Definition Language)** própria (arquivo `.thrift`) para definir contratos, assim como o gRPC usa `.proto`.
*   Suporta múltiplos transportes (TCP, HTTP) e protocolos de serialização (binário compacto, JSON).
*   **Porta padrão:** `9090`
*   **Onde você encontra:** Hive Metastore (`9083`), Impala, sistemas Hadoop legados.

```thrift
// metastore.thrift — exemplo simplificado do Hive Metastore
service ThriftHiveMetastore {
    Table get_table(1: string dbname, 2: string tbl_name)
    list<string> get_all_databases()
    void create_table(1: Table tbl)
}
```

> **Na prática:** Quando seu Spark conecta ao Hive Metastore na porta 9083, ele está falando **Thrift binário**, não HTTP. É por isso que você não consegue "cURL" o Metastore — é protocolo binário.

---

## 2. Comparativo: REST vs gRPC vs GraphQL

Três paradigmas de API que você encontra no mundo real:

| Aspecto | REST (HTTP/JSON) | gRPC (HTTP/2/Protobuf) | GraphQL (HTTP/JSON) |
|:--------|:-----------------|:-----------------------|:--------------------|
| **Formato** | JSON (texto) | Protobuf (binário) | JSON (texto) |
| **Transporte** | HTTP/1.1 ou 2 | HTTP/2 obrigatório | HTTP/1.1 ou 2 |
| **Contrato** | OpenAPI/Swagger (opcional) | `.proto` (obrigatório) | Schema (obrigatório) |
| **Tipagem** | Fraca (JSON não tem tipos) | Forte (Protobuf tipado) | Forte (schema tipado) |
| **Streaming** | Não nativo (SSE é workaround) | Nativo (4 tipos) | Subscriptions (via WebSocket) |
| **Performance** | Boa para humanos, ok para máquinas | Excelente (10x+ menor/rápido) | Boa, reduz over-fetching |
| **Debugging** | Fácil (curl, browser) | Difícil (precisa ferramentas especiais) | Médio (playground visual) |
| **Caso de uso** | APIs públicas, CRUD, integração | Microserviços internos, alto volume | Frontend flexível, múltiplos clientes |

### Quando usar o quê?

```
Seus dados precisam de...

  Alta performance + Volume massivo?
    └── gRPC (Protobuf)
        Ex: comunicação entre microserviços, streaming de métricas

  Flexibilidade de consulta + Múltiplos frontends?
    └── GraphQL
        Ex: dashboard que precisa de dados diferentes dependendo da tela

  Simplicidade + APIs públicas + Debugging fácil?
    └── REST (HTTP/JSON)
        Ex: APIs públicas, webhooks, integração com parceiros

  Ecossistema Hadoop legado?
    └── Thrift
        Ex: Hive Metastore, Impala
```

---

## 3. O que está Acontecendo por Baixo dos Panos

### 3.1 Quando o Spark lê do S3

Engenheiros de dados usam `spark.read.parquet("s3://bucket/tabela/")` como se fosse mágica. Mas por baixo do pano, é HTTP puro.

**O que acontece:**
```
spark.read.parquet("s3://meu-bucket/vendas/")

1.  HEAD s3://meu-bucket/vendas/
    → Spark usa HEAD para listar os arquivos e ver seus tamanhos

2.  GET s3://meu-bucket/vendas/part-00001.parquet
    Range: bytes=0-65535
    → Spark lê o "footer" do Parquet (metadados: schema, row groups)

3.  GET s3://meu-bucket/vendas/part-00001.parquet
    Range: bytes=1048576-2097152
    → Spark lê apenas as colunas que você precisa (column pruning!)
    → Cada executor faz requests em paralelo para diferentes parts

4.  Cada executor → TCP connection → HTTPS (TLS) → S3 API (REST)
```

**Pontos-chave:**
*   Spark usa **HTTP REST** (não SDK binário) para falar com S3.
*   `Range` headers permitem ler pedaços do arquivo (crucial para Parquet column pruning).
*   Cada executor abre suas próprias conexões HTTP — é por isso que paralelismo funciona.
*   Se você vê `SlowDown` (429) nos logs, o S3 está fazendo rate limiting nas suas requests.

### 3.2 O Fluxo Completo: Backend → Frontend

Quando um usuário acessa um dashboard de dados moderno:

```
Browser (Frontend React)
    │
    │── 1. GET /index.html ──────────→ CDN/Nginx (Arquivos Estáticos)
    │◀── HTML + JS + CSS ───────────│
    │
    │── 2. GET /api/metricas ────────→ Load Balancer (:443)
    │                                       │
    │                                       ▼
    │                                   FastAPI (:8000)
    │                                       │
    │                                       ├── SELECT * FROM metricas
    │                                       │   → PostgreSQL (:5432) [Wire Protocol]
    │                                       │
    │                                       ├── Cache check
    │                                       │   → Redis (:6379) [RESP Protocol]
    │                                       │
    │                                       └── Busca semântica
    │                                           → Milvus (:19530) [gRPC]
    │                                       
    │◀── 200 OK {json} ────────────│
    │
    │── 3. SSE /api/stream/updates ──→ FastAPI (conexão mantida aberta)
    │◀── data: {"cpu": 45.2}\n\n ───│  (server pushes a cada 1s)
    │◀── data: {"cpu": 47.1}\n\n ───│
    │◀── data: {"cpu": 44.8}\n\n ───│
```

**O que está acontecendo em cada nível:**
1.  **CDN/Nginx** serve arquivos estáticos (HTML, JS, imagens) — payload grande mas cacheável.
2.  **REST API** serve dados dinâmicos (métricas, consultas) — JSON sobre HTTP.
3.  **SSE** mantém uma conexão HTTP aberta para updates em tempo real — o servidor "empurra" dados.

### 3.3 Serialização: Protobuf vs JSON vs Avro

A escolha do formato de serialização impacta diretamente performance e interoperabilidade:

| Aspecto | JSON | Protobuf | Avro |
|:--------|:-----|:---------|:-----|
| **Formato** | Texto | Binário | Binário |
| **Schema** | Implícito | `.proto` (IDL) | `.avsc` (JSON Schema) |
| **Evolução de Schema** | Frágil (sem regras) | Forward/backward compat | Forward/backward compat |
| **Tamanho** | Grande (verbose) | Muito pequeno | Pequeno |
| **Parse speed** | Lento | Muito rápido | Rápido |
| **Human-readable** | Sim ✅ | Não ❌ | Não ❌ |
| **Ecossistema** | Universal | Google, gRPC | Hadoop, Kafka, Confluent |

**Quando usar:**

*   **JSON:** APIs públicas, configurações, debugging, integração com parceiros.
*   **Protobuf:** Comunicação entre microserviços (gRPC), alta performance, baixa latência.
*   **Avro:** Kafka topics (schema registry), data lake (evolução de schema é crítica entre producer e consumer).

---

## 4. Comunicação em Tempo Real: SSE e WebSocket

### SSE (Server-Sent Events): O Servidor "Empurra"

SSE é uma tecnologia **unidirecional**: o servidor envia dados para o cliente continuamente, mas o cliente não envia dados de volta (só o request inicial).

**Como funciona:**

```
Cliente: GET /stream HTTP/1.1
         Accept: text/event-stream

Servidor: HTTP/1.1 200 OK
          Content-Type: text/event-stream
          Cache-Control: no-cache
          Connection: keep-alive

          data: {"metrica": "cpu", "valor": 45.2}

          data: {"metrica": "cpu", "valor": 47.1}

          event: alerta
          data: {"msg": "CPU acima de 90%!"}

          (conexão fica aberta indefinidamente...)
```

**Detalhes técnicos (da MDN):**

*   O Content-Type é `text/event-stream`.
*   Cada mensagem termina com `\n\n` (duas newlines).
*   O campo `event:` define tipos customizados de eventos.
*   Se a conexão cai, o browser **reconecta automaticamente** (comportamento padrão do `EventSource`).
*   Um server pode enviar comentários (linhas começando com `:`) como heartbeat para manter a conexão viva.

**Em Python (servidor):**

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio, json

app = FastAPI()

async def gerar_metricas():
    while True:
        dados = {"cpu": random.uniform(10, 90), "ts": time.time()}
        yield f"data: {json.dumps(dados)}\n\n"
        await asyncio.sleep(1)

@app.get("/stream/metricas")
async def stream():
    return StreamingResponse(
        gerar_metricas(),
        media_type="text/event-stream"
    )
```

### WebSocket: Comunicação Bidirecional

Enquanto SSE é unidirecional (servidor → cliente), **WebSocket** é bidirecional — ambos os lados podem enviar dados a qualquer momento.

**Como funciona:**

```
1. O cliente faz um HTTP request especial (Upgrade):
   GET /chat HTTP/1.1
   Upgrade: websocket
   Connection: Upgrade

2. O servidor aceita:
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket

3. A partir daqui, NÃO É MAIS HTTP.
   A conexão TCP é "promovida" para o protocolo WebSocket.
   Ambos os lados enviam mensagens livremente:
   
   Cliente: {"msg": "Olá!"}
   Servidor: {"msg": "Oi, como posso ajudar?"}
   Cliente: {"msg": "Preciso dos dados de vendas"}
   Servidor: {"vendas": [...], "total": 1523}
```

### SSE vs WebSocket: Quando usar o quê?

| Aspecto | SSE | WebSocket |
|:--------|:----|:----------|
| **Direção** | Servidor → Cliente (unidirecional) | Bidirecional |
| **Protocolo** | HTTP padrão | Protocolo próprio (ws://) |
| **Reconexão automática** | Sim (built-in) | Não (precisa implementar) |
| **Compatibilidade** | Funciona com proxies HTTP | Pode ter problemas com proxies legados |
| **Caso de uso** | Dashboards, feeds, notificações, **LLM token streaming** | Chat, jogos, edição colaborativa |
| **Complexidade** | Simples | Mais complexo |

> **Para DE:** SSE é o que você mais encontra. LLMs (ChatGPT, Claude) usam SSE para enviar tokens um a um enquanto geram a resposta. Se você precisar consumir uma API de LLM com streaming, é SSE.

---

## 5. Portas e Protocolos Modernos: IA e Busca Vetorial

A nova geração de ferramentas de dados e IA usa portas altas e protocolos específicos:

| Serviço | Porta | Protocolo | O que faz |
|:--------|:------|:----------|:----------|
| **Milvus** | 19530 (gRPC), 9091 (métricas) | gRPC + REST | Banco vetorial para similarity search |
| **Qdrant** | 6333 (REST), 6334 (gRPC) | REST + gRPC | Banco vetorial alternativo |
| **ChromaDB** | 8000 | REST | Banco vetorial leve |
| **Ollama** | 11434 | REST | LLM local (Llama, Mistral) |
| **LangServe** | 8000 | REST + SSE | APIs de LLM com LangChain |
| **MLflow** | 5000 | REST | Tracking de experimentos ML |

### A Lógica por trás das portas altas

Todas essas ferramentas usam portas no range **User Ports (1024-49151)**. Por quê?

1.  **Não precisam de root**: portas acima de 1024 podem ser abertas por qualquer usuário.
2.  **Evitam conflito**: portas baixas já estão "ocupadas" por serviços clássicos.
3.  **Convenção > necessidade**: o número em si não importa tecnicamente. É uma convenção para que a comunidade reconheça o serviço.

### Como Embeddings e Busca Vetorial se encaixam

O fluxo de uma busca semântica usando Vector DB:

```
1. Texto "Como fazer ETL com Spark?"
        │
        ▼
2. Modelo de Embedding (ex: OpenAI text-embedding-ada-002)
   → Transforma texto em vetor: [0.023, -0.451, 0.128, ..., 0.067]
   → Dimensão: 1536 floats
        │
        ▼
3. Busca no Milvus (gRPC :19530)
   → "Encontre os 10 vetores mais similares a este"
   → Usa distância coseno/euclidiana
        │
        ▼
4. Resultados: documentos semanticamente próximos
   → Score: 0.95, 0.91, 0.87...
   → IDs dos documentos originais
```

*   O embedding model roda via **REST API** (HTTP/JSON para OpenAI, ou HTTP local para Ollama).
*   A busca vetorial roda via **gRPC** (mais rápido para alta frequência) ou **REST** (mais simples para protótipos).

---

## 💡 Nota de Rodapé: A Lógica por trás dos Números de Porta (Resumo)

```
Porta Baixa (0-1023):
  → Serviços "clássicos" da internet (HTTP, SSH, DNS)
  → Exigem root
  → Número definido na "era dourada" (anos 70-90)

Porta Média (1024-49151):
  → Bancos de dados, ferramentas modernas
  → Qualquer usuário pode abrir
  → Registradas na IANA por convenção

Porta Alta (49152-65535):
  → Efêmeras (temporárias)
  → O OS escolhe para conexões de saída
  → Você raramente configura diretamente
```

---

## 🧠 Checkpoint: Teste seu Entendimento

1.  **Por que o Spark lê do S3 usando HTTP REST e não um protocolo binário mais rápido?** Qual a vantagem dessa decisão de design?
2.  **Seu Hive Metastore está na porta 9083. Você tenta `curl localhost:9083` e recebe lixo binário. Por quê?** Qual protocolo o Metastore usa?
3.  **Uma API de LLM envia tokens um a um usando SSE. Por que SSE e não WebSocket?** O LLM precisa receber dados do cliente durante a geração?
4.  **Você precisa escolher o formato de serialização para um Kafka topic que terá 500 producers e evolução de schema frequente. JSON, Protobuf ou Avro?** Por quê?

<details>
<summary><strong>Respostas</strong></summary>

1. A API do S3 é uma **API REST HTTP** por design (compatível com qualquer client HTTP). A vantagem é **universalidade**: qualquer linguagem/ferramenta que fala HTTP consegue ler do S3. Não precisa de SDK especial. Além disso, CDNs e caches HTTP funcionam nativamente. A performance é compensada pelo paralelismo massivo (muitos executors fazendo requests simultâneos).

2. O Hive Metastore usa **Apache Thrift** (protocolo binário), não HTTP. `curl` envia um request HTTP que o Metastore não entende, e o Metastore responde em binário que o `curl` não entende. Para interagir, você precisa de um Thrift client (`beeline`, `pyspark`, ou `hive` CLI).

3. SSE é suficiente porque a geração de texto é **unidirecional**: o servidor envia tokens, o cliente apenas recebe. O prompt já foi enviado no request inicial (POST). WebSocket seria overkill — adiciona complexidade (protocolo diferente, reconexão manual) sem benefício, já que o cliente não precisa enviar dados durante a geração.

4. **Avro**. Razões: (a) Avro tem **evolução de schema** nativa com forward/backward compatibility, essencial para 500 producers que podem estar em versões diferentes. (b) O **Schema Registry** do Kafka (Confluent) é construído para Avro. (c) Protobuf também suporta evolução de schema, mas o ecossistema Kafka é mais maduro com Avro. JSON não tem garantias de schema.

</details>

---

## 🎯 Aplicação Imediata

**Exercício: Consumindo SSE com Python (5 min)**

```python
# Usando httpx para consumir um stream SSE
# Instale: pip install httpx

import httpx

# SSE público de teste (stream de números aleatórios):
url = "https://sse.dev/test"

# httpx suporta streaming nativamente:
with httpx.stream("GET", url, timeout=None) as response:
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}")
    print("---")
    count = 0
    for line in response.iter_lines():
        if line.startswith("data:"):
            dados = line[5:].strip()
            print(f"Evento {count}: {dados}")
            count += 1
            if count >= 5:
                break  # Para depois de 5 eventos

print(f"\nRecebidos {count} eventos via SSE!")
```

**Alternativa com curl:**

```bash
# Ver SSE no terminal (Ctrl+C para parar):
curl -N https://sse.dev/test
# -N desabilita buffering, mostrando cada evento em tempo real
```

---

## 🔗 Conexões com outras aulas deste módulo

| Aula | Como se conecta |
|:-----|:----------------|
| [01 - Internet Fundamentals](../01_internet_fundamentals.md) | gRPC e Thrift rodam sobre TCP/IP. Os conceitos de pacotes e transporte se aplicam aqui. |
| [02 - Network Ports](../02_network_ports.md) | Portas altas (50051, 19530, 6379) são User Ports. O conceito de faixas e IANA explica por quê. |
| [03 - Internet Security](../03_internet_security.md) | gRPC em produção usa TLS. SSE via HTTPS é SSE sobre TLS. |
| [04 - HTTP](../04_http.md) | gRPC usa HTTP/2. SSE usa HTTP com conexão mantida. REST é HTTP + JSON. Tudo conecta aqui. |
