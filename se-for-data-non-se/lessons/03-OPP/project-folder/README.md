# OOP Playground — Guia Completo (For Dummies)

Um app interativo pra aprender Programacao Orientada a Objetos (OOP) de um jeito visual,
usando metaforas de engenharia de dados. Tema inspirado no filme Dune.

---

## Como Rodar

Voce so precisa de Docker instalado. Um comando e pronto:

```bash
docker compose up --build
```

Depois abre no navegador:

- **App:** http://localhost:5173
- **API docs (Swagger):** http://localhost:8000/docs

Pra parar: `Ctrl+C` ou `docker compose down`.

---

## O Que E Cada Pagina

O app tem 5 paginas, cada uma ensina um pilar de OOP.
A barra lateral esquerda (sidebar) navega entre elas.

---

### Pagina 1 — Classes & Objects (Blueprint Builder)

**O que ensina:** A diferenca entre uma *classe* (planta/blueprint) e um *objeto* (a coisa construida a partir da planta).

**Analogia:** Uma classe e como a planta de uma casa. Um objeto e a casa construida.

#### Botoes e campos:

| Elemento | O que faz |
|----------|-----------|
| **Class Name** (campo de texto) | Nome da classe que voce esta criando. Ex: `Dog`, `DataSource` |
| **+ Attribute > name** | Nome do atributo. Ex: `name`, `age`, `_password` |
| **+ Attribute > tipo** (dropdown) | Tipo do atributo: `str`, `int`, `float`, `bool`, `list` |
| **+ Attribute > Private** (checkbox) | Marca o atributo como privado (vai ganhar `_` na frente e cadeado vermelho) |
| **+ Attribute > Add** | Adiciona o atributo na classe |
| **+ Method > method_name** | Nome do metodo. Ex: `bark`, `read`, `connect` |
| **+ Method > param1, param2** | Parametros do metodo (separados por virgula). Deixe vazio se nao tiver |
| **+ Method > body** | Corpo do metodo em Python. Ex: `return f"{self.name} says Woof!"` |
| **+ Method > Add** | Adiciona o metodo na classe |
| **Build Class** | Envia a classe pro backend. O backend gera o codigo Python real e mostra no terminal embaixo |
| **Instantiate Object > nome** | Nome da instancia. Ex: `rex`, `my_dog` |
| **Instantiate Object > campos de valor** | Preencha o valor de cada atributo publico |
| **Create Instance** | Cria um objeto a partir da classe. Aparece na secao "Live Objects" com animacao de particulas laranjas |

#### Elementos visuais:

- **Cadeado azul** = atributo publico (qualquer um acessa)
- **Cadeado vermelho** = atributo privado (so metodos da classe acessam)
- **f metodo()** = bloco de metodo (laranja)
- **Live Objects** = objetos ja criados, mostrando seus valores
- **Generated Python** (terminal embaixo) = o codigo Python real que foi gerado

#### O que arrastar:

Os blocos de atributo e metodo dentro da classe podem ser **reordenados arrastando** (drag and drop).

---

### Pagina 2 — Inheritance (Family Tree)

**O que ensina:** Heranca — uma classe filha herda atributos e metodos da classe pai.

**Analogia:** Um `Puppy` herda tudo que um `Dog` tem (nome, raca) e pode ter coisas proprias (tamanho).

#### Botoes e campos:

| Elemento | O que faz |
|----------|-----------|
| **Arvore visual** (React Flow) | Mostra as classes como nos conectados. Pai em cima, filhos embaixo. Clique em um no pra ver o codigo resolvido |
| **Parent class name** | Nome da classe pai (precisa existir — crie na Pagina 1 primeiro!) |
| **Child class name** | Nome da classe filha que vai herdar |
| **+ Own Attribute > Add** | Adiciona um atributo que so a filha tem (nao herdado) |
| **+ Method > Override parent method** (checkbox) | Marca que esse metodo substitui um metodo do pai |
| **+ Method > Add** | Adiciona metodo proprio ou override |
| **Create Child** | Cria a classe filha. Ela aparece na arvore conectada ao pai |

#### Elementos visuais:

- **Tag "Proprio"** (laranja) = algo que a classe criou por conta propria
- **Tag "Herdado"** (azul) = algo que veio do pai
- **Tag "Override"** = metodo que substituiu o do pai
- **Edge (linha tracejada)** = conexao pai -> filho na arvore

#### Inheritance Code (terminal):

Mostra o codigo Python com `class Puppy(Dog):` e `super().__init__()` — exatamente como voce escreveria em Python real.

---

### Pagina 3 — Encapsulation (Vault Puzzle)

**O que ensina:** Encapsulamento — esconder dados internos e so permitir acesso controlado via metodos.

**Analogia:** Voce nao abre o cofre do banco com as maos. Voce usa a chave (getter/setter).

#### Como funciona:

A pagina carrega automaticamente uma classe `DatabaseConnection` com:
- **Atributos publicos:** `host` (localhost), `port` (5432) — acessiveis diretamente
- **Atributos privados:** `_username`, `_password` — protegidos, mostram `***`

#### Interacoes:

| Acao | O que acontece |
|------|----------------|
| **Clicar em atributo publico** (host, port) | Acesso permitido! Mostra o valor e o codigo Python |
| **Clicar em atributo privado** (_username, _password) | **Acesso negado!** Banner vermelho + animacao de tremor. Codigo mostra `# private attribute` |
| **Arrastar metodo getter/setter pra cima do atributo privado** | **Desbloqueia!** O metodo acessa o atributo de forma segura |

#### Metodos disponiveis (lado direito):

