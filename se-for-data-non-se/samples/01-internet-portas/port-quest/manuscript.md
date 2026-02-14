# PORT QUEST -- The Container City

## Visao Geral

PORT QUEST e uma aplicacao educacional interativa que transforma conceitos abstratos de redes, containers e protocolos em uma **cidade isometrica em pixel art**. Nela, containers Docker sao predios, pacotes HTTP sao caminhoes animados que trafegam pelas estradas, e portas de rede sao as portas (fisicas) de cada edificio.

O objetivo pedagogico e permitir que estudantes de Engenharia de Software para Dados **vejam** o que normalmente e invisivel: como pacotes viajam entre servicos, como um reverse proxy roteia requisicoes, como um firewall bloqueia trafego, e como o TLS criptografa comunicacoes. Tudo acontece em tempo real com dados reais fluindo entre containers Docker.

**Conceitos ensinados:**
- Portas de rede (80, 3000, 8000, 5432)
- Containers Docker como unidades de isolamento
- Redes Docker (bridge networks) e separacao publica/interna
- Reverse proxy (Nginx) como gateway NAT
- Firewall e filtragem de pacotes
- TLS/HTTPS e o handshake de criptografia
- Server-Sent Events (SSE) para streaming em tempo real
- Resolucao DNS (incluindo DNS interno do Docker)
- Estados de conexao TCP (LISTEN, ESTABLISHED, TIME_WAIT, CLOSE_WAIT)

---

## Arquitetura

A aplicacao e composta por **4 servicos** orquestrados via Docker Compose, distribuidos em **2 redes Docker**:

### Os 4 Servicos

| Servico | Container Name | Tecnologia | Porta | Apelido na Cidade |
|---------|---------------|------------|-------|-------------------|
| **frontend** | `command-center` | React 18 + Vite + TypeScript + Canvas | 3000 | Command Center |
| **gateway** | `city-gate` | Nginx reverse proxy | 80 | City Gate |
| **api** | `city-hall` | FastAPI + sse-starlette + httpx + asyncpg | 8000 | City Hall |
| **database** | `municipal-archive` | PostgreSQL 16 Alpine | 5432 | Municipal Archive |

### As 2 Redes Docker

| Rede | Tipo | Servicos Conectados | Cor na Visualizacao |
|------|------|--------------------|--------------------|
| `city-public` | bridge | frontend, gateway | Azul |
| `city-internal` | bridge | gateway, api, database | Amarelo/dourado |

### O Conceito de NAT Gateway

O servico **gateway** (Nginx) e o unico que esta conectado a **ambas as redes**. Ele funciona como um NAT Gateway -- o ponto de entrada que faz a ponte entre o mundo externo (city-public) e os servicos internos (city-internal).

Observe no `docker-compose.yml` (linhas 15-23):

```yaml
gateway:
    build: ./gateway
    container_name: city-gate
    ports:
      - "80:80"
    networks:
      - city-public
      - city-internal
    depends_on:
      - api
```

Enquanto isso, a API e o banco de dados **nao expoe portas para o host** -- eles usam apenas `expose`, ficando acessiveis somente dentro de `city-internal`:

```yaml
api:
    # No host port mapping: API is only reachable via the gateway
    expose:
      - "8000"
    networks:
      - city-internal

database:
    # No host port mapping: database is only reachable from city-internal
    expose:
      - "5432"
    networks:
      - city-internal
```

### Diagrama da Arquitetura

```
                    INTERNET (host machine)
                           |
                    +--------------+
                    |  :3000       |    :80
              +-----|  frontend    |-----+
              |     |  (React)    |     |
              |     +--------------+     |
              |                          |
         city-public               city-public
              |                          |
              |     +--------------+     |
              +-----|   gateway    |-----+
                    |   (Nginx)   |
                    +--------------+
                      |          |
                 city-internal  city-internal
                      |          |
              +--------------+  +--------------+
              |   api        |  |  database    |
              |  (FastAPI)   |--|  (PostgreSQL) |
              |   :8000      |  |   :5432      |
              +--------------+  +--------------+
```

O fluxo de uma requisicao tipica:
1. Usuario acessa `localhost:3000` (frontend)
2. Frontend faz chamadas API para `localhost:80/api/*`
3. Gateway (Nginx) recebe na porta 80 e faz proxy reverso para `api:8000`
4. API processa e, se necessario, consulta `database:5432`
5. Resposta retorna pelo mesmo caminho

---

## Como Executar

### Pre-requisitos
- Docker e Docker Compose instalados
- Portas 80 e 3000 livres no host

### Passo a Passo

1. Navegue ate a pasta do projeto:
```bash
cd /home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest
```

2. Construa e inicie todos os servicos:
```bash
docker compose up --build
```

3. Aguarde ate que todos os 4 servicos estejam saudaveis. O banco de dados possui um healthcheck configurado:
```yaml
healthcheck:
    test: ["CMD-SHELL", "pg_isready -U portquest"]
    interval: 5s
    timeout: 5s
    retries: 5
```

