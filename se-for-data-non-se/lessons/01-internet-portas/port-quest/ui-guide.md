# PORT QUEST -- Guia Passo a Passo da Interface

Este documento descreve **cada elemento interativo** da interface do Port Quest, explicando o que faz, como usar, e o que acontece por tras quando voce clica. Ele complementa o `manuscript.md` (que foca na arquitetura) com um foco exclusivo na **experiencia do usuario**.

---

## Layout Geral da Tela

Ao abrir `http://localhost:3000`, a tela se divide em **4 zonas**:

```
+--------------------------------------------------------------+
|                    BARRA DE URL (topo)                        |
+----------+-------------------------------------------+-------+
|          |                                           |       |
| SIDEBAR  |            CIDADE ISOMETRICA              | PAINEL|
| METRICAS |              (Canvas)                     | INFO  |
|          |                                           |(cond.)|
|          |                                           |       |
+----------+-------------------------------------------+-------+
|            BARRA DE CONTROLES (rodape)                       |
+--------------------------------------------------------------+
```

- **Topo**: Barra de URL com campo de texto, botao SEND, indicador de progresso e presets
- **Esquerda**: Sidebar de metricas em tempo real (220px de largura)
- **Centro**: Canvas da cidade isometrica (ocupa todo espaco restante)
- **Direita** (condicional): Painel de informacoes do predio (aparece ao clicar num predio)
- **Rodape**: Tres controles -- Firewall, TLS e Challenges

Quando a aplicacao esta carregando, uma tela escura exibe "INITIALIZING CONTAINER CITY..." em ciano ate que a chamada `GET /api/city/status` retorne com sucesso.

---

## 1. Barra de URL (URLBar)

**Localizacao:** Topo da tela, ocupando toda a largura.

### 1.1 Campo de Texto

- **Valor padrao**: `http://api:8000/`
- **Placeholder**: `http://api:8000/...`
- Um sinal `>` verde aparece a esquerda como prompt de terminal
- Voce pode digitar qualquer URL manualmente
- Pressionar **Enter** dispara o envio (mesmo efeito do botao SEND)
- O campo fica **desabilitado** (cinza) enquanto um envio esta em andamento

### 1.2 Botao SEND

- Botao verde a direita do campo com texto "SEND"
- Muda para "..." enquanto a requisicao esta sendo processada
- Fica **desabilitado** durante o envio para evitar cliques duplos

**O que acontece ao clicar SEND:**

1. O frontend inicia um contador de tempo (`performance.now()`)
2. **Passo 1** -- Simula "Browser -> Gateway" com delay de 200ms (o primeiro ponto do progresso acende verde)
3. **Passo 2** -- Simula "Gateway -> API" com mais 200ms de delay (segundo ponto acende)
4. **Passo 3** -- Faz a chamada real `POST /api/packets/send` enviando `{ source: "browser", destination: <url> }`
5. **Passo 4** -- Quando a resposta chega, o quarto ponto acende e o tempo total aparece (ex: "433ms")
6. O pacote enviado aparece no stream SSE e gera um caminhao animado na cidade
7. Apos 1.5 segundos, o indicador de progresso reseta

### 1.3 Indicador de Progresso

Abaixo do campo de texto, uma fila de **4 pontos** conectados por linhas:

```
Browser ---- Gateway:80 ---- API:8000 ---- DB:5432
  (.)-----------(.)-------------(.)-----------(.)     [433ms]
```

