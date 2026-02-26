# Descoberta e Análise - Aulas de Internet e Portas

## Sumário das Aulas

Este módulo consiste em 5 aulas principais sobre fundamentos de rede, portas e protocolos, estruturado especificamente para **Engenheiros de Dados que buscam reforçar conceitos de Engenharia de Software**.

---

## Resumo dos Tópicos das Aulas

### Aula 1: Internet Fundamentals
- Origem histórica: ARPANET e Guerra Fria
- Internet como rede descentralizada de redes
- Infraestrutura: Cabos de fibra ótica, roteadores, modems
- ISPs: Tier 1, 2 e 3
- Protocolos fundamentais: TCP/IP e modelo de 4 camadas
- Fluxo end-to-end: DNS até HTTP, TLS, TCP/IP

### Aula 2: Network Ports
- Portas como "salas" dentro de um "prédio" (IP)
- Categorias: System (0-1023), User (1024-49151), Dynamic (49152+)
- Histórico das portas (22, 80, 443, 5432, 3306, 6379)
- Mecânica: Bind, Listen, Connect
- Cheat sheet de portas para web, bancos e Big Data

### Aula 3: Internet Security
- SSL/TLS, Certificados, Certificate Authorities, handshake
- Autenticação: Bearer Tokens, JWT, Service Principals
- Firewalls, Security Groups, regras Inbound/Outbound
- VPC: Subnets públicas vs privadas
- NAT Gateway, VPN

### Aula 4: HTTP - A Língua Franca da Internet
- Textual, stateless, request/response
- Métodos HTTP: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Status codes: 2xx, 3xx, 4xx, 5xx
- Headers, Body (JSON, CSV, XML, NDJSON)
- Ferramentas: curl, Python requests, Browser DevTools
- Paginação, rate limiting, versionamento de API, HTTP/2, HTTP/3

### Aula 5: Internet Deep Dive
- gRPC com Protocol Buffers (Porta 50051)
- Thrift para serviços cross-language
- Spark + S3: HTTP HEAD/GET, range requests, multipart upload
- Arquitetura Backend/Frontend: React → Load Balancer → FastAPI → Postgres
- Server-Sent Events (SSE) para streaming (ChatGPT, Claude)
- Vector Search (RAG): Milvus, Qdrant, Weaviate

---

## Conceitos Chave

- IP, NAT, DNS, TCP vs UDP, Portas (0-65535), Firewalls
- Modelo TCP/IP (4 camadas)
- SSL/TLS Handshake, Certificados, JWT
- HTTP Request/Response, Métodos, Status Codes, Headers, Body
- Idempotência, Multiplexação (HTTP/2), Range Requests, SSE, gRPC

## Tecnologias Mencionadas

**Protocolos:** TCP/IP, HTTP/1.1-3, HTTPS, gRPC, Thrift, SSH, FTP, DNS, UDP
**Bancos:** PostgreSQL (5432), MySQL (3306), Redis (6379), MongoDB (27017)
**Big Data:** Spark (4040/18080), Kafka (9092), Jupyter (8888), Airflow (8080), Hive (10000/9083)
**Vector DBs:** Milvus (19530), Qdrant (6333), Weaviate (8080)
**Ferramentas:** curl, Python requests, Docker, Nginx, FastAPI, SQLAlchemy
**Cloud:** AWS (S3, VPC, NAT, Security Groups)

## Referências a Frontend

- **React** como framework em exemplos de arquitetura
- **Browser DevTools (F12):** Network, Headers, Payload, Response, Timing
- **SSE:** Streaming em APIs modernas
- **JSON** como ponte Frontend/Backend
- **CORS** com OPTIONS
- **Port Quest City:** Projeto interativo simulando rede (Browser → Nginx :80 → FastAPI :8000 → Postgres :5432)

## Qualidade do Material

Currículo coerente e pragmático. Progressão: fundamentos → segurança → HTTP → cenários reais.
Analogias para data engineers: IP como "nó do cluster", DNS como "Hive Metastore", Packets como "chunks do HDFS", TCP como "ACID guarantee".
