# Mini-Aula 3.5.5: Observer/PubSub e Idempotent Consumer

> **Objetivo:** Desacoplar eventos do core e garantir seguranca em reprocessamento com comportamento idempotente.

---

## 0. O que e novo vs 03-OPP

No `03-OPP`, Observer apareceu como recomendacao de matriz.
Aqui entramos no comportamento operacional: duplicidade de mensagem, retries e efeitos colaterais.

---

## 1. Problema real de dados

Consumidor recebe eventos com politica at-least-once.
Sem idempotencia, a mesma mensagem duplica cargas e metricas.

---

## 2. Conceito

- Observer/PubSub: produtor emite evento sem conhecer listeners concretos
- Idempotent Consumer: mesma mensagem processada 1 ou N vezes gera o mesmo estado final

---

## 3. Exemplo curto em Python

```python
class EventBus:
    def __init__(self):
        self._subs = {}

    def subscribe(self, event_name: str, handler):
        self._subs.setdefault(event_name, []).append(handler)

    def publish(self, event_name: str, payload: dict):
        for handler in self._subs.get(event_name, []):
            handler(payload)

class IdempotentLoader:
    def __init__(self):
        self.processed_ids = set()

    def handle(self, event: dict):
        event_id = event["event_id"]
        if event_id in self.processed_ids:
            return
        self.processed_ids.add(event_id)
        print(f"persistindo event_id={event_id}")
```

---

## 4. Anti-exemplo comum

- side effects de notificacao dentro do metodo core
- consumidor sem chave idempotente
- cada retry gera novo insert

---

## 5. Quando usar, quando nao usar, trade-off

Use quando:
- ha listeners independentes (monitoramento, alerta, auditoria)
- retries/duplicatas sao provaveis
- precisa desacoplar core de efeitos secundarios

Nao use quando:
- fluxo ultra simples e totalmente sincrono
- custo de eventificacao supera ganho real

Trade-off explicito:
- ganha desacoplamento e resiliencia operacional
- debugging fica mais dificil sem observabilidade boa

---

## 6. Teste minimo esperado

1. emissao de evento para listener correto
2. deduplicacao por `event_id`
3. retry nao altera estado final

---

## 7. Bloco didatico: conhecimento proximal

### Cenario real de dados

Evento `payment_confirmed` dispara carga no warehouse e alerta de fraude.
Sem idempotencia, duplicata gera contagem inflada.

### Pergunta de checkpoint

Se a mesma mensagem chegar duas vezes hoje, seu sistema duplica dado ou mantem estado final correto?

### Aplicacao imediata no trabalho

Adicione chave idempotente em um consumidor critico e valide com teste de mensagem duplicada.

---

## 8. Resumo

- Observer/PubSub desacopla efeitos secundarios
- idempotencia e obrigatoria em cenarios com retry/duplicata
- sem telemetria minima, diagnostico de evento fica opaco

