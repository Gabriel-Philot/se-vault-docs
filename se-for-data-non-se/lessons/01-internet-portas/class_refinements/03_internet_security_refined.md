# Segurança e Conexões: O Elo Perdido

Neste módulo, vamos cobrir a camada que permite que sua aplicação converse com segurança e privacidade. Se as aulas anteriores são os cabos e protocolos TCP, esta é sobre identidade, criptografia e fronteiras de rede.

---

## 📋 Tabela Diagnóstica (vs. Fontes Originais)

| Seção | Veredicto | Detalhe |
|:------|:---------:|:--------|
| §1 SSL/TLS | ✅ | Analogia do cartório mantida |
| §1 Handshake | 🔵 | Adicionado: **TLS 1.3 vs 1.2** (1-RTT vs 2-RTT) |
| §1 Certificados | ✅ | Bug de CA interna mantido |
| **§2 faltante** | 🔴→✅ | **Corrigido** — criada §2 sobre criptografia simétrica vs assimétrica |
| §3 Autenticação | 🔵 | Adicionado: **estrutura do JWT** e **OAuth 2.0 client credentials** |
| §4 Topologia | ✅ | Mantido |
| §4 VPN | 🔵 | Adicionado: **Site-to-Site vs Client VPN** |
| **CORS** | 🟡→✅ | **Adicionado** — relevante para DE que trabalha com APIs |
| **Checkpoint** | 🟡→✅ | **Adicionado** |
| **Aplicação Imediata** | 🟡→✅ | **Adicionado** |

---

## 1. Segurança em Trânsito: SSL/TLS

Como mencionado anteriormente, o HTTPS é o HTTP seguro. Mas como essa "mágica" acontece? Aos olhos do Engenheiro de Dados, isso geralmente se manifesta como erros de "SSL Handshake Failed" ou "Certificate Verify Failed".

### A Analogia do Cartório

Imagine que você precisa enviar um documento secreto para o Banco:
1.  **Identidade:** Como você sabe que o bancário é quem diz ser? (Ele tem um crachá assinado pelo Banco Central).
2.  **Privacidade:** Como ninguém lê no caminho? (Vocês usam um cofre que só vocês têm a chave).

### Componentes Chave

