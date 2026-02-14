# Mini-Aula 02.5: Pandas vs Polars vs Spark

> **Objetivo:** Entender por que Pandas consome tanta RAM, quando usar Polars ou Spark, e como otimizar transformações no dia a dia.

---

## Conexão com a Aula Anterior

Na aula 04, vimos que **tudo em Python é objeto no Heap** e que cada `int` custa 28 bytes. Agora a pergunta prática:

> Se um `int` já pesa 7x mais que em C, o que acontece quando você carrega 10 milhões de linhas num DataFrame?

---

## 1. Por que Pandas Consome Tanta RAM?

### 1.1 Cada valor é um PyObject (em colunas `object`)

```
┌─────────────────────────────────────────────────────────────┐
│  df["nome"] com dtype object                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Array de ponteiros (8 bytes cada)                           │
│  ┌────┬────┬────┬────┬────┐                                  │
│  │ →  │ →  │ →  │ →  │ →  │                                  │
│  └─┬──┴─┬──┴─┬──┴─┬──┴─┬──┘                                 │
│    ▼    ▼    ▼    ▼    ▼                                     │
│  PyObj PyObj PyObj PyObj PyObj  ← cada string isolada no heap │
│  ~60B  ~60B  ~60B  ~60B  ~60B                                │
│                                                              │
│  Total por célula: 8 (ponteiro) + ~60 (objeto) = ~68 bytes   │
│  × 1 milhão de linhas = ~65 MB só para uma coluna de strings │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Cópia implícita

```python
df2 = df[df["valor"] > 100]   # filtra → pode criar cópia
df2["nova"] = 1                # SettingWithCopyWarning

# Agora existem 2 DataFrames na memória
# O GC só libera o original quando todas as referências sumirem
```

### 1.3 Resumo dos vilões de RAM

| Problema | Causa | Impacto |
|----------|-------|---------|
| Colunas `object` | Cada célula = PyObject separado | 10-20x mais que necessário |
| Dtypes padrão `int64`/`float64` | 8 bytes mesmo para valores pequenos | 2-8x mais que necessário |
| Cópias implícitas | Slices podem duplicar dados | 2x memória |
| `read_csv` sem filtro | Carrega todas as colunas e linhas | OOM em datasets grandes |

---

## 2. Polars: Por que é Mais Rápido?

### Escrito em Rust, usa Apache Arrow

```
┌─────────────────────────────────────────────────────────────┐
│  PANDAS                          POLARS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Python objects no heap          Buffers contíguos (Arrow)   │
│  ┌──┬──┬──┬──┬──┐               ┌──────────────────────┐    │
│  │→ │→ │→ │→ │→ │ ponteiros     │ 1  2  3  4  5        │    │
│  └──┴──┴──┴──┴──┘               └──────────────────────┘    │
│   ↓  ↓  ↓  ↓  ↓                 Memória contígua, tipada    │
│  PyObj em locais                 Zero overhead Python         │
│  espalhados no heap              CPU-friendly (cache lines)  │
│                                                              │
│  Overhead: ~60 bytes/valor       Overhead: 4-8 bytes/valor   │
│  GIL bloqueia threads            Rust threads sem GIL        │
│  Eager evaluation                Lazy + query optimizer       │
└─────────────────────────────────────────────────────────────┘
```

### Lazy Evaluation: o trunfo do Polars

```python
import polars as pl

# Lazy: nada executa até .collect()
result = (
    pl.scan_csv("huge.csv")           # não carrega nada
    .filter(pl.col("valor") > 100)    # registra filtro
    .select(["nome", "valor"])        # registra projeção
    .group_by("nome")                 # registra agrupamento
    .agg(pl.col("valor").sum())       # registra agregação
    .collect()                        # AGORA executa tudo otimizado
)

# O optimizer pode:
# 1. Pushdown de filtro → lê menos linhas do CSV
# 2. Pushdown de projeção → lê menos colunas
# 3. Paralelizar automaticamente entre cores
```

### Comparativo de consumo

```python
import pandas as pd
import polars as pl
import tracemalloc

# --- Pandas ---
tracemalloc.start()
df_pd = pd.read_csv("data.csv")
result_pd = df_pd.groupby("category")["value"].sum()
_, peak_pd = tracemalloc.get_traced_memory()
tracemalloc.stop()

# --- Polars ---
tracemalloc.start()
df_pl = pl.read_csv("data.csv")
result_pl = df_pl.group_by("category").agg(pl.col("value").sum())
_, peak_pl = tracemalloc.get_traced_memory()
tracemalloc.stop()

