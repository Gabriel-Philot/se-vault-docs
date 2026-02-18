# Mini-Aula 3.7: Factory Method (Design Patterns Guru)

> **Objetivo:** Entender o Factory Method como padrao de criacao para desacoplar cliente de classes concretas.

---

## 1. Problema de criacao

Quando o cliente instancia classes concretas diretamente, ele acumula conhecimento de muitos tipos e cria acoplamento.

```python
# ❌ Cliente acoplado — conhece cada classe concreta
if source_type == "csv":
    stage = CsvSource()
elif source_type == "api":
    stage = ApiSource()
elif source_type == "database":
    stage = DatabaseSource()
# Cada novo tipo exige mudanca AQUI no cliente
```

Factory Method move a decisao de **qual** objeto criar para um **criador dedicado** (subclasse), deixando o cliente livre de conhecer tipos concretos.

---

## 2. Quando usar (Applicability)

O Guru lista tres cenarios ideais:

1. **Voce nao sabe de antemao** os tipos exatos dos objetos que seu codigo precisa criar
2. **Quer permitir extensao** por usuarios da sua lib/framework — eles criam subclasses do Creator
3. **Quer reaproveitar objetos existentes** (cache/pool) ao inves de recriar toda vez

---

## 3. Estrutura (terminologia Guru)

| Participante | Papel |
|---|---|
| `Product` | Interface comum dos objetos criados |
| `ConcreteProduct` | Implementacoes concretas do Product |
| `Creator` | Declara `factory_method()` **+ contem logica de negocio** que usa o Product |
| `ConcreteCreator` | Sobrescreve `factory_method()` para retornar **um** tipo de ConcreteProduct |

> **Ponto-chave do Guru:** O Creator **nao existe so para criar**. Ele normalmente contem logica de negocio principal que depende dos objetos retornados pelo factory method. A criacao eh um detalhe delegado as subclasses.

### Diagrama

```text
  ┌─────────────────────────┐           ┌──────────────────┐
  │        Creator          │──────────▶│     Product       │
  │─────────────────────────│           │   (interface)     │
  │ run_pipeline()          │           │──────────────────│
  │   └─ stage = factory_method()       │ + process(data)   │
  │   └─ stage.process(data)│           └────────┬─────────┘
  │                         │                    │
  │ «abstract»              │                    │ implements
  │ factory_method() -> Product                  │
  └────────────┬────────────┘                    │
               │ extends                         │
  ┌────────────┴────────────┐           ┌────────┴─────────┐
  │   ConcreteCreator       │──────────▶│ ConcreteProduct   │
  │─────────────────────────│           └──────────────────┘
  │ factory_method():       │
  │   return ConcreteProduct()          
  └─────────────────────────┘
```

**Fluxo:**
1. Cliente chama `creator.run_pipeline()` (logica de negocio no Creator)
2. Internamente, `run_pipeline()` chama `self.factory_method()` — **sem saber** qual tipo concreto sera retornado
3. A subclasse (ConcreteCreator) retorna o ConcreteProduct adequado
4. `run_pipeline()` usa o produto via interface `Product`

---

## 4. Exemplo em Python (pipeline de dados)