A API espera o banco estar saudavel antes de iniciar (via `condition: service_healthy`), e internamente executa um loop de retry com 10 tentativas e 2 segundos de espera entre cada uma (arquivo `api/main.py`, linhas 46-54):

```python
for attempt in range(10):
    try:
        db_pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)
        break
    except Exception:
        if attempt < 9:
            await asyncio.sleep(2)
        else:
            raise
```

4. Acesse no navegador:
```
http://localhost:3000
```

5. Para parar:
```bash
docker compose down
```

Para remover volumes persistentes (dados do banco):
```bash
docker compose down -v
```

---

## Funcionalidades e Interacoes

### 1. Cidade Isometrica (CityCanvas)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/components/CityCanvas.tsx`

A cidade e renderizada usando **HTML5 Canvas** com projecao isometrica. Nao ha bibliotecas externas de renderizacao -- tudo e desenhado pixel a pixel usando a Canvas 2D API.

#### Projecao Isometrica

A funcao `isoProject` (linha 13) converte coordenadas de grid (gx, gy) em coordenadas de tela (x, y):

```typescript
function isoProject(gx: number, gy: number, ox: number, oy: number, tw: number, th: number) {
  return {
    x: ox + (gx - gy) * (tw / 2),
    y: oy + (gx + gy) * (th / 2),
  };
}
```

Onde:
- `ox`, `oy` = origem no centro da tela
- `tw` = largura do tile (calculada dinamicamente)
- `th` = altura do tile (metade da largura, ratio isometrico)

A formula classica de projecao isometrica:
- `x' = (gx - gy) * tw/2`
- `y' = (gx + gy) * th/2`

#### Dimensionamento Dinamico

O canvas se redimensiona automaticamente para ocupar o container pai. O tamanho dos tiles e calculado dinamicamente (linha 126):

```typescript
const tw = Math.floor(Math.min(W, H) * 0.14);
const th = Math.floor(tw / 2);
const ox = W / 2;
const oy = H * 0.28;
```

Todos os elementos (predios, janelas, portas, caminhoes, fontes) escalam proporcionalmente via um fator `scale = tw / 64`.

#### Os 4 Predios

Cada servico ocupa uma posicao no grid (linhas 21-26):

```typescript
const BUILDING_GRID: Record<string, [number, number]> = {
  frontend: [0, 0],    // canto superior esquerdo
  gateway:  [4, 0],    // canto superior direito
  api:      [4, 4],    // canto inferior direito
  database: [0, 4],    // canto inferior esquerdo
};
```

Os predios tem alturas diferentes que refletem sua "importancia":
- **frontend** (Command Center): 90px base -- o mais alto
- **api** (City Hall): 78px base
- **gateway** (City Gate): 60px base
- **database** (Municipal Archive): 55px base

Cada predio tem:
- Corpo isometrico com 3 faces (topo, esquerda, direita)
- Janelas pixel art que piscam com animacao senoidal
- Porta brilhante na base (representando a porta de rede)
- Numero da porta brilhante acima do predio (ex: `:8000`)
- Nome do predio abaixo
- Indicador de status (ponto verde = running, vermelho = error)
- Efeito de "pulse" quando recebe um pacote

#### Cores por Servico

Cada servico tem sua paleta de cores unica:

| Servico | Cor Glow | Cor Corpo |
|---------|----------|-----------|
| frontend | `#00ccff` (ciano) | `#0d3b5c` (azul escuro) |
| gateway | `#00ff88` (verde) | `#0d4d33` (verde escuro) |
| api | `#bb66ff` (roxo) | `#3d1a6e` (roxo escuro) |
| database | `#ff9922` (laranja) | `#5c3a0d` (marrom escuro) |

#### Estradas e Redes

As estradas conectam os predios e sao coloridas conforme a rede (linhas 64-71):

```typescript
const ROADS: [string, string, string][] = [
  ['frontend', 'gateway', 'city-public'],
  ['gateway', 'api', 'city-internal'],
  ['api', 'database', 'city-internal'],
  ['frontend', 'database', 'city-internal'],
  ['gateway', 'database', 'city-internal'],
  ['frontend', 'api', 'city-public'],
];
```

- **city-public** = linhas tracejadas azuis (`rgba(0,150,255,0.35)`)
- **city-internal** = linhas tracejadas amarelas (`rgba(200,180,50,0.25)`)
- Com TLS ativo, estradas internas ficam douradas solidas (`#ffd700`) com brilho

#### Caminhoes Animados (Pacotes)

Cada pacote recebido via SSE gera um "caminhao" animado que viaja de um predio a outro. A animacao funciona assim:

1. Pacote chega via SSE
2. Um `AnimPacket` e criado com `progress: 0`
3. A cada frame, `progress` avanca `0.006` (de 0 a 1)
4. A posicao do caminhao e interpolada linearmente entre origem e destino
5. Ao atingir `progress >= 1`, o caminhao para de ser renderizado

