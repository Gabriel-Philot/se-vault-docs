# Prática: Explorando a Internet e Portas

Este documento contém exercícios simples para consolidar os conceitos de IP, DNS, Portas e Protocolos.

---

## 1. Explorando a Máquina Local (Bash)

### A. Identificando seu IP e Interface
Para ver qual o seu "endereço na rede":
```bash
ip addr
# Procure por 'inet' em interfaces como eth0 ou wlan0
```

### B. Testando o DNS
Veja o IP de um domínio e teste a conectividade:
```bash
ping -c 4 google.com
# Observe o IP retornado. O seu sistema consultou o DNS para resolver 'google.com'
```

### C. Verificando Portas em Uso
Quais serviços sua máquina está "expondo" agora?
```bash
# Requer privilégios de root para ver processos
ss -tulpn
# Ou
netstat -tulpn
```

---

## 2. Simulando um Serviço Real (Docker)

Vamos subir um servidor **Nginx** (Web) e mapear uma porta.

```bash
# Baixa a imagem e roda o container
# -p 8080:80 mapeia a porta 8080 da sua máquina para a 80 do container
docker run -d --name aula-nginx -p 8080:80 nginx
```

---

## 3. Conectando e Consumindo

### Via Terminal (cURL)
O `curl` emula o comportamento de um navegador (Client).
```bash
curl -I localhost:8080
# O '-I' mostra apenas o cabeçalho HTTP (Conceito de Protocolos)
```

### Via Python
Crie um arquivo chamado `check_server.py`:
```python
import requests

try:
    response = requests.get("http://localhost:8080")
    print(f"Status Code: {response.status_code}")
    print(f"Servidor: {response.headers.get('Server')}")
except Exception as e:
    print(f"Erro ao conectar: {e}")
```

---

## 4. Entendendo Erros de Conexão

### A. Porta Errada (Connection Refused)
Tente conectar em uma porta onde **ninguém está escutando**:
```bash
curl -I localhost:9999
# Resultado: curl: (7) Failed to connect to localhost port 9999: Connection refused
```
**O que aconteceu?** O sistema operacional respondeu imediatamente: "Não tem ninguém aqui". O serviço (processo) não existe nessa porta.

### B. Porta Certa, Host Errado (Timeout)
Tente conectar em um IP que não existe ou está bloqueado:
```bash
curl --connect-timeout 5 http://192.168.99.99:8080
# Resultado: curl: (28) Connection timed out after 5000 milliseconds
```
**O que aconteceu?** Nenhuma resposta. O pacote foi enviado mas "sumiu" - ou o host não existe, ou um firewall descartou silenciosamente (DROP).

### C. Diferença Prática
| Erro | Causa Provável | Dica de Debug |
|:---|:---|:---|
| **Connection Refused** | Porta fechada (processo não está rodando) | Verifique se o serviço subiu (`docker ps`, `ss -tulpn`) |
| **Timeout** | Firewall, rota de rede, host inexistente | Verifique firewall, VPN, Security Groups |

---

## 5. Inspecionando o Container por Dentro

Entre no container e veja o processo escutando:
```bash
# Abre um shell dentro do container
docker exec -it aula-nginx bash

# Dentro do container, veja as portas em uso
apt update && apt install -y net-tools  # Instala netstat (imagem nginx é minimalista)
netstat -tulpn
# Você verá o nginx escutando na porta 80

# Saia do container
exit
```

**Observação:** Note que dentro do container a porta é **80**, mas você acessa via **8080** do host. O Docker faz o NAT entre as duas.

---

## 6. Limpeza
```bash
docker stop aula-nginx && docker rm aula-nginx
```

---

> **📖 Sobre o Nginx:** Para um overview detalhado do que é o Nginx e suas funções (Web Server, Reverse Proxy, Load Balancer, API Gateway), veja o apêndice [appendix_nginx.md](./appendix_nginx.md).
