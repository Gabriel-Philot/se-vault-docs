# Mini-Aula 3.5: Abstracao com ABC e Protocol

> **Objetivo:** Diferenciar contrato nominal (ABC) de contrato estrutural (Protocol) e escolher com criterio.

---

## 1. O que e abstracao

Abstracao define o que deve ser feito, sem amarrar como.

Exemplo de contrato: qualquer `Source` precisa expor `read()`.

---

## 2. ABC (Abstract Base Class)

```python
from abc import ABC, abstractmethod

class Source(ABC):
    @abstractmethod
    def read(self) -> list[dict]:
        pass
```

Beneficio:

- Contrato explicito
- Erro cedo ao tentar instanciar classe incompleta

---

## 3. Protocol (subtipagem estrutural)

```python
from typing import Protocol

class Readable(Protocol):
    def read(self) -> list[dict]:
        ...


def run(source: Readable):
    return source.read()
```

Qualquer classe com `read()` compativel satisfaz o contrato para type checker.

---

## 4. ABC vs Protocol

| Criterio | ABC | Protocol |
|---------|-----|----------|
| Relacao explicita de heranca | Sim | Nao obrigatoria |
| Regras de runtime | Mais forte | Mais leve |
| Flexibilidade com classes externas | Menor | Maior |
| Clareza arquitetural | Alta | Media/Alta |

Decisao pragmatica:

- Use **ABC** quando quer fronteira arquitetural explicita
- Use **Protocol** quando quer baixo acoplamento e interoperabilidade

---

## 5. Conexao com dados

- ABC para contratos centrais do dominio (`Source`, `Transform`, `Sink`)
- Protocol para integrar bibliotecas/adapters externos sem heranca forcada

---

## 6. Resumo

- Abstracao e sobre contratos
- ABC: nominal e rigido
- Protocol: estrutural e flexivel
- Escolha depende de governanca vs extensibilidade

---

## Proximo passo

**Mini-Aula 3.6:** Composicao vs Heranca.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Voce integra biblioteca de terceiro que ja possui `read()`, mas nao herda sua base `Source`.
`Protocol` permite aceitar essa integracao com baixo atrito, mantendo contrato.

### Pergunta de checkpoint

Seu problema exige governanca forte de heranca (ABC) ou flexibilidade para integrar componentes externos (Protocol)?

### Aplicacao imediata no trabalho

Escolha um contrato central (`read`, `transform` ou `write`) e documente qual estilo sera padrao do time e por que.
