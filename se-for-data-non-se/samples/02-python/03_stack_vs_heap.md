# Mini-Aula 02.3: Stack vs Heap — Entendendo a Memória

> **Objetivo:** Entender onde seus dados vivem na memória e por que isso importa quando sua pipeline OOM.

---

## Contexto: Onde Estamos na Hierarquia de Memória?

Antes de falar de Stack e Heap, precisamos situar onde eles vivem:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE MEMÓRIA                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  CPU                                                        │   │
│   │  ├── Registradores: ~100 bytes, < 1ns                       │   │
│   │  └── Cache L1/L2/L3: ~30MB, 1-10ns                          │   │
│   │      (onde a CPU guarda dados que está usando AGORA)        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              ↕ barramento                           │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  RAM (Memória Principal): 8-128GB, ~100ns                   │   │
│   │  ┌───────────────────────────────────────────────────────┐  │   │
│   │  │  Stack │ Heap │ Data │ Text  ← FOCO DESTA AULA        │  │   │
│   │  └───────────────────────────────────────────────────────┘  │   │
│   │  (onde seu programa VIVE enquanto está rodando)             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              ↕ I/O                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Storage (Disco): TB, ~10,000,000ns (10ms)                  │   │
│   │  SSD, HDD, NVMe, S3, GCS, HDFS...                           │   │
│   │  (onde seus arquivos/datasets estão PERSISTIDOS)            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│         ↑ mais rápido, menor, caro  |  ↓ mais lento, maior, barato  │
└─────────────────────────────────────────────────────────────────────┘
```

### O que isso significa para Data Engineers?

| Situação | Onde os dados estão | Latência |
|----------|---------------------|----------|
| `pd.read_csv("data.csv")` | Disco → RAM | 10ms+ |
| `df["col"].sum()` | RAM (Heap) | 100ns |
| Spark shuffle | RAM → Disco → Rede → RAM | segundos |
| Consulta ao S3 | Storage remoto | 100ms+ |

**A lição:** Stack e Heap são subdivisões da **RAM**. Quando você carrega um dataset, ele vai do **Disco** para a **RAM** (heap). Quando a RAM enche, seu processo morre (OOM).

---

## Como a CPU Conversa com a RAM?

A CPU **não entra** na RAM. Ela **puxa** dados, processa nos seus registradores, e **empurra** de volta. É como um chef: pega ingrediente na geladeira → cozinha → devolve o prato.

### O Ciclo Fetch-Execute (simplificado)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Exemplo: executando  x = x + 10  (onde x está no endereço 0x1000)  │
└─────────────────────────────────────────────────────────────────────┘

1. FETCH (buscar instrução)
   ┌───────┐                         ┌─────────────────────┐
   │  CPU  │ ◄────── lê ──────────── │  RAM (região Text)  │
   │       │   "add [0x1000], 10"    │  código do programa │
   └───────┘                         └─────────────────────┘

2. FETCH OPERAND (buscar dado)
   ┌───────┐                         ┌─────────────────────┐
   │  CPU  │ ◄────── lê ──────────── │  RAM (Stack/Heap)   │
   │       │   valor atual: 42       │  [0x1000] = 42      │
   └───────┘                         └─────────────────────┘

3. EXECUTE (processar)
   ┌───────────────────────────────────────────────┐
   │  CPU (dentro dos registradores)               │
   │  42 + 10 = 52  ◄── cálculo acontece AQUI      │
   └───────────────────────────────────────────────┘

4. WRITE BACK (escrever resultado)
   ┌───────┐                         ┌─────────────────────┐
   │  CPU  │ ──────── escreve ─────► │  RAM (Stack/Heap)   │
   │       │   novo valor: 52        │  [0x1000] = 52      │
   └───────┘                         └─────────────────────┘

Isso acontece BILHÕES de vezes por segundo (GHz = bilhões de ciclos/s)
```

### Onde Stack e Heap entram nisso?

```
Quando a CPU busca um dado:
  ┌───────────────────────────────────────────────────────────────────┐
  │  Endereço 0x7fff... (alto)  →  provavelmente está no STACK        │
  │  Endereço 0x0055... (baixo) →  provavelmente está no HEAP         │
  └───────────────────────────────────────────────────────────────────┘

A CPU não sabe se é Stack ou Heap — pra ela é tudo endereço de RAM.
Mas VOCÊ precisa saber, porque:
  • Stack: alocação automática, limitado
  • Heap: alocação manual/GC, grande mas pode fragmentar
```

### Por que Cache importa?

RAM é lenta (~100ns). CPU é rápida (<1ns). Cache é um "buffer" ultra-rápido entre eles:

```
CPU precisa de arr[0]:
  ├── No Cache L1? → SIM → 1ns ✓
  └── Não? → Busca na RAM (100ns), traz arr[0..63] pro cache

CPU precisa de arr[1]:
  └── No Cache L1? → SIM! (veio junto com arr[0]) → 1ns ✓
```

