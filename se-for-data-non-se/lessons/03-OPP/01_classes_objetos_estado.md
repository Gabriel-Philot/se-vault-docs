# Mini-Aula 3.1: Classes, Objetos e Estado

> **Objetivo:** Entender classe vs instancia, papel do `self` e como estado mutavel impacta pipelines.

---

## 1. Classe vs Instancia

- **Classe**: blueprint (estrutura + comportamento)
- **Instancia**: objeto concreto com dados reais

```python
class DataSource:
    def __init__(self, name: str):
        self.name = name

csv = DataSource("csv_orders")
api = DataSource("api_orders")
```

Ambos seguem o mesmo molde, mas carregam estado proprio.

---

## 2. O papel do `self`

Quando voce chama `csv.read()`, Python internamente chama `DataSource.read(csv)`.

`self` e a referencia para a instancia atual.

```python
class Counter:
    def __init__(self):
        self.value = 0

    def inc(self):
        self.value += 1
```

Sem `self`, o metodo nao saberia qual objeto deve ser alterado.

---

## 3. Estado mutavel e efeitos colaterais

Estado mutavel e util, mas pode gerar bugs quando compartilhado sem controle.

```python
class BatchCollector:
    def __init__(self):
        self.rows = []

    def add(self, row):
        self.rows.append(row)
```

Se varios fluxos usam o mesmo objeto, todos alteram `rows`.

Regra pratica:

- Deixe claro quem e dono do estado
- Evite compartilhar instancias globalmente sem necessidade

---

## 4. Exemplo aplicado em dados

```python
class SourceRun:
    def __init__(self, source_name: str):
        self.source_name = source_name
        self.records_read = 0

    def read(self, rows: list[dict]):
        self.records_read += len(rows)
        return rows

run = SourceRun("csv")
run.read([{"id": 1}, {"id": 2}])
print(run.records_read)  # 2
```

`records_read` pertence a esta execucao, nao ao sistema inteiro.

---

## 5. Erro comum -> correcao

| Erro comum | Correcao |
|------------|----------|
| Usar lista mutavel como atributo de classe | Inicializar no `__init__` |
| Guardar tudo em variavel global | Manter estado na instancia |
| Reutilizar objeto entre jobs sem reset | Criar nova instancia por execucao |
| Misturar configuracao com estado de runtime | Separar `config` de `metrics/state` |

---

## 6. Conexao com dados

- Cada run de pipeline deve ter estado isolado
- Metricas por execucao (linhas lidas, rejeitadas, escritas)
- Objetos com responsabilidade unica facilitam debug

---

## 7. Resumo

- Classe define comportamento; instancia guarda estado real
- `self` conecta metodo ao objeto certo
- Estado mutavel exige controle de ownership
- Em dados, isolamento por run evita bugs intermitentes

---

## Proximo passo

**Mini-Aula 3.2:** Encapsulamento de Verdade.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Um DAG roda em paralelo para paises diferentes. Se o estado da execucao ficar global, um pais contamina metrica do outro.
Instancias separadas por run evitam esse bug.

### Pergunta de checkpoint

Sua classe representa configuracao estatica, estado de runtime, ou os dois misturados?

### Aplicacao imediata no trabalho

Escolha um job atual e separe explicitamente `config` (imutavel) de `state` (mutavel por execucao).
