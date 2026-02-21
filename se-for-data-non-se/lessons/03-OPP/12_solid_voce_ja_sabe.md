# Mini-Aula 3.12: SOLID — Voce Ja Sabe (So Faltavam os Nomes)

> **Objetivo:** Formalizar os 5 principios SOLID conectando cada um ao que voce ja aprendeu nas aulas anteriores.
> **Pre-requisitos:** Aulas 3.0 a 3.11 (OOP, Composicao, Factory Method, Patterns).
> **Fonte:** Robert C. Martin — "Agile Software Development: Principles, Patterns, and Practices" (2002).

---

## Introducao: voce ja pratica SOLID

Ao longo do modulo 3, voce aprendeu a criar classes com responsabilidade clara, depender de abstracoes, estender comportamento sem mexer no core, e separar interfaces. **Tudo isso tem nome — SOLID.**

Esta aula nao introduz conceitos novos. Ela **formaliza** o que voce ja praticou e te da o vocabulario para comunicar decisoes de design com times de engenharia.

```text
┌─────────────────────────────────────────────────────┐
│  S — Single Responsibility Principle (SRP)          │
│  O — Open/Closed Principle (OCP)                    │
│  L — Liskov Substitution Principle (LSP)            │
│  I — Interface Segregation Principle (ISP)          │
│  D — Dependency Inversion Principle (DIP)           │
└─────────────────────────────────────────────────────┘
```

---

## 1. SRP — Single Responsibility Principle

> *"Uma classe deve ter apenas um motivo para mudar."*
> — Robert C. Martin

### Onde voce ja aprendeu

- **Aula 3.6 (Composicao vs Heranca):** separamos `TransformStrategy` de `Pipeline` — cada classe faz uma coisa
- **Aula 3.8 (OOP Smells):** identificamos God Class como smell — classe que acumula responsabilidades

### Conceito formal

SRP nao diz "uma classe faz uma coisa". Diz que uma classe tem **um unico ator** (stakeholder) que pode exigir mudanca. Se dois departamentos diferentes pedem mudancas na mesma classe, ela viola SRP.

### Exemplo — Antes (violando SRP)

```python
class EtlPipeline:
    """Faz TUDO: extrai, transforma, valida, carrega e envia alerta."""

    def extract(self) -> list[dict]:
        return [{"id": 1, "amount": 100}]

    def transform(self, rows: list[dict]) -> list[dict]:
        return [r | {"tax": r["amount"] * 0.17} for r in rows]

    def validate(self, rows: list[dict]) -> list[dict]:
        return [r for r in rows if r["amount"] > 0]

    def load(self, rows: list[dict]) -> None:
        print(f"Inserindo {len(rows)} registros")

    def send_alert(self, msg: str) -> None:
        print(f"[ALERT] {msg}")

    def run(self):
        rows = self.extract()
        rows = self.transform(rows)
        rows = self.validate(rows)
        self.load(rows)
        self.send_alert(f"{len(rows)} registros processados")
```

**Problema:** Se o time de dados pede mudanca na transformacao e o time de ops pede mudanca no alerta, a mesma classe muda por motivos diferentes.

### Exemplo — Depois (respeitando SRP)

```python
class TaxTransformer:
    """Responsabilidade unica: calcular imposto."""

    def apply(self, rows: list[dict]) -> list[dict]:
        return [r | {"tax": r["amount"] * 0.17} for r in rows]


class RowValidator:
    """Responsabilidade unica: validar registros."""

    def apply(self, rows: list[dict]) -> list[dict]:
        return [r for r in rows if r["amount"] > 0]


class AlertNotifier:
    """Responsabilidade unica: enviar notificacoes."""

    def notify(self, msg: str) -> None:
        print(f"[ALERT] {msg}")
```

Cada classe muda por **um motivo** e e testavel isoladamente.

---

## 2. OCP — Open/Closed Principle

> *"Entidades de software devem ser abertas para extensao, fechadas para modificacao."*
> — Bertrand Meyer (1988), popularizado por Martin

### Onde voce ja aprendeu

- **Aula 3.7 (Factory Method):** novo tipo de source = nova classe concreta, sem mexer no `PipelineCreator`
- **Aula 3.11 (Adapter):** novo vendor = novo Adapter, pipeline inalterado
- **Aula 3.6 (Composicao):** nova Strategy = novo comportamento sem tocar no Pipeline

### Conceito formal

OCP nao proibe mudanca de codigo. Diz que o **design** deve permitir estender comportamento (adicionar novo fonte, novo algoritmo, novo vendor) **sem alterar** o codigo existente que ja funciona.

### Exemplo — voce ja fez isso

```python
from abc import ABC, abstractmethod


class Source(ABC):
    @abstractmethod
    def read(self) -> list[dict]:
        ...


class CsvSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "csv"}]


# Extensao: novo source sem mexer em CsvSource nem no pipeline
class ApiSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 2, "from": "api"}]


# Pipeline nao muda — aberto para extensao, fechado para modificacao
def run_pipeline(source: Source) -> list[dict]:
    return source.read()
```

