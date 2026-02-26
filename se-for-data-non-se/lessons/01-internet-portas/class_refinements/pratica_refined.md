# Prática: Explorando a Internet e Portas

Este documento contém exercícios progressivos para consolidar os conceitos de IP, DNS, Portas, HTTP, TLS e Protocolos. Cada seção referencia a aula correspondente.

> **Pré-requisitos:** Terminal Linux (ou WSL), Docker instalado, Python 3 com `requests` e `httpx`.

---

## 1. Explorando a Máquina Local — IP e Interface

📚 *Referência: [Aula 01 — Internet Fundamentals](../01_internet_fundamentals.md)*

### A. Identificando seu IP e Interface
```bash
ip addr
# Procure por 'inet' em interfaces como eth0 ou wlan0
# O endereço 127.0.0.1 é o "localhost" (loopback) — sempre aponta para você mesmo
```

### B. Verificando a rota padrão (Gateway)
```bash
ip route | head -3
# "default via X.X.X.X" = o IP do seu Router (o próximo salto para sair da rede local)
```

**O que observar:** Seu IP é da faixa privada (`10.x`, `172.16-31.x`, `192.168.x`)? Então você está atrás de NAT.

---

## 2. DNS em Profundidade

📚 *Referência: [Aula 01 — Internet Fundamentals](../01_internet_fundamentals.md), seção DNS*

### A. Resolução simples
```bash
# Veja qual IP corresponde ao domínio
nslookup google.com
# Observe: "Server" = seu DNS resolver (provavelmente do ISP ou 8.8.8.8)
# "Address" = o IP do google.com
```

### B. A hierarquia completa (Root → TLD → Authoritative)
```bash
dig +trace google.com
```
**O que observar no output:**
1. Primeira seção: os **Root Servers** (`.`) — são ~13 no mundo todo
2. Segunda seção: os **TLD Servers** (`.com`) — quem gerencia todos os `.com`
3. Terceira seção: o **Authoritative Server** (`google.com`) — quem sabe o IP real
4. Resultado final: o IP de `google.com`

### C. Testando o cache DNS
```bash
# Execute duas vezes e compare o "Query time":
dig google.com | grep "Query time"
dig google.com | grep "Query time"
# A segunda chamada deve ser MUITO mais rápida (resposta cacheada)
```

### D. Vendo o TTL (Time To Live)
```bash
dig google.com | grep -A1 "ANSWER SECTION"
# O número antes do "IN A" é o TTL em segundos
# Quando chegar a 0, o cache expira e o DNS consulta novamente
```

---

## 3. Portas e Estados TCP

📚 *Referência: [Aula 02 — Network Ports](../02_network_ports.md)*

### A. Verificando serviços em escuta (LISTEN)
```bash
ss -tulpn | grep LISTEN
# Para cada porta, identifique:
#   - É System Port (<1024), User Port (1024-49151) ou Dynamic (>49152)?
#   - Qual processo está usando? (coluna "users:((...))") 
```

### B. Vendo conexões ativas e sockets
```bash
# Conexões TCP estabelecidas (sockets ativos):
ss -tn state established
# Cada linha mostra: Local Address (IP:porta_efêmera) ↔ Peer Address (IP:porta_serviço)
# As portas altas (>49152) na coluna Local são as efêmeras do seu lado
```

### C. Identificando problemas via estados TCP
```bash
# Veja TODOS os estados TCP de uma vez:
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn
# Output esperado (saudável):
#   15 ESTAB       ← conexões ativas (bom)
#    3 LISTEN      ← serviços esperando (bom)
#    2 TIME-WAIT   ← conexões recém-fechadas (normal em quantidade baixa)
#    1 State       ← header do output

# Se você vir:
#  500 TIME-WAIT   ← connection pool mal configurado (abrindo/fechando demais)
#  200 CLOSE-WAIT  ← bug na aplicação (não está fechando conexões!)
```

---

## 4. Simulando um Serviço Real (Docker)

📚 *Referência: [Aula 02 — Network Ports](../02_network_ports.md), seção Mecânica da Conexão*

### A. Subindo o Nginx
```bash
# -p 8080:80 mapeia a porta 8080 do host para a 80 do container
docker run -d --name aula-nginx -p 8080:80 nginx
```

### B. Verificando o mapeamento de portas
```bash
# No host: veja a porta 8080 em LISTEN
ss -tulpn | grep 8080

# Dentro do container: veja a porta 80 em LISTEN
docker exec aula-nginx ss -tulpn 2>/dev/null || \
docker exec aula-nginx cat /proc/net/tcp
# Nota: o Docker faz NAT entre as portas (8080 host → 80 container)
```

### C. Observando o socket criado ao conectar
```bash
# Em um terminal, monitore conexões em tempo real:
watch -n 0.5 'ss -tn | grep 8080'

# Em outro terminal, faça um request:
curl -s localhost:8080 > /dev/null

# No primeiro terminal, você verá o socket aparecer e sumir:
#   ESTAB  127.0.0.1:PORTA_EFEMERA  127.0.0.1:8080
```

