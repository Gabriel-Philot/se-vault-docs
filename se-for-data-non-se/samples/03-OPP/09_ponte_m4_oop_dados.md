# Mini-Aula 3.9: Ponte para M4 (OOP em Dados)

> **Objetivo:** Consolidar M3 e entregar um blueprint pronto para o modulo pratico de OOP em pipelines.

---

## 1. Recap aplicado

- Classes/objetos organizam estado e comportamento
- Encapsulamento protege regras
- Heranca e composicao estruturam reuso
- Polimorfismo remove `if/elif` estrutural
- Factory Method desacopla criacao

---

## 2. Blueprint ETL orientado a objetos

```python
from abc import ABC, abstractmethod

class Stage(ABC):
    @abstractmethod
    def process(self, data):
        pass

class Source(Stage):
    pass

class Transform(Stage):
    pass

class Sink(Stage):
    pass
```

---

## 3. Contratos recomendados

- `Source.process(data=None) -> rows`
- `Transform.process(rows) -> rows`
- `Sink.process(rows) -> None | metrics`

Opcional para semantica explicita:

- `Source.read()`
- `Transform.transform(rows)`
- `Sink.write(rows)`

Escolher um estilo e manter consistencia no modulo.

---

## 4. Esqueleto para iniciar M4

```python
REGISTRY = {
    "csv": CsvSource,
    "api": ApiSource,
    "filter": FilterTransform,
    "console": ConsoleSink,
}


def create_stage(name: str, **cfg) -> Stage:
    return REGISTRY[name](**cfg)
```

Loop:

```python
data = None
for stage in stages:
    data = stage.process(data)
```

---

## 5. Criterios de sucesso para M4

- Trocar classe concreta sem mexer no loop principal
- Adicionar novo stage alterando apenas classe + registro
- Testar cada stage de forma isolada
- Evitar dependencia em detalhes internos de outras etapas

---

## 6. Resumo

M3 fecha com linguagem comum para arquitetura orientada a objetos.
M4 comeca aplicando essa base em um pipeline real e testavel.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

No M4, o objetivo nao e "fazer OOP bonita"; e diminuir tempo de mudanca com seguranca.
Toda decisao de design deve responder: isso facilita trocar stage sem quebrar orquestracao?

### Pergunta de checkpoint

Seu blueprint de M4 permite adicionar um novo sink sem alterar o loop central?

### Aplicacao imediata no trabalho

Defina um mini POC com 3 stages (`Source`, `Transform`, `Sink`) e valide substituicao de 1 stage sem alterar o restante.
