# O que é o Nginx?

> **Nginx** (pronuncia-se "engine-x") é um servidor web e proxy reverso de alto desempenho, criado em 2004 por Igor Sysoev para resolver o problema de lidar com milhares de conexões simultâneas (o famoso "C10K problem").

O Nginx é um **canivete suíço** - ele faz várias coisas dependendo de como você o configura. Veja cada função:

---

## 1. Web Server (Servidor de Arquivos)
Na função mais básica, o Nginx **serve arquivos estáticos** diretamente para o cliente.

```
Cliente (Browser) → Nginx → Lê arquivo do disco → Devolve HTML/CSS/JS/Imagens
```

É extremamente eficiente porque não precisa de processamento - só lê e entrega.

---

## 2. Reverse Proxy (Proxy Reverso)
Aqui o Nginx **não serve arquivos**, ele repassa a requisição para outro servidor (backend).

```
Cliente → Nginx (porta 443) → FastAPI/Flask (porta 8000)
```

**Por que fazer isso?**
- O Nginx lida melhor com milhares de conexões simultâneas
- O backend (Python) foca só na lógica, não em gerenciar conexões
- Você pode ter HTTPS no Nginx e HTTP interno (mais simples)

---

## 3. Load Balancer (Balanceador de Carga)
É uma extensão do Reverse Proxy. Em vez de repassar para **1** backend, ele distribui entre **N** backends.

```
Cliente → Nginx → Escolhe um backend
                  ├── Backend 1 (10.0.0.1:8000)
                  ├── Backend 2 (10.0.0.2:8000)
                  └── Backend 3 (10.0.0.3:8000)
```

**Algoritmos de distribuição:**
- **Round Robin** (padrão): Alterna entre os backends (1, 2, 3, 1, 2, 3...)
- **Least Connections**: Manda para o backend com menos conexões ativas
- **IP Hash**: Mesmo cliente sempre vai para o mesmo backend (útil para sessões)

---

## 4. API Gateway
Em arquiteturas de microsserviços, o Nginx pode rotear diferentes endpoints para diferentes serviços:

```
/users/*   → Serviço de Usuários (porta 8001)
/orders/*  → Serviço de Pedidos (porta 8002)
/payments/* → Serviço de Pagamentos (porta 8003)
```

O cliente só conhece um endereço (`api.empresa.com`), e o Nginx decide para onde mandar internamente.

---

## 5. Em Ferramentas de Dados (Airflow, MLflow, Jupyter)
Essas ferramentas rodam em portas "estranhas" (8080, 5000, 8888). O Nginx fica na frente para:
- Expor na porta padrão (443 HTTPS)
- Adicionar autenticação (Basic Auth, OAuth)
- Servir múltiplas ferramentas no mesmo domínio (`/airflow`, `/mlflow`, `/jupyter`)

---

## 6. Kubernetes Ingress
O `ingress-nginx` é um controller que gerencia o tráfego de entrada no cluster K8s. Ele faz o mesmo papel de Reverse Proxy/Load Balancer, mas integrado ao ecossistema Kubernetes.

---

## Resumo Visual

| Função | O que faz | Quando usar |
|:---|:---|:---|
| **Web Server** | Serve arquivos do disco | Sites estáticos, SPAs |
| **Reverse Proxy** | Repassa para 1 backend | APIs em Python/Node |
| **Load Balancer** | Distribui entre N backends | Alta disponibilidade, escala horizontal |
| **API Gateway** | Roteia por path/domínio | Microsserviços |

---

**Por que usamos na prática?** É leve, rápido de subir, não precisa de configuração para um "Hello World", e demonstra perfeitamente o conceito de porta exposta. É o "Hello World" dos servidores web.
