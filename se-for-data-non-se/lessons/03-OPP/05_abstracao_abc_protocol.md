# Mini-Aula 3.5: Abstracao com ABC e Protocol

> **Objetivo:** Diferenciar contrato nominal (ABC) de contrato estrutural (Protocol) e escolher com criterio.
> **Fontes:** [Python Docs — abc](https://docs.python.org/3/library/abc.html) · [Python Docs — typing.Protocol](https://docs.python.org/3/library/typing.html#typing.Protocol) · [PEP 544 — Protocols: Structural subtyping](https://peps.python.org/pep-0544/) · [PEP 3119 — Introducing ABCs](https://peps.python.org/pep-3119/)

---

## 1. Problema que abstracao resolve

Sem abstracao, nao ha garantia de que classes diferentes compartilhem a mesma interface. O pipeline nao sabe o que esperar.

```python
# ⚠️ SEM ABSTRACAO: sem contrato, sem garantia
class CsvSource:
    def read(self):
        return [{"id": 1, "from": "csv"}]

class ApiSource:
    def fetch(self):  # nome diferente! nao ha contrato
        return [{"id": 2, "from": "api"}]

# O pipeline tenta tratar ambos, mas nao pode:
def run_pipeline(source):
    data = source.read()  # ApiSource nao tem read() -> AttributeError
    print(f"Read {len(data)} records")
```

Abstracao define **o que** deve ser feito, sem amarrar **como**.

---

## 2. Dois tipos de contrato

Python oferece dois mecanismos distintos para definir contratos:

| Conceito | Tipo | Onde definido | PEP |
|----------|------|---------------|-----|
| **ABC** (Abstract Base Class) | Nominal (heranca explicita) | `abc` module | PEP 3119 |
| **Protocol** | Estrutural (duck typing estatico) | `typing` module | PEP 544 |

- **Nominal:** a classe *declara* que segue o contrato (herda de `Source`)
- **Estrutural:** a classe *tem* os metodos esperados, isso basta (nao precisa herdar)

---

## 3. ABC (Abstract Base Class)

```python
from abc import ABC, abstractmethod

class Source(ABC):
    """Contrato nominal: todo Source deve implementar read()."""

    @abstractmethod
    def read(self) -> list[dict]:
        """Retorna lista de registros."""
        ...

    # ABC pode ter metodos concretos que filhos herdam
    def summary(self) -> str:
        data = self.read()
        return f"{len(data)} records loaded"
```

### Comportamento em runtime

```python
# ❌ Tentar instanciar ABC diretamente:
source = Source()
# TypeError: Can't instantiate abstract class Source
#            with abstract method read

# ❌ Subclasse incompleta:
class BrokenSource(Source):
    pass

broken = BrokenSource()
# TypeError: Can't instantiate abstract class BrokenSource
#            with abstract method read

# ✅ Subclasse completa:
class CsvSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "csv"}]

csv = CsvSource()
csv.read()      # funciona
csv.summary()   # herda metodo concreto: "1 records loaded"
isinstance(csv, Source)  # True — relacao nominal
```

### Recursos avancados de ABC

```python
# register(): subclasse virtual — sem heranca, mas satisfaz isinstance()
class ExternalReader:
    def read(self) -> list[dict]:
        return [{"id": 99, "from": "external"}]

Source.register(ExternalReader)
isinstance(ExternalReader(), Source)  # True
# MAS: ExternalReader nao herda summary(),
# e @abstractmethod nao e validado para ela!
```

> **Cuidado:** `register()` engana `isinstance()`, mas nao fornece heranca real nem validacao de metodos abstratos. Use com parcimonia.

### `@abstractmethod` com `@property`

```python
from abc import ABC, abstractmethod

class Source(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Nome do source — deve ser implementado."""
        ...

class CsvSource(Source):
    @property
    def name(self) -> str:
        return "csv"
```

---

## 4. Protocol (subtipagem estrutural)

```python
from typing import Protocol

class Readable(Protocol):
    """Contrato estrutural: qualquer classe com read() compativel satisfaz."""

    def read(self) -> list[dict]:
        ...
```

### Uso com type checker

```python
class CsvSource:
    """Nao herda de nada — mas tem read()."""
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "csv"}]

class ThirdPartyClient:
    """Biblioteca externa que ja tem read()."""
    def read(self) -> list[dict]:
        return [{"id": 2, "from": "api"}]

def run(source: Readable) -> list[dict]:
    return source.read()

# Ambos passam no type checker (mypy/pyright) SEM heranca:
run(CsvSource())          # ✅ OK
run(ThirdPartyClient())   # ✅ OK
```

### `@runtime_checkable` — isinstance() com Protocol

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Readable(Protocol):
    def read(self) -> list[dict]:
        ...

class CsvSource:
    def read(self) -> list[dict]:
        return [{"id": 1}]

isinstance(CsvSource(), Readable)  # True
```

> **Caveat importante:** `@runtime_checkable` verifica apenas que o **atributo/metodo existe**. Nao valida assinatura (tipos dos parametros/retorno). Para validacao completa, use type checker estatico (mypy, pyright).

---

## 5. ABC vs Protocol — comparacao detalhada

| Criterio | ABC | Protocol |
|----------|-----|----------|
| Tipo de subtipagem | **Nominal** — heranca explicita obrigatoria | **Estrutural** — basta ter os metodos |
| Validacao principal | **Runtime** — `TypeError` na instanciacao | **Estatica** — type checker (mypy/pyright) |
| `isinstance()` | Sim, nativo | Apenas com `@runtime_checkable` (limita) |
| Metodos concretos herdaveis | Sim — logica compartilhada no pai | Nao — Protocol define interface apenas |
| Flexibilidade com codigo externo | Menor — exige heranca (ou `register()`) | **Maior** — nao precisa modificar a classe |
| Governanca arquitetural | **Alta** — fronteira explicita | Media — contrato implicito |
| Acoplamento | Maior — filhos acoplados ao pai | **Menor** — sem dependencia de heranca |
| Python version | Desde Python 2 | Python 3.8+ (PEP 544) |

---

## 6. Quando usar cada um

### Use ABC quando:

- Voce controla a hierarquia e quer **fronteira arquitetural explicita**
- Precisa de **validacao em runtime** (erro na instanciacao, nao no uso)
- Quer fornecer **metodos concretos** que filhos herdam
- Esta definindo **contratos centrais do dominio** (`Source`, `Transform`, `Sink`)

### Use Protocol quando:

- Precisa aceitar **classes de terceiros** sem modificar o codigo delas
- Quer **baixo acoplamento** — nenhuma dependencia de heranca
- O contrato e **simples** (1-2 metodos) e nao precisa de logica compartilhada
- Sua equipe ja usa **type checker** (mypy, pyright) no CI

### Podem coexistir:

```python
from abc import ABC, abstractmethod
from typing import Protocol

# ABC para o contrato central do dominio
class Source(ABC):
    @abstractmethod
    def read(self) -> list[dict]: ...

# Protocol para aceitar qualquer coisa que "leia"
class Readable(Protocol):
    def read(self) -> list[dict]: ...

# Pipeline aceita Protocol — mais flexivel
def run_pipeline(source: Readable) -> list[dict]:
    return source.read()

# Classes internas herdam ABC (governanca)
class CsvSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1}]