Para pacotes bloqueados (`status === 'blocked'`), a animacao para no meio do caminho e oscila:

```typescript
if (ap.blocked && t > 0.5) {
    t = 0.5 + Math.sin((t - 0.5) * Math.PI * 10) * 0.05;
}
```

Cores dos caminhoes por protocolo:

| Protocolo | Cor |
|-----------|-----|
| HTTP | `#00ccff` |
| SQL | `#ff9922` |
| SSE | `#00ff88` |
| gRPC | `#ff44aa` |
| DNS | `#ffee44` |

Quando TLS esta ativo, caminhoes nao-bloqueados exibem um icone de cadeado dourado acima deles. Caminhoes bloqueados mostram um "X" vermelho.

#### Interacao: Hover e Click

- **Hover sobre caminhao**: exibe tooltip com `source:port -> destination:port [protocol]`
- **Click em predio**: abre o painel BuildingInfo com detalhes do servico

O sistema de hit-detection usa retangulos de colisao calculados ao redor de cada predio (linhas 211-220).

#### Overlay de Firewall

Quando o firewall esta ativo, uma borda tracejada vermelha aparece ao redor de toda a cidade com a label "FIREWALL ACTIVE", pulsando suavemente com animacao senoidal.

---

### 2. Painel de Informacoes (BuildingInfo)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/components/BuildingInfo.tsx`

Ao clicar em qualquer predio na cidade, um painel lateral aparece mostrando informacoes detalhadas do servico. O painel busca dados adicionais via `GET /api/ports/{service}`.

#### Informacoes Exibidas

- **Nome do predio** (ex: "City Hall")
- **Service**: nome do servico Docker (ex: "api")
- **Port**: porta de rede com destaque em ciano (ex: `:8000`)
- **Status**: RUNNING (verde) ou ERROR (vermelho)
- **Networks**: redes Docker conectadas (ex: "city-internal")

#### Conexoes Ativas

O painel simula a saida do comando `ss -tlnp`, exibindo conexoes no formato:

```
State       Local Addr:Port  Peer Addr:Port
ESTABLISHED api:8000         gateway:80
ESTABLISHED api:8000         database:5432
```

Os estados de conexao TCP sao representados com cores:

| Estado | Cor | Significado |
|--------|-----|------------|
| **LISTEN** | Verde (`#00ff88`) | Servico aguardando conexoes |
| **ESTABLISHED** | Ciano (`#00ccff`) | Conexao ativa e transmitindo dados |
| **TIME_WAIT** | Laranja (`#ffaa00`) | Conexao encerrada, aguardando timeout |
| **CLOSE_WAIT** | Vermelho (`#ff4444`) | Esperando aplicacao fechar a conexao |

Esses estados sao definidos tanto no backend (`api/models.py`, linhas 10-15) quanto no frontend (`frontend/src/types/city.ts`, linhas 7-12).

---

### 3. Metricas em Tempo Real (MetricsSidebar)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/components/MetricsSidebar.tsx`

A sidebar esquerda exibe metricas em tempo real alimentadas pelo stream SSE.

#### Indicador de Conexao SSE

No topo, um indicador mostra se o stream SSE esta conectado:
- Ponto verde + "SSE CONNECTED"
- Ponto vermelho + "DISCONNECTED"

#### Contadores

- **Packets/sec**: taxa de pacotes por segundo, com animacao suave de transicao entre valores (interpolacao de 15% por step a cada 60ms)
- **Active Connections**: numero de conexoes com estado ESTABLISHED

#### Grafico de Latencia (Sparkline)

Um mini-grafico Canvas de 200x60px exibe os ultimos 30 valores de latencia em milissegundos. Utiliza uma linha ciano com preenchimento semitransparente embaixo. Os dados sao mantidos em um `useRef` para evitar re-renders desnecessarios.

#### Log de Pacotes Recentes

Lista os ultimos 15 pacotes com:
- Protocolo (colorido conforme o tipo)
- Caminho (source -> destination)
- Latencia em ms

---

### 4. Barra de URL (URLBar)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/components/URLBar.tsx`

A barra de URL no topo permite ao estudante enviar requisicoes e visualizar o caminho do pacote.

#### Como Funciona

1. O estudante digita uma URL (ou seleciona um preset)
2. Clica "SEND" ou pressiona Enter
3. A barra mostra um diagrama de progresso com 4 etapas:
   ```
   Browser -> Gateway:80 -> API:8000 -> DB:5432
   ```
4. Cada ponto acende em verde conforme o pacote avanca
5. A chamada real e feita via `POST /api/packets/send`
6. O tempo total de resposta e exibido no final

#### Botoes de Atalho (Presets)

Tres botoes de acesso rapido a endpoints comuns:

