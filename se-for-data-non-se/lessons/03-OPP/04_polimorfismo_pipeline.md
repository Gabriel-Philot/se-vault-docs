# Mini-Aula 3.4: Polimorfismo em Pipeline

> **Objetivo:** Entender como um loop unico pode operar classes diferentes atraves de um contrato comum, e como isso elimina `if/elif` estrutural.
> **Fontes:** [Python Docs — Inheritance (§9.5)](https://docs.python.org/3/tutorial/classes.html#inheritance) · [Python Docs — typing.Protocol](https://docs.python.org/3/library/typing.html#typing.Protocol) · [Refactoring Guru — Replace Conditional with Polymorphism](https://refactoring.guru/replace-conditional-with-polymorphism)

---

## 1. Problema que polimorfismo resolve

Sem polimorfismo, o codigo que orquestra fica cheio de `if/elif` verificando tipos — e cada nova variante exige mexer nesse codigo.

```python
# ⚠️ SEM POLIMORFISMO: if/elif por tipo
def read_data(source_type: str, config: dict) -> list[dict]:
    if source_type == "csv":
        print(f"Reading CSV from {config['path']}")
        return [{"id": 1, "from": "csv"}]
    elif source_type == "api":
        print(f"Calling API at {config['url']}")
        return [{"id": 2, "from": "api"}]
    elif source_type == "parquet":
        print(f"Reading Parquet from {config['path']}")
        return [{"id": 3, "from": "parquet"}]
    else:
        raise ValueError(f"Tipo desconhecido: {source_type}")

# Adicionar "database" exige MEXER nesta funcao
# Cada if/elif e um ponto de regressao
```

---

## 2. Conceito: mesma interface, comportamentos diferentes

Polimorfismo permite que o **cliente** (quem chama) dependa de um **contrato** (interface), e cada classe concreta implementa o comportamento especifico.

O cliente nao sabe — e nao precisa saber — qual classe concreta esta executando.

```python
from abc import ABC, abstractmethod

class Source(ABC):
    """Contrato: todo Source tem read()."""

    @abstractmethod
    def read(self) -> list[dict]:
        ...

class CsvSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "csv"}]

class ApiSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 2, "from": "api"}]

class ParquetSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 3, "from": "parquet"}]

# O loop nao conhece classes concretas — depende do contrato
sources: list[Source] = [CsvSource(), ApiSource(), ParquetSource()]

for source in sources:
    data = source.read()  # polimorfismo em acao
    print(f"Read {len(data)} records")
```

> **Adicionar `DatabaseSource`?** Basta criar a classe e adicionar na lista. O loop **nao muda**.

---

## 3. Refatoracao completa: if/elif → polimorfismo

Baseado na tecnica **Replace Conditional with Polymorphism** (Refactoring Guru):

### Antes — if/elif chain

```python
# ⚠️ Cada novo tipo exige mudar ESTA funcao
def process(source_type: str, rows: list[dict]) -> list[dict]:
    if source_type == "csv":
        # limpa headers, trata encoding
        return [{"clean": True, **r} for r in rows]
    elif source_type == "api":
        # normaliza JSON nested
        return [{"normalized": True, **r} for r in rows]
    elif source_type == "parquet":
        # converte tipos de coluna
        return [{"typed": True, **r} for r in rows]
    else:
        raise ValueError(f"Unknown: {source_type}")
```

### Depois — polimorfismo

```python
from abc import ABC, abstractmethod

class Transform(ABC):
    @abstractmethod
    def process(self, rows: list[dict]) -> list[dict]:
        ...

class CsvTransform(Transform):
    def process(self, rows: list[dict]) -> list[dict]:
        return [{"clean": True, **r} for r in rows]

class ApiTransform(Transform):
    def process(self, rows: list[dict]) -> list[dict]:
        return [{"normalized": True, **r} for r in rows]

class ParquetTransform(Transform):
    def process(self, rows: list[dict]) -> list[dict]:
        return [{"typed": True, **r} for r in rows]

# Cliente depende do contrato, nao da implementacao
def run_pipeline(transform: Transform, rows: list[dict]) -> list[dict]:
    return transform.process(rows)  # nenhum if/elif

# Adicionar novo tipo = nova classe, zero mudanca no pipeline
```

### Por que isso e melhor?

| Aspecto | if/elif | Polimorfismo |
|---------|---------|-------------|
| Adicionar novo tipo | Mexe na funcao existente | Cria nova classe — codigo existente intocado |
| Principio | Viola Open/Closed | Respeita Open/Closed (aberto para extensao, fechado para modificacao) |
| Risco de regressao | Alto — qualquer branch pode quebrar | Baixo — mudanca e localizada |
| Testabilidade | Testa todos os branches numa funcao | Testa cada classe isoladamente |

---

## 4. Duck typing em Python

Python nao exige heranca para polimorfismo funcionar. Se o objeto **tem** o metodo esperado, ele funciona:

> "If it walks like a duck and quacks like a duck, it's a duck."
> — Python Glossary

```python
# Sem heranca — duck typing puro
class MockSource:
    """Classe de teste que nao herda de Source."""
    def read(self) -> list[dict]:
        return [{"id": 99, "from": "mock"}]

sources = [CsvSource(), MockSource()]  # MockSource nao herda de Source

for source in sources:
    data = source.read()  # funciona! Python so exige que .read() exista
    print(data)
```

**Vantagem:** flexibilidade total, especialmente para testes.
**Risco:** se o objeto nao tiver `read()`, o erro so aparece em **runtime**.

---

## 5. `typing.Protocol` — duck typing com seguranca

`Protocol` formaliza duck typing para **type checkers** (mypy, pyright) sem exigir heranca:

```python
from typing import Protocol

class Readable(Protocol):
    """Contrato estrutural: qualquer classe com read() satisfaz."""
    def read(self) -> list[dict]: ...

class CsvSource:  # NAO herda de Readable
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "csv"}]

class MockSource:  # NAO herda de Readable
    def read(self) -> list[dict]:
        return [{"id": 99, "from": "mock"}]

def run_pipeline(source: Readable) -> None:
    """Aceita qualquer objeto que tenha read() -> list[dict]."""
    data = source.read()
    print(f"Read {len(data)} records")

run_pipeline(CsvSource())   # ✅ type checker aceita
run_pipeline(MockSource())  # ✅ type checker aceita
run_pipeline("string")      # ❌ type checker rejeita — str nao tem read()
```

---

## 6. ABC vs Protocol — quando usar cada um

| Criterio | `abc.ABC` (nominal) | `Protocol` (estrutural) |
|----------|---------------------|-------------------------|
| Heranca necessaria? | Sim — filho deve herdar | Nao — basta ter os metodos |
| Erro ao esquecer metodo | Na instanciacao (runtime) | No type checker (estatico) |
| Ideal para | Hierarquias controladas pelo seu codigo | Interfaces de terceiros, mocks, testes |
| Python idiomatico? | Sim — padrao para frameworks | Sim — padrao para tipagem moderna |
| Visibilidade do contrato | Explicita na arvore de heranca | Implicita — satisfaz sem declarar |

**Regra pratica:**
- Dentro do seu projeto, onde voce controla as classes → `abc.ABC`
- Quando precisa aceitar objetos externos ou mocks sem forcar heranca → `Protocol`

---

## 7. Tell-Don't-Ask e Open/Closed

Polimorfismo habilita dois principios fundamentais:

### Tell-Don't-Ask
Em vez de perguntar ao objeto "que tipo voce e?" e decidir o que fazer, **diga** ao objeto o que fazer e ele decide como:

```python
# ❌ ASK: pergunta o tipo, depois decide
if isinstance(source, CsvSource):
    data = parse_csv(source.path)
elif isinstance(source, ApiSource):
    data = call_api(source.url)

# ✅ TELL: diz o que fazer, objeto decide como
data = source.read()  # cada classe sabe como ler
```

### Open/Closed Principle (OCP)
O codigo deve ser **aberto para extensao** e **fechado para modificacao**:

- **Aberto:** adicionar `DatabaseSource` = criar nova classe
- **Fechado:** o loop, o pipeline, os testes existentes **nao mudam**

---

## 8. Tipos de polimorfismo em Python

| Tipo | Mecanismo | Exemplo |
|------|-----------|---------|
| **Subtipo** | Heranca + override | `CsvSource(Source)` sobrescreve `read()` |
| **Duck typing** | Presenca do metodo | Qualquer objeto com `read()` funciona |
| **Structural** | `typing.Protocol` | Type checker valida sem heranca |
| **Ad-hoc** (overloading) | `@singledispatch`, `@overload` | Mesmo nome, tipos de argumento diferentes |

Na pratica, pipelines de dados usam mais **subtipo** (ABC) e **duck typing** (testes/mocks).

---

## 9. Pros e contras

| Pros | Contras |
|------|---------|
| Elimina if/elif estrutural | Mais classes no projeto |
| Respeita Open/Closed — extensivel sem modificar | Precisa de fabrica ou config para instanciar a classe certa |
| Tell-Don't-Ask — codigo mais limpo | Over-engineering se ha apenas 2 variantes que nunca mudam |
| Testavel isoladamente | Duck typing sem Protocol pode esconder bugs |
| Facilita mocks e doubles | Hierarquia mal feita gera Refused Bequest |

---

## 10. Conexao com dados

- **Trocar `CsvSource` por `ApiSource`** sem alterar orquestracao — contrato garante
- **Trocar `ConsoleSink` por `DatabaseSink`** sem mexer no pipeline core
- **Facilita testes** com doubles/mocks — duck typing ou Protocol
- **Pipelines extensiveis:** novo source = nova classe, zero mudanca no DAG
- **Config-driven:** um dicionario mapeia nomes para classes concretas, o loop permanece generico

---

## 11. Resumo

| Conceito | Ponto-chave |
|----------|-------------|
| Polimorfismo | Mesma interface, comportamentos diferentes |
| if/elif → classes | Refatoracao Replace Conditional with Polymorphism |
| Duck typing | Se tem o metodo, funciona — sem heranca |
| `Protocol` | Duck typing com validacao estatica |
| `abc.ABC` | Contrato nominal — exige heranca |
| Tell-Don't-Ask | Diga ao objeto o que fazer, nao pergunte o tipo |
| Open/Closed | Extensivel sem modificar codigo existente |

---

## Proximo passo

**Mini-Aula 3.5:** Abstracao com ABC e Protocol.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Hoje o cliente recebe CSV. Amanha recebe API. Semana que vem recebe Parquet.
Se o seu orquestrador depende do contrato (`Source.read()`) e nao da implementacao, o pipeline continua estavel. Adicionar `DatabaseSource` e criar um arquivo novo — o DAG, os testes e a orquestracao nao mudam.

### Pergunta de checkpoint

1. Ao adicionar um novo source, voce altera o loop principal ou apenas cria uma nova classe?
2. Qual a diferenca entre verificar `isinstance(source, CsvSource)` e simplesmente chamar `source.read()`?
3. Quando voce usaria `abc.ABC` e quando usaria `Protocol` para definir o contrato?

### Aplicacao imediata no trabalho

1. Encontre um `if/elif` no seu codigo que decide comportamento baseado em tipo ou string
2. Extraia cada branch para uma classe com metodo comum
3. Substitua o if/elif por um loop sobre objetos que compartilham o contrato
4. Bonus: defina o contrato como `Protocol` e rode mypy para validar
