# Mini-Aula 3.5.3: Template Method vs Composicao em ETL

> **Objetivo:** Decidir entre esqueleto fixo (Template Method) e montagem flexivel (composicao) em pipelines ETL.

---

## 0. O que e novo vs 03-OPP

No `03-OPP`, vimos composicao vs heranca de forma geral.
Aqui a decisao e aplicada a ETL: quando padronizar ordem fixa e quando evitar heranca.

---

## 1. Problema real de dados

Fluxo ETL tem etapas sempre iguais (`extract -> validate -> transform -> load`), mas alguns clientes precisam hooks extras.
Sem criterio, time mistura override, flags e condicionais no mesmo lugar.

---

## 2. Conceito

Template Method define algoritmo fixo na classe base e deixa pontos de extensao.
Composicao monta etapas como objetos independentes e troca sequencia com menos heranca.

---

## 3. Exemplo curto em Python (Template Method)

```python
from abc import ABC, abstractmethod

class BaseEtl(ABC):
    def run(self):
        rows = self.extract()
        rows = self.transform(rows)
        self.load(rows)

    @abstractmethod
    def extract(self):
        pass

    def transform(self, rows):
        return rows

    @abstractmethod
    def load(self, rows):
        pass

class CsvToWarehouse(BaseEtl):
    def extract(self):
        return [{"id": 1}]

    def transform(self, rows):
        return [{"id": r["id"], "source": "csv"} for r in rows]

    def load(self, rows):
        print(f"loaded {len(rows)} rows")
```

---

## 4. Anti-exemplo comum

- hierarquia com 4-5 niveis para pequenos desvios
- override de metodo inteiro so para mudar 1 linha
- classe filha quebrando pre-condicoes da classe base

---

## 5. Quando usar, quando nao usar, trade-off

Use Template Method quando:
- ordem do fluxo e estavel
- variacao cabe em poucos hooks

Prefira composicao quando:
- sequencia muda por cliente/produto
- combinacoes de etapas crescem rapido

Trade-off explicito:
- template reduz duplicacao de fluxo
- heranca profunda dificulta manutencao e teste isolado

---

## 6. Teste minimo esperado

1. teste do fluxo base (ordem das etapas)
2. teste do hook sobrescrito
3. teste de nao regressao para classe base ao criar nova filha

---

## 7. Bloco didatico: conhecimento proximal

### Cenario real de dados

Mesma empresa possui ETL diario para financeiro e marketing.
Fluxo e parecido, mas regras de validacao diferem.

### Pergunta de checkpoint

Sua variacao exige mudar a ordem de etapas ou apenas o comportamento dentro da mesma ordem?

### Aplicacao imediata no trabalho

Escolha um ETL com passos fixos e extraia um template com no maximo 2 hooks.

---

## 8. Resumo

- Template Method funciona para fluxo estavel com variacoes pontuais
- composicao ganha quando combinacao de etapas muda muito
- sinal de risco: heranca profunda para resolver variacoes pequenas

