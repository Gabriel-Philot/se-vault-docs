# Mini-Aula 3.5.2: Factory para Connectors (Fontes e Destinos)

> **Objetivo:** Centralizar criacao de connectors para reduzir acoplamento e evitar instanciacao espalhada.

---

## 0. O que e novo vs 03-OPP

No `03-OPP`, Factory foi apresentado como padrao criacional.
Aqui o foco e uso em engenharia de dados com registry, falhas comuns e fronteira de testes.

---

## 1. Problema real de dados

Pipeline precisa ler de `csv`, `api`, `s3` e gravar em `warehouse` ou `lake`.
Quando cada task instancia classe concreta, qualquer fonte nova exige mudanca em varios pontos.

---

## 2. Conceito

Factory concentra a decisao de criacao em um lugar.
Cliente pede "tipo" e recebe objeto que respeita contrato.

---

## 3. Exemplo curto em Python

```python
from abc import ABC, abstractmethod

class Source(ABC):
    @abstractmethod
    def read(self) -> list[dict]:
        pass

class CsvSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "from": "csv"}]

class ApiSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 2, "from": "api"}]

class SourceFactory:
    _registry = {
        "csv": CsvSource,
        "api": ApiSource,
    }

    @classmethod
    def create(cls, source_type: str) -> Source:
        if source_type not in cls._registry:
            raise ValueError(f"source_type nao suportado: {source_type}")
        return cls._registry[source_type]()
```

---

## 4. Anti-exemplo comum

```python
def run_job(source_type: str):
    if source_type == "csv":
        source = CsvSource()
    elif source_type == "api":
        source = ApiSource()
    elif source_type == "s3":
        source = S3Source()
    # repetido em varios jobs
    rows = source.read()
    return rows
```

---

## 5. Quando usar, quando nao usar, trade-off

Use quando:
- multiplos tipos de fonte/destino
- novos conectores entram no roadmap
- quer reduzir mudanca espalhada

Nao use quando:
- existe so 1 implementacao estavel
- criacao e trivial e nao deve evoluir

Trade-off explicito:
- ganha ponto unico de extensao
- risco de "factory deus" sem governanca de registry

---

## 6. Teste minimo esperado

1. mapping de tipo para classe correta
2. erro claro para tipo desconhecido
3. smoke test com pelo menos 2 conectores diferentes

---

## 7. Bloco didatico: conhecimento proximal

### Cenario real de dados

Time adiciona nova origem quinzenalmente por parceria comercial.
Factory evita tocar em cada DAG/task para ajustar criacao.

### Pergunta de checkpoint

Seu codigo muda em um ponto ou em varios arquivos sempre que entra um connector novo?

### Aplicacao imediata no trabalho

Mapeie todas instanciacoes de connector no repo e mova para uma factory unica.

---

## 8. Resumo

- Factory desacopla fluxo da criacao concreta
- bom para multiplas fontes/destinos
- sem regra de ownership do registry, vira gargalo arquitetural

