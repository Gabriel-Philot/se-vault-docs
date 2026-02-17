# Mini-Aula 3.7: Factory Method (Design Patterns Guru)

> **Objetivo:** Entender o Factory Method como padrao de criacao para desacoplar cliente de classes concretas.

---

## 1. Problema de criacao

Quando o cliente instancia classes concretas diretamente, ele acumula conhecimento de muitos tipos e cria acoplamento.

Factory Method move a decisao de qual objeto criar para um criador dedicado.

---

## 2. Estrutura (terminologia Guru)

- `Product`: interface comum dos objetos criados
- `ConcreteProduct`: implementacoes concretas
- `Creator`: declara `factory_method()`
- `ConcreteCreator`: decide qual `ConcreteProduct` retornar

### Diagrama ASCII

```text
Creator -----------------> Product
  |                         ^
  | factory_method()        |
  v                         |
ConcreteCreator -----> ConcreteProduct
```

---

## 3. Exemplo em Python (pipeline)

```python
from abc import ABC, abstractmethod

class Stage(ABC):
    @abstractmethod
    def process(self, data):
        pass

class CsvSource(Stage):
    def process(self, data=None):
        return [{"id": 1}]

class ApiSource(Stage):
    def process(self, data=None):
        return [{"id": 2}]

class StageCreator(ABC):
    @abstractmethod
    def factory_method(self, kind: str) -> Stage:
        pass

class DefaultStageCreator(StageCreator):
    def factory_method(self, kind: str) -> Stage:
        if kind == "csv":
            return CsvSource()
        if kind == "api":
            return ApiSource()
        raise ValueError(f"unknown kind: {kind}")
```

Cliente:

```python
creator = DefaultStageCreator()
stage = creator.factory_method("csv")
print(stage.process())
```

---

## 4. Comparacao de uso

Sem Factory Method:

- Cliente escolhe classe concreta
- Novo tipo exige mudanca no cliente

Com Factory Method:

- Cliente pede `Product`
- Mudanca fica concentrada no `Creator`

---

## 5. Conexao com dados

- Criar stages por config (`source=csv`, `sink=db`)
- Facilitar extensao por novos conectores
- Reduzir acoplamento entre orquestrador e implementacoes

---

## 6. Resumo

- Factory Method e padrao criacional
- Cliente depende de `Product`, nao de `ConcreteProduct`
- `Creator` centraliza decisao de instanciacao
- Excelente para pipelines configuraveis

---

## Proximo passo

**Mini-Aula 3.8:** OOP Smells e Anti-Patterns.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Novos conectores entram por configuracao (`source_type`).
Factory Method evita espalhar decisao de criacao por varios modulos.

### Pergunta de checkpoint

Hoje, quantos lugares diferentes no seu projeto instanciam stages concretas manualmente?

### Aplicacao imediata no trabalho

Centralize criacao em uma factory unica e meca o diff: quantos `if/elif` sairam do cliente principal.