```typescript
const PRESETS = [
  { label: 'GET /api/health', url: 'http://api:8000/health' },
  { label: 'GET /api/ports', url: 'http://api:8000/ports' },
  { label: 'GET /api/city/status', url: 'http://api:8000/city/status' },
];
```

A barra simula delays visuais de 200ms entre os passos para tornar a jornada do pacote perceptivel, mesmo que a latencia real seja menor.

---

### 5. Firewall Toggle

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/components/FirewallToggle.tsx`

O botao de firewall na barra inferior permite ativar/desativar regras de firewall.

#### Comportamento Visual

- **Desativado**: icone "O" + indicador "OFF"
- **Ativado**: icone de escudo + indicador "ACTIVE" em vermelho + contador de pacotes bloqueados
- O indicador brilha com box-shadow vermelho quando ativo

#### Comportamento no Backend

Ao ativar o firewall, o backend (`api/services/city_state.py`, linhas 134-148) automaticamente adiciona uma regra padrao:

```python
def toggle_firewall(enabled: bool) -> bool:
    global _firewall_enabled
    _firewall_enabled = enabled
    if enabled:
        set_firewall_rule(FirewallRule(
            id="default-block-db",
            source="*",
            destination="database",
            port=5432,
            action="BLOCK",
            enabled=True,
        ))
    else:
        _firewall_rules.clear()
    return _firewall_enabled
```

Essa regra bloqueia **qualquer** trafego direcionado ao banco de dados na porta 5432. Quando um pacote e enviado e a verificacao de firewall (`check_firewall`) detecta uma regra de bloqueio, o pacote recebe `status = "blocked"` e o caminhao na cidade para no meio do caminho com uma animacao de oscilacao e um "X" vermelho.

#### O Conceito Ensinado

O firewall demonstra que, em uma arquitetura real, o banco de dados **nunca** deve ser acessivel diretamente por clientes externos. Todo trafego deve passar pelo gateway e pela API. A rede `city-internal` isola os servicos sensiveis.

---

### 6. TLS Toggle

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/components/TLSToggle.tsx`

O botao TLS simula a ativacao de criptografia com uma animacao do handshake TLS 1.3.

#### Animacao do Handshake

Ao ativar TLS, o componente:
1. Faz `GET /api/tls/handshake` para obter os 6 passos
2. Exibe cada passo sequencialmente com 400ms de delay
3. Mostra um painel flutuante com os detalhes de cada etapa
4. Apos 3 segundos, o painel desaparece

Os 6 passos do handshake TLS 1.3 (definidos no backend `api/main.py`, linhas 265-323):

| Passo | Nome | Descricao |
|-------|------|-----------|
| 1 | **Client Hello** | Cliente envia versoes TLS suportadas, cipher suites e numero aleatorio |
| 2 | **Server Hello** | Servidor seleciona versao TLS, cipher suite e envia seu numero aleatorio |
| 3 | **Certificate** | Servidor envia cadeia de certificados X.509 |
| 4 | **Certificate Verify** | Servidor prova posse da chave privada assinando hash do transcript |
| 5 | **Key Derivation** | Ambos derivam chaves de sessao usando ECDHE (HKDF-SHA384) |
| 6 | **Finished** | Ambos confirmam com MAC sobre o transcript -- canal seguro estabelecido! |

#### Mudancas Visuais

Com TLS ativado:
- **Estradas internas**: mudam de tracejadas amarelas para **solidas douradas** com brilho
- **Caminhoes**: ganham um icone de **cadeado dourado** acima
- **Predios**: exibem emoji de cadeado ao lado
- **Indicador**: mostra "ENCRYPTED" em dourado

#### O Conceito Ensinado

O TLS demonstra como a criptografia transforma uma conexao "plain text" em uma conexao segura. O handshake de 6 passos mostra que estabelecer uma conexao HTTPS nao e instantaneo -- ha uma negociacao complexa antes que qualquer dado da aplicacao possa trafegar.

---

### 7. Modo Desafio (ChallengeMode)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/components/ChallengeMode.tsx`

O modo desafio apresenta 4 problemas praticos com sistema de pontuacao, validados pelo backend.

#### Desafio 1: "Wrong Port" (10 pontos, Facil)

**Problema:** "A service is running on the wrong port! The API server should listen on port 8000, but someone misconfigured it. Which port should it be on?"

**Interface:** Dropdown com opcoes de portas (80, 443, 3000, 5432, 8000, 8080)

**Resposta correta:** `8000`

**Validacao no backend** (`api/services/challenge_engine.py`, linha 78):
```python
if challenge_id == 1:
    is_correct = str(answer_value) == "8000"
```

**Explicacao:** "Port 8000 is the standard port for the FastAPI service (City Hall). If it were running on 9000, the gateway's reverse proxy config wouldn't be able to reach it since nginx proxies to api:8000."

#### Desafio 2: "The Invasion" (20 pontos, Medio)

