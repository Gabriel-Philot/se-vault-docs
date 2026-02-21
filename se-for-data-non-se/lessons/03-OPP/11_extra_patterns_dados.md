# Mini-Aula 3.11 (Extra): Patterns Complementares para Engenharia de Dados

> **Objetivo:** Apresentar Adapter, Facade, Observer e padroes de integracao (Pipes/Filters) com foco em decisao pratica para pipelines de dados.
> **Fontes:** [Refactoring Guru — Adapter](https://refactoring.guru/design-patterns/adapter) · [Refactoring Guru — Facade](https://refactoring.guru/design-patterns/facade) · [Refactoring Guru — Observer](https://refactoring.guru/design-patterns/observer) · [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)

---

## Parte A: Adapter e Facade

### A.1. Problema que resolvem

Pipeline depende de SDK de vendor externo (API bancaria, gateway de pagamento).
O vendor muda nomes de campo, formato de resposta e codigos de erro.
Sem isolamento, mudanca externa quebra transformacoes e testes internos.

---

### A.2. Conceito + terminologia (Guru)

| Participante | Pattern | Papel |
|---|---|---|
| **Client Interface** | Adapter | Protocolo que o pipeline espera — define `read_order()`, `read_payment()`, etc. |
| **Service** | Adapter | Classe do vendor/SDK que voce **nao controla** (3rd-party, legacy) |
| **Adapter** | Adapter | Implementa Client Interface e traduz chamadas para o Service |
| **Facade** | Facade | Interface simplificada para um **subsistema complexo** (multiplas classes) |

**Diferenca essencial (Guru):**

> **Adapter** torna uma interface existente **usavel** para o cliente.
> **Facade** define uma **nova** interface simplificada para um subsistema inteiro.
> Adapter geralmente embrulha **um** objeto. Facade trabalha com **muitos**.

```text
  ┌──────────────────┐          ┌──────────────────┐
  │   Pipeline        │          │   Client          │
  │   (Client)        │          │   Interface       │
  │──────────────────│          │   read_order()    │
  │ usa contrato     │─────────▶│                   │
  │ interno unico    │          └────────┬──────────┘
  └──────────────────┘                   │ implements
                                         │
                              ┌──────────┴──────────┐
                              │   Adapter            │
                              │──────────────────────│
                              │ - client: VendorSDK  │
                              │ + read_order()       │
                              │   └─ traduz payload  │
                              └──────────┬───────────┘
                                         │ delega
                              ┌──────────┴──────────┐
                              │   VendorSDK          │
                              │   (Service)          │
                              │ + fetch() -> dict    │
                              └─────────────────────┘
```

---

### A.3. Exemplo Python — Adapter

```python
from abc import ABC, abstractmethod


# ─── CLIENT INTERFACE ─────────────────────────────────────
# Contrato interno do pipeline — define o formato que o core espera.
# Nenhuma classe do vendor aparece aqui.

class OrderProvider(ABC):
    """Contrato interno: qualquer fonte de pedidos."""

    @abstractmethod
    def read_order(self) -> dict:
        """Retorna pedido no formato padrao do pipeline."""
        ...


# ─── SERVICE (vendor que voce NAO controla) ───────────────
# Payload, nomes de campo e erros definidos pelo vendor.

class AcmeBankClient:
    """SDK de terceiro — payload imutavel."""

    def fetch_transaction(self) -> dict:
        return {
            "txnId": "TXN-999",
            "txnAmount": 150.75,
            "txnCurrency": "BRL",
            "statusCode": 1,  # 1=ok, 0=fail — convencao do vendor
        }


# ─── ADAPTER ──────────────────────────────────────────────
# Implementa o contrato interno e traduz a resposta do vendor.
# Quando o vendor mudar, so este arquivo muda — o pipeline nao.

class AcmeBankAdapter(OrderProvider):
    """Adapter: traduz AcmeBankClient -> OrderProvider."""

    _STATUS_MAP = {1: "approved", 0: "rejected"}

    def __init__(self, client: AcmeBankClient):
        self._client = client

    def read_order(self) -> dict:
        raw = self._client.fetch_transaction()
        return {
            "order_id": raw["txnId"],
            "amount": float(raw["txnAmount"]),
            "currency": raw["txnCurrency"],
            "status": self._STATUS_MAP.get(raw["statusCode"], "unknown"),
        }


# ─── USO NO PIPELINE ─────────────────────────────────────
def run_pipeline(provider: OrderProvider) -> dict:
    """Pipeline so conhece OrderProvider — nunca o SDK."""
    order = provider.read_order()
    print(f"Processando pedido {order['order_id']}: {order['amount']} {order['currency']}")
    return order


# Troca de vendor = troca de Adapter, zero mudanca no pipeline
adapter = AcmeBankAdapter(AcmeBankClient())
run_pipeline(adapter)
```

---

### A.4. Exemplo Python — Facade

```python
class AuthService:
    def validate_token(self, token: str) -> bool:
        return token == "valid-token"

class RateLimiter:
    def check(self, client_id: str) -> bool:
        return True  # simplificado

class AuditLogger:
    def log(self, action: str, client_id: str) -> None:
        print(f"[AUDIT] {action} by {client_id}")


# ─── FACADE ───────────────────────────────────────────────
# Interface simplificada sobre 3 subsistemas.
# Pipeline chama 1 metodo em vez de orquestrar 3 classes.

class ApiGatewayFacade:
    """Ponto unico de entrada para auth + rate limit + audit."""

    def __init__(self):
        self._auth = AuthService()
        self._limiter = RateLimiter()
        self._audit = AuditLogger()

    def authorize_request(self, token: str, client_id: str) -> bool:
        if not self._auth.validate_token(token):
            return False
        if not self._limiter.check(client_id):
            return False
        self._audit.log("authorize", client_id)
        return True


# Pipeline usa Facade sem saber detalhes internos
gateway = ApiGatewayFacade()
if gateway.authorize_request("valid-token", "pipeline-etl"):
    print("Request autorizado")
```

---

### A.5. Anti-exemplo

```python
# ❌ Sem Adapter: dominio contaminado pelo vendor
def process_payment(bank_client):
    raw = bank_client.fetch_transaction()
    # Nomes do vendor espalhados pelo pipeline
    if raw["statusCode"] == 1:
        amount = raw["txnAmount"]  # muda se vendor mudar
        # toda transformacao depende do payload externo
```

---

### A.6. Pros e contras (Guru)

| | Pros | Contras |
|--|------|---------|
| **Adapter** | SRP: separa conversao da logica de negocio | Mais classes e interfaces no sistema |
| | OCP: novo adapter = novo vendor sem mexer no core | Complexidade se a interface for simples demais para justificar |
| **Facade** | Isola codigo da complexidade do subsistema | Pode virar God Object se acumular responsabilidade |

---

### A.7. Relacoes com outros patterns

| Relacao | Detalhe |
|---|---|
| **Adapter vs Facade** | Adapter traduz interface existente; Facade cria interface nova e simplificada |
| **Adapter vs Decorator** | Adapter muda interface; Decorator mantem interface e adiciona comportamento |
| **Adapter vs Proxy** | Adapter muda interface; Proxy mantem mesma interface |
| **Facade vs Mediator** | Facade simplifica acesso unidirecional; Mediator centraliza comunicacao bidirecional |

---

### A.8. Conexao com dados

- **Troca de vendor** — novo gateway de pagamento = novo Adapter, pipeline inalterado
- **Multiplas APIs externas** — Facade unifica auth + rate limit + logging
- **Testes** — mock do Adapter sem depender de SDK externo
- **Config-driven** — Factory pode criar o Adapter correto por config (`adapter_type: "acme"`)

---

## Parte B: Observer/PubSub + Idempotent Consumer

### B.1. Problema que resolve

Pipeline termina ingestao e precisa disparar auditoria, alerta de fraude e atualizacao de metricas.
Se todos os efeitos ficam dentro do metodo `load()`, o core fica acoplado a tudo.
Alem disso, em politicas **at-least-once**, a mesma mensagem pode chegar mais de uma vez.

---

### B.2. Conceito + terminologia (Guru)

| Participante | Papel |
|---|---|
| **Publisher** | Objeto que emite eventos — mantem lista de subscribers |
| **Subscriber (interface)** | Declara metodo `update()` — contrato para receber notificacoes |
| **Concrete Subscriber** | Reage ao evento (auditar, alertar, persistir) |
| **Subscription mechanism** | `subscribe()`, `unsubscribe()`, `notify()` no Publisher |

**Idempotent Consumer** (Enterprise Integration Patterns):
Garante que processar a mesma mensagem 1 ou N vezes produz o **mesmo estado final**.
Essencial em cenarios com retries e at-least-once delivery.

---

### B.3. Estrutura

```text
  ┌─────────────────────────────┐
  │       Publisher              │
  │─────────────────────────────│
  │ - subscribers: list         │
  │ + subscribe(event, sub)     │
  │ + unsubscribe(event, sub)   │
  │ + notify(event, data)       │
  │   └─ for s in subs:         │
  │       s.update(data)        │
  └──────────────┬──────────────┘
                 │ notifica
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  ┌──────┐  ┌──────┐  ┌──────────────┐
  │Audit │  │Alert │  │Idempotent    │
  │Logger│  │Sender│  │Loader        │
  │      │  │      │  │(dedup por id)│
  └──────┘  └──────┘  └──────────────┘
  Concrete Subscribers
```

---

### B.4. Exemplo Python

```python
from abc import ABC, abstractmethod


# ─── SUBSCRIBER INTERFACE ─────────────────────────────────
# Contrato Guru: qualquer subscriber implementa update().

class EventSubscriber(ABC):
    @abstractmethod
    def update(self, event_name: str, payload: dict) -> None:
        ...


# ─── PUBLISHER ────────────────────────────────────────────
# Mecanismo de subscription: subscribe, unsubscribe, notify.

class EventPublisher:
    def __init__(self):
        self._subscribers: dict[str, list[EventSubscriber]] = {}

    def subscribe(self, event_name: str, subscriber: EventSubscriber) -> None:
        self._subscribers.setdefault(event_name, []).append(subscriber)

    def unsubscribe(self, event_name: str, subscriber: EventSubscriber) -> None:
        self._subscribers.get(event_name, []).remove(subscriber)

    def notify(self, event_name: str, payload: dict) -> None:
        for sub in self._subscribers.get(event_name, []):
            sub.update(event_name, payload)


# ─── CONCRETE SUBSCRIBERS ────────────────────────────────

class AuditLogger(EventSubscriber):
    """Registra evento em log de auditoria."""

    def update(self, event_name: str, payload: dict) -> None:
        print(f"[AUDIT] {event_name}: {payload}")


class FraudAlert(EventSubscriber):
    """Dispara alerta se valor ultrapassa limiar."""

    def __init__(self, threshold: float = 5000.0):
        self._threshold = threshold

    def update(self, event_name: str, payload: dict) -> None:
        if payload.get("amount", 0) > self._threshold:
            print(f"[FRAUD ALERT] Valor {payload['amount']} acima do limiar!")


class IdempotentLoader(EventSubscriber):
    """Persiste dados com deduplicacao por event_id.

    Idempotent Consumer: processar 1x ou Nx = mesmo estado final.
    Chave: event_id como dedup key.
    """

    def __init__(self):
        self._processed_ids: set[str] = set()

    def update(self, event_name: str, payload: dict) -> None:
        event_id = payload.get("event_id")
        if event_id in self._processed_ids:
            print(f"[LOADER] Duplicata ignorada: {event_id}")
            return
        self._processed_ids.add(event_id)
        print(f"[LOADER] Persistindo {event_id}: {payload}")


# ─── USO ──────────────────────────────────────────────────
bus = EventPublisher()
bus.subscribe("payment_confirmed", AuditLogger())
bus.subscribe("payment_confirmed", FraudAlert(threshold=5000))
bus.subscribe("payment_confirmed", IdempotentLoader())

# Evento normal
bus.notify("payment_confirmed", {"event_id": "evt-001", "amount": 1500})
# Duplicata (at-least-once) — IdempotentLoader ignora
bus.notify("payment_confirmed", {"event_id": "evt-001", "amount": 1500})
# Evento de alto valor — FraudAlert dispara
bus.notify("payment_confirmed", {"event_id": "evt-002", "amount": 8000})
```

**Saida esperada:**
```text
[AUDIT] payment_confirmed: {'event_id': 'evt-001', 'amount': 1500}
[LOADER] Persistindo evt-001: {'event_id': 'evt-001', 'amount': 1500}
[AUDIT] payment_confirmed: {'event_id': 'evt-001', 'amount': 1500}
[LOADER] Duplicata ignorada: evt-001
[AUDIT] payment_confirmed: {'event_id': 'evt-002', 'amount': 8000}
[FRAUD ALERT] Valor 8000 acima do limiar!
[LOADER] Persistindo evt-002: {'event_id': 'evt-002', 'amount': 8000}
```

---

### B.5. Anti-exemplo

```python
# ❌ Efeitos colaterais acoplados no metodo core
def load_data(rows):
    for row in rows:
        db.insert(row)
        audit_service.log(row)           # acoplamento direto
        if row["amount"] > 5000:
            fraud_service.alert(row)     # mais acoplamento
        metrics.increment("loaded")      # e mais...
    # Cada novo efeito exige mexer aqui dentro
```

---

### B.6. Pros e contras (Guru)

| Pros | Contras |
|------|---------|
| **OCP**: novo subscriber = nova classe, Publisher nao muda | Subscribers notificados em ordem **nao garantida** |
| Relacoes entre objetos **estabelecidas em runtime** | Debug mais dificil sem observabilidade (tracing/logging) |
| Core desacoplado de efeitos secundarios | Risco de **cascata invisivel** se subscriber falhar silenciosamente |

---

### B.7. Relacoes com outros patterns

| Relacao | Detalhe |
|---|---|
| **Observer vs Mediator** | Observer = conexoes dinamicas 1:N. Mediator = hub central que conhece todos |
| **Observer + Idempotent Consumer** | Combinacao essencial em mensageria at-least-once |
| **Chain of Responsibility vs Observer** | CoR passa request ate alguem processar. Observer notifica **todos** |

---

### B.8. Conexao com dados

- **at-least-once** (Kafka, SQS, Pub/Sub) — IdempotentLoader com chave dedup e obrigatorio
- **Desacoplamento** — novo subscriber (ex.: export para data lake) entra sem mudar o core
- **Observabilidade** — subscriber de metricas captura latencia, volume, erros por evento
- **Teste** — subscriber testavel isoladamente com payload fixo

---

## Parte C: Pipes & Filters + Router/Translator/Aggregator

### C.1. Problema que resolve

Evento chega em formatos diferentes por canal (app, web, parceiro).
Pipeline precisa validar, normalizar schema, rotear por regra e agregar.
Sem separacao, surge **transformador monolitico** que faz tudo e e impossivel testar por etapa.

---

### C.2. Conceito — Enterprise Integration Patterns

| Participante | Papel |
|---|---|
| **Filter** | Etapa independente: recebe dados, processa, produz saida. Sem estado compartilhado |
| **Pipe** | Conector entre filtros — passa saida de um como entrada do proximo |
| **Content-Based Router** | Escolhe caminho de processamento baseado no conteudo da mensagem |
| **Message Translator** | Converte formato/schema A para formato B |
| **Aggregator** | Consolida multiplas mensagens em uma unidade (soma, grupo, janela) |

**Principio:** cada filtro faz **uma coisa** e pode ser testado, substituido ou reordenado de forma independente.

---

### C.3. Estrutura

```text
  Evento bruto (multi-canal)
       │
       ▼
  ┌──────────┐     pipe     ┌──────────┐     pipe     ┌──────────┐
  │Translator│─────────────▶│  Router  │─────────────▶│Aggregator│
  │(normalize│              │(high vs  │              │(soma por │
  │ schema)  │              │ normal)  │              │ cliente) │
  └──────────┘              └────┬─────┘              └──────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼                         ▼
              high_value path           normal path
```

---

### C.4. Exemplo Python

```python
from abc import ABC, abstractmethod


# ─── FILTER (interface) ───────────────────────────────────
# Cada filtro segue um contrato unico: recebe dados, retorna dados.

class Filter(ABC):
    @abstractmethod
    def process(self, data: list[dict]) -> list[dict]:
        ...


# ─── TRANSLATOR: normaliza schema de entrada ─────────────
class SchemaTranslator(Filter):
    """Converte payload de varios canais para formato unico."""

    def process(self, data: list[dict]) -> list[dict]:
        result = []
        for event in data:
            result.append({
                "customer_id": event.get("userId") or event.get("customer_id"),
                "amount": float(event.get("value") or event.get("amount", 0)),
                "channel": event.get("channel", "unknown"),
            })
        return result


# ─── VALIDATOR: rejeita eventos invalidos ─────────────────
class RequiredFieldsValidator(Filter):
    """Remove eventos sem campos obrigatorios."""

    def __init__(self, required: list[str]):
        self._required = required

    def process(self, data: list[dict]) -> list[dict]:
        return [e for e in data if all(e.get(f) for f in self._required)]


# ─── ROUTER: separa caminhos por conteudo ─────────────────
class ContentBasedRouter:
    """Roteia eventos para pipelines diferentes por regra."""

    def __init__(self, condition, label_true: str = "high_value", label_false: str = "normal"):
        self._condition = condition
        self._label_true = label_true
        self._label_false = label_false

    def route(self, data: list[dict]) -> dict[str, list[dict]]:
        result = {self._label_true: [], self._label_false: []}
        for event in data:
            key = self._label_true if self._condition(event) else self._label_false
            result[key].append(event)
        return result


# ─── AGGREGATOR: consolida por grupo ──────────────────────
class CustomerAggregator:
    """Soma valores por customer_id."""

    def aggregate(self, data: list[dict]) -> list[dict]:
        totals: dict[str, float] = {}
        for event in data:
            cid = event["customer_id"]
            totals[cid] = totals.get(cid, 0) + event["amount"]
        return [{"customer_id": k, "total": v} for k, v in totals.items()]


# ─── PIPE: conecta filtros em sequencia ───────────────────
class Pipeline:
    """Pipe que encadeia filtros — saida de um e entrada do proximo."""

    def __init__(self, filters: list[Filter]):
        self._filters = filters

    def run(self, data: list[dict]) -> list[dict]:
        for f in self._filters:
            data = f.process(data)
        return data


# ─── USO COMPLETO ─────────────────────────────────────────
raw_events = [
    {"userId": "C1", "value": 1200, "channel": "app"},
    {"userId": "C2", "value": 300, "channel": "web"},
    {"customer_id": "C1", "amount": 800, "channel": "partner"},
    {"userId": None, "value": 500, "channel": "app"},  # invalido
]

# 1. Pipe de preparacao: Translator -> Validator
prep = Pipeline([
    SchemaTranslator(),
    RequiredFieldsValidator(["customer_id", "amount"]),
])
clean_data = prep.run(raw_events)

# 2. Router: separa por valor
router = ContentBasedRouter(condition=lambda e: e["amount"] >= 1000)
routes = router.route(clean_data)

# 3. Aggregator: soma por cliente nos dois caminhos
agg = CustomerAggregator()
print("High value:", agg.aggregate(routes["high_value"]))
print("Normal:", agg.aggregate(routes["normal"]))
```

**Saida esperada:**
```text
High value: [{'customer_id': 'C1', 'total': 1200}]
Normal: [{'customer_id': 'C2', 'total': 300}, {'customer_id': 'C1', 'total': 800}]
```

---

### C.5. Anti-exemplo

```python
# ❌ Transformador monolitico — faz tudo no mesmo metodo
def process_events(events):
    results = []
    for e in events:
        # traducao, validacao, roteamento e agregacao misturados
        cid = e.get("userId") or e.get("customer_id")
        if not cid:
            continue
        amount = float(e.get("value") or e.get("amount", 0))
        if amount >= 1000:
            # logica de high value aqui dentro
            pass
        results.append({"customer_id": cid, "amount": amount})
    # impossivel testar traducao sem testar tudo
    return results
```

---

### C.6. Pros e contras

| Pros | Contras |
|------|---------|
| Cada filtro testavel **isoladamente** | Coordenacao entre muitos filtros pode ser complexa |
| Adicionar/remover etapa sem mexer nas outras | Contratos entre filtros precisam ser bem definidos |
| Reuso de filtros em pipelines diferentes | Overhead de passagem de dados entre etapas |
| Escalabilidade: filtros podem rodar em paralelo | Debugging exige tracing de fluxo ponta a ponta |

---

### C.7. Relacoes com outros patterns

| Relacao | Detalhe |
|---|---|
| **Pipes/Filters + Strategy** | Cada Filter pode encapsular uma Strategy de transformacao |
| **Pipes/Filters + Factory** | Factory pode criar filtros por configuracao |
| **Router + Observer** | Router encaminha por conteudo; Observer notifica todos |
| **Aggregator + Template Method** | Aggregator pode padronizar logica de acumulacao com hooks |

---

### C.8. Conexao com dados

- **ETL multi-fonte** — Translator normaliza schema de cada fonte
- **Validacao por camada** — filtros de qualidade de dados encadeados
- **Roteamento de eventos** — Kafka consumer com Router por tipo de evento
- **Agregacao temporal** — janelas de 5min, 1h, por customer, por produto
- **Config-driven pipeline** — YAML define quais filtros e em que ordem

---

## Resumo geral

| Pattern | Problema que resolve | Quando usar |
|---|---|---|
| **Adapter** | Interface externa incompativel com contrato interno | Vendor/SDK externo com payload diferente do esperado |
| **Facade** | Subsistema complexo com muitas classes para orquestrar | Auth + rate limit + logging em um ponto unico |
| **Observer** | Core acoplado a efeitos secundarios (audit, alerta, metricas) | Multiplos listeners independentes por evento |
| **Idempotent Consumer** | Duplicata de mensagem gera estado inconsistente | Cenarios at-least-once (Kafka, SQS, Pub/Sub) |
| **Pipes/Filters** | Transformador monolitico impossivel de testar por etapa | Pipeline com etapas separaveis e reutilizaveis |
| **Router** | Fluxo precisa bifurcar por conteudo da mensagem | Multi-canal, regras por tipo de evento |
| **Translator** | Formatos de entrada variados precisam de schema unico | Multiplas fontes com payloads diferentes |
| **Aggregator** | Multiplas mensagens precisam virar uma unidade util | Soma, contagem, janela temporal |

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Plataforma de e-commerce recebe eventos de compra via app (campo `userId`), web (campo `customer_id`) e parceiro externo (campo `buyerId`). O **Translator** normaliza para `customer_id`. O **Validator** rejeita registros sem campos obrigatorios. O **Router** separa compras acima de R$1000 para revisao de fraude. O **Aggregator** calcula totais por cliente. Quando o vendor de pagamento muda o SDK, apenas o **Adapter** e atualizado. O evento `payment_confirmed` dispara **Observer** para audit log, alerta de fraude e metricas — cada um como subscriber independente. Se a fila entregar o evento duas vezes, o **IdempotentLoader** ignora a duplicata.

### Perguntas de checkpoint

1. Qual a diferenca entre Adapter e Facade? Quando voce usaria um vs o outro?
2. Se o vendor de pagamento trocar todos os nomes de campo amanha, quantos arquivos do seu pipeline precisariam mudar com Adapter vs sem Adapter?
3. Por que idempotencia nao e opcional em politicas at-least-once? O que acontece sem ela?
4. No seu pipeline atual, quantas etapas estao misturadas no mesmo metodo? Quais poderiam ser filtros independentes?

### Aplicacao imediata no trabalho

1. Escolha uma integracao externa e crie um Adapter com contrato unico de leitura
2. Adicione um subscriber de auditoria ao seu pipeline sem mexer no metodo `load()`
3. Implemente chave idempotente (`event_id`) em um consumidor critico
4. Quebre um transformador monolitico em pelo menos 3 filtros testados isoladamente

---

## Proximo passo

**Modulo 04:** OOP Aplicado em Pipelines de Dados (pratica hands-on).

---

## Referencias

- Refactoring Guru — Adapter: https://refactoring.guru/design-patterns/adapter
- Refactoring Guru — Facade: https://refactoring.guru/design-patterns/facade
- Refactoring Guru — Observer: https://refactoring.guru/design-patterns/observer
- Enterprise Integration Patterns (Hohpe & Woolf): https://www.enterpriseintegrationpatterns.com/
- Python Docs — abc: https://docs.python.org/3/library/abc.html
