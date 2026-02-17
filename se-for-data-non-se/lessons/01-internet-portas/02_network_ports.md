# Portas de Rede: As Portas Lógicas (Fundamentos)

Este documento ("Page 2") serve como base fundamental antes de entrarmos em Segurança. É impossível blindar uma casa se você não sabe onde ficam as portas e janelas.

---

## 1. O Conceito: Por que Portas existem?

Imagine um servidor potente na AWS. Ele é um prédio gigante (identificado pelo **Endereço IP**).
Dentro desse prédio, existem milhares de salas comerciais.
*   Na sala 5432, trabalha a equipe do Postgres.
*   Na sala 443, trabalha a equipe do Site Seguro.
*   Na sala 22, trabalha o Zelador do prédio (SSH).

Se os pacotes de dados chegassem no prédio e só tivessem o IP, o porteiro não saberia para qual sala enviar a encomenda. A **Porta (Port)** resolve esse problema de endereçamento interno.

### A História e o Padrão (IANA)
Quem organizou a bagunça foi a **IANA (Internet Assigned Numbers Authority)** na década de 70. Eles dividiram as **65.535** portas disponíveis em categorias:

1.  **System Ports (0-1023):** As "nobres" e históricas. Exigem permissão de `root` para rodar.
2.  **User Ports (1024-49151):** Onde vivem os bancos de dados e aplicações corporativas modernas.
3.  **Dynamic Ports (49152+):** Temporárias, usadas pelo seu browser.

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
| **49152 - 65535** | **Dynamic Ports** | Temporárias para clientes (Ephemeral). O browser usa para conectar no servidor. |

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

### 💡 Resumo: A Lógica da Investigação (Esboço)

1.  **Encontrar a Porta:** Se é um serviço (DB, API), ele *escuta* em algum lugar. Procure o `EXPOSE` no Docker ou `port:` na documentação.
2.  **Identificar o Protocolo:** JSON/Texto geralmente é HTTP (Portas 80/443/8080). Binário/Rápido geralmente é gRPC ou porta específica do DB.
3.  **Checar Bloqueios:** Se não conecta, o firewall pode estar barrando portas altas ou específicas.
4.  **Dev vs Prod:** Use portas altas (>1024) para evitar permissões de root em Dev; use portas padrão (80/443) em Prod para facilitar o acesso do usuário final.