**Problema:** "Malicious packets are attacking the database directly! Configure the firewall to block external traffic to port 5432."

**Interface:** Dropdown com regras de firewall:
- Block external -> :5432
- Block all -> :5432
- Allow only internal -> :5432
- Block external -> :80

**Respostas aceitas:** `block-external-5432` ou `allow-internal-5432`

**Explicacao:** "The database (Municipal Archive) sits on city-internal network only. Direct external access should be blocked - traffic must flow through the gateway (City Gate) which bridges both networks, demonstrating the NAT Gateway concept."

#### Desafio 3: "DNS Down" (20 pontos, Medio)

**Problema:** "DNS resolution has failed. Figure out what happens and how services find each other."

**Interface:** Campo de texto livre ("Which DNS step fails? (1-4)")

**Respostas aceitas:** `3` ou `docker-dns`

**Explicacao:** "Docker has an embedded DNS server at 127.0.0.11. Containers resolve service names (like 'api' or 'database') through Docker DNS. If DNS fails, you can fall back to direct container IPs, but that's fragile since IPs can change."

#### Desafio 4: "Protocol Race" (30 pontos, Dificil)

**Problema:** "REST vs gRPC -- which protocol delivers the response faster? Watch the packets race!"

**Interface:** Dropdown com:
- REST (HTTP/1.1 + JSON)
- gRPC (HTTP/2 + Protobuf)

**Resposta correta:** `gRPC`

**Explicacao:** "gRPC uses Protocol Buffers for binary serialization, which produces smaller payloads and is faster to serialize/deserialize compared to JSON used by REST. This matters especially for high-throughput service-to-service communication."

#### Sistema de Pontuacao

A pontuacao total e acumulada no estado local do componente. Desafios ja resolvidos mostram a pontuacao obtida com borda verde.

---

## Backend: API Endpoints

**Arquivo principal:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/api/main.py`

### GET /api/city/status

Retorna o estado completo da cidade: predios, conexoes, metricas e flags.

**Resposta:**
```json
{
  "buildings": [
    {
      "id": "1",
      "name": "Command Center",
      "service": "frontend",
      "port": 3000,
      "status": "running",
      "networks": ["city-public"],
      "description": "React frontend served by Vite dev server",
      "connections": [...]
    }
  ],
  "connections": [...],
  "active_connections": 3,
  "packets_per_second": 0.5,
  "firewall_enabled": false,
  "tls_enabled": false
}
```

### GET /api/city/connections

Retorna a lista de conexoes ativas entre servicos.

### GET /api/packets/stream

Endpoint SSE (Server-Sent Events) que transmite pacotes em tempo real. Envia eventos nomeados `packet` com dados JSON. Inclui heartbeat a cada 30 segundos para manter a conexao viva.

```python
async def event_generator():
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=30.0)
            yield {"event": "packet", "data": json.dumps(event)}
        except asyncio.TimeoutError:
            yield {"event": "heartbeat", "data": json.dumps({"type": "keepalive"})}
```

### POST /api/packets/send

Envia um pacote de um servico para outro. O backend faz uma requisicao real ao servico de destino e mede a latencia.

**Request body:**
```json
{
  "source": "browser",
  "destination": "gateway",
  "protocol": "HTTP",
  "payload": "GET /api/status"
}
```

O endpoint resolve o nome do destino via `_resolve_service()` (aceita aliases como "gate", "nginx", "hall", "postgres", "archive"), verifica regras de firewall, faz a requisicao HTTP real (ou query SQL para o banco), e registra o pacote no banco de dados.

### GET /api/ports/{service}

Simula o comando `ss -tlnp` para um servico especifico. Retorna porta, redes, protocolo e conexoes.

### POST /api/firewall/toggle

Ativa/desativa o firewall globalmente.

### POST /api/firewall/rules e GET /api/firewall/rules

Gerencia regras individuais de firewall. Cada regra tem: source, destination, port, action (ALLOW/BLOCK).

### GET /api/dns/resolve/{name}

Simula a resolucao DNS passo a passo. Para servicos Docker (frontend, gateway, api, database), a resolucao e feita pelo DNS interno do Docker em 4 passos. Para nomes externos, simula a cadeia completa de 7 passos (browser cache -> OS cache -> Docker DNS -> root server -> TLD -> authoritative -> resposta).

### GET /api/challenges e POST /api/challenges/{id}/check

Lista e valida desafios. O endpoint de validacao aceita tanto IDs numericos quanto strings (via mapeamento interno).

### GET /api/tls/handshake

Retorna os 6 passos do handshake TLS 1.3 com detalhes tecnicos (cipher suites, certificados, algoritmos).

---

## O Monitor de Pacotes (Background Task)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/api/services/packet_monitor.py`

O `packet_monitor` e uma task em background que roda continuamente enquanto a API estiver ativa. A cada 2 segundos, ele:

