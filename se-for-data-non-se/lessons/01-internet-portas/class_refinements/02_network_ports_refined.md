# Portas de Rede: As Portas Lógicas (Fundamentos)

Este documento serve como base fundamental antes de entrarmos em Segurança. É impossível blindar uma casa se você não sabe onde ficam as portas e janelas.

---

## 📋 Tabela Diagnóstica (vs. Fontes Originais)

| Seção | Veredicto | Detalhe |
|:------|:---------:|:--------|
| §1 Conceito | ✅ | Excelente analogia do prédio |
| §1 IANA/Faixas | ✅ | Correto |
| §2 Origem dos números | ✅ | Histórias precisas |
| §3 Mecânica da Conexão | 🔵 | Adicionado: estados TCP (`LISTEN`, `ESTABLISHED`, `TIME_WAIT`) |
| §4 Cheat Sheet | ✅ | Muito prático |
| §5 Devo decorar? | ✅ | Excelente reflexão |
| **Socket (IP:Port)** | 🟡→✅ | **Adicionado** — conceito fundamental ausente |
| **Ephemeral Ports (detalhe)** | 🟡→✅ | **Adicionado** — lado cliente da conexão |
| **Checkpoint** | 🟡→✅ | **Adicionado** |
| **Aplicação Imediata** | 🟡→✅ | **Adicionado** |

---

## 1. O Conceito: Por que Portas existem?

Imagine um servidor potente na AWS. Ele é um prédio gigante (identificado pelo **Endereço IP**).
Dentro desse prédio, existem milhares de salas comerciais.
*   Na sala 5432, trabalha a equipe do Postgres.
*   Na sala 443, trabalha a equipe do Site Seguro.
*   Na sala 22, trabalha o Zelador do prédio (SSH).

Se os pacotes de dados chegassem no prédio e só tivessem o IP, o porteiro não saberia para qual sala enviar a encomenda. A **Porta (Port)** resolve esse problema de endereçamento interno.

### O Conceito de Socket: IP + Port

A porta sozinha não identifica uma conexão. O que identifica é o **Socket** — a combinação de IP + Porta:

```
Socket = IP : Porta
Exemplo: 192.168.1.10:5432  →  "PostgreSQL naquela máquina específica"
```

Uma conexão TCP completa é identificada por **dois sockets** (origem e destino):

```
Conexão = Socket Origem ↔ Socket Destino
          192.168.1.5:49832 ↔ 52.22.33.44:5432
          (seu notebook)       (RDS Postgres)
```

> **Por que importa?** Quando você vê `ECONNREFUSED 10.0.1.55:5432`, você sabe que o endereço **completo** (IP + porta) é o que precisa debugar. Talvez o IP esteja certo mas o Postgres não está escutando naquela porta.

### A História e o Padrão (IANA)

Quem organizou a bagunça foi a **IANA (Internet Assigned Numbers Authority)** na década de 70. Eles dividiram as **65.535** portas disponíveis em categorias:

1.  **System Ports (0-1023):** As "nobres" e históricas. Exigem permissão de `root` para rodar.
2.  **User Ports (1024-49151):** Onde vivem os bancos de dados e aplicações corporativas modernas.
3.  **Dynamic/Ephemeral Ports (49152-65535):** Temporárias, usadas pelo seu sistema operacional.

### Portas Efêmeras: O Lado que Ninguém Fala

Quando você abre o browser e acessa `google.com:443`, a porta do destino é 443. Mas qual é a porta **da sua máquina** nessa conexão?

O sistema operacional escolhe automaticamente uma **porta efêmera** (ephemeral port) do range dinâmico:

```
Sua máquina:49832  →───→  Google:443
(porta efêmera)           (porta fixa)
```

*   Cada nova conexão recebe uma porta efêmera diferente.
*   É por isso que você pode ter 50 abas do Chrome — cada uma usa uma porta efêmera diferente para o mesmo destino.
*   Quando a conexão fecha, a porta é devolvida ao pool.

```bash
# Veja as portas efêmeras em uso agora:
ss -tn | head -20
# A coluna "Local Address" mostra IP:PORTA_EFÊMERA
# A coluna "Peer Address" mostra IP:PORTA_SERVIÇO
```

---

## 2. A Origem dos Números: Por que 80? Por que 22?