print(f"Pandas peak: {peak_pd / 1024 / 1024:.1f} MB")
print(f"Polars peak: {peak_pl / 1024 / 1024:.1f} MB")
# Polars tipicamente usa 2-5x menos memória
```

---

## 3. Quando Usar Spark vs Pandas vs Polars?

```
┌─────────────────────────────────────────────────────────────┐
│  ÁRVORE DE DECISÃO                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tamanho do dataset?                                         │
│  │                                                           │
│  ├── < 1 GB ──► Pandas ou Polars (single node)              │
│  │              └── Precisa de velocidade? → Polars          │
│  │              └── Ecossistema/legacy? → Pandas             │
│  │                                                           │
│  ├── 1-50 GB ──► Polars (single node com lazy)              │
│  │               └── Não cabe na RAM? → Spark               │
│  │                                                           │
│  └── > 50 GB ──► Spark (distribuído)                         │
│                  └── Cluster disponível? Obrigatório         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tabela Comparativa

| Aspecto | Pandas | Polars | Spark |
|---------|--------|--------|-------|
| **Linguagem** | Python (C/Cython) | Rust + Python API | Scala/Java (JVM) |
| **Modelo** | Eager, single-thread | Lazy, multi-thread | Lazy, distribuído |
| **Memória** | PyObjects no heap | Apache Arrow buffers | JVM off-heap |
| **GIL** | Bloqueia paralelismo | Não afeta (Rust) | Não afeta (JVM) |
| **Escala** | ~1 GB | ~50 GB | Petabytes |
| **Ecossistema** | Enorme (scikit, plotly) | Crescendo rápido | Maduro (MLlib, Delta) |
| **Curva** | Familiar | Sintaxe nova | Setup de cluster |

### Por que Spark usa JVM e não Python?

```
┌─────────────────────────────────────────────────────────────┐
│  PySpark: a verdade por baixo dos panos                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Seu código Python (driver)                                  │
│       │                                                      │
│       ▼ serializa instruções (não dados!)                    │
│  Py4J bridge ──► JVM (Spark Core)                            │
│                    │                                         │
│                    ▼ executa no cluster                      │
│               Workers JVM processam dados                    │
│                                                              │
│  → Python só descreve o plano                                │
│  → JVM executa de verdade                                    │
│  → Dados NUNCA passam pelo interpretador Python*             │
│                                                              │
│  *Exceto UDFs Python → serialização cara (evite!)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Hands-on: Identificando Memory Leak

### Script de exemplo

```python
"""
memory_leak_demo.py
Demonstra um memory leak típico e como identificar.
"""
import tracemalloc
import gc

tracemalloc.start()

# --- Simulação de leak: lista que só cresce ---
cache = []

def process_batch(batch_id):
    data = list(range(10000))
    result = sum(data)
    cache.append(data)  # BUG: nunca limpa o cache
    return result

# Processa 100 batches
for i in range(100):
    process_batch(i)
    if (i + 1) % 25 == 0:
        current, peak = tracemalloc.get_traced_memory()
        print(f"Batch {i+1:3d} | Atual: {current/1024:.0f} KB | Pico: {peak/1024:.0f} KB")

# Diagnóstico: top consumidores
snapshot = tracemalloc.take_snapshot()
print("\n--- Top 3 consumidores de memória ---")
for stat in snapshot.statistics("lineno")[:3]:
    print(stat)

tracemalloc.stop()

# FIX: limpar cache após uso, ou usar maxlen
# from collections import deque
# cache = deque(maxlen=10)  # mantém só os últimos 10
```

**Output esperado:**
```
Batch  25 | Atual:  870 KB | Pico:  870 KB
Batch  50 | Atual: 1720 KB | Pico: 1720 KB
Batch  75 | Atual: 2570 KB | Pico: 2570 KB
Batch 100 | Atual: 3420 KB | Pico: 3420 KB  ← crescendo sem parar!

--- Top 3 consumidores de memória ---
memory_leak_demo.py:14: size=3340 KiB  ← a linha do append
```

---

## 5. Cheat Sheet

```
┌─────────────────────────────────────────────────────────────┐
│  PANDAS vs POLARS vs SPARK                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PANDAS: rápido de prototipar, pesado na RAM                 │
│  ✅ Use para: EDA, datasets < 1GB, integração com ML libs   │
│  ⚠️  Otimize: category, downcast, usecols, chunksize        │
│                                                              │
│  POLARS: performance sem cluster                             │
│  ✅ Use para: ETL local, datasets até ~50GB, lazy queries    │
│  ⚠️  Cuidado: ecossistema menor, sintaxe diferente          │
│                                                              │
│  SPARK: escala horizontal                                    │
│  ✅ Use para: datasets > 50GB, pipelines em cluster          │
│  ⚠️  Cuidado: overhead de setup, evite UDFs Python           │
│                                                              │
│  REGRA DE OURO:                                              │
│  "Use a ferramenta mais simples que resolve o problema"      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Conexões

- **Anterior:** [04 - Memória em Python](./04_memoria_python.md)
- **Próximo:** [Prática do Módulo 02](./pratica.md)
- **Complementar:** A aula 04 explica *por que* PyObjects são caros; esta aula mostra as *alternativas*