**Na aula 3.7 voce fez exatamente isso com Factory Method.** Agora sabe o nome formal.

---

## 3. LSP — Liskov Substitution Principle

> *"Objetos de um tipo derivado devem poder substituir objetos do tipo base sem alterar o comportamento correto do programa."*
> — Barbara Liskov (1987)

### Onde voce ja aprendeu

- **Aula 3.3 (Heranca sem Dor):** discutimos heranca como contrato — subclasse deve honrar promessas da superclasse
- **Aula 3.4 (Polimorfismo):** varias subclasses de `Stage` usadas no mesmo pipeline sem quebrar

### Conceito formal

Se `CsvSource` herda de `Source`, qualquer codigo que usa `Source` deve poder receber `CsvSource` **sem surpresas**. A subclasse nao pode:
- Lancar excecoes que a base nao lanca
- Exigir pre-condicoes mais fortes
- Oferecer pos-condicoes mais fracas
- Mudar o significado semantico de metodos herdados

### Exemplo — violacao classica

```python
class Source(ABC):
    @abstractmethod
    def read(self) -> list[dict]:
        """Retorna lista de dicionarios. Nunca retorna None."""
        ...


class BrokenSource(Source):
    def read(self) -> list[dict]:
        return None  # ❌ Viola LSP: base promete lista, nao None
```

### Exemplo — respeitando LSP

```python
class EmptySource(Source):
    def read(self) -> list[dict]:
        return []  # ✅ Lista vazia — respeita o contrato


class ParquetSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "parquet"}]  # ✅ Lista de dicts
```

**Ambas podem substituir `Source` sem quebrar o pipeline.** Na aula 3.4 voce ja fez isso.

---

## 4. ISP — Interface Segregation Principle

> *"Nenhum cliente deve ser forcado a depender de metodos que nao usa."*
> — Robert C. Martin

### Onde voce ja aprendeu

- **Aula 3.5 (ABC e Protocol):** Protocol define interfaces pequenas e especificas
- **Aula 3.6 (Composicao):** em vez de uma interface gigante, varias Strategy pequenas

### Conceito formal

ISP diz que interfaces "gordas" (muitos metodos) forcam implementadores a criar metodos vazios ou levantar `NotImplementedError`. Melhor: multiplas interfaces pequenas e coesas.

### Exemplo — violacao (interface gorda)

```python
class DataProcessor(ABC):
    @abstractmethod
    def extract(self) -> list[dict]: ...
    @abstractmethod
    def transform(self, rows: list[dict]) -> list[dict]: ...
    @abstractmethod
    def load(self, rows: list[dict]) -> None: ...
    @abstractmethod
    def send_report(self) -> None: ...  # nem todo processor envia relatorio!


class SimpleLoader(DataProcessor):
    def extract(self): return []
    def transform(self, rows): return rows
    def load(self, rows): print("loading")
    def send_report(self):
        raise NotImplementedError  # ❌ Forcado a implementar algo que nao usa
```

### Exemplo — respeitando ISP

```python
from typing import Protocol


class Readable(Protocol):
    def read(self) -> list[dict]: ...


class Transformable(Protocol):
    def apply(self, rows: list[dict]) -> list[dict]: ...


class Loadable(Protocol):
    def load(self, rows: list[dict]) -> None: ...


# Cada classe implementa SOMENTE o que precisa
class CsvReader:  # implementa Readable
    def read(self) -> list[dict]:
        return [{"id": 1}]


class TaxApplier:  # implementa Transformable
    def apply(self, rows: list[dict]) -> list[dict]:
        return [r | {"tax": r["amount"] * 0.17} for r in rows]
```

**Na aula 3.5 voce ja usou Protocol exatamente para isso.** Agora sabe que se chama ISP.

---

## 5. DIP — Dependency Inversion Principle

> *"Modulos de alto nivel nao devem depender de modulos de baixo nivel. Ambos devem depender de abstracoes."*
> — Robert C. Martin

### Onde voce ja aprendeu

- **Aula 3.7 (Factory Method):** pipeline depende de `Source` (abstrata), nao de `CsvSource` (concreta)
- **Aula 3.11 (Adapter):** pipeline depende de `OrderProvider`, nao de `AcmeBankClient`
- **Aula 3.6 (Composicao):** Pipeline recebe `TransformStrategy` por injecao, nao cria internamente

### Conceito formal

DIP tem 2 regras:
1. Modulos de alto nivel (pipeline) **nao importam** modulos de baixo nivel (CSV reader, API client)
2. Ambos dependem de **abstracoes** (interfaces, ABCs, Protocols)

A inversao e que o fluxo de dependencia **aponta para cima** (abstracoes), nao para baixo (detalhes).