**Isso afeta seu código:**
```python
# ✅ Cache-friendly: acesso sequencial
for i in range(len(arr)):
    total += arr[i]  # arr[i+1] já está no cache

# ❌ Cache-unfriendly: acesso aleatório
for i in random.sample(range(len(arr)), len(arr)):
    total += arr[i]  # cada acesso é cache miss (~100x mais lento)
```

---

## 1. Layout de Memória de um Programa

Todo programa em execução tem sua memória dividida em 4 regiões:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MEMÓRIA DE UM PROCESSO                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Endereços ALTOS (ex: 0xFFFFFFFF)                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                         STACK                               │   │
│   │  • Variáveis locais de funções                              │   │
│   │  • Parâmetros de função                                     │   │
│   │  • Endereços de retorno                                     │   │
│   │                          ↓                                  │   │
│   │                    (cresce para BAIXO)                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                    ┌──── ESPAÇO LIVRE ────┐                         │
│                    │  (buffer de colisão) │                         │
│                    └──────────────────────┘                         │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    (cresce para CIMA)                       │   │
│   │                          ↑                                  │   │
│   │                         HEAP                                │   │
│   │  • Objetos alocados dinamicamente                           │   │
│   │  • Arrays de tamanho variável                               │   │
│   │  • Tudo que você aloca em runtime                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                         DATA                                │   │
│   │  • Variáveis globais e estáticas                            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                         TEXT                                │   │
│   │  • Código do programa (instruções)                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│   Endereços BAIXOS (ex: 0x00000000)                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Por que Stack e Heap crescem em direções opostas?

Pense assim: o SO não sabe de antemão quanto de Stack ou Heap você vai usar. Então ele coloca cada um em uma ponta da memória disponível:

```
Início do programa:
  STACK (quase vazio)  ────────────────────  HEAP (quase vazio)
        ↓                 muito espaço                ↑

Programa rodando:
  STACK (cresce)  ───────→ ← ───────  HEAP (cresce)
        ↓↓↓           menos espaço           ↑↑↑

Se colidirem: 💥 Crash (Stack Overflow ou Out of Memory)
```

### Analogia para Data Engineers

| Região | Analogia | Características |
|--------|----------|-----------------|
| **Stack** | `/tmp` no container | Rápido, temporário, pequeno (~1-8MB) |
| **Heap** | S3/GCS/HDFS | Flexível, persistente, grande (GBs) |
| **Data** | Variáveis de ambiente | Configurações globais |
| **Text** | Código da DAG/Job | Instruções que rodam |

---

## 2. O que é o Stack?

### Características Principais

| Aspecto | Comportamento |
|---------|---------------|
| **Estrutura** | LIFO (Last In, First Out) — pilha de pratos |
| **Alocação** | Automática pelo compilador |
| **Velocidade** | Muito rápida (ponteiro move up/down) |
| **Tamanho** | Limitado (~1-8MB por thread) |
| **Escopo** | Local à função |

### Como Funciona

```
Chamada main() → Chamada funcao_a() → Chamada funcao_b()

┌─────────────┐
│ funcao_b()  │ ← Topo (última a entrar)
├─────────────┤
│ funcao_a()  │
├─────────────┤
│ main()      │ ← Base (primeira a entrar)
└─────────────┘
```

Quando `funcao_b()` retorna, seu frame é **automaticamente removido**.

### Exemplo em C

```c
void processar_batch() {
    int batch_size = 1000;     // Stack
    double metrics[10];        // Stack (tamanho fixo)
    
    // Ao sair da função, tudo é liberado automaticamente
}
```

---

## 3. O que é o Heap?

### Características Principais

| Aspecto | Comportamento |
|---------|---------------|
| **Estrutura** | Área livre, fragmentável |
| **Alocação** | Manual ou por Garbage Collector |
| **Velocidade** | Mais lenta (busca por espaço livre) |
| **Tamanho** | Grande (limitado pela RAM) |
| **Escopo** | Global — persiste até ser liberado |

### Como Funciona

```
┌────┬────┬──────┬────┬────────┬────┐
│ A  │ B  │ FREE │ C  │  FREE  │ D  │  ← Heap pode fragmentar
└────┴────┴──────┴────┴────────┴────┘
```

### Exemplo em C

```c
void processar_dataset() {
    // Alocação dinâmica no heap
    int* dados = malloc(1000000 * sizeof(int));
    
    // ... processamento ...
    
    free(dados);  // OBRIGATÓRIO em C! Senão: memory leak
}
```

**⚠️ Risco:** Esquecer o `free()` = memory leak. Em pipelines longas, isso mata o processo.

---

## 4. Stack Overflow vs Out of Memory

### 🔴 Stack Overflow

**Causa:** Stack excede seu limite (geralmente recursão infinita ou variáveis locais gigantes).

