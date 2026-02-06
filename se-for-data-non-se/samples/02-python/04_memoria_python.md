# Mini-Aula 02.4: Gerenciamento de Memória em Python

> **Objetivo:** Entender como Python gerencia memória internamente e por que seu DataFrame come toda RAM.

---

## Conexão com a Aula Anterior

Na aula 03, vimos que a memória se divide em **Stack** e **Heap**. Agora vamos aprofundar:

```
┌───────────────────────────────────────────────────────────────────────┐
│  Resumo da Aula Anterior (Stack vs Heap)                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  STACK                              HEAP                              │
│  • Referências locais               • Objetos alocados                │
│  • Automático (função entra/sai)    • GC ou manual                    │
│  • Pequeno (~8MB)                   • Grande (GBs)                    │
│                                                                       │
│  Em C:  int x = 5;    ← x VIVE no stack (valor direto)                │
│  Em Python: x = 5     ← x é PONTEIRO no stack → objeto no heap        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**A grande diferença:** Em Python, **TUDO é objeto no Heap**. Até um simples `x = 5`.

---

## 1. Tudo é Objeto = Tudo no Heap

### O que realmente acontece quando você faz `x = [1, 2, 3]`

```
┌─────────────────────────────────────────────────────────────────────┐
│  Código Python: x = [1, 2, 3]                                       │
└─────────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STACK (frame da função)                                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  x  ──────────────────────────────┐                            │ │
│  │     (ponteiro, 8 bytes)           │                            │ │
│  └────────────────────────────────────│────────────────────────────┘│
└──────────────────────────────────────│──────────────────────────────┘
                                       │ aponta para
                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  HEAP (Private Python Heap)                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  PyObject: lista [1, 2, 3]                                     │ │
│  │  ├── ob_refcnt: 1          ← quantas referências apontam aqui  │ │
│  │  ├── ob_type: list         ← tipo do objeto                    │ │
│  │  └── items: [→1, →2, →3]   ← ponteiros para outros PyObjects!  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  PyObject: int(1)    PyObject: int(2)    PyObject: int(3)           │
│  ├── ob_refcnt: 1    ├── ob_refcnt: 1    ├── ob_refcnt: 1           │
│  └── value: 1        └── value: 2        └── value: 3               │
└─────────────────────────────────────────────────────────────────────┘
```

### Por que isso importa?

```python
import sys

# Um int em C: 4 bytes
# Um int em Python:
x = 42
print(sys.getsizeof(x))  # 28 bytes!!! (overhead do PyObject)

# Uma lista de 1000 ints:
lista = list(range(1000))
print(sys.getsizeof(lista))  # ~8KB só da estrutura da lista
# + 1000 × 28 bytes = ~28KB para os ints
# Total: ~36KB para 1000 números que em C seriam 4KB
```

**Overhead do Python:** ~7-9x mais memória que C para dados numéricos.

---

## 2. Pymalloc: Como Python Organiza o Heap

Python não usa `malloc()` diretamente para objetos pequenos. Usa **pymalloc**, um alocador otimizado.

### Fluxo de Camadas: malloc → pymalloc

```
┌─────────────────────────────────────────────────────────────────────┐
│  Código Python: x = 42                                              │
└─────────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Python runtime: "Preciso alocar PyLongObject (~28 bytes)"          │
└─────────────────────────────────────────────────────────────────────┘
         ↓
         ├──  ≤512 bytes? ──► pymalloc: "Pego block de arena existente"
         │                              (fast path, sem syscall)
         │
         └──  >512 bytes? ──► malloc(): "Peço direto ao SO"
                                        (syscall lenta)