Você pediu "o porquê" dos números. A verdade é que muitos são uma mistura de necessidade técnica, piadas internas e arbitrariedade burocrática.

### Porta 22 (SSH): "Entre o FTP e o Telnet"

Essa é a história mais famosa. Em 1995, Tatu Ylönen criou o SSH para substituir o inseguro **Telnet (Porta 23)** e o **FTP (Porta 21)**.
*   Ele queria que o SSH fosse o substituto natural para esses dois.
*   Ele olhou para a lista e viu que a **Porta 22** estava livre.
*   Era poeticamente perfeito: **22** está exatamente entre **21** e **23**. Ele mandou um email para a IANA e conseguiu o registro em 24h.

### Porta 80 (HTTP) e 443 (HTTPS)

*   **Porta 80:** Tim Berners-Lee (criador da Web) escolheu a 80 nos anos 90. Na época, "80" era uma alternativa comum em sistemas Unix para serviços "www" não-privilegiados, herança de protocolos anteriores. Não tem um significado místico, foi uma convenção que pegou.
*   **Porta 443:** Quando a segurança (SSL) foi inventada, a Kipp E.B. (fundador da Netscape) pediu a 443 para a IANA simplesmente porque estava livre no bloco "baixo" (System Ports) e eles queriam diferenciar tráfego seguro do inseguro.

### Bancos de Dados (5432, 3306...)

Aqui reina a burocracia ou a piada interna.
*   **Postgres (5432):** Não há registro oficial do "porquê", mas especula-se ser uma brincadeira com os números (5-4-3-2...).
*   **MySQL (3306):** Simplesmente designada pela IANA baseada na solicitação do Monty Widenius (criador do MySQL).
*   **Redis (6379):** Essa é legal. **6379** soletra "MERZ" num teclado telefônico antigo (T9). "Merz" era o codinome de um personagem (Alessia Merz) que o criador do Redis gostava.

---

## 3. A Mecânica da Conexão

Quando você roda um comando `psql -h meu-banco -p 5432`, o que acontece?

1.  **Bind:** O processo do Postgres avisa o Linux: "Reserve a porta 5432 pra mim".
2.  **Listen:** O Postgres fica ouvindo.
3.  **Connect:** Seu cliente bate na porta.
    *   **Porta Fechada (Connection Refused):** O prédio existe, mas **ninguém está na sala 5432** (o processo caiu ou não subiu).
    *   **Porta Filtrada (Timeout):** O prédio existe, a sala está cheia, mas o **porteiro (Firewall)** proibiu você de entrar no saguão.

### Estados TCP de uma Conexão (Detalhamento)

Uma conexão TCP passa por **estados** que você encontra ao debugar com `ss` ou `netstat`:

```
Cliente                           Servidor
   │                                  │
   │                          LISTEN  │  ← Esperando conexões
   │──── SYN ────────────────────→│   │
   │                    SYN_RECEIVED  │
   │←──── SYN-ACK ──────────────│    │
   │  ESTABLISHED                     │
   │──── ACK ────────────────────→│   │
   │                     ESTABLISHED  │  ← Ambos conectados
   │                                  │
   │  ... troca de dados ...          │
   │                                  │
   │──── FIN ────────────────────→│   │
   │  FIN_WAIT_1                      │
   │←──── ACK ──────────────────│    │
   │  FIN_WAIT_2            CLOSE_WAIT│
   │←──── FIN ──────────────────│    │
   │  TIME_WAIT             LAST_ACK  │
   │──── ACK ────────────────────→│   │
   │                         CLOSED   │
   │  (espera 2*MSL)                  │
   │  CLOSED                          │
```

**Estados que você mais encontra na prática:**

| Estado | Significado | Quando debugar? |
|:-------|:------------|:----------------|
| `LISTEN` | Serviço esperando conexões | Se não aparece: o serviço não subiu |
| `ESTABLISHED` | Conexão ativa | Normal — dados trafegando |
| `TIME_WAIT` | Conexão fechou, esperando cleanup | Muitos = possível leak de conexões |
| `CLOSE_WAIT` | Servidor não fechou o socket dele | **Bug na aplicação** — não está fechando conexões |

> **Dica prática:** Se você vê milhares de `TIME_WAIT` para a porta do seu banco de dados, seu connection pool provavelmente está mal configurado — está abrindo e fechando conexões em excesso.