```c
// ❌ PROBLEMA: recursão sem caso base
void recursao_infinita() {
    int buffer[1000];       // Cada chamada aloca mais stack
    recursao_infinita();    // Nunca para
}
// Resultado: StackOverflowError / Segmentation Fault
```

```python
# Python tem limite de recursão (~1000 por padrão)
def fatorial_errado(n):
    return n * fatorial_errado(n - 1)  # Sem caso base!
# RecursionError: maximum recursion depth exceeded
```

### 🔴 Out of Memory (OOM)

**Causa:** Heap esgotado — você alocou mais do que a RAM suporta.

```python
# ❌ Clássico em Data Engineering
import pandas as pd

# Tentando carregar 50GB em máquina com 16GB RAM
df = pd.read_csv("dataset_gigante.csv")
# MemoryError ou processo killed pelo OOM Killer
```

### Tabela Comparativa

| Erro | Onde Ocorre | Causa Comum | Sintoma |
|------|-------------|-------------|---------|
| **Stack Overflow** | Stack | Recursão infinita | `RecursionError`, Segfault |
| **Out of Memory** | Heap | Dataset > RAM | `MemoryError`, OOM Kill |

---

## 5. Diferenças por Linguagem: C vs Java vs Python

### Onde cada coisa vive?

| Linguagem | Primitivos | Objetos/Arrays | Quem libera memória? |
|-----------|------------|----------------|----------------------|
| **C** | Stack | Heap (malloc) | Você (`free()`) |
| **Java** | Stack | Heap (new) | Garbage Collector |
| **Python** | Heap¹ | Heap | Garbage Collector |

> ¹ **Plot twist:** Em Python, **TUDO** é objeto, então tudo vai pro heap. Até `x = 5` cria um objeto `int` no heap.

### Fluxo Visual

```
         C                      Python
    ┌─────────┐             ┌─────────┐
    │  Stack  │             │  Stack  │
    │ int x=5 │             │ ref x ──┼──┐
    └─────────┘             └─────────┘  │
                                         ▼
    ┌─────────┐             ┌─────────┐
    │  Heap   │             │  Heap   │
    │ malloc()│             │ PyInt(5)│ ← Objeto int
    └─────────┘             └─────────┘
```

---

## 6. Por que isso Importa para Dados?

### 6.1 Pandas e o Heap

Cada célula de um DataFrame é um objeto Python no heap:

```python
import pandas as pd
import sys

df = pd.DataFrame({"a": range(1000)})

# Cada inteiro é um PyObject de ~28 bytes
print(sys.getsizeof(df["a"][0]))  # ~28 bytes para um int!

# Comparado com array NumPy (contíguo em memória)
import numpy as np
arr = np.array(range(1000))
print(arr.nbytes)  # 8000 bytes total (~8 bytes por int)
```

**Resultado:** DataFrame Pandas usa ~3-4x mais RAM que o dado "cru".

### 6.2 Quando sua Pipeline dá OOM

```
┌─────────────────────────────────────────────────────────────┐
│  Você tem 16GB RAM. Seu CSV tem 20GB.                       │
│                                                              │
│  ❌ pd.read_csv("20gb.csv")                                 │
│     → Tenta carregar tudo no heap → OOM                     │
│                                                              │
│  ✅ Soluções:                                               │
│     1. Chunking: for chunk in pd.read_csv(..., chunksize=)  │
│     2. Polars (lazy evaluation, streaming)                  │
│     3. Spark (distribui o heap entre nós)                   │
│     4. DuckDB (out-of-core processing)                      │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Por que Spark Distribui?

```
Máquina única:        Cluster Spark:
┌──────────────┐      ┌────────┐ ┌────────┐ ┌────────┐
│    HEAP      │      │ HEAP 1 │ │ HEAP 2 │ │ HEAP 3 │
│   16GB max   │  →   │  16GB  │ │  16GB  │ │  16GB  │
│   OOM! 💥    │      │ Worker │ │ Worker │ │ Worker │
└──────────────┘      └────────┘ └────────┘ └────────┘
                              48GB total capacity
```

---

## 7. Resumo Prático

```
┌─────────────────────────────────────────────────────────────┐
│  STACK                          HEAP                        │
│  ─────                          ─────                       │
│  Automático                     Manual ou GC                │
│  Rápido, pequeno                Lento, grande               │
│  Variáveis locais               Objetos, dados dinâmicos    │
│  Erro: Stack Overflow           Erro: Out of Memory         │
│                                                              │
│  🎯 Para Data Engineers:                                    │
│  Python coloca TUDO no heap → por isso Pandas come RAM      │
│  Heap cheio = OOM → use chunking, Polars, ou distribua      │
└─────────────────────────────────────────────────────────────┘
```

---

## Conexões

- **Anterior:** [02 - Interpretado vs Compilado](./02_interpretado_vs_compilado.md)
- **Próximo:** [04 - Gerenciamento de Memória em Python](./04_memoria_python.md)
- **Complementar:** A aula 2.4 vai aprofundar como Python gerencia o heap (reference counting, GC)
