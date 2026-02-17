# Mini-Aula 02.3: Python vs C — Interpretado vs Compilado

> **Objetivo:** Entender como linguagens executam código e por que isso importa para Data Engineering.

---

## 1. O que é Compilação? (C como exemplo)

**Compilação:** transformar código-fonte inteiro em código de máquina **antes** da execução.

```
Código (.c) → Preprocessor → Compiler → Assembler → Linker → Executável nativo
```

### As 4 Etapas

| Etapa | O que faz | Output |
|-------|-----------|--------|
| **Preprocessing** | Expande `#include`, `#define`, remove comentários | Código expandido |
| **Compilation** | Traduz para assembly (específico da CPU) | Arquivo `.s` |
| **Assembly** | Converte assembly em object code | Arquivo `.o` |
| **Linking** | Junta object files + bibliotecas | Executável binário |

**Resultado:** binário que roda **direto na CPU**, sem intermediários.

```c
// hello.c
#include <stdio.h>
int main() {
    printf("Hello, World!\n");
    return 0;
}
```
```bash
gcc hello.c -o hello    # compila
./hello                  # executa binário nativo
```

---

## 2. O que é Interpretação? (Python)

Python usa modelo **híbrido**: compila para bytecode, depois interpreta.

```
Código (.py) → CPython compila → Bytecode (.pyc) → PVM interpreta → CPU
```

### O Processo

1. **Compilação para Bytecode**
   - Código-fonte → bytecode (`.pyc` em `__pycache__/`)
   - Bytecode é **independente de plataforma**
   - Acontece automaticamente ao rodar

2. **Python Virtual Machine (PVM)**
   - Lê e executa bytecode instrução por instrução
   - Gerencia memória, tipos, exceções em runtime

```python
# hello.py
print("Hello, World!")  # executa direto, sem compilação manual
```

> **Por que ainda é "interpretado"?** O executável final (bytecode) ainda precisa de um intérprete (PVM) para rodar. Não é código de máquina nativo.

---

## 3. Tabela Comparativa: C vs Python

| Aspecto | C | Python |
|---------|---|--------|
| **Modelo de execução** | Compilado → binário nativo | Bytecode → PVM interpreta |
| **Tipagem** | Estática (compile-time) | Dinâmica (runtime) |
| **Portabilidade** | Recompilar por plataforma | Mesmo `.pyc` roda em qualquer OS |
| **Velocidade** | Muito rápida | 10-200× mais lenta |
| **Memória** | Manual (`malloc`/`free`) | Automática (GC) |
| **Sintaxe** | Verbosa, explícita | Concisa, legível |
| **Ponteiros** | Sim, explícitos | Não (usa referências) |
| **OOP** | Não nativo (struct-based) | Classes built-in |
| **Biblioteca padrão** | Mínima | Extensa ("batteries included") |
| **Tratamento de erros** | Return codes, checks manuais | Exceptions |

### Entendendo as Diferenças

- **Tipagem estática vs dinâmica:** Em C, `int x = 5;` é fixo — x sempre será int. Em Python, `x = 5` depois `x = "texto"` funciona (duck typing). Isso dá flexibilidade, mas custa performance (checagem em runtime).
- **Ponteiros vs referências:** C expõe endereços de memória diretamente. Python abstrai isso — você manipula referências, não endereços.
- **Biblioteca padrão:** C tem só o básico (I/O, strings, math). Python vem com JSON, HTTP, regex, datetime, etc. prontinhos.
- **Tratamento de erros:** Em C você checa `if (result == -1)`. Python usa `try/except` — mais legível, mas com overhead.

### Benchmark Real

| Tarefa | C | Python | Diferença |
|--------|---|--------|-----------|
| Loop até 1 bilhão | 21ms | 79,000ms | **3,761× mais lenta** |
| Contar primos até 250k | 0.012s | 0.261s | **21× mais lenta** |
| Fibonacci recursivo | ~1x | ~40x | **40× mais lenta** |

