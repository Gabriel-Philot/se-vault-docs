# Mini-Aula 3.1: Classes, Objetos e Estado

> **Objetivo:** Entender classe vs instancia, papel do `self`, diferenca entre variavel de classe e variavel de instancia, e como estado mutavel impacta pipelines.
> **Fonte:** [Python Docs — Classes (§9.3–9.4)](https://docs.python.org/3/tutorial/classes.html)

---

## 1. Problema que este conceito resolve

Sem classes, dados e funcoes que operam nesses dados ficam soltos.
Voce acaba passando dicionarios entre funcoes, perdendo controle sobre quem altera o que.

```python
# Sem classes: dados e logica desacoplados
run_data = {"source": "csv", "records_read": 0}

def read(run_data, rows):
    run_data["records_read"] += len(rows)
    return rows

# Qualquer parte do codigo pode alterar run_data por engano
run_data["records_read"] = -999  # ninguem impede
```

Classes agrupam dados + comportamento em uma unica unidade, tornando claro quem e dono do estado.

---

## 2. Classe vs Instancia

- **Classe**: blueprint — define estrutura (atributos) e comportamento (metodos)
- **Instancia**: objeto concreto criado a partir da classe, com dados proprios

```python
class DataSource:
    def __init__(self, name: str):
        self.name = name  # atributo de instancia — cada objeto tem o seu

csv = DataSource("csv_orders")   # instancia 1
api = DataSource("api_orders")   # instancia 2

# Mesmo molde, dados independentes
print(csv.name)  # csv_orders
print(api.name)  # api_orders
```

Quando voce chama `DataSource("csv_orders")`, Python:
1. Cria um objeto vazio do tipo `DataSource`
2. Chama automaticamente `__init__(self, "csv_orders")` — o `self` aponta para o objeto recem-criado
3. Retorna o objeto ja inicializado

---

## 3. Variavel de classe vs variavel de instancia

Este e um ponto critico que a documentacao do Python destaca com um exemplo classico:

```python
# ⚠️ ERRADO: lista mutavel como variavel de CLASSE
class BatchCollector:
    rows = []  # compartilhada entre TODAS as instancias!

    def add(self, row):
        self.rows.append(row)

a = BatchCollector()
b = BatchCollector()
a.add({"id": 1})
b.add({"id": 2})

print(a.rows)  # [{"id": 1}, {"id": 2}] — contaminado!
print(b.rows)  # [{"id": 1}, {"id": 2}] — mesmo objeto!
print(a.rows is b.rows)  # True — sao a mesma lista
```

```python
# ✅ CORRETO: lista mutavel como variavel de INSTANCIA
class BatchCollector:
    def __init__(self):
        self.rows = []  # cada instancia tem sua propria lista

    def add(self, row):
        self.rows.append(row)

a = BatchCollector()
b = BatchCollector()
a.add({"id": 1})
b.add({"id": 2})

print(a.rows)  # [{"id": 1}] — isolado
print(b.rows)  # [{"id": 2}] — isolado
print(a.rows is b.rows)  # False — objetos diferentes
```

**Regra:** variaveis de classe servem para valores compartilhados e imutaveis (ex: constantes). Dados mutaveis devem sempre ser inicializados no `__init__`.

---

## 4. O papel do `self`

Quando voce chama `csv.read()`, Python internamente transforma isso em `DataSource.read(csv)`.

`self` e a referencia para a instancia que esta chamando o metodo. Sem ele, o metodo nao saberia qual objeto alterar.

```python
class Counter:
    def __init__(self):
        self.value = 0  # self conecta 'value' a ESTA instancia

    def inc(self):
        self.value += 1  # altera o value DESTE objeto, nao de outro

c1 = Counter()
c2 = Counter()
c1.inc()
c1.inc()
c2.inc()

print(c1.value)  # 2 — estado isolado
print(c2.value)  # 1 — estado isolado
```

> **Nota:** `self` e uma **convencao**, nao uma palavra reservada do Python. Voce poderia usar qualquer nome, mas quebrar essa convencao torna o codigo ilegivel para outros programadores.

---

## 5. Estado mutavel: quando usar e quando evitar

Estado mutavel e util para rastrear progresso durante uma execucao, mas pode gerar bugs quando compartilhado sem controle.

### Quando estado mutavel e apropriado

- Contadores de metricas por execucao (linhas lidas, rejeitadas, escritas)
- Buffers que acumulam dados antes de um flush
- Objetos que representam uma sessao/conexao com ciclo de vida claro

### Quando estado mutavel e perigoso

- Objetos reutilizados entre execucoes sem reset
- Instancias compartilhadas entre threads/processos
- Estado misturado com configuracao

**Regra pratica:** se voce precisa dar `reset()` antes de reutilizar um objeto, provavelmente deveria criar uma nova instancia.

---

## 6. Exemplo aplicado em dados

```python
class SourceRun:
    """Rastreia metricas de uma unica execucao de leitura."""

    def __init__(self, source_name: str):
        self.source_name = source_name
        self.records_read = 0       # estado mutavel — pertence a esta run
        self.records_rejected = 0   # estado mutavel — pertence a esta run

    def read(self, rows: list[dict]) -> list[dict]:
        self.records_read += len(rows)
        return rows

    def reject(self, count: int):
        self.records_rejected += count

    def summary(self) -> str:
        return (
            f"[{self.source_name}] "
            f"Read: {self.records_read}, "
            f"Rejected: {self.records_rejected}"
        )

# Cada execucao cria sua propria instancia — estado isolado
run = SourceRun("csv")
run.read([{"id": 1}, {"id": 2}])
run.reject(1)
print(run.summary())  # [csv] Read: 2, Rejected: 1

# Nova execucao = nova instancia, sem residuos
run2 = SourceRun("csv")
print(run2.records_read)  # 0 — limpo
```

`records_read` pertence a esta execucao, nao ao sistema inteiro.

---

## 7. Erros comuns → correcao

| Erro comum | O que acontece | Correcao |
|------------|----------------|----------|
| Usar lista mutavel como atributo de **classe** | Todas as instancias compartilham a mesma lista | Inicializar no `__init__` como atributo de instancia |
| Guardar tudo em variavel global | Qualquer funcao pode alterar sem controle | Manter estado na instancia que e dona dele |
| Reutilizar objeto entre jobs sem reset | Dados da execucao anterior contaminam a proxima | Criar nova instancia por execucao |
| Misturar config com estado de runtime | Dificil saber o que muda e o que e fixo | Separar `config` (imutavel) de `metrics/state` (mutavel) |

---

## 8. Pros e contras do estado mutavel em objetos

| Pros | Contras |
|------|---------|
| Rastreia progresso de forma natural | Bugs intermitentes se compartilhado entre runs |
| Metodos podem alterar estado coordenadamente | Dificil de debugar quando multiplos atores mutam o mesmo objeto |
| Acumula metricas sem precisar de variaveis externas | Requer disciplina de ownership (quem cria, quem altera, quem le) |
| Simples de implementar para fluxos lineares | Em pipelines paralelos, exige atencao extra com isolamento |

---

## 9. Conexao com dados

- Cada run de pipeline deve ter estado isolado — crie nova instancia por execucao
- Metricas por execucao (linhas lidas, rejeitadas, escritas) sao atributos de instancia
- Objetos com responsabilidade unica facilitam debug — `SourceRun` so cuida de leitura
- Nunca use atributos de classe mutaveis para dados por-execucao

---

## 10. Resumo

| Conceito | Ponto-chave |
|----------|-------------|
| Classe | Define comportamento e estrutura (blueprint) |
| Instancia | Objeto concreto com dados proprios |
| `self` | Referencia a instancia atual — convencao, nao keyword |
| `__init__` | Metodo chamado automaticamente na criacao do objeto |
| Var de classe | Compartilhada entre todas as instancias — use para constantes |
| Var de instancia | Unica por objeto — use para estado mutavel |
| Estado mutavel | Util, mas exige controle de ownership e isolamento |

---

## Proximo passo

**Mini-Aula 3.2:** Encapsulamento de Verdade.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Um DAG roda em paralelo para paises diferentes. Se `records_read` fosse um atributo de classe (compartilhado), a contagem do Brasil contaminaria a metrica da Argentina.
Instancias separadas por run (`SourceRun("br")`, `SourceRun("ar")`) evitam esse bug.

### Pergunta de checkpoint

1. Se voce adicionar `rows = []` como atributo de classe em vez de no `__init__`, o que acontece quando duas instancias chamam `.add()`?
2. Sua classe representa configuracao estatica, estado de runtime, ou os dois misturados? Como voce separaria?

### Aplicacao imediata no trabalho

Escolha um job atual e:
1. Identifique quais valores sao **config** (imutavel entre execucoes) e quais sao **state** (mutavel por execucao)
2. Separe-os: config no construtor como parametros, state inicializado como atributos no `__init__`
3. Garanta que cada execucao cria uma nova instancia — nunca reutilize a mesma