1. **Faz um probe HTTP ao gateway** (`GET http://gateway:80/health`) e mede a latencia
2. **Faz um probe SQL ao banco** (`SELECT 1`) e mede a latencia
3. Registra ambos os pacotes no banco de dados
4. Publica os eventos na fila SSE

Isso garante que, mesmo sem interacao do usuario, ha trafego constante na cidade -- os caminhoes estao sempre andando.

A fila de eventos (`asyncio.Queue`) tem capacidade maxima de 1000 eventos. Quando cheia, o evento mais antigo e descartado para dar lugar ao novo (linhas 85-92):

```python
try:
    _event_queue.put_nowait(event)
except asyncio.QueueFull:
    try:
        _event_queue.get_nowait()
    except asyncio.QueueEmpty:
        pass
    _event_queue.put_nowait(event)
```

A taxa de pacotes por segundo e calculada com uma janela deslizante de 10 segundos.

---

## O Simulador de DNS

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/api/services/dns_simulator.py`

O simulador DNS demonstra a diferenca entre resolver nomes Docker internos e nomes de dominio externos.

### Resolucao de Servico Docker (4 passos)

Para nomes como `api`, `database`, `gateway`:

```
1. Browser checks local DNS cache        -> MISS
2. OS checks /etc/hosts                  -> MISS
3. Docker DNS (127.0.0.11) resolves      -> HIT! api -> 172.21.0.2
4. IP returned to requesting service     -> RESOLVED: 172.21.0.2
```

### Resolucao de Nome Externo (7 passos)

Para nomes como `google.com`:

```
1. Browser cache                         -> MISS
2. OS /etc/hosts                         -> MISS
3. Docker DNS                            -> MISS (forwards upstream)
4. Root server (a.root-servers.net)      -> REFERRAL to .com TLD
5. TLD server (.com)                     -> REFERRAL to authoritative NS
6. Authoritative NS (ns1.google.dns)     -> A RECORD: 172.21.0.xx
7. Recursive resolver                    -> RESOLVED with TTL 3600s
```

Os IPs de servicos Docker sao mapeados estaticamente:

```python
DOCKER_SERVICES = {
    "frontend": "172.20.0.2",
    "gateway": "172.20.0.3",
    "api": "172.21.0.2",
    "database": "172.21.0.3",
}
```

As latencias sao simuladas com valores aleatorios realistas -- DNS Docker resolve em < 2ms, enquanto a cadeia completa pode somar dezenas de milissegundos.

---

## O Hook SSE (useSSE)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/frontend/src/hooks/useSSE.ts`

O custom hook `useSSE` gerencia a conexao Server-Sent Events com o backend.

### Funcionamento

```typescript
export function useSSE() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [connected, setConnected] = useState(false);

  // ...

  const es = new EventSource('/api/packets/stream');

  es.addEventListener('packet', (event: MessageEvent) => {
    const packet: Packet = JSON.parse(event.data);
    setPackets((prev) => {
      const next = [packet, ...prev];
      return next.slice(0, MAX_PACKETS); // max 50 pacotes
    });
  });
```

Caracteristicas:
- Mantem no maximo **50 pacotes** em memoria (constante `MAX_PACKETS`)
- **Reconexao automatica** apos 3 segundos em caso de erro
- Escuta eventos nomeados `packet` (nao o evento `message` padrao)
- Tambem escuta eventos `heartbeat` para keep-alive
- Retorna `{ packets, connected }` para os componentes consumidores

### Por que SSE e nao WebSocket?

SSE e mais simples para fluxos unidirecionais (servidor -> cliente). Neste caso, o servidor envia pacotes e o cliente apenas recebe. Nao ha necessidade de comunicacao bidirecional. Alem disso, SSE funciona sobre HTTP padrao, facilitando o proxy via Nginx.

---

## Configuracao do Nginx (Gateway)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/gateway/nginx.conf`

O Nginx atua como reverse proxy na porta 80, roteando `/api/*` para o backend FastAPI.

### Configuracoes Criticas para SSE

```nginx
location /api/ {
    proxy_pass http://api_server;

    # SSE / WebSocket support
    proxy_buffering off;
    proxy_cache off;
    add_header X-Accel-Buffering no always;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_read_timeout 86400s;
    chunked_transfer_encoding off;
}
```

Sem essas configuracoes, o Nginx bufferiza as respostas SSE e o stream para de funcionar. Os pontos essenciais:

- `proxy_buffering off` -- desativa o buffer de resposta do Nginx
- `proxy_set_header Connection ''` -- limpa o header Connection para permitir keep-alive
- `proxy_read_timeout 86400s` -- timeout de 24 horas para nao fechar conexoes SSE longas
- `proxy_http_version 1.1` -- necessario para chunked transfer encoding

### Health Check

```nginx
location /health {
    return 200 '{"status": "ok", "service": "city-gate"}';
    add_header Content-Type application/json;
}
```

Este endpoint e usado pelo `packet_monitor` para verificar a saude do gateway a cada 2 segundos.

