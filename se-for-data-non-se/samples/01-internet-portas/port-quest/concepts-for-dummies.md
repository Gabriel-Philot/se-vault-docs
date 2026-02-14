# PORT QUEST -- Conceitos para Dummies

Este arquivo explica **cada conceito** de redes, infraestrutura e engenharia de software que o Port Quest ensina, usando linguagem simples e analogias com a propria cidade do jogo. Nenhum conhecimento previo e necessario.

---

## Indice

1. [Portas de Rede](#1-portas-de-rede)
2. [Containers Docker](#2-containers-docker)
3. [Redes Docker (Bridge Networks)](#3-redes-docker-bridge-networks)
4. [Reverse Proxy e NAT Gateway](#4-reverse-proxy-e-nat-gateway)
5. [Firewall](#5-firewall)
6. [TLS e HTTPS](#6-tls-e-https)
7. [DNS (Domain Name System)](#7-dns-domain-name-system)
8. [Protocolos de Comunicacao](#8-protocolos-de-comunicacao)
9. [Estados de Conexao TCP](#9-estados-de-conexao-tcp)
10. [Server-Sent Events (SSE)](#10-server-sent-events-sse)
11. [Latencia](#11-latencia)
12. [Healthcheck](#12-healthcheck)

---

## 1. Portas de Rede

### O que e

Imagine um predio comercial com varias salas. O predio tem um unico endereco (ex: Rua X, numero 100), mas dentro dele existem salas diferentes: sala 80 e a recepcao, sala 3000 e o escritorio de design, sala 8000 e a contabilidade, sala 5432 e o arquivo morto.

Uma **porta de rede** funciona exatamente assim. Um computador (ou servidor) tem um unico endereco IP, mas pode ter **milhares de portas** (de 0 a 65535). Cada porta e como uma sala diferente dentro do mesmo predio -- cada servico "escuta" numa porta especifica esperando conexoes.

### No Port Quest

Cada predio da cidade tem um **numero brilhante** no topo:

| Predio | Porta | Por que esse numero? |
|--------|-------|---------------------|
| Command Center (frontend) | **:3000** | Porta padrao do Vite (servidor de desenvolvimento React) |
| City Gate (gateway) | **:80** | Porta padrao do protocolo HTTP. Quando voce acessa um site sem digitar porta, o navegador usa a 80 |
| City Hall (api) | **:8000** | Porta comum para APIs Python (FastAPI, Django) |
| Municipal Archive (database) | **:5432** | Porta padrao do PostgreSQL |

A **porta brilhante na base** de cada predio e uma metafora visual: assim como uma porta fisica e a entrada de um edificio, a porta de rede e a "entrada" por onde dados entram e saem de um servico.

### Por que isso importa

Se voce configurar um servico na porta errada, ninguem consegue se conectar a ele. E como se voce fosse ao andar 8000 de um predio procurar a contabilidade, mas ela mudou pro andar 9000 sem avisar ninguem. O Desafio 1 ("Wrong Port") do jogo explora exatamente isso.

### Portas famosas no mundo real

| Porta | Servico | Voce ja usou quando... |
|-------|---------|----------------------|
| 80 | HTTP | Acessou qualquer site sem "https" |
| 443 | HTTPS | Acessou qualquer site com cadeado |
| 22 | SSH | Conectou remotamente a um servidor Linux |
| 3306 | MySQL | Conectou a um banco MySQL |
| 5432 | PostgreSQL | Conectou a um banco Postgres |
| 6379 | Redis | Usou cache Redis |
| 27017 | MongoDB | Conectou a um banco Mongo |

---

## 2. Containers Docker

### O que e

Pense em **apartamentos mobiliados** dentro de um predio. Cada apartamento e completamente independente: tem sua propria cozinha, banheiro, moveis, chave. Voce pode montar um apartamento novo em minutos a partir de uma planta (blueprint), e desmonta-lo sem afetar os vizinhos.

Um **container Docker** e exatamente isso para software. E uma "caixinha" isolada que contem tudo que um programa precisa para rodar: codigo, bibliotecas, configuracoes, sistema operacional minimo. Voce pode criar, destruir e recriar containers em segundos.

### No Port Quest

Cada predio da cidade **e** um container Docker:

| Predio | Nome do Container | O que roda dentro |
|--------|-------------------|-------------------|
| Command Center | `command-center` | React + Vite (interface web) |
| City Gate | `city-gate` | Nginx (proxy reverso) |
| City Hall | `city-hall` | FastAPI (API Python) |
| Municipal Archive | `municipal-archive` | PostgreSQL 16 (banco de dados) |

Quando voce roda `docker compose up --build`, os 4 "predios" sao construidos e levantados. Quando roda `docker compose down`, a cidade inteira e demolida. Mas a "planta" (os Dockerfiles) continua la, pronta para reconstruir tudo identico.

### Por que isso importa

Sem containers, instalar uma aplicacao com 4 servicos significaria: instalar Python, instalar Node.js, instalar Nginx, instalar PostgreSQL, configurar cada um manualmente, torcer para que as versoes nao conflitem. Com Docker, voce roda **um comando** e tudo funciona igual em qualquer maquina.

### Analogia completa

| Conceito Docker | Analogia da Cidade |
|-----------------|-------------------|
| **Container** | Um predio individual |
| **Imagem** | A planta/blueprint do predio |
| **Dockerfile** | As instrucoes de construcao |
| **docker compose up** | "Construa e abra todos os predios" |
| **docker compose down** | "Feche e demolha todos os predios" |
| **Volume** | O cofre do arquivo morto (dados persistem mesmo se demolir o predio) |

---

## 3. Redes Docker (Bridge Networks)

### O que e

Numa cidade real, existem **bairros diferentes**. Moradores do mesmo bairro podem se visitar facilmente andando a pe. Mas para ir a outro bairro, voce precisa pegar um onibus que passe por ambos.

**Redes Docker** funcionam assim. Containers na mesma rede conseguem se "ver" e conversar diretamente usando nomes (como vizinhos que se chamam pelo nome). Containers em redes diferentes sao **invisiveis** um para o outro -- a menos que haja um intermediario conectado a ambas.

### No Port Quest

A cidade tem **2 bairros** (redes):

**city-public** (estradas azuis tracejadas):
- Command Center (frontend)
- City Gate (gateway)
- Acessivel pelo "mundo externo" (sua maquina)

**city-internal** (estradas amarelas tracejadas):
- City Gate (gateway)
- City Hall (api)
- Municipal Archive (database)
- **Nao** acessivel diretamente pelo mundo externo

Observe: o **City Gate (gateway) esta em ambas as redes**. Ele e o unico "predio" com acesso aos dois bairros. E como um onibus que transita entre bairros -- veremos isso no proximo topico.

### Por que isso importa

Separar redes e uma questao de **seguranca**. O banco de dados (Municipal Archive) contem dados sensiveis. Ele nao tem por que ser acessivel pela internet. Ao coloca-lo numa rede interna, garantimos que so quem esta "dentro do bairro" (a API e o gateway) pode acessar.

Se alguem mal-intencionado acessar a rede publica, ele so enxerga o frontend e o gateway. O banco e a API ficam escondidos atras do muro da `city-internal`.

### Detalhe tecnico simplificado

No `docker-compose.yml`:
- `ports: "80:80"` = "Abra a porta 80 do predio para a rua" (visivel do host)
- `expose: "8000"` = "A porta 8000 existe, mas so quem ta no bairro interno ve" (visivel apenas na rede Docker)

---

## 4. Reverse Proxy e NAT Gateway

### O que e um Reverse Proxy

Imagine a **recepcao** de um predio comercial. Voce nao entra direto na sala do diretor. Voce chega na recepcao, diz o que precisa, e a recepcionista encaminha voce ao andar correto. Se a sala mudar de lugar, a recepcionista sabe o novo endereco -- voce nem percebe a mudanca.

Um **reverse proxy** faz isso para requisicoes web. Ele fica na frente dos servicos reais e redireciona o trafego. O cliente so conhece o proxy; os servicos reais ficam escondidos.

### O que e um NAT Gateway

Agora imagine que o predio comercial tem **duas entradas**: uma pela rua principal (publica) e outra pelo estacionamento interno (privado). A recepcao e o unico ponto que conecta as duas. Quem vem pela rua so chega aos andares internos passando pela recepcao.

Um **NAT Gateway** e essa recepcao: o ponto de interseccao entre uma rede publica e uma rede privada.

### No Port Quest

O **City Gate (Nginx)** cumpre ambos os papeis:

**Como reverse proxy:**
- Voce acessa `localhost:80/api/health`
- O Nginx olha a URL, ve que comeca com `/api/`
- Encaminha a requisicao para `api:8000/health` (interno)
- Recebe a resposta e devolve pra voce
- Voce nunca soube que a API roda na porta 8000

**Como NAT Gateway:**
- E o unico container em ambas as redes (`city-public` + `city-internal`)
- Faz a ponte: o frontend (rede publica) fala com o gateway, que fala com a API (rede interna)
- Sem o gateway, o frontend e a API nao se enxergam

### Na cidade

Observe como as estradas (redes) se conectam:
```
Command Center ---[azul]--- City Gate ---[amarelo]--- City Hall
                                     ---[amarelo]--- Municipal Archive
```

O City Gate e literalmente o **portao da cidade** -- toda comunicacao entre o mundo externo e os servicos internos passa por ele.

### Por que isso importa

1. **Seguranca**: O mundo externo so conhece o gateway. Mesmo que o gateway seja comprometido, o atacante nao tem acesso direto ao banco
2. **Flexibilidade**: Se a API mudar de porta (de 8000 para 9000), basta atualizar o Nginx. Os clientes nao precisam saber
3. **Balanceamento**: Em producao, o reverse proxy pode distribuir requisicoes entre multiplas instancias da API

---

## 5. Firewall

### O que e

Um firewall e o **seguranca na portaria** de um condominio. Ele tem uma lista de regras: "moradores podem entrar" (ALLOW), "entregadores so ate a recepcao" (ALLOW com restricao), "vendedores ambulantes nao entram" (BLOCK).

Cada pacote de dados que tenta entrar ou sair e **verificado** contra essas regras. Se bater com uma regra de bloqueio, o pacote e descartado. Se nao bater com nenhuma regra, depende da politica padrao (geralmente bloquear).

### No Port Quest

Quando voce clica no botao **FIREWALL** na barra inferior:

**Ativando:**
1. O backend cria uma regra automatica: `BLOCK * -> database:5432`
2. Isso significa: "Bloqueie QUALQUER trafego destinado ao banco de dados na porta 5432"
3. Na cidade, aparece uma borda vermelha tracejada pulsante com "FIREWALL ACTIVE"
4. Caminhoes que tentam chegar ao Municipal Archive **param no meio da estrada** e exibem um X vermelho
5. O indicador mostra quantos pacotes foram bloqueados

**Desativando:**
1. Todas as regras sao removidas
2. Caminhoes voltam a fluir normalmente
3. A borda vermelha desaparece

### O que o caminhao parado significa

Quando um caminhao para no meio da estrada e fica oscilando, isso representa um **pacote bloqueado**. Na vida real, isso significa que o pacote de dados foi recebido pela rede, mas o firewall o descartou antes de chegar ao destino. O remetente eventualmente recebe um timeout (ou um "connection refused").

### Por que isso importa

O Desafio 2 ("The Invasion") simula um cenario real: alguem tentando acessar o banco de dados **diretamente**, sem passar pela API. Na vida real:

- Bancos de dados **nunca** devem ser expostos a internet
- Mesmo na rede interna, firewalls podem restringir quem pode acessar o que
- Uma regra como "so a API pode acessar o banco" evita que um servico comprometido acesse dados diretamente

### Analogia completa

| Conceito | Na Cidade |
|----------|-----------|
| Regra BLOCK | "Proibido entrar no Municipal Archive" |
| Regra ALLOW | "Entrada liberada para City Hall" |
| Pacote bloqueado | Caminhao parado com X vermelho |
| Pacote permitido | Caminhao que chega ao destino normalmente |
| Firewall ativo | Borda vermelha pulsante na cidade |

---

## 6. TLS e HTTPS

### O que e TLS

Imagine que voce quer enviar uma carta secreta para alguem. Se usar o correio normal, qualquer carteiro pode abrir e ler. Entao voce e o destinatario combinam um sistema:

1. Voce pede a chave publica do destinatario (como um cadeado aberto)
2. O destinatario envia o cadeado aberto junto com um certificado provando quem ele e
3. Voce tranca a carta com esse cadeado
4. So o destinatario tem a chave que abre o cadeado
5. A partir dai, ambos usam uma chave secreta compartilhada para trocar mensagens rapido

Isso e o **TLS** (Transport Layer Security). O **HTTPS** e simplesmente HTTP (navegacao web normal) + TLS (criptografia). Quando voce ve o cadeado no navegador, TLS esta ativo.

### O Handshake TLS 1.3 no Port Quest

Quando voce clica no botao **TLS**, uma animacao mostra os 6 passos do handshake:

**Passo 1 -- Client Hello** (Ola, servidor!)
- O cliente (navegador) diz: "Oi! Eu falo TLS 1.2 e 1.3. Minhas cifras favoritas sao AES-256 e ChaCha20. Aqui esta um numero aleatorio."
- E como se apresentar e dizer quais idiomas voce fala.

**Passo 2 -- Server Hello** (Ola, cliente!)
- O servidor responde: "Vamos usar TLS 1.3 com a cifra TLS_AES_256_GCM_SHA384. Aqui esta meu numero aleatorio."
- E como escolher o idioma que ambos falam melhor.

**Passo 3 -- Certificate** (Aqui esta meu RG)
- O servidor envia seu **certificado digital** -- um documento assinado por uma autoridade confiavel que prova "eu sou realmente o servidor X".
- E como mostrar sua carteira de identidade autenticada em cartorio.

**Passo 4 -- Certificate Verify** (Provando que o RG e meu)
- O servidor assina um hash da conversa ate agora usando sua **chave privada**. O cliente verifica essa assinatura usando a chave publica do certificado.
- E como assinar algo na frente da pessoa para provar que o RG e seu e nao roubado.

**Passo 5 -- Key Derivation** (Criando a chave secreta compartilhada)
- Usando matematica (Diffie-Hellman sobre curvas elipticas -- ECDHE), ambos os lados calculam **a mesma chave secreta** sem jamais envia-la pela rede.
- E como dois magicos que, cada um de um lado do palco, criam a mesma carta sem se comunicar. Qualquer um que observe a conversa nao consegue descobrir a chave.

**Passo 6 -- Finished** (Tudo pronto!)
- Ambos enviam um MAC (codigo de autenticacao) sobre toda a conversa para confirmar que ninguem adulterou nada.
- A partir daqui, tudo e criptografado. A conversa e segura.

### Na cidade

- **Antes do TLS**: Estradas amarelas tracejadas, caminhoes "pelados" (dados visiveis)
- **Depois do TLS**: Estradas **douradas solidas com brilho**, caminhoes com **cadeado dourado** acima, predios com emoji de cadeado

A mudanca visual e proposital: dados criptografados "brilham" diferente de dados em texto puro. Na vida real, se alguem interceptar trafego HTTPS, so vera caracteres aleatorios inuteis.

### Por que isso importa

Sem TLS:
- Senhas viajam em texto puro pela rede
- Qualquer intermediario pode ler seus dados
- Ataques "man-in-the-middle" sao triviais

Com TLS:
- Tudo e criptografado entre origem e destino
- Mesmo que alguem intercepte, nao consegue ler
- O certificado garante que voce esta falando com o servidor certo (e nao um impostor)

---

## 7. DNS (Domain Name System)

### O que e

Voce lembra o telefone de todos seus amigos de cor? Provavelmente nao -- voce salva na agenda com o **nome** e o telefone aparece automaticamente quando voce busca o nome.

O **DNS** e a "agenda de contatos" da internet. Computadores se comunicam usando enderecos IP numericos (como `172.21.0.2`), mas humanos preferem nomes (como `google.com`). O DNS traduz nomes em numeros.

### Como funciona a resolucao DNS normal (7 passos)

Quando voce digita `google.com` no navegador:

1. **Cache do navegador** -- "Eu ja procurei isso recentemente?" Se sim, usa o IP guardado. Se nao...
2. **Cache do sistema operacional** -- "O Windows/Linux ja sabe?" Verifica `/etc/hosts` e o cache do OS. Se nao...
3. **Servidor DNS local** -- Pergunta ao DNS configurado (ex: 8.8.8.8 do Google ou o DNS do seu provedor). Se nao sabe...
4. **Root Server** -- Pergunta a um dos 13 servidores raiz: "Quem cuida do `.com`?" Resposta: "Pergunte ao servidor TLD tal."
5. **TLD Server** -- Pergunta ao servidor do `.com`: "Quem cuida do `google.com`?" Resposta: "Pergunte ao servidor autoritativo tal."
6. **Authoritative NS** -- Pergunta ao servidor que realmente controla `google.com`: "Qual o IP?" Resposta: "142.250.x.x"
7. **Resposta final** -- O IP e retornado ao navegador e guardado em cache com um TTL (tempo de vida, tipo "valido por 1 hora").

### DNS Docker -- O atalho interno (4 passos)

Dentro do mundo Docker, existe um truque: o Docker tem um **servidor DNS embutido** no endereco `127.0.0.11`. Containers podem se chamar pelo nome do servico (como `api`, `database`, `gateway`) e o Docker resolve automaticamente para o IP interno.

1. **Cache do navegador** -> MISS
2. **Cache do OS / /etc/hosts** -> MISS
3. **Docker DNS (127.0.0.11)** -> HIT! `api` = `172.21.0.2`
4. **IP retornado** -> Resolvido!

Sao so 4 passos porque o Docker DNS ja sabe todos os IPs dos containers na mesma rede.

### No Port Quest

O endpoint `GET /api/dns/resolve/{nome}` simula essa resolucao passo a passo. Para nomes de containers (api, database), usa o caminho curto de 4 passos. Para nomes externos (google.com), simula a cadeia completa de 7 passos.

O Desafio 3 ("DNS Down") pede para voce identificar **em qual passo** a resolucao falha. A resposta e o passo 3 (Docker DNS), porque se o DNS do Docker cair, os containers nao conseguem resolver nomes internos -- e ai o `gateway` nao encontra o `api`, mesmo que ambos estejam na mesma rede.

### Por que isso importa

- Sem DNS, voce teria que decorar IPs numericos para acessar qualquer site
- No mundo Docker, sem o DNS embutido, voce teria que usar IPs fixos dos containers -- mas esses IPs podem mudar cada vez que um container reinicia
- DNS e tao fundamental que quando cai, a internet "inteira" parece offline (mesmo que todos os servidores estejam funcionando)

---

## 8. Protocolos de Comunicacao

### O que e um protocolo

Um **protocolo** e um conjunto de regras para comunicacao. Quando voce liga para alguem, existe um "protocolo" implicito: voce diz "alo", a pessoa responde, voce fala, espera a resposta, e no final diz "tchau". Se um fala em portugues e outro em chines, a comunicacao nao funciona -- precisam usar o mesmo protocolo.

### Protocolos no Port Quest

A cidade usa **5 protocolos** diferentes, cada um com uma cor de caminhao:

#### HTTP (ciano -- azul claro)

- **O que e:** HyperText Transfer Protocol -- o protocolo da web
- **Como funciona:** Cliente pede ("GET /pagina"), servidor responde com o conteudo
- **Versao:** HTTP/1.1 (uma requisicao por vez por conexao) ou HTTP/2 (multiplas em paralelo)
- **Na cidade:** Os caminhoes cianos viajam entre o frontend, gateway e API
- **Analogia:** Como enviar uma carta e esperar a resposta pelo correio

#### SQL (laranja)

- **O que e:** Structured Query Language -- a linguagem dos bancos de dados
- **Como funciona:** A aplicacao envia uma query ("SELECT * FROM users"), o banco executa e retorna os dados
- **Na cidade:** Caminhoes laranjas viajam entre City Hall (API) e Municipal Archive (banco)
- **Analogia:** Como ir ao arquivo morto e pedir um documento especifico

#### SSE (verde)

- **O que e:** Server-Sent Events -- streaming de dados do servidor para o cliente
- **Como funciona:** O cliente abre uma conexao que fica aberta. O servidor envia dados quando tem novidade, sem o cliente precisar perguntar repetidamente
- **Na cidade:** O stream que alimenta a sidebar de metricas e as animacoes dos caminhoes
- **Analogia:** Como assinar um jornal -- voce nao vai a banca todo dia, o jornal chega na sua porta quando tem edicao nova

#### gRPC (rosa)

- **O que e:** Google Remote Procedure Call -- protocolo de alta performance
- **Como funciona:** Usa HTTP/2 (multiplexacao) e Protocol Buffers (serializacao binaria compacta) em vez de JSON (texto)
- **Na cidade:** Aparece no Desafio 4 como alternativa mais rapida ao REST
- **Analogia:** Enquanto REST e como enviar cartas escritas a mao (texto legivel), gRPC e como enviar mensagens em codigo Morse (compacto, rapido, mas precisa de decodificador)

#### DNS (amarelo)

- **O que e:** Resolucao de nomes (explicado na secao anterior)
- **Na cidade:** Caminhoes amarelos representam consultas DNS

### REST vs gRPC (Desafio 4)

| Aspecto | REST (HTTP/1.1 + JSON) | gRPC (HTTP/2 + Protobuf) |
|---------|----------------------|------------------------|
| **Formato dos dados** | JSON (texto legivel) | Protocol Buffers (binario compacto) |
| **Transporte** | HTTP/1.1 (uma req por vez) | HTTP/2 (multiplas em paralelo) |
| **Tamanho dos pacotes** | Maior (texto + chaves repetidas) | Menor (binario otimizado) |
| **Velocidade** | Mais lento | **Mais rapido** |
| **Facilidade de debug** | Facil (basta ler o JSON) | Dificil (binario nao e legivel) |
| **Uso tipico** | APIs publicas, frontend<->backend | Comunicacao entre microsservicos |

---

## 9. Estados de Conexao TCP

### O que e TCP

**TCP** (Transmission Control Protocol) e o protocolo que garante entrega confiavel de dados. Antes de enviar qualquer coisa, origem e destino fazem um "handshake de 3 vias" para estabelecer a conexao. Depois, cada pacote enviado e confirmado ("recebi!"). Se um pacote se perder, e reenviado.

### Os 4 estados no Port Quest

Quando voce clica num predio e abre o painel de informacoes, a secao "Active Connections" mostra conexoes como a saida do comando `ss` (ferramenta Linux que lista sockets). Cada conexao esta num **estado**:

#### LISTEN (verde)

```
O servico esta com a porta aberta, esperando conexoes.
```
- **Analogia:** Uma loja aberta com a placa "ABERTO" na vitrine, esperando clientes
- **No Port Quest:** Significa que o servico esta rodando e pronto para receber requisicoes
- **Exemplo:** `LISTEN api:8000` = A API esta escutando na porta 8000

#### ESTABLISHED (ciano)

```
Uma conexao ativa existe entre dois servicos. Dados estao fluindo.
```
- **Analogia:** Um cliente entrou na loja e esta sendo atendido. A conversa esta em andamento.
- **No Port Quest:** Os caminhoes em movimento representam dados fluindo em conexoes ESTABLISHED
- **Exemplo:** `ESTABLISHED api:8000 gateway:80` = A API e o gateway estao trocando dados ativamente

#### TIME_WAIT (laranja)

```
A conexao foi encerrada, mas o sistema espera um tempo antes de limpar.
```
- **Analogia:** O cliente foi embora, mas a loja espera 2 minutos antes de "esquecer" o atendimento -- caso o cliente volte dizendo "esqueci de pegar meu troco"
- **Tecnicamente:** O TCP espera 2x o MSL (Maximum Segment Lifetime, tipicamente 60s) para garantir que pacotes "perdidos" do encerramento anterior nao sejam confundidos com uma nova conexao
- **No Port Quest:** Conexoes que acabaram mas ainda nao desapareceram do painel

#### CLOSE_WAIT (vermelho)

```
O outro lado da conexao fechou, mas a aplicacao local ainda nao fechou a sua parte.
```
- **Analogia:** O cliente foi embora e fechou a porta, mas o lojista ainda nao percebeu e continua falando sozinho
- **Sinal de problema:** Muitas conexoes em CLOSE_WAIT geralmente indicam um bug -- a aplicacao nao esta fechando sockets corretamente, gerando "vazamento" de conexoes
- **No Port Quest:** Mostrado em vermelho justamente para chamar atencao como potencial problema

### Ciclo de vida simplificado

```
     Cliente quer conectar
            |
            v
    [LISTEN] (servidor esperando)
            |
   3-way handshake (SYN, SYN-ACK, ACK)
            |
            v
    [ESTABLISHED] (dados fluindo)
            |
    um dos lados encerra (FIN)
            |
            v
    [TIME_WAIT] ou [CLOSE_WAIT]
            |
    timeout expira
            |
            v
    (conexao removida)
```

---

## 10. Server-Sent Events (SSE)

### O que e

Normalmente na web, a comunicacao e "pedido-resposta": o cliente pergunta, o servidor responde. Se o cliente quer novidades, precisa ficar perguntando repetidamente ("polling"). Isso e como ligar para a pizzaria a cada 30 segundos perguntando "minha pizza ficou pronta?".

**SSE** e diferente: o cliente abre uma conexao que **fica aberta**. O servidor empurra dados quando tem novidade. E como se a pizzaria ligasse para voce quando a pizza ficasse pronta, em vez de voce ficar ligando.

### Comparacao com alternativas

| Abordagem | Como funciona | Analogia |
|-----------|---------------|----------|
| **Polling** | Cliente pergunta a cada X segundos | Ligar na pizzaria toda hora |
| **Long Polling** | Cliente pergunta, servidor segura a resposta ate ter novidade | Ligar e ficar na linha ate a pizza ficar pronta |
| **SSE** | Servidor empurra dados quando quer (unidirecional) | A pizzaria liga pra voce |
| **WebSocket** | Ambos podem enviar dados a qualquer momento (bidirecional) | Walkie-talkie entre voce e a pizzaria |

### Por que SSE e nao WebSocket?

O Port Quest usa SSE porque o fluxo de dados e **unidirecional**: o servidor envia pacotes, o cliente apenas recebe e exibe. Nao ha necessidade do cliente enviar dados pelo stream. SSE e mais simples, funciona sobre HTTP padrao, e e mais facil de rotear atraves de um reverse proxy como Nginx.

### No Port Quest

O indicador "SSE CONNECTED" (verde) na sidebar mostra que o stream esta ativo. A cada 2 segundos, o backend envia automaticamente:
- Um pacote HTTP (api -> gateway) = probe de saude
- Um pacote SQL (api -> database) = probe de saude

Esses pacotes geram os caminhoes animados na cidade. Quando voce envia uma requisicao pela URL Bar, o pacote extra tambem aparece no stream.

Se o stream cair, o indicador fica "DISCONNECTED" (vermelho) e o hook tenta reconectar em 3 segundos. Ate 50 pacotes sao mantidos em memoria; os mais antigos sao descartados.

### Detalhe tecnico: por que precisa de configuracao especial no Nginx

O Nginx, por padrao, **bufferiza** respostas -- ele acumula dados antes de enviar ao cliente para ser mais eficiente. Mas para SSE, isso e fatal: os dados ficam presos no buffer e nunca chegam ao cliente em tempo real.

Por isso, a configuracao do Nginx inclui:
- `proxy_buffering off` -- desliga o buffer
- `proxy_read_timeout 86400s` -- nao fecha a conexao por 24 horas
- `proxy_set_header Connection ''` -- permite keep-alive

Sem essas configs, o stream SSE simplesmente para de funcionar.

---

## 11. Latencia

### O que e

**Latencia** e o tempo que um pacote leva para ir de A a B. E medida em milissegundos (ms). Pense como o tempo entre voce gritar "oi!" e ouvir o eco.

### No Port Quest

- A **sidebar** mostra um grafico de latencia em tempo real (sparkline ciano)
- Cada pacote na lista mostra sua latencia individual (ex: "1.45ms")
- A **URL Bar** mostra o tempo total da requisicao apos clicar SEND (ex: "433ms")

Latencias tipicas na cidade:
- **SQL** (api -> database): ~0.5-1ms (muito rapido, mesma rede interna Docker)
- **HTTP** (api -> gateway): ~1-2ms (rapido, mesma rede)
- **Requisicao completa** (browser -> gateway -> api -> db): ~400-500ms (inclui 400ms de delay visual artificial)

### Contexto do mundo real

| Latencia | Percepcao | Exemplo |
|----------|-----------|---------|
| < 1ms | Instantaneo | Comunicacao entre containers Docker na mesma maquina |
| 1-10ms | Imperceptivel | Rede local (LAN) |
| 10-50ms | Rapido | Servidor no mesmo pais |
| 50-150ms | Aceitavel | Servidor em outro continente |
| 150-300ms | Notavel | Conexao via satelite |
| > 300ms | Lento | Multiplos saltos, conexao ruim |
| > 1000ms | Frustrante | Timeout iminente |

---

## 12. Healthcheck

### O que e

Um **healthcheck** e como um medico que visita um paciente de tempos em tempos para ver se esta tudo bem. Se o paciente nao responder, algo esta errado e e preciso agir.

### No Port Quest

Existem **3 niveis** de healthcheck:

**1. Healthcheck do Docker Compose (banco de dados)**
```yaml
healthcheck:
    test: ["CMD-SHELL", "pg_isready -U portquest"]
    interval: 5s
```
- A cada 5 segundos, o Docker roda `pg_isready` dentro do container do banco
- Se falhar 5 vezes seguidas, o container e marcado como "unhealthy"
- A API so inicia depois que o banco esta "healthy" (`condition: service_healthy`)

**2. Healthcheck do Nginx (gateway)**
```
GET /health -> {"status": "ok", "service": "city-gate"}
```
- Um endpoint simples que retorna "estou vivo"
- O `packet_monitor` do backend chama isso a cada 2 segundos

**3. Probe do packet_monitor (monitoramento ativo)**
- A cada 2 segundos, a API faz:
  - `GET http://gateway:80/health` (testa o Nginx)
  - `SELECT 1` no banco (testa o PostgreSQL)
- Esses probes geram os caminhoes que voce ve se movendo mesmo sem interagir
- Se algum probe falhar, o status do predio muda de verde para vermelho

### Na cidade

O **ponto colorido** ao lado de cada predio e o resultado do healthcheck:
- **Verde** = running, saudavel
- **Vermelho** = error, nao respondendo

---

## Como Tudo se Conecta

Aqui esta o panorama completo de como todos os conceitos se entrelaçam numa unica requisicao:

```
Voce digita http://api:8000/health e clica SEND

1. [DNS] O navegador resolve "api" -> Docker DNS -> 172.21.0.2

2. [PORTA] A requisicao vai para a porta 8000

3. [PROTOCOLO] Usa HTTP para comunicar

4. [CONTAINER] O container "city-hall" recebe a requisicao

5. [REDE] A requisicao viajou pela rede city-internal

6. [REVERSE PROXY] Na verdade passou pelo gateway primeiro
   (frontend -> gateway:80 -> api:8000)

7. [FIREWALL] Se ativo, verifica se a regra permite esse trafego

8. [TLS] Se ativo, toda essa comunicacao esta criptografada

9. [TCP] A conexao entre os servicos esta no estado ESTABLISHED

10. [SSE] O pacote e publicado no stream para atualizar a UI

11. [LATENCIA] O tempo de ida e volta e medido e exibido

12. [HEALTHCHECK] A API so esta la para responder porque
    passou no healthcheck na inicializacao
```

Cada caminhao que voce ve cruzando a cidade representa essa cadeia inteira acontecendo em milissegundos.