# Classes externas satisfazem Protocol (flexibilidade)
class ThirdPartyReader:
    def read(self) -> list[dict]:
        return [{"id": 2}]

# Ambos funcionam:
run_pipeline(CsvSource())        # ABC + Protocol
run_pipeline(ThirdPartyReader())  # so Protocol
```

---

## 7. Pros e contras

| | Pros | Contras |
|--|------|---------|
| **ABC** | Erro na instanciacao (falha cedo) | Acoplamento por heranca |
| | Metodos concretos reutilizaveis | Exige que classes herdem explicitamente |
| | `isinstance()` funciona nativamente | Menos flexivel com codigo externo |
| | Governanca clara de arquitetura | Potencial para hierarquias profundas |
| **Protocol** | Zero acoplamento de heranca | Sem validacao em runtime (por padrao) |
| | Integra codigo de terceiros | Sem logica compartilhada |
| | "Pythonic" — respeita duck typing | Requer type checker para seguranca plena |
| | Interface Segregation natural | `@runtime_checkable` valida so existencia |

---

## 8. Conexao com dados

- **ABC** para contratos centrais do dominio (`Source`, `Transform`, `Sink`) — governanca de time
- **Protocol** para integrar bibliotecas/adapters externos sem heranca forcada
- Combinar ambos: ABC no core, Protocol na fronteira do pipeline
- `@runtime_checkable` util em testes para validar que mocks satisfazem o contrato
- Em plugins/extensoes: Protocol permite que usuarios estendam sem importar suas bases

---

## 9. Resumo

| Conceito | Ponto-chave |
|----------|-------------|
| Abstracao | Define *o que*, nao *como* — contratos, nao implementacoes |
| ABC | Nominal: heranca explicita, erro na instanciacao, pode ter metodos concretos |
| Protocol | Estrutural: basta ter os metodos, validado pelo type checker |
| `@abstractmethod` | Forca implementacao — `TypeError` se faltar metodo |
| `@runtime_checkable` | Permite `isinstance()` com Protocol — mas so checa existencia |
| `register()` | Subclasse virtual de ABC — `isinstance()` sem heranca real |
| Escolha | Governanca → ABC · Flexibilidade → Protocol · Ambos coexistem |

---

## Proximo passo

**Mini-Aula 3.6:** Composicao vs Heranca.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Voce integra biblioteca de terceiro (ex: SDK de cloud) que ja possui um metodo `read()` compativel. Nao pode modificar o codigo-fonte dela para herdar de `Source(ABC)`.

Com **Protocol**, basta tipar o parametro como `Readable` — o type checker valida que a classe do SDK tem `read() -> list[dict]`, sem atrito.

Se voce tambem precisar de `isinstance()` em runtime (ex: log condicional), use `@runtime_checkable` — mas lembre que so verifica existencia do metodo, nao a assinatura completa.

### Perguntas de checkpoint

1. Qual a diferenca entre falhar na **instanciacao** (ABC) e falhar no **type check** (Protocol)? Em que momento cada erro aparece?
2. Se voce usa `@runtime_checkable`, por que `isinstance(obj, Readable)` pode retornar `True` mesmo que `obj.read()` retorne `str` em vez de `list[dict]`?
3. Um time decide usar ABC para `Source` internamente e Protocol para a API publica do pipeline. Faz sentido? Por que?

### Aplicacao imediata no trabalho

1. Identifique um contrato central no seu pipeline (`read`, `transform`, `write`)
2. Defina como **ABC** com `@abstractmethod`
3. Crie um **Protocol** equivalente para a interface publica que aceita implementacoes externas
4. Documente no README do time qual estilo e padrao e por que