┌─────────────────────────────────────────────────────────────────────┐
│  Quando pymalloc precisa de mais espaço:                            │
│                                                                     │
│  pymalloc ──► malloc(256KB) ──► SO entrega arena                    │
│           ↓                                                         │
│  "Divido em pools/blocks e gerencio internamente"                   │
└─────────────────────────────────────────────────────────────────────┘
```

> **Analogia:** malloc = ir ao supermercado; pymalloc = sua dispensa em casa.
> Você não vai ao mercado toda vez que quer comer — compra bastante de uma vez.

### A Hierarquia: Arenas → Pools → Blocks

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRIVATE PYTHON HEAP                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Arena (1 MB)                                                       │
│  ├─ Pool (4 KB) ─ Size Class: 32 bytes                              │
│  │  ├─ Block [allocated] ← int(42)                                  │
│  │  ├─ Block [allocated] ← int(100)                                 │
│  │  ├─ Block [free]      ← estava ocupado, agora livre              │
│  │  └─ Block [untouched] ← nunca usado                              │
│  │                                                                  │
│  ├─ Pool (4 KB) ─ Size Class: 48 bytes                              │
│  │  ├─ Block [allocated] ← "hello"                                  │
│  │  └─ Block [allocated] ← "world"                                  │
│  │                                                                  │
│  └─ Pool (4 KB) ─ Size Class: 64 bytes                              │
│     └─ Block [allocated] ← pequena lista                            │
│                                                                     │
│  Arena (1 MB) ... mais arenas conforme necessário                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Analogia para Data Engineers

| Conceito | Pymalloc | Data Lake |
|----------|----------|-----------|
| **Arena** | 1 MB de memória | Partição `year=2024/month=01/` |
| **Pool** | 4 KB, um tamanho específico | Arquivo Parquet |
| **Block** | Onde o objeto vive | Registro/linha |

### Por que esse design?

1. **Pools separados por tamanho** → evita fragmentação
2. **Blocks reutilizados** → objeto deletado vira bloco livre
3. **Arenas liberáveis** → quando uma arena inteira fica vazia, Python devolve ao SO

### Objetos > 512 bytes

```python
# Objetos pequenos (≤512 bytes): pymalloc
x = 42                    # ~28 bytes → block de 32 bytes
s = "hello"               # ~54 bytes → block de 56 bytes

# Objetos grandes (>512 bytes): malloc direto do SO
big = "x" * 1000          # >1000 bytes → malloc()
df = pd.DataFrame(...)    # Muito grande → malloc()
```

---

## 3. Reference Counting: Quando Liberar Memória?

Python sabe quando liberar um objeto contando **quantas referências** apontam para ele.

### O contador `ob_refcnt`

```python
import sys

a = [1, 2, 3]
print(sys.getrefcount(a))  # 2 (a + argumento da função)

b = a                      # Agora b também aponta pro mesmo objeto
print(sys.getrefcount(a))  # 3

del b                      # Remove referência de b
print(sys.getrefcount(a))  # 2

# Quando refcount chega a 0: objeto é desalocado imediatamente
```

### Fluxo Visual

```
Passo 1: a = [1, 2, 3]
┌─────────┐         ┌──────────────────┐
│ a ──────┼────────►│ PyObject(list)   │
└─────────┘         │ ob_refcnt: 1     │
                    └──────────────────┘

Passo 2: b = a
┌─────────┐         ┌──────────────────┐
│ a ──────┼────────►│ PyObject(list)   │
│ b ──────┼────────►│ ob_refcnt: 2     │
└─────────┘         └──────────────────┘

Passo 3: del a
┌─────────┐         ┌──────────────────┐
│ b ──────┼────────►│ PyObject(list)   │
└─────────┘         │ ob_refcnt: 1     │
                    └──────────────────┘

Passo 4: del b
                    ┌──────────────────┐
                    │ PyObject(list)   │
                    │ ob_refcnt: 0     │ ← DEALLOC!
                    └──────────────────┘
                            ↓
                    Bloco vira "free"
                    (mas não volta pro SO imediatamente)
```

---

## 4. Garbage Collector: O Problema dos Ciclos

Reference counting tem um problema: **ciclos**.

### O Problema

```python
class Node:
    def __init__(self, name):
        self.name = name
        self.next = None

a = Node("A")
b = Node("B")
a.next = b   # a → b
b.next = a   # b → a (ciclo!)

del a, b     # Deletamos as variáveis, MAS:
             # Objeto A ainda referencia B (refcount ≥ 1)
             # Objeto B ainda referencia A (refcount ≥ 1)
             # Nunca chegam a 0! MEMORY LEAK!
```

```
Antes do del:
┌─────┐       ┌─────────────┐       ┌─────────────┐
│  a  │──────►│ Node("A")   │──────►│ Node("B")   │
└─────┘       │ refcount: 2 │◄──────│ refcount: 2 │
              └─────────────┘       └─────────────┘