---

## Banco de Dados (PostgreSQL)

**Arquivo:** `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/database/init.sql`

### Tabela `packet_log`

Registra todos os pacotes que trafegam pela cidade:

```sql
CREATE TABLE packet_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50),
    destination VARCHAR(50),
    port INTEGER,
    protocol VARCHAR(10),
    payload TEXT,
    latency_ms FLOAT,
    status VARCHAR(20)
);
```

### Tabela `challenges`

Armazena os 4 desafios com respostas corretas em JSONB:

```sql
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    difficulty VARCHAR(20),
    correct_answer JSONB,
    hints JSONB
);
```

Os 4 desafios sao inseridos automaticamente no `init.sql`. O backend carrega os desafios do banco na inicializacao, mas tem um fallback em memoria caso a leitura falhe (`api/services/challenge_engine.py`, linhas 30-57).

---

## Conceitos de SE Ensinados

A tabela abaixo mapeia cada funcionalidade da aplicacao ao conceito de Engenharia de Software que ela ensina:

| Funcionalidade | Metafora Visual | Conceito de SE |
|----------------|----------------|----------------|
| **Predios** | 4 edificios isometricos | Containers Docker como unidades de deploy isoladas |
| **Portas brilhantes** | Numeros luminosos nos predios (:80, :3000, :8000, :5432) | Portas de rede -- pontos de entrada para servicos |
| **Estradas azuis** | Conexoes na rede `city-public` | Rede publica acessivel externamente |
| **Estradas amarelas** | Conexoes na rede `city-internal` | Rede interna isolada do mundo externo |
| **City Gate (gateway)** | Predio que conecta ambas as redes | Reverse proxy / NAT Gateway |
| **Caminhoes** | Pacotes viajando entre predios | Requisicoes HTTP / queries SQL em transito |
| **Cores dos caminhoes** | HTTP=ciano, SQL=laranja, gRPC=rosa | Diferentes protocolos de comunicacao |
| **Firewall toggle** | Barreira vermelha, caminhoes bloqueados | Regras de firewall e filtragem de trafego |
| **TLS toggle** | Estradas douradas, cadeados nos caminhoes | Criptografia HTTPS e handshake TLS |
| **Painel de conexoes** | Tabela estilo `ss -tlnp` | Estados de conexao TCP |
| **Sidebar de metricas** | Graficos e contadores em tempo real | Observabilidade e monitoramento |
| **Stream SSE** | Dados fluindo continuamente | Server-Sent Events para comunicacao em tempo real |
| **Simulador DNS** | Passos de resolucao | Hierarquia DNS (cache -> Docker DNS -> root -> TLD -> authoritative) |
| **Barra de URL** | Diagrama Browser->Gateway->API->DB | Fluxo completo de uma requisicao HTTP end-to-end |
| **Desafios** | Quiz interativo com pontuacao | Aplicacao pratica dos conceitos aprendidos |

---

## Detalhes Tecnicos

### Stack Completa

| Camada | Tecnologia | Versao/Detalhes |
|--------|-----------|-----------------|
| **Frontend** | React + Vite + TypeScript | React 18, HTML5 Canvas para renderizacao |
| **Backend** | FastAPI + sse-starlette + httpx + asyncpg | Python async com pool de conexoes |
| **Gateway** | Nginx | Reverse proxy com suporte SSE |
| **Database** | PostgreSQL | 16 Alpine com JSONB para dados de desafios |
| **Orquestracao** | Docker Compose | 4 servicos, 2 redes bridge |

### Matematica Isometrica

A projecao isometrica 2:1 usada no canvas:

```
x_tela = origem_x + (grid_x - grid_y) * (tile_width / 2)
y_tela = origem_y + (grid_x + grid_y) * (tile_height / 2)
```

Onde `tile_height = tile_width / 2` (ratio 2:1 para projecao isometrica).

O dimensionamento dinamico:
```
tile_width = Math.floor(Math.min(canvas_width, canvas_height) * 0.14)
scale = tile_width / 64
```

Todos os elementos (predios, fontes, caminhoes, hitboxes) sao multiplicados por `scale` para manter proporcao em qualquer tamanho de tela.

### Tipos Compartilhados (Contrato da API)

O contrato entre frontend e backend e definido por tipos espelhados:

**Backend** (`api/models.py`) usa Pydantic:
```python
class Building(BaseModel):
    id: str = ""
    name: str
    service: str
    port: int
    status: str = "running"
    networks: list[str] = []
    description: str = ""
    connections: list[Connection] = []
```

**Frontend** (`frontend/src/types/city.ts`) usa TypeScript:
```typescript
export interface Building {
  id: string;
  name: string;
  service: string;
  port: number;
  status: string;
  networks: string[];
  description: string;
  connections: Connection[];
}
```

Os campos devem ser identicos em nome e tipo para que a serializacao JSON funcione sem adaptadores.

