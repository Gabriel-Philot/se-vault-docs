# Mini-Aula 3.0: OOP Mental Model para Dados

> **Objetivo:** Entender por que OOP existe, quando ela ajuda de verdade em dados e quando uma abordagem mais simples eh melhor.

---

## 1. O problema que OOP tenta resolver

Em projetos pequenos, script procedural resolve.
Em projetos que crescem, aparecem **sintomas claros**:

- Regras de negocio espalhadas em varios arquivos (**Shotgun Surgery**)
- Condicoes `if/elif` para cada tipo novo (**Switch Statements smell**)
- Dificuldade para trocar implementacao sem quebrar fluxo (**acoplamento forte**)
- Testes caros porque tudo depende de tudo (**dependencias implicitas**)

**OOP entra para organizar comportamento + estado em unidades coesas**, com contratos claros entre elas.

> **Vocabulario Guru:** Esses sintomas sao o que o Refactoring Guru chama de **Code Smells** — indicadores de que o design pode ser melhorado. OOP e Design Patterns sao ferramentas para tratar esses smells.

---

## 2. O que muda no modelo mental

**Sem OOP**, pensamos em: "qual funcao chamar agora?"

**Com OOP**, pensamos em:

1. Quais **entidades** existem no dominio?
2. Qual **responsabilidade** de cada entidade? (→ Single Responsibility Principle)
3. Qual **contrato** entre elas? (→ interface/classe abstrata)
4. Como **trocar implementacoes** sem mudar o cliente? (→ Dependency Inversion Principle)

### Exemplo mental em dados

```text
 Entidade:        Source
 Responsabilidade: produzir dados
 Contrato:        read() -> list[dict]
 Implementacoes:  CsvSource, ApiSource, ParquetSource
 Troca sem quebrar: cliente depende de Source, nao de CsvSource
```

A **mudanca-chave** no raciocinio nao eh "que funcao cria os dados", mas "qual objeto **sabe** produzir dados e qual **contrato** ele cumpre".

---

## 3. Design Patterns: a conexao com OOP

O livro **Dive Into Design Patterns** (Refactoring Guru) trata patterns como:

> "Solucoes tipicas para problemas comuns em design de software. Sao como plantas pre-prontas que voce customiza para resolver um problema recorrente."

Patterns **nao sao codigo copiavel** — sao **conceitos**. O mesmo pattern aplicado em dois projetos pode gerar codigo diferente.

### Classificacao (Guru)

| Categoria | O que faz | Exemplos |
|---|---|---|
| **Creational** (criacionais) | Mecanismos de criacao de objetos | Factory Method, Abstract Factory, Builder, Singleton |
| **Structural** (estruturais) | Como montar objetos em estruturas maiores | Adapter, Decorator, Facade, Composite |
| **Behavioral** (comportamentais) | Comunicacao e responsabilidades entre objetos | Strategy, Observer, Template Method, Iterator |

> **Nota:** Esta serie de mini-aulas foca nos patterns mais uteis para **data engineering**. Voce nao precisa decorar os 22 — precisa saber **quando** cada um resolve um problema real seu.

### Por que aprender patterns?

1. **Toolkit testado** — solucoes validadas para problemas que voce *vai* encontrar
2. **Vocabulario comum** — dizer "usa Strategy aqui" comunica a ideia inteira ao time
3. **Ensina principios OOP na pratica** — mesmo que nao aplique o pattern, entende o *porquê*

---

## 4. Procedural vs OOP vs Funcional (visao pragmatica)

| Estilo | Melhor uso | Risco comum |
|---|---|---|
| **Procedural** | Scripts curtos, tarefa unica, EDA | Virar script gigante sem fronteiras |
| **OOP** | Sistemas com entidades e **variacoes de comportamento** | Excesso de classes sem necessidade ("over-engineering") |
| **Funcional** | Transformacoes puras e pipelines declarativos | Ignorar estado quando ele eh inevitavel |

### Regra pratica

```text
 1. Comece simples (funcao pura ou script)
 2. Evolua para OOP quando houver:
    - Variacao de comportamento (mais de uma implementacao do mesmo contrato)
    - Manutencao dificil (if/elif crescendo)
    - Necessidade de testes isolados (mocks por contrato)
 3. Misture: use funcoes puras DENTRO de metodos quando fizer sentido
```

> **Critica do Guru:** *"Se tudo que voce tem eh um martelo, tudo parece prego."* Novatos que aprendem patterns tentam aplica-los em todo lugar, mesmo quando codigo simples resolveria. Nao caia nisso.

---

## 5. Exemplo: Procedural vs OOP (Python)

### ❌ Sem OOP — acoplamento cresce com cada tipo novo

```python
# Cada novo source_type exige mais um elif AQUI no cliente
# O cliente "conhece" detalhes de todas as implementacoes

def run_pipeline(source_type: str):
    if source_type == "csv":
        data = [{"id": 1, "origin": "csv"}]       # logica embutida
    elif source_type == "api":
        data = [{"id": 1, "origin": "api"}]        # logica embutida
    elif source_type == "parquet":
        data = [{"id": 1, "origin": "parquet"}]     # logica embutida
    else:
        raise ValueError(f"Tipo desconhecido: {source_type}")

    # processamento...
    print(f"Processados {len(data)} registros de {source_type}")
    return data

run_pipeline("csv")
run_pipeline("api")
```

**Problemas:**
- Novo tipo → modificar esta funcao (viola Open/Closed Principle)
- Impossivel testar um source sem rodar o pipeline inteiro
- Logica de leitura misturada com logica de orquestracao

