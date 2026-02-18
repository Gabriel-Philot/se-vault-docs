# Mini-Aula 3.5.1: Strategy para Regras Volateis

> **Objetivo:** Usar Strategy para isolar variacao de regra de negocio sem quebrar o fluxo principal do pipeline.

---

## 0. O que e novo vs 03-OPP

No `03-OPP`, Strategy apareceu como ideia dentro de composicao.
Aqui o foco e decisao de engenharia: quando vale criar estrategias, quando nao vale, e qual teste minimo protege o refactor.

---

## 1. Problema real de dados

Pipeline unico processa pedidos de varios paises.
Cada pais muda regra fiscal em ritmos diferentes.
Sem isolamento, o core vira `if/elif` infinito.

---

## 2. Conceito

Strategy separa "variacao de regra" do "fluxo estavel".
O pipeline chama um contrato comum e troca apenas a estrategia.

---

## 3. Exemplo curto em Python

```python
from abc import ABC, abstractmethod

class TaxStrategy(ABC):
    @abstractmethod
    def apply(self, order: dict) -> dict:
        pass

class BrTax(TaxStrategy):
    def apply(self, order: dict) -> dict:
        order["tax"] = round(order["amount"] * 0.17, 2)
        return order

class UsTax(TaxStrategy):
    def apply(self, order: dict) -> dict:
        order["tax"] = round(order["amount"] * 0.08, 2)
        return order

class TaxPipeline:
    def __init__(self, strategy: TaxStrategy):
        self.strategy = strategy

    def run(self, rows: list[dict]) -> list[dict]:
        return [self.strategy.apply(r.copy()) for r in rows]
```

---

## 4. Anti-exemplo comum

```python
def apply_tax(order, country):
    if country == "BR":
        order["tax"] = order["amount"] * 0.17
    elif country == "US":
        order["tax"] = order["amount"] * 0.08
    elif country == "MX":
        order["tax"] = order["amount"] * 0.12
    # cresce toda sprint
    return order
```

---

## 5. Quando usar, quando nao usar, trade-off

Use quando:
- regras mudam com frequencia
- multiplos mantenedores alteram o mesmo trecho
- custo de erro e alto

Nao use quando:
- existe 1 regra estavel
- vida util curta (script ad hoc)

Trade-off explicito:
- ganha extensibilidade e teste por regra
- paga custo de mais classes e governanca de naming

---

## 6. Teste minimo esperado

1. teste de contrato: toda estrategia devolve dict valido
2. teste por estrategia: BR e US com amostra fixa
3. teste de fallback: pais nao suportado gera erro claro

---

## 7. Bloco didatico: conhecimento proximal

### Cenario real de dados

Time de revenue recebe nova regra de imposto por pais quase todo mes.
Strategy evita refactor no loop inteiro a cada mudanca.

### Pergunta de checkpoint

A variacao do seu pipeline esta na sequencia do fluxo ou na regra de negocio de um passo?

### Aplicacao imediata no trabalho

Escolha um `if/elif` por cliente/pais e extraia 2 estrategias sem mexer no loop principal.

---

## 8. Resumo

- Strategy desacopla regra volatil do fluxo estavel
- evita condicional estrutural crescendo
- sem teste por estrategia, vira apenas complexidade extra

