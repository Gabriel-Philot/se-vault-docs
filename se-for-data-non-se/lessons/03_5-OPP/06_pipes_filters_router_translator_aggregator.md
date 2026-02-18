# Mini-Aula 3.5.6: Pipes/Filters + Router/Translator/Aggregator

> **Objetivo:** Estruturar fluxo de dados com etapas coesas e combinar padroes de integracao para rotear, traduzir e agregar.

---

## 0. O que e novo vs 03-OPP

No `03-OPP`, composicao foi vista dentro de OOP.
Aqui aplicamos combinacoes classicas de integracao para pipelines reais com multiplos caminhos.

---

## 1. Problema real de dados

Evento chega em formatos diferentes por canal.
Pipeline precisa validar, normalizar schema, rotear por regra e agregar por janela.
Sem separacao clara, surge transformador monolitico dificil de testar.

---

## 2. Conceito

- Pipes and Filters: cadeia de etapas independentes
- Content-Based Router: escolhe caminho por conteudo
- Message Translator: converte formato A para B
- Aggregator: consolida multiplas mensagens em uma unidade util

---

## 3. Exemplo curto em Python

```python
class Translator:
    def run(self, event: dict) -> dict:
        return {"customer_id": event["userId"], "amount": event["value"]}

class Router:
    def run(self, event: dict) -> str:
        return "high_value" if event["amount"] >= 1000 else "normal"

class Aggregator:
    def __init__(self):
        self.total_by_customer = {}

    def run(self, event: dict):
        cid = event["customer_id"]
        self.total_by_customer[cid] = self.total_by_customer.get(cid, 0) + event["amount"]
        return {"customer_id": cid, "running_total": self.total_by_customer[cid]}
```

---

## 4. Anti-exemplo comum

- uma classe faz parse, validacao, roteamento, agregacao e persistencia
- regra de roteamento escondida em if aninhado
- agregacao sem criterio claro de janela/grupo

---

## 5. Quando usar, quando nao usar, trade-off

Use quando:
- fluxo tem etapas claramente separaveis
- existe variacao de rota por conteudo
- multiplas mensagens precisam consolidacao

Nao use quando:
- caso simples linear com 1-2 etapas estaveis
- custo de orquestrar muitos componentes nao se paga

Trade-off explicito:
- ganha coesao, teste isolado e evolucao por etapa
- paga custo de coordenacao entre etapas e contratos

---

## 6. Teste minimo esperado

1. contrato de cada filtro (input/output)
2. determinismo do roteamento para casos limite
3. traducao de schema com campos obrigatorios
4. agregacao correta para lote pequeno de eventos

---

## 7. Bloco didatico: conhecimento proximal

### Cenario real de dados

Plataforma recebe compras de app, web e parceiro externo.
Translator normaliza schema, Router separa risco alto, Aggregator compoe indicadores de cliente.

### Pergunta de checkpoint

Seu pipeline consegue evoluir uma etapa sem obrigar refactor em todas as outras?

### Aplicacao imediata no trabalho

Quebre um transformador monolitico em no minimo 3 etapas: tradutor, roteador e agregador.

---

## 8. Resumo

- Pipes/Filters aumentam modularidade do fluxo
- Router/Translator/Aggregator resolvem variacao de caminho e formato
- sem contrato entre etapas, composicao vira acoplamento disfarcado