---

### ✅ Com OOP — contrato estavel, implementacoes intercambiaveis

```python
from abc import ABC, abstractmethod


# ─── CONTRATO (interface) ─────────────────────────────────
# Define O QUE um Source deve fazer, nao COMO
class Source(ABC):
    @abstractmethod
    def read(self) -> list[dict]:
        """Retorna registros do dominio."""
        ...


# ─── IMPLEMENTACOES (ConcreteProducts) ────────────────────
# Cada classe sabe ler de UMA fonte especifica
# Pode ser testada isoladamente
class CsvSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "origin": "csv"}]

class ApiSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "origin": "api"}]

class ParquetSource(Source):
    def read(self) -> list[dict]:
        return [{"id": 1, "origin": "parquet"}]


# ─── CLIENTE ──────────────────────────────────────────────
# Depende de Source (abstracao), NAO de CsvSource/ApiSource
# Novo tipo? Zero mudanca aqui — so cria nova classe
def run_pipeline(source: Source):
    data = source.read()
    print(f"Processados {len(data)} registros de {source.__class__.__name__}")
    return data


# ─── USO ──────────────────────────────────────────────────
run_pipeline(CsvSource())      # troca de fonte =
run_pipeline(ApiSource())      # trocar 1 linha,
run_pipeline(ParquetSource())  # nao reescrever o pipeline
```

**O que mudou:**
- Cliente **nao conhece** nenhum tipo concreto — so `Source`
- Novo conector (ex: Kafka) → cria `KafkaSource(Source)`, **zero** alteracao no pipeline
- Cada Source pode ser testada com `assert KafkaSource().read() == [...]`

---

## 6. Os principios por tras (SOLID no contexto de dados)

| Principio | Significado em dados |
|---|---|
| **S** — Single Responsibility | Cada classe faz uma coisa: `CsvSource` le CSV, `JsonTransform` transforma |
| **O** — Open/Closed | Pipeline aberto para extensao (novo Source), fechado para modificacao |
| **L** — Liskov Substitution | Qualquer `Source` pode substituir outra sem quebrar `run_pipeline` |
| **I** — Interface Segregation | Contratos pequenos e focados: `Source.read()`, nao `Source.read_write_validate_log()` |
| **D** — Dependency Inversion | `run_pipeline` depende da abstracao `Source`, nao de `CsvSource` |

> Voce nao precisa decorar o acronimo. O importante eh reconhecer que **cada principio evita um tipo de dor** que aparece quando o projeto cresce.

---

## 7. Quadro rapido: quando usar OOP

### ✅ Use OOP quando

- Existem entidades estaveis no dominio (`Source`, `Transform`, `Sink`)
- Ha **multiplas implementacoes** do mesmo contrato
- O sistema precisa **evoluir** sem reescrever fluxo central
- Voce quer **testar** partes isoladamente com mocks

### ❌ Evite OOP pesada quando

- Eh script de analise descartavel (notebook, EDA)
- Nao ha variacao de comportamento
- Uma funcao pura resolve com clareza
- Voce esta adicionando classes "por precaucao" (**Speculative Generality** — code smell do Guru)

---

## 8. Conexao com dados (mundo real)

Em data engineering, OOP ajuda principalmente em:

| Area | Como OOP ajuda |
|---|---|
| **Conectores** | Sources intercambiaveis (S3, Kafka, API, DB) via contrato `Source.read()` |
| **Validacao** | Regras encapsuladas por dominio — cada `Validator` sabe suas regras |
| **Pipelines** | Extensiveis sem `if/elif` infinito — novo stage = nova classe |
| **Testes** | Mock de `Source`, `Transform`, `Sink` por contrato |
| **Config** | Tipo do conector vem de config → mapeia para classe concreta |

---

## 9. Resumo (cheat sheet)

- OOP **nao eh objetivo final** — eh ferramenta de organizacao
- Use quando houver **variacao + evolucao + manutencao**
- **Contratos** (interfaces/classes abstratas) reduzem acoplamento
- Cliente deve depender de **abstracao**, nao de implementacao
- **Design Patterns** sao solucoes testadas para problemas comuns de design — **nao** receitas para copiar
- Em dados: **troque pecas do pipeline sem reescrever o loop**
- **Nao force OOP** onde script simples resolve — isso tambem eh um anti-pattern

---

## Proximo passo

**Mini-Aula 3.1:** Classes, Objetos e Estado.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Seu time precisa trocar uma fonte de ingestao de CSV para API sem parar o job diario.
Se o fluxo central estiver acoplado ao tipo concreto (`if source == "csv"`), a mudanca vira retrabalho.
Com contrato (`Source.read()`), a troca fica localizada: **nova classe, nova linha de config, zero mudanca no orquestrador**.

### Perguntas de checkpoint

1. Qual a diferenca entre depender de `CsvSource` e depender de `Source`?
2. Se amanha entrar uma fonte Kafka, qual parte do seu codigo deveria mudar: o loop do pipeline ou apenas a nova classe?
3. Cite um cenario onde adicionar OOP seria **over-engineering** no seu trabalho atual.

### Aplicacao imediata no trabalho

1. Liste 2 pontos do seu pipeline atual que tem `if/elif` por tipo e marque onde um contrato unico reduziria risco
2. Identifique quais "entidades" estaveis existem no seu dominio atual (fontes, transformacoes, destinos)
3. Para cada entidade, escreva o contrato minimo que ela deveria cumprir (ex: `read() -> list[dict]`)