- Cada ponto comeca **cinza escuro** (#333)
- Conforme o pacote avanca, os pontos acendem **verde** (#00ff88) com brilho
- As linhas entre os pontos tambem mudam de escuro para verde
- Ao final, o tempo total de resposta aparece em **ciano** a direita
- Se ocorrer erro, exibe "ERROR" em vez do tempo

### 1.4 Botoes de Preset (Atalhos)

Tres botoes pequenos abaixo do indicador de progresso:

| Botao | URL que define no campo |
|-------|------------------------|
| `GET /api/health` | `http://api:8000/health` |
| `GET /api/ports` | `http://api:8000/ports` |
| `GET /api/city/status` | `http://api:8000/city/status` |

- Clicar em um preset **apenas preenche o campo** de URL -- nao envia automaticamente
- Voce ainda precisa clicar SEND ou pressionar Enter para disparar
- Os botoes tem estilo de terminal: fundo escuro, texto roxo-azulado, borda sutil

---

## 2. Sidebar de Metricas (MetricsSidebar)

**Localizacao:** Lateral esquerda, 220px de largura, toda a altura da area central.

### 2.1 Indicador de Conexao SSE

No topo da sidebar:

- **Conectado**: Ponto verde pulsante + texto "SSE CONNECTED" em verde
- **Desconectado**: Ponto vermelho + texto "DISCONNECTED" em vermelho

Isso indica se o stream de Server-Sent Events esta ativo. O SSE reconecta automaticamente apos 3 segundos em caso de queda.

### 2.2 Contador Packets/sec

- Label "Packets/sec" a esquerda
- Numero grande em **ciano** (#00ccff) a direita
- O valor **anima suavemente** entre transicoes (interpolacao de 15% a cada 60ms)
- Reflete a taxa real de pacotes medida pelo backend numa janela de 10 segundos

### 2.3 Contador Active Connections

- Label "Active Connections" a esquerda
- Numero grande em **ciano** a direita
- Mostra quantas conexoes estao no estado ESTABLISHED entre os servicos

### 2.4 Grafico de Latencia (Sparkline)

- Mini-canvas de 200x60px com fundo escuro
- Label "Latency (ms)" acima
- Desenha uma **linha ciano** conectando os ultimos 30 valores de latencia
- Area abaixo da linha preenchida com ciano semitransparente
- Atualiza automaticamente a cada pacote recebido via SSE
- O eixo Y escala dinamicamente conforme o valor maximo muda

### 2.5 Lista de Pacotes Recentes

- Titulo "RECENT PACKETS" em cinza
- Lista dos **ultimos 15 pacotes** em formato tabular compacto
- Cada linha mostra:
  - **Protocolo** (colorido): HTTP em ciano, SQL em laranja, SSE em verde, gRPC em rosa
  - **Caminho**: `origem->destino` em cinza
  - **Latencia**: valor em ms alinhado a direita
- Quando nenhum pacote chegou ainda: "Waiting for packets..." em cinza escuro
- A lista rola verticalmente se exceder o espaco disponivel

---

## 3. Cidade Isometrica (CityCanvas)

**Localizacao:** Centro da tela, ocupa todo o espaco entre a sidebar e os controles.

### 3.1 Visao Geral

O canvas mostra uma cidade em **projecao isometrica** com:
- **4 predios** representando os containers Docker
- **Estradas** conectando os predios (representando redes)
- **Caminhoes animados** viajando entre predios (representando pacotes)
- **Grid sutil** de fundo (linhas cinza-escuro diagonais)

Todos os elementos escalam **dinamicamente** conforme o tamanho da janela. Nao ha dimensoes fixas.

### 3.2 Os 4 Predios

Cada predio e um bloco isometrico em pixel art com 3 faces (topo, esquerda, direita):

| Predio | Servico | Porta | Cor | Posicao no Grid | Altura |
|--------|---------|-------|-----|-----------------|--------|
| **Command Center** | frontend | :3000 | Ciano/azul | Topo-centro | Mais alto (90) |
| **City Gate** | gateway | :80 | Verde | Direita | Medio (60) |
| **City Hall** | api | :8000 | Roxo | Baixo-centro | Alto (78) |
| **Municipal Archive** | database | :5432 | Laranja | Esquerda | Mais baixo (55) |

Elementos visuais de cada predio:
- **Numero da porta** brilhante acima (ex: `:3000`) na cor do servico
- **Janelas pixel art** que piscam com animacao senoidal (tipo neon de cidade a noite)
- **Porta brilhante** na base, pulsando suavemente (representa a porta de rede)
- **Nome** abaixo do predio em cinza claro
- **Ponto de status** no canto: verde = running, vermelho = error
- **Efeito pulse** quando o predio recebe um pacote (brilho temporario)

### 3.3 Estradas (Redes)

As linhas que conectam os predios representam as redes Docker:

| Conexao | Rede | Estilo Padrao | Estilo com TLS |
|---------|------|---------------|----------------|
| Command Center <-> City Gate | city-public | Tracejada azul | Tracejada azul (nao muda) |
| Command Center <-> City Hall | city-public | Tracejada azul | Tracejada azul |
| City Gate <-> City Hall | city-internal | Tracejada amarela | **Solida dourada com brilho** |
| City Gate <-> Municipal Archive | city-internal | Tracejada amarela | **Solida dourada com brilho** |
| City Hall <-> Municipal Archive | city-internal | Tracejada amarela | **Solida dourada com brilho** |
| Command Center <-> Municipal Archive | city-internal | Tracejada amarela | **Solida dourada com brilho** |

### 3.4 Caminhoes Animados (Pacotes)

Cada pacote que chega via SSE gera um pequeno "caminhao" pixel art que viaja ao longo das estradas:

- **Corpo** colorido conforme o protocolo (HTTP=ciano, SQL=laranja, SSE=verde, gRPC=rosa, DNS=amarelo)
- **Cabine** em cor mais escura na frente
- A animacao dura aproximadamente **167 frames** (progress 0 -> 1 a 0.006 por frame)
- O caminhao se move em **linha reta** da origem ao destino

**Caminhoes com TLS ativo:**
- Exibem um **cadeado dourado** acima do caminhao

**Caminhoes bloqueados (firewall):**
- Param no **meio do caminho** (50% do percurso)
- Oscilam para frente e para tras com animacao senoidal
- Exibem um **X vermelho** grande sobre eles
- Brilho vermelho ao redor

### 3.5 Interacoes no Canvas

**Hover sobre caminhao:**
- Um tooltip aparece acima do caminhao mostrando: `origem:porta -> destino:porta [protocolo]`
- Exemplo: `api:8000 -> gateway:80 [HTTP]`
- O tooltip tem fundo escuro com borda ciano

**Click em predio:**
- Abre o **Painel de Informacoes** (BuildingInfo) na lateral direita
- A deteccao de clique usa retangulos de colisao calculados ao redor de cada predio
- O hitbox e proporcional ao tamanho do predio (100 x 140 pixels na escala base)

### 3.6 Overlay de Firewall

Quando o firewall esta ativo:
- Uma **borda tracejada vermelha** pulsa ao redor de toda a cidade
- O texto "FIREWALL ACTIVE" aparece no canto superior esquerdo do canvas em vermelho
- A opacidade da borda oscila suavemente com animacao senoidal

---

## 4. Painel de Informacoes do Predio (BuildingInfo)

**Localizacao:** Lateral direita, 300px de largura. Aparece ao clicar num predio.

### 4.1 Como Abrir

- Clique em qualquer predio no canvas da cidade
- O painel aparece instantaneamente a direita

### 4.2 Como Fechar

- Clique no botao **X** no canto superior direito do painel

### 4.3 Informacoes Exibidas

O painel mostra dados em formato de tabela:

| Campo | Exemplo | Cor |
|-------|---------|-----|
| **Titulo** (h2) | "Command Center" | Branco |
| **Service** | frontend | Cinza claro |
| **Port** | :3000 | **Ciano** |
| **Status** | RUNNING | **Verde** (ou vermelho se ERROR) |
| **Networks** | city-public | Cinza claro |

### 4.4 Tabela de Conexoes Ativas

Abaixo dos dados basicos, uma secao "Active Connections" estilizada como saida de terminal:

```
State        Local Addr:Port   Peer Addr:Port
ESTABLISHED  frontend:3000     gateway:80
```

Os estados de conexao sao coloridos:

| Estado | Cor | Significado |
|--------|-----|------------|
| LISTEN | Verde (#00ff88) | Aguardando conexoes |
| ESTABLISHED | Ciano (#00ccff) | Conexao ativa |
| TIME_WAIT | Laranja (#ffaa00) | Aguardando timeout |
| CLOSE_WAIT | Vermelho (#ff4444) | Esperando fechar |

Se nao houver conexoes: "No active connections" em cinza.

### 4.5 Descricao

No rodape do painel, um texto descritivo do servico em cinza pequeno. Exemplo: "React frontend served by Vite dev server".

### 4.6 Dados em Tempo Real

Ao abrir o painel, ele faz automaticamente `GET /api/ports/{service}` para buscar as conexoes atualizadas. Durante o carregamento, "loading..." aparece ao lado do titulo "Active Connections".

---

## 5. Botao FIREWALL (FirewallToggle)

**Localizacao:** Barra de controles no rodape, primeiro botao (esquerda).

### 5.1 Estado Desativado (Padrao)

- Icone: **O** (circulo vazio)
- Texto: "FIREWALL"
- Indicador abaixo: "OFF" em cinza
- Borda vermelha sutil ao redor do botao

### 5.2 Clicando para Ativar

1. O botao faz `POST /api/firewall/rules` com `{ enabled: true }`
2. O backend cria automaticamente uma regra: **bloquear todo trafego para database:5432**
3. A partir desse momento, pacotes destinados ao banco sao marcados como "blocked"

### 5.3 Estado Ativado

- Icone muda para **escudo** (emoji)
- Indicador muda para "ACTIVE" em **vermelho**
- Contador de pacotes bloqueados aparece: "1 blocked", "2 blocked", etc.
- O indicador ganha um **brilho vermelho** (box-shadow)
- No canvas, a borda vermelha tracejada e o texto "FIREWALL ACTIVE" aparecem
- Caminhoes que tentam chegar ao banco param no meio do caminho com X vermelho

### 5.4 Clicando para Desativar

1. Faz `POST /api/firewall/rules` com `{ enabled: false }`
2. O backend limpa **todas** as regras de firewall
3. Tudo volta ao normal: caminhoes fluem livremente, overlay desaparece

### 5.5 Conceito Ensinado

O firewall demonstra que o banco de dados **nunca** deve ser acessivel diretamente. Todo trafego deve passar pelo gateway e pela API. A rede `city-internal` isola servicos sensiveis.

---

## 6. Botao TLS (TLSToggle)

**Localizacao:** Barra de controles no rodape, segundo botao (centro).

### 6.1 Estado Desativado (Padrao)

- Icone: **cadeado aberto** (emoji)
- Texto: "TLS"
- Indicador abaixo: "PLAIN" em cinza
- Borda dourada sutil ao redor

### 6.2 Clicando para Ativar -- A Animacao do Handshake

Ao clicar, inicia-se uma **animacao sequencial** do handshake TLS 1.3:

1. O botao fica **desabilitado** durante a animacao
2. O indicador muda para "HANDSHAKE..." em dourado
3. O frontend faz `GET /api/tls/handshake` para obter os 6 passos
4. Um **painel flutuante** aparece acima do botao, e cada passo e revelado com 400ms de intervalo:

| Passo | Nome | Descricao Exibida |
|-------|------|-------------------|
| #1 | **Client Hello** | Client sends supported TLS versions, cipher suites, and a random number |
| #2 | **Server Hello** | Server selects TLS version, cipher suite, and sends its random number |
| #3 | **Certificate** | Server sends its X.509 certificate chain for identity verification |
| #4 | **Certificate Verify** | Server proves it owns the private key by signing a transcript hash |
| #5 | **Key Derivation** | Both sides derive the same session keys using ECDHE shared secret |
| #6 | **Finished** | Both sides confirm the handshake with a MAC over the transcript |

5. O painel de passos desaparece automaticamente apos **3 segundos**
6. O indicador muda para "ENCRYPTED" em **dourado** com brilho

### 6.3 Estado Ativado

- Icone muda para **cadeado fechado** (emoji)
- Indicador: "ENCRYPTED" em dourado com box-shadow dourado
- No canvas:
  - Estradas `city-internal` mudam de tracejadas amarelas para **solidas douradas com brilho**
  - Caminhoes ganham um **cadeado dourado** acima
  - Predios exibem um **emoji de cadeado** ao lado

### 6.4 Clicando para Desativar

1. Nao faz chamada de handshake (apenas reverte)
2. Todas as mudancas visuais voltam ao estado original
3. O indicador volta para "PLAIN"

### 6.5 Conceito Ensinado

O TLS mostra que estabelecer uma conexao HTTPS nao e instantaneo -- ha uma negociacao complexa de 6 passos antes que qualquer dado possa trafegar com seguranca. A animacao torna visivel algo que normalmente leva milissegundos e e invisivel.

---

## 7. Botao CHALLENGES (ChallengeMode)

**Localizacao:** Barra de controles no rodape, terceiro botao (direita).

### 7.1 Abrindo o Modal

- Ao clicar em "CHALLENGES", um **modal escuro** aparece sobrepondo toda a tela
- Fundo semitransparente (70% preto) cobre a cidade por tras
- O modal tem 520px de largura, centralizado na tela

### 7.2 Cabecalho do Modal

- Titulo "CHALLENGE MODE" em roxo com espacamento de letras
- **Score: 0** em verde a direita (acumula pontos ao acertar)
- Botao **X** para fechar o modal

### 7.3 Lista de Desafios

4 botoes empilhados verticalmente, cada um mostrando:
- **Titulo** em negrito (ex: "1. Wrong Port")
- **Descricao** truncada em cinza (primeiros 60 caracteres + "...")
- Se ja resolvido: borda **verde** + texto "+N pts" em verde

### 7.4 Desafio 1: "Wrong Port" (10 pontos -- Facil)

**Clicando no desafio:**
- A lista e substituida pela **tela do desafio**
- Botao **"<- Back"** no topo para voltar a lista

**Pergunta:** "A service is running on the wrong port! The API server should listen on port 8000, but someone misconfigured it. Which port should it be on?"

**Dicas:**
- "Standard HTTP APIs usually run on port 8000 or 8080" (fundo amarelo sutil)
- "Check the building labels" (fundo amarelo sutil)

**Entrada:** Dropdown (combobox) com opcoes:
- Select port... (placeholder)
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (Dev)
- 5432 (PostgreSQL)
- **8000 (API)** <-- resposta correta
- 8080 (Alt HTTP)

**Botao SUBMIT:** Desabilitado ate selecionar uma opcao. Ao clicar:
- Faz `POST /api/challenges/wrong-port/check` com `{ challenge_id: "wrong-port", answer: "8000" }`
- Se correto: caixa verde "CORRECT!" + explicacao + "+10 pts"
- Se errado: caixa vermelha "WRONG!" + explicacao

### 7.5 Desafio 2: "The Invasion" (20 pontos -- Medio)

**Pergunta:** "Malicious packets are attacking the database directly! Configure the firewall to block external traffic to port 5432."

**Entrada:** Dropdown com regras:
- Block external -> :5432 <-- aceita
- Block all -> :5432
- Allow only internal -> :5432 <-- aceita
- Block external -> :80

**Respostas corretas:** `block-external-5432` ou `allow-internal-5432`

### 7.6 Desafio 3: "DNS Down" (20 pontos -- Medio)

**Pergunta:** "DNS resolution is failing! Trace the DNS resolution path to find where it breaks."

**Entrada:** Campo de texto livre
- Placeholder: "Which DNS step fails? (1-4)"

**Respostas corretas:** `3` ou `docker-dns`

### 7.7 Desafio 4: "Protocol Race" (30 pontos -- Dificil)

**Pergunta:** "REST vs gRPC - which protocol delivers the response faster? Watch the packets race!"

**Entrada:** Dropdown com:
- REST (HTTP/1.1 + JSON)
- **gRPC (HTTP/2 + Protobuf)** <-- resposta correta

### 7.8 Feedback de Resultado

Apos submeter qualquer desafio, uma caixa de resultado aparece:

- **Correto:** Borda verde, fundo verde translucido, texto "CORRECT!" em verde, explicacao abaixo, "+N pts" embaixo
- **Errado:** Borda vermelha, fundo vermelho translucido, texto "WRONG!" em vermelho, explicacao abaixo

### 7.9 Sistema de Pontuacao

- A pontuacao e **acumulada localmente** no estado do componente
- Mostrada como "Score: N" no cabecalho
- Desafios ja resolvidos ganham borda verde e mostram os pontos obtidos na lista
- A pontuacao reseta ao recarregar a pagina (nao persiste no backend)

---

## 8. Stream SSE (Dados em Tempo Real)

Todas as interacoes acima sao alimentadas por um **stream de Server-Sent Events** que roda continuamente em background:

### 8.1 Conexao Automatica

- Ao carregar a pagina, o hook `useSSE` abre `EventSource('/api/packets/stream')`
- O indicador na sidebar muda para "SSE CONNECTED" em verde
- A partir desse momento, pacotes fluem automaticamente

### 8.2 Trafego Automatico (Background)

Mesmo **sem nenhuma interacao** do usuario, o backend envia pacotes a cada 2 segundos:
- Um probe HTTP ao gateway (api -> gateway)
- Um probe SQL ao banco (api -> database)

Isso garante que a cidade sempre tenha caminhoes animados se movendo.

### 8.3 Reconexao

Se a conexao SSE cair:
- O indicador muda para "DISCONNECTED" em vermelho
- Apos 3 segundos, tenta reconectar automaticamente
- Nao requer acao do usuario

### 8.4 Limite de Pacotes

- Maximo de **50 pacotes** mantidos em memoria
- Pacotes mais antigos sao descartados quando novos chegam
- A lista na sidebar mostra os 15 mais recentes

---

## Resumo: Tabela de Todos os Elementos Interativos

| # | Elemento | Localizacao | Tipo | Acao | Chamada API |
|---|----------|-------------|------|------|-------------|
| 1 | Campo de URL | Topo | Input texto | Digitar URL de destino | -- |
| 2 | Botao SEND | Topo-direita | Botao | Enviar requisicao | `POST /api/packets/send` |
| 3 | Preset "GET /api/health" | Topo | Botao | Preencher URL | -- |
| 4 | Preset "GET /api/ports" | Topo | Botao | Preencher URL | -- |
| 5 | Preset "GET /api/city/status" | Topo | Botao | Preencher URL | -- |
| 6 | Click em predio | Canvas | Canvas click | Abrir painel info | `GET /api/ports/{service}` |
| 7 | Hover em caminhao | Canvas | Canvas hover | Mostrar tooltip | -- |
| 8 | Botao FIREWALL | Rodape | Toggle | Ativar/desativar firewall | `POST /api/firewall/rules` |
| 9 | Botao TLS | Rodape | Toggle | Ativar/desativar TLS | `GET /api/tls/handshake` |
| 10 | Botao CHALLENGES | Rodape | Botao | Abrir modal de desafios | -- |
| 11 | Desafio (selecionar) | Modal | Botao | Abrir tela do desafio | -- |
| 12 | Botao Back | Modal desafio | Botao | Voltar a lista | -- |
| 13 | Dropdown/Input resposta | Modal desafio | Select/Input | Escolher resposta | -- |
| 14 | Botao SUBMIT | Modal desafio | Botao | Enviar resposta | `POST /api/challenges/{id}/check` |
| 15 | Botao X (fechar painel) | Painel info | Botao | Fechar painel do predio | -- |
| 16 | Botao X (fechar modal) | Modal desafio | Botao | Fechar challenges | -- |

---

## Fluxo Recomendado para Primeira Exploraacao

1. **Observe a cidade** -- Note os 4 predios, as estradas e os caminhoes se movendo automaticamente
2. **Leia a sidebar** -- Veja o indicador SSE conectado, as metricas e os pacotes fluindo
3. **Clique num predio** -- Explore as informacoes de cada servico e suas conexoes TCP
4. **Use a URL Bar** -- Selecione um preset e clique SEND. Observe o progresso e o caminhao novo na cidade
5. **Ative o Firewall** -- Veja como pacotes para o banco sao bloqueados e os caminhoes param com X vermelho
6. **Desative o Firewall e ative o TLS** -- Assista a animacao do handshake de 6 passos e as estradas ficarem douradas
7. **Abra os Challenges** -- Teste seus conhecimentos com os 4 desafios, acumulando pontos