---

## 4. O Cheat Sheet Definitivo de Portas

Para consultas rápidas no dia a dia.

### Acesso e Administração
| Porta | Nome | Por que essa porta? / Nota | Dica de Segurança |
| :--- | :--- | :--- | :--- |
| **22** | SSH | Fica entre FTP(21) e Telnet(23). | **CRÍTICO:** Nunca exponha para 0.0.0.0/0. |
| **3389** | RDP | Padrão Microsoft. | Alvo #1 de Ransomware. Use VPN. |

### Web e Transferência
| Porta | Nome | Por que essa porta? / Nota | Dica de Segurança |
| :--- | :--- | :--- | :--- |
| **80** | HTTP | Padrão da Web (World Wide Web). | Redirecione para 443. |
| **443** | HTTPS | HTTP Seguro (Secure). | Padrão obrigatório hoje. |
| **21** | FTP | Padrão antigo de transferência. | Inseguro (senhas em texto plano). |

### Bancos de Dados
| Porta | Nome | Origem/Detalhe | Dica de Segurança |
| :--- | :--- | :--- | :--- |
| **5432** | PostgreSQL | Sequencial (5-4-3-2). | Padrão DE. |
| **3306** | MySQL | Designado pela IANA. | - |
| **6379** | Redis | Teclado T9 para "MERZ". | Redis não tem senha por padrão! Cuidado. |
| **27017** | MongoDB | Padrão da IANA. | - |

### Big Data & Engenharia de Dados
| Porta | Nome | Contexto | Uso |
| :--- | :--- | :--- | :--- |
| **4040** | Spark UI | Porta web sequencial (4040, 4041...). | Monitorar jobs ativos. |
| **18080**| Spark Hist. | Variação da 8080 (Web padrão). | Logs históricos. |
| **9092** | Kafka | Padrão do projeto Kafka. | Brokers (Plaintext). |
| **8888** | Jupyter | Repetição de 8s (lido visualmente). | Notebooks locais. |
| **8080** | Airflow | Porta Web genérica (alternativa à 80). | Webserver do Airflow. |

### Resumo das Faixas (Ranges)
| Faixa | Nome | Descrição |
| :--- | :--- | :--- |
| **0 - 1023** | **System Ports** | Reservadas para serviços raiz (HTTP, SSH). Exigem `root`. |
| **1024 - 49151** | **User Ports** | Serviços registrados (Bancos de dados, Big Data). Onde trabalhamos. |
| **49152 - 65535** | **Dynamic Ports** | Temporárias para clientes (Ephemeral). O browser/OS usa para conectar no servidor. |

---

## 5. Devo decorar todas as portas?

A resposta curta é: **Não**.

A resposta longa é que esse conhecimento é o que marca a sua transição de um **executor de configurações** para um **engenheiro de verdade**.
Em um mundo com IAs, livros e documentação infinita, saber **identificar padrões** e ter senso crítico é muito mais importante do que memorizar tabelas. Esse alicerce cria as **raízes e fundamentos** que permitem que, ao encontrar um território desconhecido, você faça as perguntas certas para destravar a investigação e desbloquear a solução por puro instinto técnico.

**O cenário real não é um tutorial:**
Na vida real, ninguém te entrega um manual dizendo *"Abra a porta 6333"*.
O que acontece é: *"Precisamos subir essa ferramenta nova de IA, mas ela não conecta"*.

**A Intuição de Engenharia em ação:**
Se você tem os fundamentos (aquela "root layer" na sua cabeça), você automaticamente mapeia o terreno desconhecido usando conceitos conhecidos (terrenos próximos):
1.  *"Se isso é um banco de dados, ele deve ouvir em uma porta fixa."* (Você vai procurar isso na docs ou no `docker-compose.yml`).
2.  *"Se ele fala JSON, deve ser HTTP. Se fala binário rápido, deve ser algo tipo gRPC."*
3.  *"Quais são os canais (portas) que essa ferramenta usa? Será que é uma porta alta bloqueada no meu firewall?"*
4.  *"Quais portas são boas para Dev e quais para Prod?"*

Você deixa de ser um "executor de configurações" e vira um **Engenheiro de Sistemas**. Você sabe que a porta **tem** que existir, e sabe onde procurá-la, porque entendeu a lógica por trás da internet, não apenas decorou a tabela.

