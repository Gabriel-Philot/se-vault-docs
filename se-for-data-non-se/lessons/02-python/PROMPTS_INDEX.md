# 🐍 Módulo 02: Python e Computadores

## 📊 Visão Geral

| Mini-Aula | Tema | Duração | Tipo | Status |
|-----------|------|---------|------|--------|
| 2.0 | Origens da Computação | 20min | Teórico | [ ] |
| 2.1 | Bits, Bytes e Linguagens | 20min | Teórico | [ ] |
| 2.2 | Linux, Processos e Bash | 20min | Misto | [ ] |
| 2.3 | Python vs C: Interpretado vs Compilado | 25min | Misto | [ ] |
| 2.4 | Stack vs Heap | 25min | Misto | [ ] |
| 2.5 | Gerenciamento de Memória em Python | 20min | Misto | [ ] |
| 2.6 | Conexão com Dados: Pandas, Polars, Spark | 10min | Hands-on | [ ] |
| **TOTAL** | | **2h20** | | |

---

## 🎯 Objetivo do Módulo

- Entender como Python se relaciona com o SO
- Diferenciar Python de linguagens compiladas
- Debugar problemas de memória
- Entender por que Pandas consome RAM e quando usar Spark/Polars

---

## 📁 Fontes de Conteúdo (funda-re/)

| Arquivo | Usar em |
|---------|---------|
| `02-python-vs-c.md` | 2.3 |
| `stack-heap.md` | 2.4 |
| `python-memory-allocation.md` | 2.5 |

---

## 🗂️ PROMPTS PARA PRÓXIMAS SESSÕES

### Mini-Aula 2.0: Origens da Computação
**Prompt:**
```
Crie a mini-aula 02.0 (Origens da Computação) para o módulo 02-python.

Estrutura:
1. A primeira máquina programável (Teares de Jacquard, Máquina Analítica de Babbage)
2. Alan Turing e a Máquina de Turing (conceito de computabilidade)
3. ENIAC e os primeiros computadores eletrônicos
4. A transição: válvulas → transistores → circuitos integrados

Formato:
- Seguir o padrão de /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/01-internet-portas/01_internet_fundamentals.md
- Analogias para engenheiros de dados
- Máximo 150 linhas, conciso

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/00_origens_computacao.md
```

---

### Mini-Aula 2.1: Bits, Bytes e Linguagens
**Prompt:**
```
Crie a mini-aula 02.1 (Bits, Bytes e Linguagens) para o módulo 02-python.

Estrutura:
1. Sistema Binário: Por que computadores só entendem 0 e 1
2. Bits → Bytes → KB → MB → GB (escalas)
3. Assembly: A primeira linguagem "humana"
4. A evolução: Fortran → COBOL → C → Python
5. Por que Python surgiu (filosofia de legibilidade)

Formato:
- Seguir o padrão do Módulo 01
- Conectar com contexto de dados (tamanho de datasets, parquet vs csv)
- Máximo 150 linhas

Fonte extra: pesquisar história das linguagens de programação

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/01_bits_bytes_linguagens.md
```

---

### Mini-Aula 2.2: Linux, Processos e Bash
**Prompt:**
```
Crie a mini-aula 02.2 (Linux, Processos e Bash) para o módulo 02-python.

Objetivo:
- Explicar como Python conversa com o sistema operacional Linux
- Mostrar o papel do Bash na execução e automação
- Preparar base para Stack/Heap e memória em Python

Estrutura:
1. Linux (kernel) vs Bash (shell) vs terminal
2. Processo, PID, memória virtual e file descriptors (stdin/stdout/stderr)
3. Syscalls essenciais: open/read/write, fork/exec, mmap
4. Pipes e redirecionamento (|, >, 2>) com analogia de pipeline de dados
5. Comandos práticos para debugging: ps, top, free, df, du, lsof, ss, grep, awk
6. Ponte explícita para as aulas 2.3 e 2.4

Formato:
- Seguir estilo das mini-aulas do módulo 02 (didático, objetivo, com conexão a dados)
- Incluir exemplos de comando executáveis
- Máximo 180 linhas

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/02_linux_so_bash.md
```