┌─────┐               ▲                    │
│  b  │───────────────┼────────────────────┘
└─────┘

Depois do del a, b:
              ┌─────────────┐       ┌─────────────┐
              │ Node("A")   │──────►│ Node("B")   │
              │ refcount: 1 │◄──────│ refcount: 1 │
              └─────────────┘       └─────────────┘
                    ↑                      │
                    └──────────────────────┘
              (Inalcançáveis, mas refcount > 0!)
```

### A Solução: Generational GC

Python tem um **Garbage Collector** que periodicamente procura ciclos:

```
┌─────────────────────────────────────────────────────────────────────┐
│  GENERATIONAL GARBAGE COLLECTOR                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Geração 0 (young)     Geração 1 (middle)     Geração 2 (old)       │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐    │
│  │ Objetos novos   │   │ Sobreviveram    │   │ Sobreviveram    │    │
│  │ Coletados MUITO │──►│ Coletados às    │──►│ Coletados       │    │
│  │ frequentemente  │   │ vezes           │   │ raramente       │    │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘    │
│                                                                     │
│  Hipótese: "Maioria dos objetos morre jovem"                        │
│  → Foca energia na geração 0                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Controlando o GC

```python
import gc

# Ver configurações
print(gc.get_threshold())  # (700, 10, 10)
# Significa: coleta gen0 a cada 700 alocações
#            coleta gen1 a cada 10 coletas de gen0
#            coleta gen2 a cada 10 coletas de gen1

# Forçar coleta (útil após deletar objetos grandes)
gc.collect()

# Desabilitar GC (cuidado!)
gc.disable()  # Só reference counting funciona
gc.enable()
```

---

## 5. Por que Pandas Usa Tanta RAM?

### Causa 1: Cada célula é um PyObject (em colunas object)

```python
import pandas as pd
import numpy as np

# Coluna string (object dtype)
df = pd.DataFrame({"name": ["Alice", "Bob", "Carol"] * 10000})
print(df.memory_usage(deep=True))
# name: ~500 KB para 30000 strings curtas!

# Mesmo dado como categoria
df["name_cat"] = df["name"].astype("category")
print(df.memory_usage(deep=True))
# name_cat: ~30 KB (armazena códigos inteiros + lookup table)
```

### Causa 2: Dtypes padrão são "gordos"

```python
df = pd.DataFrame({"age": [25, 30, 35]})  # Default: int64 (8 bytes)

# Mas idade cabe em int8 (1 byte)!
df["age"] = df["age"].astype("int8")

# Antes: 24 bytes (3 × 8)
# Depois: 3 bytes (3 × 1)
```

### Causa 3: Cópias implícitas

```python
# ❌ Cria cópia silenciosa
df2 = df[df["age"] > 25]  # Pode copiar
df2["new_col"] = 1        # Warning de SettingWithCopyWarning

# ✅ Cópia explícita
df2 = df[df["age"] > 25].copy()
df2["new_col"] = 1

# ✅ Pandas 2.0+: Copy-on-Write (experimental)
pd.options.mode.copy_on_write = True
```

### Causa 4: Carregando dados demais de uma vez

```python
# ❌ Tudo na RAM
df = pd.read_csv("huge.csv")  # 10GB → OOM

# ✅ Só colunas necessárias
df = pd.read_csv("huge.csv", usecols=["col1", "col2"])

# ✅ Processamento em chunks
for chunk in pd.read_csv("huge.csv", chunksize=100000):
    process(chunk)

# ✅ Formato eficiente
df = pd.read_parquet("data.parquet")  # Columnar, tipado
```

---

## 6. Otimizações Práticas

### 6.1 Otimizar dtypes do DataFrame

```python
def optimize_dtypes(df):
    """Reduz dtypes para os menores possíveis."""
    for col in df.select_dtypes(include=["int"]):
        df[col] = pd.to_numeric(df[col], downcast="integer")
    for col in df.select_dtypes(include=["float"]):
        df[col] = pd.to_numeric(df[col], downcast="float")
    for col in df.select_dtypes(include=["object"]):
        if df[col].nunique() / len(df) < 0.5:  # <50% unique
            df[col] = df[col].astype("category")
    return df

# Uso
df = optimize_dtypes(df)
print(df.info(memory_usage="deep"))
```

