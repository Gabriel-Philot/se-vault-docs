# Mini-Aula 3.6: Composição vs Herança

> **Objetivo:** Aplicar a regra "favor composition over inheritance" para reduzir acoplamento.

---

## 1. Composicao em uma frase

Composicao = montar comportamento combinando objetos menores.

Em vez de uma classe filha gigantesca, voce injeta componentes especializados.

---

## 2. Exemplo com Strategy simples

```python
class TransformStrategy:
    def apply(self, rows: list[dict]) -> list[dict]:
        raise NotImplementedError

class FilterActive(TransformStrategy):
    def apply(self, rows):
        return [r for r in rows if r.get("active")]

class MapIdOnly(TransformStrategy):
    def apply(self, rows):
        return [{"id": r["id"]} for r in rows]

class PipelineStep:
    def __init__(self, strategy: TransformStrategy):
        self.strategy = strategy

    def run(self, rows):
        return self.strategy.apply(rows)
```

Trocar estrategia nao exige nova hierarquia.

---

## 3. Checklist de decisao

Use heranca quando:

- Existe relacao clara de especializacao
- Reuso do pai e estavel
- Override e pontual

Use composicao quando:

- Comportamento varia por configuracao
- Troca em runtime e desejavel
- Heranca comeca a crescer em profundidade

---

## 4. Conexao com dados

- Etapas de transformacao plugaveis
- Regras de validacao injetaveis por dominio
- Menos risco de "efeito cascata" ao alterar classe base

---

## 5. Resumo

- Composicao reduz acoplamento estrutural
- Heranca e util, mas nao default
- Strategy e porta de entrada simples para composicao

---

## Proximo passo

**Mini-Aula 3.7:** Factory Method (Guru).

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Regras de transformacao mudam por cliente. Em vez de criar `ClientAFilterTransform`, `ClientBFilterTransform`, injete estrategias configuraveis.

### Pergunta de checkpoint

A variacao que voce precisa acontece por tipo fixo (heranca) ou por combinacao de comportamento (composicao)?

### Aplicacao imediata no trabalho

Pegue uma transformacao com muitos `ifs` de regra de negocio e extraia 2 estrategias separadas.