### Modelo de Dados do Pacote

O pacote e o tipo central da aplicacao, fluindo do backend via SSE ate a animacao no canvas:

```typescript
export interface Packet {
  id: string;              // ID unico (do DB ou UUID)
  source: string;          // servico de origem
  source_port: number;     // porta de origem
  destination: string;     // servico de destino
  destination_port: number;// porta de destino
  protocol: string;        // HTTP, SQL, SSE, gRPC, DNS
  payload_preview: string; // preview do conteudo (max 50 chars)
  status: string;          // traveling, delivered, blocked, timeout, error
  timestamp: string;       // ISO 8601
  latency_ms: number;      // latencia real medida
}
```

---

## Licoes Aprendidas (Post-Mortem)

Este projeto foi construido por uma equipe de agentes de IA (team-lead, backend-dev, frontend-dev, devil-advocate) trabalhando em paralelo. O processo revelou problemas comuns em desenvolvimento distribuido.

### 1. Desalinhamento do Contrato da API (Critico)

**O problema:** Os agentes backend-dev e frontend-dev trabalharam em paralelo e produziram shapes de dados incompativeis. Exemplos:
- Backend retornava `network: str` (singular), frontend esperava `networks: string[]` (array)
- Backend retornava `port: int` (unico), frontend esperava `source_port`, `destination_port`, `payload_preview`
- Backend nao incluia `firewall_enabled` e `tls_enabled` no `CityStatus`
- Backend nao incluia `score` no `ChallengeResult`

O devil-advocate tentou "alinhar" os tipos mas acabou piorando a situacao, quebrando componentes que dependiam dos nomes originais do frontend.

**A correcao:** O team-lead reescreveu manualmente `models.py`, `city_state.py`, `main.py`, `packet_monitor.py`, `challenge_engine.py`, `types/city.ts`, `App.tsx`, `BuildingInfo.tsx` e `ChallengeMode.tsx`.

**A licao:** Quando equipes trabalham em paralelo, o **contrato da API (tipos/modelos) deve ser definido PRIMEIRO** como artefato compartilhado antes de qualquer implementacao.

### 2. Metodo HTTP Incorreto para TLS

**O problema:** O frontend fazia `POST /api/tls/handshake`, mas o backend definia `GET`.

**A licao:** Documentar explicitamente o metodo HTTP de cada endpoint no contrato.

### 3. Tipo de ID dos Desafios

**O problema:** Frontend usava strings (`wrong-port`, `invasion`), backend usava inteiros (1, 2, 3, 4) carregados do banco.

**A correcao:** Backend agora aceita ambos via mapeamento:
```python
cid_map = {"wrong-port": 1, "invasion": 2, "dns-down": 3, "protocol-race": 4}
```

**A licao:** Definir claramente a tipagem de IDs no contrato.

### 4. Race Condition na Conexao com o Banco

**O problema:** A API iniciava antes do PostgreSQL estar pronto, causando falhas na primeira conexao.

**A correcao:** Loop de retry com 10 tentativas + healthcheck com `condition: service_healthy` no Docker Compose.

**A licao:** Sempre implementar retry logic para dependencias externas.

### 5. Canvas Desproporcional

**O problema:** A cidade era minuscula (~200px) em um canvas de 1000px+. Tiles e predios tinham tamanhos fixos que nao escalavam.

**A correcao:** Dimensionamento dinamico baseado no tamanho do canvas, com fator de escala `tw / 64`. Grid positions espacadas 4 unidades (em vez de 2). Origem vertical em `H * 0.28`.

**A licao:** Canvas HTML5 **nunca** deve usar dimensoes fixas em pixels. Tudo deve escalar com o container.

### 6. Buffering do Nginx em Conexoes SSE

**O problema:** O Nginx bufferizava respostas SSE, fazendo o stream travar.

**A correcao:** Adicionar `proxy_buffering off`, `proxy_set_header Connection ''`, e `proxy_read_timeout 86400s`.

**A licao:** SSE e streaming requerem configuracao especifica no reverse proxy.

### 7. Import Ausente de Enum

**O problema:** `CityCanvas.tsx` referenciava `PacketStatus.BLOCKED` sem importar o enum.

**A correcao:** Substituir por comparacao de string literal `pkt.status === 'blocked'`.

**A licao:** Preferir comparacoes de string quando o valor vem de dados serializados (JSON nao preserva enums).

### Recomendacoes para Projetos Futuros

1. **Defina tipos compartilhados PRIMEIRO** -- Crie `shared-contract.ts` / `shared-contract.py` antes de dividir o trabalho
2. **Revisores nao devem modificar codigo** -- Apenas sinalizem problemas para o agente responsavel corrigir
3. **Smoke tests antes de validacao visual** -- Um `curl` rapido em cada endpoint antes de usar Playwright
4. **Canvas responsivo por padrao** -- Nunca hardcode dimensoes em pixel para HTML5 Canvas