---

### 💡 Resumo: A Lógica da Investigação

1.  **Encontrar a Porta:** Se é um serviço (DB, API), ele *escuta* em algum lugar. Procure o `EXPOSE` no Docker ou `port:` na documentação.
2.  **Identificar o Protocolo:** JSON/Texto geralmente é HTTP (Portas 80/443/8080). Binário/Rápido geralmente é gRPC ou porta específica do DB.
3.  **Checar Bloqueios:** Se não conecta, o firewall pode estar barrando portas altas ou específicas.
4.  **Dev vs Prod:** Use portas altas (>1024) para evitar permissões de root em Dev; use portas padrão (80/443) em Prod para facilitar o acesso do usuário final.

---

## 🧠 Checkpoint: Teste seu Entendimento

1.  **O que é um Socket?** Se alguém te perguntar "qual Socket o Postgres está usando?", como você responderia?
2.  **Um servidor tem o Postgres na porta 5432 e o Redis na 6379. Quantos IPs esse servidor precisa?** Por quê?
3.  **Seu script Python conecta no banco e você vê 500 conexões em estado `CLOSE_WAIT` no `ss`. O que provavelmente está errado?** É um problema de rede ou de código?
4.  **Por que portas abaixo de 1024 exigem `root`?** Qual o risco de segurança se qualquer usuário pudesse abrir a porta 80?

<details>
<summary><strong>Respostas</strong></summary>

1. Um Socket é a combinação de **IP + Porta**. Exemplo: `10.0.1.55:5432`. Se o Postgres está ouvindo em todas as interfaces, o socket seria `0.0.0.0:5432`.

2. **Um único IP** é suficiente. As portas diferenciam os serviços dentro do mesmo IP. O IP identifica a máquina, as portas identificam os serviços.

3. É um problema de **código**. `CLOSE_WAIT` significa que o lado remoto fechou a conexão, mas seu código não chamou `.close()` no socket/conexão. É um **leak de conexões** — o connection pool ou o código não está devolvendo conexões corretamente.

4. É uma medida de segurança do Unix. Se qualquer usuário pudesse abrir a porta 80, um atacante poderia rodar um web server falso e interceptar tráfego que deveria ir para o servidor legítimo. Exigir `root` garante que apenas administradores controlam serviços críticos.

</details>

---

## 🎯 Aplicação Imediata

**Exercício: Investigando Portas na sua máquina (5 min)**

```bash
# 1. Veja TODAS as portas em LISTEN (serviços ativos)
ss -tulpn | grep LISTEN

# 2. Para cada porta que aparecer, identifique:
#    - É System Port (<1024), User Port (1024-49151) ou Dynamic (>49152)?
#    - Qual processo está usando? (coluna "users")
#    - Você reconhece o serviço? (Postgres, Docker, Nginx?)

# 3. Agora veja as conexões ESTABLISHED (ativas):
ss -tn state established

# 4. Identifique os sockets: qual é a porta local (efêmera) e qual é a remota (serviço)?
#    As portas altas (>49152) são as efêmeras do seu lado.
```

**Desafio extra:** Se tiver Docker rodando, compare as portas DENTRO do container vs FORA:

```bash
docker run -d --name test-nginx -p 9090:80 nginx
ss -tulpn | grep 9090   # Porta 9090 no host
docker exec test-nginx ss -tulpn  # Porta 80 dentro do container
docker stop test-nginx && docker rm test-nginx
```

---

## 🔗 Conexões com outras aulas deste módulo

| Aula | Como se conecta |
|:-----|:----------------|
| [01 - Internet Fundamentals](../01_internet_fundamentals.md) | O **IP** é metade do Socket. A porta é a outra metade. Sem entender IP, portas não fazem sentido. |
| [03 - Internet Security](../03_internet_security.md) | **Firewalls** controlam quais portas aceitam tráfego. Security Groups na cloud = regras de portas. |
| [04 - HTTP](../04_http.md) | HTTP roda na porta **80/443**. Entender portas é pré-requisito para entender "por que minha API não conecta". |
| [05 - Deep Dive](../05_internet_deep_dive.md) | Ferramentas modernas (gRPC:50051, Milvus:19530) usam portas altas — são User Ports por design. |
