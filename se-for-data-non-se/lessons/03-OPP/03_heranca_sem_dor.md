# Mini-Aula 3.3: Heranca sem Dor

> **Objetivo:** Aplicar heranca com criterio, usando `super()`, `abc.ABC`, e evitando hierarquias rigidas.
> **Fontes:** [Python Docs — Inheritance (§9.5)](https://docs.python.org/3/tutorial/classes.html#inheritance) · [Python Docs — abc module](https://docs.python.org/3/library/abc.html) · [Refactoring Guru — Refused Bequest](https://refactoring.guru/smells/refused-bequest)

---

## 1. Problema que heranca resolve

Sem heranca, voce repete logica comum em classes parecidas e nao tem como garantir que todas sigam o mesmo contrato.

```python
# ⚠️ Sem heranca: duplicacao e sem contrato
class CsvSource:
    def read(self):
        return [{"id": 1, "from": "csv"}]

class ApiSource:
    def fetch(self):  # nome diferente! nao ha contrato
        return [{"id": 2, "from": "api"}]

# O pipeline nao consegue tratar ambos de forma generica
# porque nao existe interface comum
```

Heranca permite definir um contrato no pai e garantir que filhos o sigam.

---

## 2. O teste "e um tipo de" (is-a)

Heranca so e correta quando existe relacao **genuina** de especializacao.

| Pergunta | Se "sim" | Se "nao" |
|----------|----------|----------|
| `CsvSource` **e um tipo de** `Source`? | ✅ Heranca | — |
| `Logger` **e um tipo de** `FileWriter`? | — | ❌ Use composicao |
| `Admin` **e um tipo de** `User`? | Depende | Avalie — pode ser role, nao tipo |

> **Regra:** se a frase "X e um tipo de Y" soa estranha no dominio, heranca provavelmente e a escolha errada.

---

## 3. Contratos com `abc.ABC` e `@abstractmethod`

O Python tem a forma idiomatica de forcar filhos a implementar metodos: o modulo `abc`.

```python
from abc import ABC, abstractmethod

class Source(ABC):
    """Contrato: todo Source deve implementar read()."""

    @abstractmethod
    def read(self) -> list[dict]:
        """Retorna lista de registros."""
        ...

# Tentar instanciar Source diretamente:
# source = Source()  # TypeError: Can't instantiate abstract class

class CsvSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "csv"}]

class ApiSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 2, "from": "api"}]

# Agora o pipeline trata qualquer Source de forma generica
def run_pipeline(source: Source):
    data = source.read()  # contrato garantido
    print(f"Read {len(data)} records")

run_pipeline(CsvSource())   # funciona
run_pipeline(ApiSource())   # funciona
```

> **Nota:** `raise NotImplementedError` tambem funciona, mas so falha em **runtime** quando o metodo e chamado. `@abstractmethod` falha na **instanciacao** — erro mais cedo = mais seguro.

---

## 4. Override + `super()`

`super()` chama o metodo da classe pai seguindo o **MRO** (Method Resolution Order).

```python
class FileSource(Source):
    def __init__(self, path: str):
        self.path = path

    def read(self) -> list[dict]:
        print(f"Reading from {self.path}")
        return []

class CsvSource(FileSource):
    def __init__(self, path: str, delimiter: str = ","):
        super().__init__(path)  # reutiliza init do pai
        self.delimiter = delimiter

    def read(self) -> list[dict]:
        rows = super().read()  # chama FileSource.read()
        # adiciona logica especifica de CSV
        return rows + [{"id": 1, "delimiter": self.delimiter}]
```

### Por que `super()` e nao `FileSource.__init__(self, path)`?

| Abordagem | Problemas |
|-----------|-----------|
| `FileSource.__init__(self, path)` | Hardcoded — quebra se a hierarquia mudar |
| `super().__init__(path)` | Segue o MRO — funciona com heranca multipla e cooperativa |

---

## 5. MRO — Method Resolution Order

Python lineariza a arvore de heranca para decidir a ordem de busca de metodos:

```python
class A:
    def greet(self):
        return "A"

class B(A):
    def greet(self):
        return "B"

class C(A):
    def greet(self):
        return "C"

class D(B, C):
    pass

# MRO: D -> B -> C -> A -> object
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

d = D()
print(d.greet())  # "B" — B vem antes de C no MRO
```

> **Regra pratica:** se voce precisa se preocupar com MRO, sua hierarquia provavelmente esta complexa demais. Prefira heranca simples (1 pai).

---

## 6. Refused Bequest — o code smell de heranca errada

O smell **Refused Bequest** (Refactoring Guru) ocorre quando o filho **ignora ou sobrescreve** a maioria dos metodos do pai.

```python
# ⚠️ REFUSED BEQUEST: herda mas nao usa quase nada
class FileProcessor:
    def open(self): ...
    def read_lines(self): ...
    def parse(self): ...
    def validate(self): ...
    def close(self): ...

class MetricsCollector(FileProcessor):  # herda 5 metodos
    def collect(self):
        # usa apenas open() e close(), ignora o resto
        ...
    def parse(self):
        raise NotImplementedError("MetricsCollector nao faz parse")
```

**Sinal:** se o filho levanta `NotImplementedError` para metodos herdados, a relacao "e um tipo de" nao e valida.

**Correcao:** use composicao — o `MetricsCollector` **tem** um `FileProcessor`, mas **nao e** um.

```python
# ✅ COMPOSICAO: usa apenas o que precisa
class MetricsCollector:
    def __init__(self, file_handler: FileProcessor):
        self._file_handler = file_handler  # delega ao invés de herdar

    def collect(self):
        self._file_handler.open()
        # coleta metricas...
        self._file_handler.close()
```

---

## 7. Principio de Liskov (LSP) — a regra de ouro da heranca

> "Se S e subtipo de T, objetos de T podem ser substituidos por objetos de S sem alterar as propriedades corretas do programa."

Em termos simples: **todo lugar que espera o pai deve funcionar com o filho sem surpresas.**

```python
# ⚠️ VIOLA LSP: filho muda o comportamento esperado
class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

class Square(Rectangle):
    def __init__(self, side: float):
        super().__init__(side, side)

    # Se alguem faz square.width = 5, height nao acompanha
    # Viola a expectativa de que width e height sao independentes
```

**Teste de LSP para dados:** se voce tem `Source.read()` que retorna `list[dict]`, um filho que retorna `None` ou levanta excecao inesperada viola LSP.

---

## 8. Heranca vs composicao — antes/depois completo

```python
# ⚠️ ANTES: hierarquia profunda e rigida
class BaseSource:
    def connect(self): ...
    def read(self): ...
    def close(self): ...

class FileSource(BaseSource):
    def __init__(self, path: str):
        self.path = path

class DelimitedSource(FileSource):
    def __init__(self, path: str, delimiter: str):
        super().__init__(path)
        self.delimiter = delimiter

class CsvSource(DelimitedSource):
    def __init__(self, path: str):
        super().__init__(path, ",")

class BusinessCsvSource(CsvSource):
    def __init__(self, path: str, schema: dict):
        super().__init__(path)
        self.schema = schema

# 5 niveis! Mudar BaseSource.connect() pode quebrar tudo
```

```python
# ✅ DEPOIS: composicao com 1 nivel de heranca
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class FileConfig:
    path: str
    delimiter: str = ","

@dataclass
class SchemaConfig:
    fields: dict

class Source(ABC):
    @abstractmethod
    def read(self) -> list[dict]:
        ...

class CsvSource(Source):
    """Composicao: RECEBE config e schema, nao herda."""

    def __init__(self, file_config: FileConfig, schema: SchemaConfig | None = None):
        self._file_config = file_config
        self._schema = schema

    def read(self) -> list[dict]:
        print(f"Reading {self._file_config.path} with delimiter '{self._file_config.delimiter}'")
        rows = [{"id": 1}]
        if self._schema:
            # valida contra schema
            pass
        return rows

# 1 nivel de heranca, config por composicao
csv = CsvSource(
    FileConfig("/data/orders.csv"),
    SchemaConfig({"id": "int", "name": "str"})
)
```

---

## 9. Heranca boa vs ruim

| Boa heranca | Heranca problematica |
|-------------|---------------------|
| Contrato simples no pai (`abc.ABC` + 1-2 metodos abstratos) | Pai com dezenas de metodos concretos |
| Filhos realmente especializados | Filhos sobrescrevendo a maioria dos metodos |
| Override pontual com `super()` | Dependencia de detalhes internos do pai |
| Facil testar pai e filhos isoladamente | Mudar pai quebra metade do sistema |
| 1-2 niveis de profundidade | 3+ niveis (avaliar composicao) |

---

## 10. Pros e contras

| Pros | Contras |
|------|---------|
| Reutiliza comportamento compartilhado | Acoplamento forte entre pai e filho |
| Contrato explicito com `abc.ABC` | Hierarquias profundas sao frageis |
| Polimorfismo natural (pai como tipo) | Mudar pai pode gerar efeitos cascata |
| MRO resolve ambiguidades automaticamente | MRO pode surpreender em heranca multipla |
| Menos codigo que duplicar logica | Refused Bequest se o filho nao precisa de tudo |

---

## 11. Conexao com dados

- `Source`, `Transform`, `Sink` como bases abstratas estaveis (1 nivel)
- Classes concretas especializam I/O sem alterar contrato
- **Config** por composicao (`dataclass`), **contrato** por heranca (`abc.ABC`)
- Mudancas internas (ex: trocar lib de CSV) nao devem vazar para o pipeline
- Se o filho precisa ignorar metodos do pai, use composicao

---

## 12. Resumo

| Conceito | Ponto-chave |
|----------|-------------|
| Heranca | Ferramenta de especializacao, nao de reuso generico |
| Teste "is-a" | Se a frase soa estranha, use composicao |
| `abc.ABC` + `@abstractmethod` | Forma Pythonica de forcar contrato — erro na instanciacao |
| `super()` | Segue MRO — nao hardcode o nome do pai |
| MRO | Linearizacao da arvore — se precisa pensar nisso, simplifique |
| Refused Bequest | Code smell: filho ignora metodos herdados |
| Liskov (LSP) | Filho deve funcionar em qualquer lugar que espera o pai |
| Composicao | Prefira quando a relacao e "tem um" em vez de "e um" |

---

## Proximo passo

**Mini-Aula 3.4:** Polimorfismo em Pipeline.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Sua empresa tem `BaseSource` para S3, API e banco. Quando a base cresce pra 5 niveis de heranca, toda mudanca em `BaseSource.connect()` gera regressao em cadeia nos 12 sources concretos.

Solucao: extraia `ConnectionConfig` como `dataclass`, mantenha `Source(ABC)` com 1 metodo abstrato `read()`, e mova as configuracoes para composicao.

### Pergunta de checkpoint

1. Sua classe filha realmente **e um tipo de** classe pai, ou esta apenas reaproveitando codigo?
2. Se voce levanta `NotImplementedError` em algum metodo herdado, o que isso indica sobre a hierarquia?
3. Qual a diferenca entre `raise NotImplementedError` e `@abstractmethod`? Quando cada um falha?

### Aplicacao imediata no trabalho

1. Identifique uma hierarquia no seu codigo com mais de 2 niveis
2. Aplique o teste "is-a" em cada nivel — onde a relacao e genuina?
3. Onde nao for, extraia a logica para composicao: crie uma `dataclass` de config ou um objeto colaborador