---

## 4. Por que isso Importa para Dados?

### 4.1 Performance de Loops

Python puro é **muito lento** para loops intensivos:

```python
# ❌ LENTO: loop Python puro
total = 0
for i in range(1_000_000):
    total += i * i

# ✅ RÁPIDO: NumPy (C por baixo dos panos)
import numpy as np
arr = np.arange(1_000_000)
total = np.sum(arr ** 2)  # 100x mais rápido
```

**Lição:** Em Data Engineering, **evite loops Python puros**. Use bibliotecas vetorizadas.

### 4.2 GIL e Threading

O **Global Interpreter Lock (GIL)** do CPython:
- Permite apenas **1 thread executar Python por vez**
- Impede paralelismo real em CPU-bound tasks
- Threads funcionam para I/O (aguardar rede, disco)

```python
# CPU-bound: threads NÃO ajudam (GIL bloqueia)
# Use multiprocessing para paralelismo real

from multiprocessing import Pool

def processar(chunk):
    return sum(x**2 for x in chunk)

with Pool(4) as p:  # 4 processos separados (sem GIL)
    resultados = p.map(processar, chunks)
```

> **🔮 Python 3.13+ Free-Threaded (PEP 703)**
> 
> A partir do Python 3.13, existe um build **experimental sem GIL** (`--disable-gil`).
> 
> **Benchmarks reais:**
> - Multi-threaded CPU-bound: **~80% mais rápido** (8.5s → 1.5s)
> - Fibonacci com 8 threads: **84% mais rápido**
> - Escalabilidade quase linear com número de cores
> 
> **Trade-off:** Single-threaded fica ~40% mais lento (projetado cair para ~10% no 3.14).
> 
> **Status:** Experimental até ~2030 para manter compatibilidade com extensões C.

### 4.3 Por que Spark usa JVM?

**Problema:** Python é lento demais para processar terabytes.

**Solução do Spark:**
1. **Core em Scala/Java** → roda na JVM, compilado para bytecode JVM
2. **JVM tem JIT** → compila hot paths para código nativo em runtime
3. **PySpark** → API Python, mas execução em JVM

```
PySpark Code → Driver Python → Serializa para JVM → Workers JVM executam
```

**Trade-off:** Você escreve Python (produtividade), mas o trabalho pesado roda em JVM (performance).

| Framework | Linguagem Core | Por quê? |
|-----------|----------------|----------|
| **Spark** | Scala (JVM) | JIT, garbage collection madura |
| **Pandas** | C/Cython | Operações vetorizadas nativas |
| **Polars** | Rust | Segurança + performance nativa |
| **DuckDB** | C++ | SQL engine otimizada |

---

## 5. Resumo Prático

```
┌─────────────────────────────────────────────────────────────┐
│  C (Compilado)              Python (Interpretado)          │
│  ─────────────              ───────────────────            │
│  Código → Binário nativo    Código → Bytecode → PVM        │
│  Máxima performance         Flexibilidade/produtividade    │
│  Controle total memória     GC automático                  │
│  Portabilidade: recompilar  Mesmo código roda em tudo      │
└─────────────────────────────────────────────────────────────┘
```

**Para Data Engineers:**
1. **Loops:** use NumPy/Pandas (C por baixo), não Python puro
2. **Paralelismo:** `multiprocessing` para CPU, `threading` para I/O
3. **Big Data:** engines JVM (Spark) ou nativas (Polars/DuckDB)
4. **Entenda o trade-off:** Python = produtividade, delegate performance para bibliotecas

---

## Conexões

- **Anterior:** [02 - Linux, Processos e Bash](./02_linux_so_bash.md)
- **Próximo:** [04 - Stack vs Heap](./04_stack_vs_heap.md)
- **Complementar:** Por que frameworks modernos (Polars, DuckDB) escolhem Rust/C++