---

## 5. HTTP: Do Básico ao Verbose

📚 *Referência: [Aula 04 — HTTP](../04_http.md)*

### A. Headers da resposta
```bash
curl -I localhost:8080
# -I faz um HEAD request (só headers, sem body)
# Observe: Server, Content-Type, Content-Length
```

### B. A conversa HTTP completa (`curl -v`)
```bash
curl -v localhost:8080 2>&1 | head -25
# Linhas com ">" = o que VOCÊ enviou (request)
# Linhas com "<" = o que o SERVIDOR respondeu (response)
# Linhas com "*" = informações de conexão (TCP, TLS)
```

**O que observar:**
- `> GET / HTTP/1.1` — o método e versão
- `> Host: localhost:8080` — header obrigatório
- `> User-Agent: curl/...` — quem é você
- `< HTTP/1.1 200 OK` — status code
- `< Content-Type: text/html` — formato da resposta

### C. Testando diferentes status codes
```bash
# httpbin.org é um serviço público para testes HTTP
curl -i https://httpbin.org/status/404    # Not Found
curl -i https://httpbin.org/status/429    # Rate Limited (olhe o Retry-After)
curl -i https://httpbin.org/status/503    # Service Unavailable
```

### D. Testando redirects
```bash
# Sem seguir redirect (para no 302):
curl -i https://httpbin.org/redirect/3

# Seguindo todos os redirects (-L):
curl -Lv https://httpbin.org/redirect/3 2>&1 | grep "< HTTP"
# Você verá: 302, 302, 302, 200 — três redirecionamentos até o destino
```

### E. Enviando dados (POST com JSON)
```bash
curl -X POST https://httpbin.org/post \
     -H "Content-Type: application/json" \
     -d '{"sensor": "A1", "valor": 23.5}' | python3 -m json.tool
# httpbin echo-a tudo que você enviou: headers, body, origin IP
```

---

## 6. Inspecionando TLS e Certificados

📚 *Referência: [Aula 03 — Internet Security](../03_internet_security.md)*

### A. Vendo o handshake TLS
```bash
openssl s_client -connect google.com:443 -brief
# Observe:
#   Protocol version: TLSv1.3     ← versão do TLS negociada
#   Ciphersuite: TLS_AES_256_...  ← algoritmo de criptografia
#   Verify return code: 0 (ok)    ← certificado válido
```

### B. Detalhes do certificado (CA, validade)
```bash
echo | openssl s_client -connect google.com:443 2>/dev/null | \
  openssl x509 -noout -subject -issuer -dates
# subject = quem é o dono (google.com)
# issuer  = quem assinou (a CA — provavelmente Google Trust Services)
# notAfter = quando expira
```

### C. Testando certificado inválido
```bash
# badssl.com é feito para testes de TLS:
openssl s_client -connect expired.badssl.com:443 -brief
# Observe: "Verify return code: 10 (certificate has expired)"

openssl s_client -connect self-signed.badssl.com:443 -brief
# Observe: "Verify return code: 18 (self-signed certificate)"
```

### D. Comparando TLS 1.2 vs 1.3
```bash
# Forçando TLS 1.2:
openssl s_client -connect google.com:443 -tls1_2 -brief 2>/dev/null | head -3
# Forçando TLS 1.3:
openssl s_client -connect google.com:443 -tls1_3 -brief 2>/dev/null | head -3
# Compare a ciphersuite usada em cada versão
```

---

## 7. Consumindo com Python

📚 *Referência: [Aula 04 — HTTP](../04_http.md) e [Aula 05 — Deep Dive](../05_internet_deep_dive.md)*

### A. Request básico e tratamento de erros
```python
# check_server.py
import requests

try:
    response = requests.get("http://localhost:8080", timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Servidor: {response.headers.get('Server')}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Tempo: {response.elapsed.total_seconds():.3f}s")
except requests.ConnectionError:
    print("Connection Refused — o serviço está rodando? (docker ps)")
except requests.Timeout:
    print("Timeout — firewall? VPN? Rede fora?")
```

### B. Consumindo SSE (Server-Sent Events) com httpx
```python
# sse_consumer.py
# pip install httpx
import httpx

url = "https://sse.dev/test"
print(f"Conectando a {url} via SSE...\n")

with httpx.stream("GET", url, timeout=None) as response:
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}")
    print("---")
    count = 0
    for line in response.iter_lines():
        if line.startswith("data:"):
            dados = line[5:].strip()
            print(f"  Evento {count}: {dados}")
            count += 1
            if count >= 5:
                break

print(f"\nRecebidos {count} eventos via SSE!")
```

---

## 8. Entendendo Erros de Conexão

📚 *Referência: [Aula 02 — Network Ports](../02_network_ports.md) e [Aula 03 — Security](../03_internet_security.md)*