---

### Mini-Aula 2.3: Python vs C - Interpretado vs Compilado
**Prompt:**
```
Crie a mini-aula 02.3 (Python vs C: Interpretado vs Compilado) condensando:
/home/bil/Documents/studies/se-vault/funda-re/02-python-vs-c.md

Estrutura:
1. O que é compilação? (C como exemplo)
   - Preprocessing → Compilation → Assembly → Linking
2. O que é interpretação? (Python)
   - Bytecode → PVM
3. Tabela comparativa: C vs Python
4. Por que isso importa para dados?
   - Performance de loops
   - GIL e threading
   - Por que Spark usa JVM

Formato:
- Condensar o conteúdo existente (máximo 180 linhas)
- Manter exemplos de código práticos
- Adicionar seção de conexão com dados

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/03_interpretado_vs_compilado.md
```

---

### Mini-Aula 2.4: Stack vs Heap
**Prompt:**
```
Crie a mini-aula 02.4 (Stack vs Heap) condensando:
/home/bil/Documents/studies/se-vault/funda-re/stack-heap.md

Estrutura:
1. O que é o Stack? (LIFO, variáveis locais)
2. O que é o Heap? (Alocação dinâmica)
3. Stack Overflow e Out of Memory
4. Visualização gráfica do fluxo
5. Diferenças práticas: C vs Python vs Java

Formato:
- Condensar (máximo 300 linhas)
- Diagramas ASCII
- Analogia com partições/storage em dados

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/04_stack_vs_heap.md
```

---

### Mini-Aula 2.5: Gerenciamento de Memória em Python
**Prompt:**
```
Crie a mini-aula 02.5 (Gerenciamento de Memória em Python) condensando:
/home/bil/Documents/studies/se-vault/funda-re/python-memory-allocation.md

Estrutura:
1. Tudo é objeto em Python → Tudo no Heap
2. Pymalloc: Arenas → Pools → Blocks
3. Reference Counting (ob_refcnt)
4. Garbage Collector e Ciclos
5. Por que Pandas usa tanta RAM?

Formato:
- Condensar (máximo 180 linhas)
- Exemplos com sys.getrefcount()
- Diagramas de alocação

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/05_memoria_python.md
```

---

### Mini-Aula 2.6: Conexão com Dados - Pandas, Polars, Spark
**Prompt:**
```
Crie a mini-aula 02.6 (Pandas vs Polars vs Spark) focando em:

Estrutura:
1. Por que Pandas consome tanta RAM?
   - Cada valor é um PyObject
   - Cópia implícita
2. Polars: Por que é mais rápido?
   - Escrito em Rust, usa Apache Arrow
   - Lazy evaluation
3. Quando usar Spark vs Pandas?
   - Tamanho do dataset
   - Distribuição vs single-node
4. Otimizar transformações básicas

Entregável sugerido: 
- Script de exemplo identificando memory leak
- Comparativo de consumo de RAM

Formato:
- Hands-on, exemplos executáveis
- Máximo 120 linhas

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/06_pandas_polars_spark.md
```

---

### Arquivo de Prática (Final do Módulo)
**Prompt:**
```
Crie o arquivo de prática para o Módulo 02.

Desafios:
1. Identificar e corrigir memory leak em script de processamento
2. Comparar tempo de execução: lista Python vs NumPy array
3. Monitorar memória com tracemalloc

Formato:
- Seguir padrão de /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/01-internet-portas/pratica.md
- Código comentado com soluções

Salvar em: /home/bil/Documents/studies/se-vault/se-for-data-non-se/samples/02-python/pratica.md
```

---

## ✅ Checklist de Criação

- [ x ] 2.0 - Origens da Computação
- [ ] 2.1 - Bits, Bytes e Linguagens
- [ ] 2.2 - Linux, Processos e Bash
- [ ] 2.3 - Interpretado vs Compilado
- [ ] 2.4 - Stack vs Heap
- [ ] 2.5 - Memória em Python
- [x] 2.6 - Pandas/Polars/Spark
- [ ] Prática