*   **Certificado Digital (O Crachá):** Um arquivo no servidor que diz: "Eu sou o `google.com`".
*   **Certificate Authority (CA - O Banco Central):** Uma entidade confiável (como Let's Encrypt, DigiCert) que assina digitalmente o crachá do site. Se seu browser/código não confia na CA, ele rejeita o site.
    *   *Bug comum:* Em ambientes corporativos, as empresas usam "CAs internas". Se seu container Docker não tiver essa CA instalada, o Python vai gritar erro de SSL.

### O Handshake (O Aperto de Mão)

Antes de trocar qualquer dado real, acontece uma dança complexa:

1.  **Client Hello:** "Oi, eu suporto criptografia X e Y."
2.  **Server Hello:** "Beleza, vamos usar Y. Toma meu certificado (crachá)."
3.  **Verificação:** O cliente liga para a CA (ou checa sua lista interna): "Esse certificado é válido?".
4.  **Troca de Chaves:** Se válido, eles usam matemática assimétrica (chaves públicas/privadas) para criar uma **Chave de Sessão**.
5.  **Tudo Pronto:** A partir daqui, usam essa Chave de Sessão (simétrica, muito mais rápida) para criptografar tudo.

### TLS 1.2 vs TLS 1.3: A Evolução

| Aspecto | TLS 1.2 (2008) | TLS 1.3 (2018) |
|:--------|:---------------|:----------------|
| **Round-trips antes de enviar dados** | 2-RTT (duas idas e voltas) | **1-RTT** (uma ida e volta) |
| **Cipher suites** | Muitas opções (incluindo inseguras) | Apenas cipher suites seguras |
| **0-RTT Resumption** | Não suportado | Suportado (reconexão instantânea) |
| **Forward Secrecy** | Opcional | **Obrigatório** |
| **Impacto prático** | Mais lento para estabelecer conexão | ~100ms mais rápido por conexão |

> **Para DE na prática:** Se seu pipeline recebe "SSL handshake timeout" em alto volume, pode ser que o servidor ainda use TLS 1.2 com o handshake mais lento. Em APIs de alta frequência, TLS 1.3 faz diferença real.

---

## 2. Criptografia: A Fundação de Tudo

O Handshake TLS menciona "chaves simétricas" e "assimétricas". Vamos desmistificar:

### Criptografia Simétrica (Uma Chave Só)

```
Mesma chave para trancar e destrancar:

  "Olá mundo" ──[chave123]──→ "x8#kL9$m" ──[chave123]──→ "Olá mundo"
                 CIFRAR                       DECIFRAR
```

*   **Vantagem:** Muito rápida (AES-256 processa gigabytes/segundo).
*   **Problema:** Como você envia a chave para o outro lado sem que alguém intercepte?
*   **Uso:** Criptografia em repouso (encryption-at-rest no S3, discos).

### Criptografia Assimétrica (Par de Chaves)

```
Duas chaves diferentes: uma pública (cadeado) e uma privada (chave do cadeado)

  "Olá mundo" ──[chave PÚBLICA]──→ "x8#kL9$m" ──[chave PRIVADA]──→ "Olá mundo"
                  (qualquer um)                     (só o dono)
```

*   **Vantagem:** A chave pública pode ser distribuída abertamente — não precisa de canal seguro.
*   **Problema:** Muito lenta (RSA é ~1000x mais lento que AES).
*   **Uso:** Assinatura digital, troca de chaves do TLS Handshake.

### O Truque do TLS: Híbrido

O TLS usa **ambas** — assimétrica para trocar com segurança uma chave simétrica, e depois simétrica para o resto da comunicação (velocidade):

```
1. Handshake: Criptografia ASSIMÉTRICA (lenta, mas segura para trocar chaves)
   └── Resultado: ambos agora têm a mesma chave simétrica de sessão

2. Comunicação: Criptografia SIMÉTRICA (rápida, usa a chave negociada)
   └── Todos os dados (requisições HTTP, respostas) criptografados com AES
```

> **Analogia:** É como trocar o segredo de um cofre usando um cadeado público. Você coloca a combinação do cofre dentro de uma caixa trancada com o cadeado público do destinatário. Só ele abre com sua chave privada. Depois, vocês dois usam o cofre (rápido) para trocar documentos.

---

## 3. Autenticação e Estado: Quem é você?

O HTTP é "stateless" (sem memória). O servidor não lembra que você fez login há 5 segundos. Como mantemos uma sessão de usuário ou de serviço?

### Cookies vs Tokens

Em engenharia de dados, raramente lidamos com Cookies (coisa de browser). Lidamos com **Tokens**.

*   **Bearer Token (O Ingresso do Show):**
    *   Você manda seu user/senha para um servidor de Auth (ex: Okta, Auth0).
    *   Ele te devolve um JWT (JSON Web Token) criptografado.
    *   Para cada pedido seguinte, você anexa no Header: `Authorization: Bearer <token>`.
    *   *Vantagem:* O servidor da API não precisa ir no banco checar sua senha toda vez. Ele só valida a assinatura matemática do token.

### Anatomia de um JWT (JSON Web Token)

Um JWT tem **3 partes** separadas por pontos:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYiLCJuYW1lIjoiSm9obiJ9.SflKxwRJSMeKKF2QT4fwpM
─────────────────────  ────────────────────────────────────────────────  ──────────────────────
       HEADER                           PAYLOAD                              SIGNATURE
```

| Parte | Conteúdo (decodificado) | O que contém |
|:------|:------------------------|:-------------|
| **Header** | `{"alg": "HS256", "typ": "JWT"}` | Algoritmo de assinatura |
| **Payload** | `{"sub": "123456", "name": "John", "exp": 1700000000}` | Dados do usuário (claims) + expiração |
| **Signature** | `HMACSHA256(header + "." + payload, secret)` | Prova de que ninguém alterou o token |

> **Cuidado:** O Payload é codificado em Base64, **NÃO criptografado**. Qualquer pessoa pode decodificar e ler o conteúdo. A assinatura apenas garante que o conteúdo não foi adulterado.

```python
# Decodificando um JWT em Python (sem verificar assinatura):
import base64, json

token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYiLCJuYW1lIjoiSm9obiJ9.SflKx..."
payload = token.split(".")[1]
# Adiciona padding se necessário
payload += "=" * (4 - len(payload) % 4)
dados = json.loads(base64.urlsafe_b64decode(payload))
print(dados)  # {'sub': '123456', 'name': 'John'}
```

### Service Principals e OAuth 2.0 Client Credentials

Seu job Spark não tem mouse para digitar senha. Ele usa o **OAuth 2.0 Client Credentials Flow**:

```
1. Spark Job envia:
   POST /oauth/token
   grant_type=client_credentials
   client_id=spark-etl-prod
   client_secret=s3cr3t_k3y

2. Auth Server responde:
   {
     "access_token": "eyJhbGci...",
     "token_type": "Bearer",
     "expires_in": 3600
   }

3. Spark Job usa o token em cada request:
   GET /api/dados
   Authorization: Bearer eyJhbGci...
```

*   **Client ID** = username da máquina
*   **Client Secret** = senha da máquina
*   O token tem **expiração** — seu código precisa renovar antes de expirar

---

## 4. Topologia de Rede: "Por que não conecta?"

Aqui é onde Portas, IPs e Segurança se encontram. O pesadelo número 1 do Data Engineer: "Connection Timeout".

### Firewalls e Security Groups

Pense num porteiro de prédio (Firewall).
*   **Inbound Rules (Entrada):** "Só deixo entrar quem vem do IP do escritório". "Só abro a porta 22 (SSH) para o IP do Admin".
*   **Outbound Rules (Saída):** "Só deixo sair para a porta 443 (HTTPS)". Muitos servidores de produção são bloqueados para sair (Egress), impedindo `pip install` (que precisa ir na internet).

### VPC (Virtual Private Cloud)

Sua "fatia privada" da nuvem pública.
*   **Subnet Pública:** Tem acesso direto à internet (tem um Gateway). É onde ficam os Load Balancers.
*   **Subnet Privada:** Isolada do mundo exterior. É onde **DEVEM** ficar seus Bancos de Dados e Clusters Spark por segurança.
    *   *O dilema:* Se o Cluster está na subnet privada, como ele baixa bibliotecas do PyPI (internet)?
    *   *A solução:* **NAT Gateway**.

### NAT Gateway: O Conceito Aplicado à Cloud

Lembra do **NAT** (Network Address Translation) que vimos nos fundamentos? Na sua casa, o roteador traduz os IPs privados (`192.168.x.x`) para o IP público da sua conexão. Na cloud, o conceito é o mesmo, mas em escala corporativa.

*   **O Problema:** Máquinas em subnets privadas (como seu cluster Spark) não têm IP público. Elas não conseguem iniciar conexões para a internet (baixar pacotes, chamar APIs externas).
*   **A Solução:** O **NAT Gateway** é um serviço gerenciado que faz a tradução de endereços. Ele tem um IP público e fica na subnet pública.
*   **O Fluxo:**
    1.  Seu Executor Spark (IP privado `10.0.1.55`) quer acessar `pypi.org`.
    2.  O pacote vai para o NAT Gateway (IP público `52.33.44.55`).
    3.  O NAT Gateway substitui o IP de origem pelo seu próprio IP público e manda para a internet.
    4.  A resposta volta para o NAT Gateway, que traduz de volta e entrega ao Executor.
*   **Segurança:** O NAT Gateway só permite tráfego **de saída (egress)**. Ninguém da internet consegue iniciar uma conexão para dentro. É um "furo de saída", não uma porta de entrada.

### VPN (Virtual Private Network)

Um túnel criptografado que conecta seu escritório (ou sua casa) diretamente para dentro da VPC, como se estivessem no mesmo prédio físico. É por isso que você precisa ligar a VPN para acessar o Airflow de staging (que está numa subnet privada).

#### Site-to-Site vs Client VPN

| Tipo | O que conecta | Caso de uso |
|:-----|:--------------|:------------|
| **Site-to-Site** | Rede inteira (escritório ↔ VPC) | Escritório acessando recursos cloud permanentemente |
| **Client VPN** | Máquina individual (seu laptop ↔ VPC) | Trabalho remoto, home office |

*   **Site-to-Site** é configurado no nível do roteador do escritório. Todo mundo que entra na rede do escritório ganha acesso automaticamente.
*   **Client VPN** exige que cada pessoa instale um cliente (OpenVPN, WireGuard) e se autentique individualmente.

---

## 5. CORS: O Bloqueio Silencioso

Se você já viu esse erro no console do browser, CORS é o culpado:

```
Access to fetch at 'https://api.empresa.com/dados' from origin 'https://meu-dashboard.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

### O que é?

**CORS (Cross-Origin Resource Sharing)** é uma política de segurança do browser que impede que um site (`meu-dashboard.com`) faça requests para outro domínio (`api.empresa.com`) sem permissão explícita.

### Por que existe?

Sem CORS, qualquer site malicioso poderia fazer requests para `api.seubanco.com` usando suas credenciais (cookies) do browser. O CORS protege o usuário.

### Como funciona?

```
1. Browser envia "Preflight" (OPTIONS):
   "Posso fazer um GET de meu-dashboard.com para api.empresa.com?"

2. Servidor responde com headers CORS:
   Access-Control-Allow-Origin: https://meu-dashboard.com   ← "sim, esse domínio pode"
   Access-Control-Allow-Methods: GET, POST                   ← "esses métodos são ok"
   Access-Control-Allow-Headers: Authorization               ← "pode mandar esse header"

3. Se o servidor autorizar, o browser faz o request real.
```

### Para DE na prática:

*   CORS é um problema de **browser**, não de terminal. O `curl` e o `requests` do Python **não** respeitam CORS.
*   Se seu dashboard (React/Jupyter com JavaScript) não consegue acessar sua API, mas `curl` funciona, é CORS.
*   **Solução:** O backend precisa retornar os headers `Access-Control-Allow-Origin` corretos.

---

## Resumo Prático (Troubleshooting Guide)

| Erro | Camada | O que checar |
|:-----|:-------|:-------------|
| **SSL Handshake Failed** | TLS | Certificado da CA é confiável? (`certifi`) Versão TLS compatível? |
| **Certificate Verify Failed** | TLS | CA interna não instalada no container? Certificado expirado? |
| **Access Denied (401)** | Auth | Token expirou? Client Credentials corretos? |
| **Forbidden (403)** | Auth | Autenticado mas sem permissão para esse recurso específico. |
| **Connection Refused** | Porta | O serviço na porta alvo caiu (não está "Listening"). |
| **Timeout** | Rede | Firewall barrou o pacote (DROP), rota de rede, VPN desconectada. |
| **CORS Error** | Browser | Falta `Access-Control-Allow-Origin` no backend. |

---

## 🧠 Checkpoint: Teste seu Entendimento

1.  **Por que o TLS usa criptografia assimétrica E simétrica?** Por que não usar só uma?
2.  **Um JWT contém `"exp": 1700000000`. O que acontece se o relógio do seu servidor estiver 5 minutos atrasado?** Por que isso é um problema real em sistemas distribuídos?
3.  **Seu Spark rodando numa subnet privada não consegue acessar `pypi.org`. Timeout.** Qual componente está faltando? Desenhe o fluxo.
4.  **`curl` funciona, mas React no browser dá CORS error.** Por que essa diferença? O problema é no frontend ou backend?

<details>
<summary><strong>Respostas</strong></summary>

1. A assimétrica é **segura para trocar chaves** (não precisa de canal seguro prévio), mas é **lenta demais** para criptografar dados em massa. A simétrica é ~1000x mais rápida, mas precisa que ambos tenham a mesma chave. O TLS usa assimétrica apenas para negociar a chave simétrica de sessão, e depois usa simétrica para velocidade.

2. Se o relógio está atrasado, o servidor pode aceitar tokens **já expirados** (achando que ainda são válidos) ou rejeitar tokens **válidos** (achando que são do futuro). Em sistemas distribuídos, **sincronização de relógio** (NTP) é crítica para que JWTs funcionem corretamente.

3. Falta o **NAT Gateway** na subnet pública. O fluxo correto: Spark (subnet privada) → NAT Gateway (subnet pública, com IP público) → Internet → pypi.org. Sem o NAT Gateway, o pacote não tem como sair da subnet privada.

4. `curl` e `requests` (Python) **ignoram CORS** — é uma política exclusiva de browsers. O problema está no **backend**: ele precisa retornar o header `Access-Control-Allow-Origin` com o domínio do frontend. CORS protege o usuário do browser, não a API.

</details>

---

## 🎯 Aplicação Imediata

**Exercício: Inspecionando TLS na prática (5 min)**

```bash
# 1. Veja o certificado TLS de um site (quem assinou, validade, versão TLS):
openssl s_client -connect google.com:443 -brief
# Observe: Protocol version, Cipher, Verify return code

# 2. Veja detalhes do certificado (quem é a CA, quando expira):
echo | openssl s_client -connect google.com:443 2>/dev/null | openssl x509 -noout -subject -issuer -dates
# Observe: issuer = CA que assinou, notAfter = data de expiração

# 3. Teste com um site que tem certificado inválido/expirado:
# (use expired.badssl.com que é feito para testes)
openssl s_client -connect expired.badssl.com:443 -brief
# Observe: "Verify return code: 10 (certificate has expired)"

# 4. Compare TLS 1.2 vs 1.3:
openssl s_client -connect google.com:443 -tls1_2 -brief 2>/dev/null | head -5
openssl s_client -connect google.com:443 -tls1_3 -brief 2>/dev/null | head -5
```

---

## 🔗 Conexões com outras aulas deste módulo

| Aula | Como se conecta |
|:-----|:----------------|
| [01 - Internet Fundamentals](../01_internet_fundamentals.md) | HTTPS = HTTP + TLS. O fluxo End-to-End inclui o TLS Handshake como passo 3. |
| [02 - Network Ports](../02_network_ports.md) | Firewalls controlam **portas**. Security Groups = regras por porta + IP. |
| [04 - HTTP](../04_http.md) | Headers `Authorization: Bearer` e status codes 401/403 são detalhados na aula HTTP. |
| [05 - Deep Dive](../05_internet_deep_dive.md) | gRPC e APIs de AI usam TLS em produção sobre porta 443. |