### 6.2 Usar `__slots__` em classes

```python
# ❌ Classe normal: cada instância tem __dict__ (dict no heap)
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# ✅ Com __slots__: sem __dict__, atributos pré-alocados
class PointOptimized:
    __slots__ = ["x", "y"]
    def __init__(self, x, y):
        self.x = x
        self.y = y

import sys
p1 = Point(1, 2)
p2 = PointOptimized(1, 2)
print(sys.getsizeof(p1.__dict__))  # 104 bytes
# p2 não tem __dict__!

# Economia: ~30-50% de RAM por instância
```

### 6.3 Generators para streams

```python
# ❌ Lista: tudo na memória
def get_rows():
    return [row for row in huge_query()]  # OOM

# ✅ Generator: uma linha por vez
def get_rows():
    for row in huge_query():
        yield row  # Lazy evaluation

# ✅ Equivalente com expressão geradora
rows = (row for row in huge_query())
```

### 6.4 weakref para caches

```python
import weakref

class DataCache:
    def __init__(self):
        self._cache = weakref.WeakValueDictionary()
    
    def get(self, key, loader):
        if key not in self._cache:
            self._cache[key] = loader()
        return self._cache[key]

# Objetos no cache são coletados se ninguém mais os referencia
# Evita memory leak em caches que crescem infinitamente
```

---

## 7. Debugging de Memória

### tracemalloc (built-in)

```python
import tracemalloc

tracemalloc.start()

# Seu código
data = [list(range(1000)) for _ in range(1000)]

current, peak = tracemalloc.get_traced_memory()
print(f"Atual: {current / 1024 / 1024:.1f} MB")
print(f"Pico: {peak / 1024 / 1024:.1f} MB")

# Top 5 consumidores
snapshot = tracemalloc.take_snapshot()
for stat in snapshot.statistics("lineno")[:5]:
    print(stat)

tracemalloc.stop()
```

### memory_profiler

```bash
pip install memory-profiler
```

```python
from memory_profiler import profile

@profile
def process_data():
    df = pd.read_csv("data.csv")
    result = df.groupby("category").sum()
    return result

# Executar: python -m memory_profiler script.py
```

### df.info(memory_usage="deep")

```python
df = pd.read_csv("data.csv")
df.info(memory_usage="deep")

# Output:
# Column  Non-Null  Dtype   
# ...
# memory usage: 45.2 MB  ← uso real de memória
```

---

## 8. Resumo Prático

```
┌─────────────────────────────────────────────────────────────────────┐
│  PYTHON MEMORY MANAGEMENT                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. TUDO É OBJETO NO HEAP                                           │
│     • int(5) = 28 bytes (não 4!)                                    │
│     • Overhead ~7x vs C para números                                │
│                                                                     │
│  2. PYMALLOC                                                        │
│     • Arena (1MB) → Pool (4KB) → Block (8-512 bytes)                │
│     • Objetos > 512 bytes: malloc direto                            │
│                                                                     │
│  3. REFERENCE COUNTING                                              │
│     • refcount = 0 → libera imediatamente                           │
│     • Não resolve ciclos!                                           │
│                                                                     │
│  4. FLUXO malloc → pymalloc                                         │
│     • Objeto ≤512 bytes → pymalloc (pega block de arena existente)  │
│     • Objeto >512 bytes → malloc direto (syscall ao SO)             │
│     • pymalloc USA malloc: pede arenas grandes, gerencia internamente│
│                                                                     │
│  5. GARBAGE COLLECTOR                                               │
│     • Geracional (0→1→2)                                            │
│     • Detecta ciclos (reference counting não resolve)               │
│                                                                     │
│  ⚠️ PANDAS: cuidado com dtypes, cópias, carregar tudo de uma vez    │
│                                                                     │
│  ✅ OTIMIZE: category, downcast, chunks, generators, __slots__      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Conexões

- **Anterior:** [03 - Stack vs Heap](./03_stack_vs_heap.md)
- **Próximo:** [05 - Pandas, Polars, Spark](./05_pandas_polars_spark.md)
- **Complementar:** A aula 05 vai aprofundar por que Polars/Spark são mais eficientes