```python
from abc import ABC, abstractmethod


# ─── PRODUCT (interface comum) ───────────────────────────────
# Todos os "produtos" implementam esta interface.
# O cliente so conhece Stage — nunca os tipos concretos.

class Stage(ABC):
    """Interface comum para todas as etapas do pipeline."""

    @abstractmethod
    def process(self, data: list[dict] | None = None) -> list[dict]:
        """Executa a logica desta etapa sobre os dados."""
        ...


# ─── CONCRETE PRODUCTS ──────────────────────────────────────
# Cada implementacao sabe LER de uma fonte diferente.
# O cliente nunca instancia estas classes diretamente.

class CsvSource(Stage):
    """Le dados de um arquivo CSV (simulado)."""

    def process(self, data=None) -> list[dict]:
        print("  [CsvSource] Lendo registros do CSV...")
        return [{"id": 1, "origem": "csv"}]


class ApiSource(Stage):
    """Le dados de uma API REST (simulado)."""

    def process(self, data=None) -> list[dict]:
        print("  [ApiSource] Chamando API externa...")
        return [{"id": 2, "origem": "api"}]


class DatabaseSource(Stage):
    """Le dados de um banco relacional (simulado)."""

    def process(self, data=None) -> list[dict]:
        print("  [DatabaseSource] Consultando banco de dados...")
        return [{"id": 3, "origem": "database"}]


# ─── CREATOR (classe abstrata) ───────────────────────────────
# O Creator NAO existe apenas para criar objetos.
# Ele contem LOGICA DE NEGOCIO (run_pipeline) que depende
# do produto — mas sem saber qual produto concreto sera usado.
#
# O factory_method() eh um "hook" que as subclasses sobrescrevem.
# Note: SEM parametros! A decisao eh da subclasse, nao de um if/elif.

class PipelineCreator(ABC):
    """Criador abstrato: declara o factory_method + logica de negocio."""

    @abstractmethod
    def factory_method(self) -> Stage:
        """Subclasses decidem QUAL Stage retornar."""
        ...

    def run_pipeline(self) -> list[dict]:
        """
        Logica de negocio que USA o produto.

        Este metodo eh o motivo pelo qual o Creator existe!
        Ele orquestra o pipeline sem saber qual Stage concreta
        sera usada — isso eh decidido pelo factory_method().
        """
        # 1. Cria o stage via factory method (sem saber o tipo concreto)
        stage = self.factory_method()

        # 2. Usa o stage atraves da interface Stage (polimorfismo)
        print(f"-> Pipeline iniciado com: {stage.__class__.__name__}")
        dados = stage.process()
        print(f"OK Pipeline concluido: {len(dados)} registro(s)\n")

        return dados


# ─── CONCRETE CREATORS ──────────────────────────────────────
# Cada ConcreteCreator sobrescreve factory_method()
# para retornar UM tipo especifico de Stage.
#
# Para adicionar um novo tipo (ex: Kafka, S3), basta criar
# um NOVO ConcreteCreator — sem modificar nenhum codigo existente.
# Isso respeita o Open/Closed Principle (OCP).

class CsvPipelineCreator(PipelineCreator):
    """Cria pipelines que leem de CSV."""

    def factory_method(self) -> Stage:
        return CsvSource()


class ApiPipelineCreator(PipelineCreator):
    """Cria pipelines que leem de API."""

    def factory_method(self) -> Stage:
        return ApiSource()


class DatabasePipelineCreator(PipelineCreator):
    """Cria pipelines que leem de banco de dados."""

    def factory_method(self) -> Stage:
        return DatabaseSource()
```

### Cliente

```python
# O cliente trabalha com PipelineCreator (abstracao).
# Ele NUNCA menciona CsvSource, ApiSource, etc.
# A troca de fonte eh feita trocando o Creator — zero if/elif.

def executar_pipeline(creator: PipelineCreator) -> list[dict]:
    """
    Funcao cliente generica.
    Recebe qualquer Creator e executa o pipeline.
    Nao sabe (e nao precisa saber) qual Stage sera usada.
    """
    return creator.run_pipeline()


# ─── DEMONSTRACAO ────────────────────────────────────────────
if __name__ == "__main__":
    # Simula escolha vinda de config/env (ex: source_type = "csv")
    creators: dict[str, PipelineCreator] = {
        "csv": CsvPipelineCreator(),
        "api": ApiPipelineCreator(),
        "database": DatabasePipelineCreator(),
    }

    for nome, creator in creators.items():
        print(f"--- Fonte: {nome} ---")
        resultado = executar_pipeline(creator)
        print(f"    Resultado: {resultado}")
```

### Saida esperada

```text
--- Fonte: csv ---
-> Pipeline iniciado com: CsvSource
  [CsvSource] Lendo registros do CSV...
OK Pipeline concluido: 1 registro(s)

    Resultado: [{'id': 1, 'origem': 'csv'}]
--- Fonte: api ---
-> Pipeline iniciado com: ApiSource
  [ApiSource] Chamando API externa...
OK Pipeline concluido: 1 registro(s)

    Resultado: [{'id': 2, 'origem': 'api'}]
--- Fonte: database ---
-> Pipeline iniciado com: DatabaseSource
  [DatabaseSource] Consultando banco de dados...
OK Pipeline concluido: 1 registro(s)

    Resultado: [{'id': 3, 'origem': 'database'}]
```