```text
  Sem DIP:                       Com DIP:
  Pipeline → CsvSource           Pipeline → Source (ABC)
  Pipeline → ApiSource                        ↑
  (depende de concretos)          CsvSource ───┘
                                  ApiSource ───┘
                                  (concretos dependem da abstracao)
```

### Exemplo — Dependency Injection (a tecnica que implementa DIP)

```python
class Pipeline:
    """Alto nivel: orquestra ETL. Nao conhece nenhum concreto."""

    def __init__(self, source: Source, transforms: list[Transformable]):
        self._source = source          # injetado, nao criado aqui
        self._transforms = transforms  # injetado, nao criado aqui

    def run(self) -> list[dict]:
        rows = self._source.read()
        for t in self._transforms:
            rows = t.apply(rows)
        return rows


# Composicao raiz: onde concretos sao montados
pipeline = Pipeline(
    source=CsvSource(),
    transforms=[TaxApplier()],
)
pipeline.run()
```

**Na aula 3.6 voce ja fez isso.** DIP e o nome formal.

---

## Mapa SOLID ↔ Aulas do Modulo

| Principio | Resumo | Voce aprendeu em |
|---|---|---|
| **SRP** | Uma classe, um motivo de mudanca | 3.6, 3.8 |
| **OCP** | Estender sem modificar | 3.6, 3.7, 3.11 |
| **LSP** | Subclasse substitui base sem surpresas | 3.3, 3.4 |
| **ISP** | Interfaces pequenas e coesas | 3.5 |
| **DIP** | Depender de abstracoes, nao de concretos | 3.6, 3.7, 3.11 |

---

## Quando SOLID e demais (YAGNI)

SOLID nao e dogma. Aplicar cegamente gera overengineering:

| Sinal de overengineering | Exemplo |
|---|---|
| Interface com 1 unica implementacao que nunca vai mudar | `DiscountCalculator` com ABC para um calculo fixo |
| Injecao de dependencia para tudo | Injetar `MathService` para fazer `x * 0.17` |
| Classes de 5 linhas que so delegam | `ValidatorFactory` que cria `Validator` que chama `len()` |

**Heuristica pratica (da aula 3.10 — Matriz de Decisao):**
- Script descartavel (< 1 semana de vida)? → SOLID e desperdicio
- Pipeline com SLA e multiplos contribuidores? → SOLID paga dividendos
- So 1 implementacao e vai continuar assim? → Interface e overengineering

---

## Conexao com dados

| Principio | Aplicacao em dados |
|---|---|
| **SRP** | Separar validacao, transformacao e load em classes distintas |
| **OCP** | Novo conector (S3, BigQuery) sem mexer no pipeline existente |
| **LSP** | `ParquetSource` substitui `CsvSource` em testes sem quebrar |
| **ISP** | `Readable`, `Transformable`, `Loadable` em vez de `DataProcessor` monolitico |
| **DIP** | Pipeline recebe `Source` por construtor — troca por config sem refactor |

---

## Bloco didatico: conhecimento proximal

### Perguntas de checkpoint

1. Olhe para o codigo do seu ultimo pipeline. Quantas responsabilidades a classe principal tem? (SRP)
2. Se amanha voce precisar adicionar um novo tipo de source, quantos arquivos existentes precisaria modificar? (OCP)
3. Suas subclasses de `Source` podem substituir a classe base sem surpresas? Alguma retorna `None` onde deveria retornar lista? (LSP)
4. Ha alguma interface no seu codigo que forca implementadores a criar metodos vazios? (ISP)
5. Seu pipeline importa diretamente `pandas` ou `boto3`, ou depende de abstracoes que escondem esses detalhes? (DIP)

### Aplicacao imediata no trabalho

1. Identifique a classe com mais responsabilidades no seu projeto. Extraia **uma** responsabilidade para uma classe separada (SRP)
2. Escolha um ponto de extensao frequente (novo fonte, novo formato) e verifique se e possivel adicionar sem modificar codigo existente (OCP)
3. Substitua uma implementacao concreta por outra nos testes — se quebrar, voce encontrou uma violacao de LSP
4. Revise suas ABCs: se alguma tem mais de 3-4 metodos abstratos, considere quebrar em interfaces menores (ISP)
5. No construtor da sua classe principal, troque criacao direta (`self.source = CsvSource()`) por injecao (`self.source = source`) (DIP)

---

## Proximo passo

Agora voce tem o vocabulario formal de SOLID para:
- Justificar decisoes de design em code reviews
- Comunicar com times de engenharia usando terminologia compartilhada
- Avaliar quando um principio agrega valor vs quando e overengineering

**Modulo 04:** OOP Aplicado em Pipelines de Dados (pratica hands-on).

---

## Referencias

- Robert C. Martin — "Clean Architecture" (2017), caps. 7-11
- Robert C. Martin — "Agile Software Development: Principles, Patterns, and Practices" (2002)
- Barbara Liskov — "Data Abstraction and Hierarchy" (1987)
- Bertrand Meyer — "Object-Oriented Software Construction" (1988)