| Metodo | O que faz |
|--------|-----------|
| `get_username()` | Le o valor de `_username` de forma segura |
| `get_password()` | Le `_password` mas retorna mascarado (`***ret`) |
| `set_password()` | Altera `_password` de forma controlada |

#### A licao:

Atributos privados (`_`) nao devem ser acessados diretamente.
Use metodos (getters/setters) pra ler e escrever — isso e encapsulamento.

---

### Pagina 4 — Polymorphism (Arena)

**O que ensina:** Polimorfismo — objetos diferentes respondem ao mesmo metodo de formas diferentes.

**Analogia:** Tres fontes de dados (CSV, Parquet, API) todas tem `.read()`, mas cada uma le de um jeito diferente. Pro pipeline, tanto faz qual voce usa — a interface e a mesma.

#### Elementos:

| Elemento | O que faz |
|----------|-----------|
| **Cards de source** (CsvSource, ParquetSource, ApiSource) | Cada card mostra a implementacao do `.read()` daquela fonte |
| **Bolinha no canto** (toggle) | Clique pra selecionar/desselecionar a fonte |
| **Execute .read()** | Executa o metodo `.read()` nas fontes selecionadas via streaming (SSE) |

#### O que acontece ao executar:

1. Cada fonte selecionada recebe eventos em tempo real:
   - **Start** — `.read()` chamado
   - **Progress** — lendo dados...
   - **Result** — dados retornados (diferentes pra cada fonte!)

2. O terminal mostra o codigo Python polimórfico:
```python
sources = [CsvSource(), ParquetSource()]
for source in sources:
    data = source.read()  # mesmo metodo, comportamento diferente
```

#### A licao:

Mesma interface (`.read()`), implementacoes diferentes.
Voce pode trocar CsvSource por ApiSource e o codigo continua funcionando.

---

### Pagina 5 — Factory Pattern (Pipeline Builder)

**O que ensina:** Factory Pattern — construir pipelines componiveis onde as pecas sao intercambiaveis.

**Analogia:** Uma esteira de fabrica. Voce encaixa as pecas (source -> transform -> sink) e a esteira roda. Pode trocar qualquer peca por outra do mesmo tipo.

#### Elementos:

| Elemento | O que faz |
|----------|-----------|
| **Stages** (painel esquerdo) | Lista de pecas disponiveis pra montar o pipeline |
| **Canvas** (React Flow, area central) | Onde as pecas aparecem conectadas |
| **Clicar em uma stage** | Adiciona ao pipeline (auto-conecta ao anterior) |
| **Build Pipeline** | Envia o pipeline pro backend e gera o codigo Python |
| **Run Pipeline** | Executa o pipeline via streaming (SSE) — cada stage acende conforme processa |
| **Swap** (index + dropdown) | Troca uma peca do pipeline por outra. Ex: troque CsvSource por ParquetSource |

#### Tipos de stage:

| Tipo | Stages | O que fazem |
|------|--------|-------------|
| **SOU** (source) | CsvSource, ParquetSource, ApiSource | Origem dos dados |
| **TRA** (transform) | FilterTransform, MapTransform, AggregateTransform | Transformam os dados |
| **SIN** (sink) | ConsoleSink, FileSink, DatabaseSink | Destino final dos dados |

#### Fluxo tipico:

1. Clique em **CsvSource** (aparece no canvas)
2. Clique em **FilterTransform** (conecta automaticamente)
3. Clique em **ConsoleSink** (conecta automaticamente)
4. Clique em **Build Pipeline** — codigo gerado no terminal
5. Clique em **Run Pipeline** — cada stage acende em sequencia mostrando os dados fluindo
6. Use **Swap** pra trocar CsvSource por ParquetSource — pipeline continua funcionando!

#### Pipeline Code (terminal):

```python
stage_0 = CsvSource(path="data.csv")       # source
stage_1 = FilterTransform(column="id")     # transform
stage_2 = ConsoleSink()                     # sink

pipeline = Pipeline([stage_0, stage_1, stage_2])
pipeline.run()
```

#### A licao:

Tudo que voce aprendeu junto: classes (Pagina 1), heranca (Pagina 2), encapsulamento (Pagina 3) e polimorfismo (Pagina 4) se combinam aqui no Factory Pattern. As pecas sao intercambiaveis porque seguem a mesma interface.

---

## Resumo Visual Rapido

```
Pagina 1: Classe e o molde, Objeto e a coisa feita do molde
Pagina 2: Filho herda do Pai (e pode sobrescrever)
Pagina 3: Privado = cadeado. Getter/Setter = chave
Pagina 4: Mesmo metodo, comportamentos diferentes
Pagina 5: Monta o pipeline, troca as pecas, tudo funciona
```

---

## Estrutura do Projeto

```
project-folder/
  docker-compose.yml          # Sobe backend + frontend
  backend/
    app/
      main.py                 # FastAPI — 15 rotas
      models/                 # Contratos Pydantic (fonte da verdade)
      routers/                # 1 router por pagina
      engine/executor.py      # Executa codigo Python
      sse/stream.py           # Streaming de eventos
  frontend/
    src/
      App.tsx                 # Rotas + layout
      pages/                  # 5 paginas
      components/
        layout/               # Sidebar, CodeTerminal
        shared/               # ClassCard, AttributeBlock, etc.
        page1/ a page5/       # Componentes especificos
```

---

## Stack

- **Backend:** Python 3.12, FastAPI, Pydantic v2, uvicorn, sse-starlette
- **Frontend:** React 19, TypeScript, Vite, @dnd-kit, motion, React Flow
- **Infra:** Docker Compose (2 containers)
- **Tema:** Dune (cores do deserto, spice orange, Fremen blue)