---

## 5. Comparacao: Factory Method vs Simple Factory

| Aspecto | Simple Factory (parametrizada) | Factory Method (GoF/Guru) |
|---|---|---|
| Quem decide o tipo? | `if/elif` dentro de **um** Creator | **Cada subclasse** de Creator |
| `factory_method()` recebe parametro? | Sim (`kind: str`) | **Nao** |
| Extensao para novo tipo | Modifica o Creator existente | Cria **novo** ConcreteCreator |
| Open/Closed Principle | ❌ Viola (altera codigo existente) | ✅ Respeita (so adiciona) |
| Creator tem logica de negocio? | Geralmente nao, so cria | **Sim**, contem logica que **usa** o produto |

> **Atencao:** Simple Factory é util e tem seu lugar, mas **nao eh** o Factory Method do GoF. Nao confunda os dois.

---

## 6. Pros e contras

### ✅ Pros

- **Evita acoplamento forte** entre o criador e os produtos concretos
- **Single Responsibility Principle (SRP):** criacao de produto centralizada em um lugar
- **Open/Closed Principle (OCP):** novos tipos de produto entram sem quebrar codigo existente

### ❌ Contras

- **Mais subclasses:** o codigo pode ficar mais complexo com muitos ConcreteCreators
- **Melhor cenario:** quando ja existe uma hierarquia de classes Creator para estender

---

## 7. Relacoes com outros padroes

| Relacao | Descricao |
|---|---|
| **Factory Method → Abstract Factory** | Muitos designs comecam com FM e evoluem para AF quando precisam criar familias de produtos |
| **Abstract Factory** usa Factory Methods | AF classes costumam ser conjuntos de Factory Methods |
| **Factory Method ≈ Template Method** | FM eh uma **especializacao** do Template Method — o `run_pipeline()` eh o template, `factory_method()` eh o hook |
| **FM + Iterator** | Subclasses de colecao podem usar FM para retornar tipos diferentes de iteradores |
| **FM vs Prototype** | FM eh baseado em heranca; Prototype usa clonagem (sem heranca, mas inicializacao mais complexa) |

---

## 8. Conexao com dados

- Criar stages por config (`source=csv`, `sink=db`) — cada config mapeia para um ConcreteCreator
- Facilitar extensao por novos conectores: novo conector = novo Creator + novo Product, zero mudanca no orquestrador
- Reduzir acoplamento entre orquestrador e implementacoes concretas
- O `run_pipeline()` do Creator funciona como **Template Method** do orquestrador

---

## 9. Resumo

- Factory Method eh padrao **criacional** do GoF
- Cliente depende de `Product` (interface), **nao** de `ConcreteProduct`
- `Creator` **centraliza logica de negocio** e delega criacao via hook `factory_method()`
- Cada `ConcreteCreator` decide qual produto retornar — **sem** `if/elif`
- Respeita **OCP**: novo tipo = novo Creator, sem alterar codigo existente
- Excelente para **pipelines configuraveis** em engenharia de dados

---

## Proximo passo

**Mini-Aula 3.8:** OOP Smells e Anti-Patterns.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Novos conectores entram por configuracao (`source_type`). Cada valor de config mapeia para um `ConcreteCreator` especifico. O orquestrador (cliente) nunca instancia `CsvSource`, `ApiSource`, etc. — ele so conhece `PipelineCreator` e `Stage`.

### Pergunta de checkpoint

1. Qual a diferenca entre Simple Factory e Factory Method?
2. Por que o Creator deve conter logica de negocio, e nao apenas o `factory_method()`?
3. Se amanha voce precisar adicionar um conector Kafka, quantos arquivos existentes precisaria modificar usando Factory Method?

### Aplicacao imediata no trabalho

Centralize criacao de stages em ConcreteCreators e meca o diff:
- Quantos `if/elif` de selecao de tipo sairam do cliente principal?
- O orquestrador ainda menciona algum tipo concreto de Stage?
