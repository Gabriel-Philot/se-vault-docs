# Mini-Aula 3.6: Composicao vs Heranca

> **Objetivo:** Aplicar a regra "favor composition over inheritance" para reduzir acoplamento e aumentar flexibilidade.
> **Fontes:** [GoF — Design Patterns, p. 33](https://en.wikipedia.org/wiki/Design_Patterns) · [Refactoring Guru — Replace Inheritance with Delegation](https://refactoring.guru/refactoring/replace-inheritance-with-delegation) · [Python Docs — abc](https://docs.python.org/3/library/abc.html)

---

## 1. Problema que composicao resolve

Heranca profunda cria acoplamento forte: mudar o pai pode quebrar todos os filhos.

```python
# ⚠️ HERANCA PROFUNDA: acoplamento em cascata
class BaseTransform:
    def validate(self, rows): ...
    def normalize(self, rows): ...
    def apply(self, rows): ...

class BusinessTransform(BaseTransform):
    def apply_rules(self, rows): ...

class ClientATransform(BusinessTransform):
    def apply(self, rows):
        rows = self.validate(rows)      # herdado de BaseTransform
        rows = self.normalize(rows)     # herdado de BaseTransform
        rows = self.apply_rules(rows)   # herdado de BusinessTransform
        return [r for r in rows if r.get("active")]

class ClientBTransform(BusinessTransform):
    def apply(self, rows):
        rows = self.validate(rows)
        rows = self.normalize(rows)
        rows = self.apply_rules(rows)
        return [{"id": r["id"]} for r in rows]

# 3 niveis de heranca. Se BaseTransform.validate() mudar,
# ClientA e ClientB podem quebrar sem aviso.
# Se ClientC precisar de normalize() mas nao apply_rules()? Refused Bequest.
```

**Principio GoF (p. 33):**
> "Favor object composition over class inheritance. [...] Your classes and class hierarchies will remain small and will be less likely to grow into unmanageable monsters."

---

## 2. Composicao em uma frase

Composicao = montar comportamento **combinando objetos menores** em vez de herdar de uma cadeia de pais.

A relacao muda de "**e um**" (is-a) para "**tem um**" (has-a).

---

## 3. Antes/depois completo

### ⚠️ ANTES: hierarquia para cada combinacao

```python
# "Class explosion": cada variacao exige nova subclasse
class BaseTransform:
    def apply(self, rows: list[dict]) -> list[dict]:
        raise NotImplementedError

class FilterActiveTransform(BaseTransform):
    def apply(self, rows):
        return [r for r in rows if r.get("active")]

class MapIdTransform(BaseTransform):
    def apply(self, rows):
        return [{"id": r["id"]} for r in rows]

# E se precisar filtrar E mapear? Nova subclasse!
class FilterAndMapTransform(BaseTransform):
    def apply(self, rows):
        filtered = [r for r in rows if r.get("active")]
        return [{"id": r["id"]} for r in filtered]

# E se precisar validar antes? Mais uma subclasse.
# Para N comportamentos, temos 2^N combinacoes possiveis.
```

### ✅ DEPOIS: composicao com Strategy

```python
from abc import ABC, abstractmethod

# Contrato com ABC — consistente com Mini-Aula 3.3 e 3.5
class TransformStrategy(ABC):
    """Cada estrategia faz UMA coisa bem feita."""

    @abstractmethod
    def apply(self, rows: list[dict]) -> list[dict]:
        ...

class FilterActive(TransformStrategy):
    def apply(self, rows: list[dict]) -> list[dict]:
        return [r for r in rows if r.get("active")]

class MapIdOnly(TransformStrategy):
    def apply(self, rows: list[dict]) -> list[dict]:
        return [{"id": r["id"]} for r in rows]

class ValidateRequired(TransformStrategy):
    def __init__(self, required_fields: list[str]):
        self._required = required_fields

    def apply(self, rows: list[dict]) -> list[dict]:
        return [r for r in rows if all(f in r for f in self._required)]


class Pipeline:
    """Compoe estrategias — nao herda de nada."""

    def __init__(self, strategies: list[TransformStrategy]):
        self._strategies = strategies  # "tem" estrategias (has-a)

    def run(self, rows: list[dict]) -> list[dict]:
        for strategy in self._strategies:
            rows = strategy.apply(rows)
        return rows

    def add(self, strategy: TransformStrategy) -> None:
        """Troca/adiciona em runtime — impossivel com heranca."""
        self._strategies.append(strategy)


# Monta comportamento por combinacao, nao por hierarquia
pipe_a = Pipeline([
    ValidateRequired(["id", "active"]),
    FilterActive(),
    MapIdOnly(),
])

pipe_b = Pipeline([
    ValidateRequired(["id"]),
    MapIdOnly(),
])

data = [
    {"id": 1, "active": True, "name": "Alice"},
    {"id": 2, "active": False, "name": "Bob"},
    {"id": 3, "name": "Charlie"},  # sem "active"
]

print(pipe_a.run(data))  # [{"id": 1}]
print(pipe_b.run(data))  # [{"id": 1}, {"id": 2}, {"id": 3}]
```

**O que mudou:**

| Aspecto | Heranca | Composicao |
|---------|---------|------------|
| Nova combinacao | Nova subclasse | Nova lista de estrategias |
| Trocar em runtime | Impossivel | `pipeline.add(strategy)` |
| Testar | Precisa de toda a hierarquia | Cada estrategia isolada |
| Codigo novo | Classe inteira | Apenas a estrategia nova |

---

## 4. Delegation — a mecanica por tras da composicao

Composicao funciona atraves de **delegacao**: o objeto principal delega tarefas a objetos internos.

```python
# Delegacao explicita: Pipeline delega para strategies
class Pipeline:
    def __init__(self, strategies):
        self._strategies = strategies

    def run(self, rows):
        for s in self._strategies:
            rows = s.apply(rows)  # delega — nao implementa
        return rows
```

Refactoring Guru chama isso de **"Replace Inheritance with Delegation"** — transformar "is-a" em "has-a":

1. Crie um campo para o objeto que antes era pai
2. Delegue chamadas de metodo para esse objeto
3. Remova a heranca

---

## 5. "Class Explosion" — o problema que composicao evita

Com heranca, cada **combinacao** de comportamentos requer uma subclasse dedicada:

```text
# Para 3 comportamentos independentes (filtrar, mapear, validar):
# Heranca: ate 2^3 = 8 subclasses

FilterTransform
MapTransform
ValidateTransform
FilterAndMapTransform
FilterAndValidateTransform
MapAndValidateTransform
FilterMapValidateTransform
NoOpTransform

# Composicao: 3 estrategias + 1 Pipeline
# Combinacoes sao feitas em runtime, nao em codigo
```

---

## 6. Checklist de decisao

| Pergunta | Se "sim" → | Se "nao" → |
|----------|------------|------------|
| Existe relacao **genuina** de "e um tipo de"? | Heranca | Composicao |
| O filho usa **todos** os metodos do pai? | Heranca | Composicao (Refused Bequest) |
| Comportamento pode variar **por configuracao**? | Composicao | Heranca |
| Troca em **runtime** e desejavel? | Composicao | Heranca pode servir |
| Hierarquia tem **3+ niveis**? | Refatore para composicao | OK se raso |
| Precisa de **metodos concretos** do pai? | Heranca (com ABC) | Composicao |

---

## 7. Conexao com SOLID

| Principio | Como composicao ajuda |
|-----------|----------------------|
| **S** — Single Responsibility | Cada estrategia faz UMA coisa |
| **O** — Open/Closed | Nova estrategia = nova classe. Pipeline nao muda |
| **L** — Liskov Substitution | Todas as estrategias sao substituiveis (mesmo contrato) |
| **I** — Interface Segregation | Contrato minimo: apenas `apply()` |
| **D** — Dependency Inversion | Pipeline depende de `TransformStrategy` (abstracao), nao de implementacao |

---

## 8. Pros e contras

| | Pros | Contras |
|--|------|---------|
| **Composicao** | Baixo acoplamento | Mais objetos no sistema |
| | Troca em runtime | Pode obscurecer fluxo (muita delegacao) |
| | Evita class explosion | Requer design de interfaces claras |
| | Cada peca testavel isoladamente | Overhead de setup (montar pipeline) |
| **Heranca** | Reutiliza comportamento do pai | Acoplamento forte ao pai |
| | Menos boilerplate se a relacao e genuina | Hierarquias profundas sao frageis |
| | Polimorfismo natural (`isinstance()`) | Mudar pai gera efeito cascata |

---

## 9. Conexao com dados

- **Etapas de transformacao plugaveis** — cada `TransformStrategy` e uma etapa do pipeline
- **Regras de validacao injetaveis** por dominio/cliente sem criar subclasses
- **Menos risco de cascata** — mudar uma estrategia nao afeta as outras
- **Testes unitarios** — cada estrategia testavel com dados minimos
- **Config-driven pipelines** — montar pipeline a partir de arquivo YAML/JSON

```python
# Exemplo: pipeline configuravel por dominio
strategies_config = {
    "client_a": [ValidateRequired(["id"]), FilterActive(), MapIdOnly()],
    "client_b": [ValidateRequired(["id", "name"]), MapIdOnly()],
}

pipeline = Pipeline(strategies_config["client_a"])
```

---

## 10. Resumo

| Conceito | Ponto-chave |
|----------|-------------|
| Composicao | "Has-a" em vez de "is-a" — monta comportamento com objetos menores |
| Delegacao | Objeto principal delega tarefas a objetos internos |
| Class Explosion | Heranca combinatoria gera 2^N subclasses — composicao evita |
| GoF | "Favor object composition over class inheritance" (p. 33) |
| Strategy | Porta de entrada para composicao — encapsula comportamento variavel |
| Checklist | Se o comportamento varia por config ou precisa trocar em runtime → composicao |
| Heranca nao e vilao | Quando a relacao "is-a" e genuina e o contrato e estavel, heranca e valida |

---

## Proximo passo

**Mini-Aula 3.7:** Factory Method (Guru).

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Seu pipeline processa dados de 5 clientes. Cada cliente tem regras diferentes de validacao, filtragem e mapeamento. Com heranca, voce teria `ClientATransform`, `ClientBTransform`, ..., cada um herdando de `BaseTransform` e sobrescrevendo metodos.

Com composicao, voce cria estrategias reutilizaveis (`ValidateRequired`, `FilterActive`, `MapIdOnly`) e monta o pipeline de cada cliente com uma lista diferente de estrategias. Quando ClientF chega, zero classes novas — apenas nova combinacao.

### Perguntas de checkpoint

1. Se voce tem 4 comportamentos independentes (filtrar, mapear, validar, enriquecer), quantas subclasses precisaria com heranca combinatoria? E com composicao?
2. Quando heranca **e** a melhor escolha, mesmo que composicao seja possivel?
3. No seu pipeline, o `Pipeline` sabe qual estrategia esta rodando? Deveria saber? Por que?

### Aplicacao imediata no trabalho

1. Identifique uma classe com muitos `if/elif` para regras de negocio diferentes
2. Extraia cada ramo em uma **estrategia** separada com `apply()` + ABC
3. Crie um driver (`Pipeline`) que receba a lista de estrategias
4. Compare: quantas linhas/classes o antes tinha vs o depois?