### A. Connection Refused (Porta Fechada)
```bash
curl -I localhost:9999
# curl: (7) Failed to connect to localhost port 9999: Connection refused
```
**O que aconteceu?** O OS respondeu instantaneamente: "Não tem processo escutando na porta 9999". O host existe, mas a porta não tem serviço.

### B. Timeout (Firewall ou Host Inexistente)
```bash
curl --connect-timeout 5 http://192.168.99.99:8080
# curl: (28) Connection timed out after 5000 milliseconds
```
**O que aconteceu?** Nenhuma resposta. O pacote foi enviado mas "sumiu" — host não existe, firewall fez DROP silencioso, ou rota de rede quebrada.

### C. SSL Error (Certificado Inválido)
```bash
# Python rejeita certificados inválidos por padrão:
python3 -c "import requests; requests.get('https://expired.badssl.com')"
# SSLError: certificate has expired
```
**O que aconteceu?** O TLS Handshake falhou porque o certificado expirou. Em ambientes corporativos, isso geralmente é uma CA interna não instalada no container.

### D. Tabela de Diagnóstico Rápido

| Erro | Camada | Causa Provável | Debug |
|:-----|:-------|:---------------|:------|
| **Connection Refused** | TCP/Porta | Processo não está rodando | `ss -tulpn`, `docker ps` |
| **Timeout** | Rede/Firewall | Firewall DROP, rota, host inexistente | `ping`, VPN, Security Groups |
| **SSL Handshake Failed** | TLS | Certificado inválido/expirado/CA desconhecida | `openssl s_client` |
| **401 Unauthorized** | HTTP/Auth | Token expirado ou ausente | Checar header `Authorization` |
| **403 Forbidden** | HTTP/Auth | Autenticado mas sem permissão | Checar roles/permissions |
| **502 Bad Gateway** | Proxy | Nginx/ALB não alcança o backend | Logs do proxy, `ss` no backend |

---

## 9. Exercício Integrado: Fluxo Ponta-a-Ponta 🎯

Este exercício conecta **todos** os conceitos do módulo numa sequência:

```bash
# === FASE 1: DNS ===
echo "=== 1. Resolvendo DNS ==="
nslookup google.com
echo ""

# === FASE 2: PORTAS (antes de subir o serviço) ===
echo "=== 2. Portas antes do Nginx ==="
ss -tulpn | grep 8080 || echo "Porta 8080: LIVRE (ninguém escutando)"
echo ""

# === FASE 3: SUBIR SERVIÇO ===
echo "=== 3. Subindo Nginx ==="
docker run -d --name e2e-nginx -p 8080:80 nginx
sleep 2
echo ""

# === FASE 4: PORTAS (depois de subir) ===
echo "=== 4. Portas depois do Nginx ==="
ss -tulpn | grep 8080
echo "→ Agora a porta 8080 está em LISTEN (Nginx escutando)"
echo ""

# === FASE 5: HTTP VERBOSE ===
echo "=== 5. Conversa HTTP completa ==="
curl -v localhost:8080 2>&1 | grep -E "^[><*]" | head -15
echo ""

# === FASE 6: SOCKET EM TEMPO REAL ===
echo "=== 6. Socket criado pela conexão ==="
curl -s localhost:8080 > /dev/null &
ss -tn | grep 8080
echo "→ Observe o socket: IP:EFÊMERA ↔ IP:8080"
echo ""

# === FASE 7: TLS (com site externo) ===
echo "=== 7. Inspecionando TLS do Google ==="
echo | openssl s_client -connect google.com:443 -brief 2>/dev/null | head -4
echo ""

# === FASE 8: ERROS ===
echo "=== 8. Simulando erros ==="
echo "--- Connection Refused (porta sem serviço):"
curl -s -o /dev/null -w "%{http_code}" localhost:9999 2>&1 || echo " (Connection Refused)"
echo ""
echo "--- Certificado expirado:"
curl -s -o /dev/null -w "%{http_code}" https://expired.badssl.com 2>&1 || echo " (SSL Error)"
echo ""

# === FASE 9: LIMPEZA ===
echo "=== 9. Limpeza ==="
docker stop e2e-nginx && docker rm e2e-nginx
echo "✅ Exercício completo!"
```

**Ao final deste exercício, você terá praticado:**
- [x] Resolução DNS (`nslookup`)
- [x] Investigação de portas (`ss -tulpn`)
- [x] Port mapping Docker (host:container)
- [x] Conversa HTTP completa (`curl -v`)
- [x] Observação de sockets em tempo real
- [x] Inspeção TLS (`openssl s_client`)
- [x] Diagnóstico de erros (Connection Refused, SSL Error)

---

## 10. Limpeza Final
```bash
# Remova qualquer container restante:
docker stop aula-nginx e2e-nginx 2>/dev/null
docker rm aula-nginx e2e-nginx 2>/dev/null
```

---

> **📖 Sobre o Nginx:** Para um overview detalhado do que é o Nginx e suas funções (Web Server, Reverse Proxy, Load Balancer, API Gateway), veja o apêndice [appendix_nginx.md](./appendix_nginx.md).
