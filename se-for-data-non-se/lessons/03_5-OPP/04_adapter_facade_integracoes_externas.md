# Mini-Aula 3.5.4: Adapter e Facade para Integracoes Externas

> **Objetivo:** Proteger o dominio de dados contra mudancas de SDK/vendor via Adapter e simplificar uso de multiplas dependencias via Facade.

---

## 0. O que e novo vs 03-OPP

No `03-OPP`, a integracao externa foi citada de forma breve.
Aqui focamos em fronteira de integracao: mapear interface, erro e timeout sem contaminar o core.

---

## 1. Problema real de dados

Um vendor muda payload, nomes de campo e codigos de erro.
Sem camada de adaptacao, mudanca externa quebra transformacoes internas e testes.

---

## 2. Conceito

- Adapter: converte interface externa para contrato interno
- Facade: oferece ponto unico e simples para varias chamadas externas

---

## 3. Exemplo curto em Python (Adapter)

```python
class VendorClient:
    def fetch(self) -> dict:
        return {"orderId": "10", "totalValue": 99.9}

class OrderProviderAdapter:
    def __init__(self, client: VendorClient):
        self.client = client

    def read_order(self) -> dict:
        raw = self.client.fetch()
        return {
            "order_id": int(raw["orderId"]),
            "amount": float(raw["totalValue"]),
        }
```

---

## 4. Anti-exemplo comum

- codigo de dominio lendo resposta crua do vendor em varios modulos
- `try/except` de SDK espalhado no pipeline
- retries e timeout duplicados em cada task

---

## 5. Quando usar, quando nao usar, trade-off

Use quando:
- interface externa nao bate com contrato interno
- mudanca de vendor e risco real
- precisa manter core estavel

Nao use quando:
- interface externa ja e igual a interna e estavel
- camada extra so adicionaria indirecao

Trade-off explicito:
- ganha isolamento e troca de fornecedor mais barata
- paga custo de mais uma camada para manter

---

## 6. Teste minimo esperado

1. mapeamento de campos entrada/saida
2. mapeamento de erro externo para erro interno
3. comportamento de timeout/retry no limite definido

---

## 7. Bloco didatico: conhecimento proximal

### Cenario real de dados

Pipeline de conciliacao depende de API bancaria third-party.
Adapter evita que cada alteracao do banco force refactor em toda regra de negocio.

### Pergunta de checkpoint

Seu dominio "conhece" detalhes do SDK externo ou apenas o contrato interno?

### Aplicacao imediata no trabalho

Escolha uma integracao critica e crie um adapter com contrato unico de leitura/escrita.

---

## 8. Resumo

- Adapter protege dominio de mudanca externa
- Facade simplifica uso de varias dependencias
- sem testes de mapeamento, a camada perde seu valor

