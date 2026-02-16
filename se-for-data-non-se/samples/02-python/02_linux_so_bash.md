# Mini-Aula 02.2: Linux, Processos e Bash — Como o Python conversa com o SO

> **Objetivo:** Entender como o Linux executa programas, como o Bash orquestra comandos, e por que isso impacta pipelines de dados em Python.

---

## Conexao com a Aula Anterior

Na 2.1, vimos que Python nao vira binario nativo igual C. Entao surge a pergunta:

> Se Python nao fala direto com hardware, quem faz essa ponte?

Resposta curta: **o Sistema Operacional (Linux)**, atraves de **syscalls**.

---

## 1. Linux nao e Bash (e nem terminal)

Muita gente mistura os papeis:

- **Kernel (Linux):** gerencia CPU, memoria, disco, rede e isolamento de processos.
- **Shell (Bash):** interpretador de comandos; traduz seu texto em acoes.
- **Terminal:** janela/interface onde voce digita.

Analogia de dados:
- Kernel = cluster manager (controla recurso).
- Bash = orchestrator leve (encadeia tarefas).
- Terminal = painel onde voce dispara jobs.

---

## 2. Processo: unidade real de execucao

Quando voce roda:

```bash
python etl.py
```

o Linux cria um **processo** com:

- **PID** (identidade unica)
- espaco de memoria virtual
- file descriptors (arquivos, sockets, pipes)
- contexto de execucao (usuario, cwd, variaveis de ambiente)

Visual simplificado:

```text
Terminal -> Bash -> fork/exec -> Processo python (PID 43120)
                                      |- codigo (text)
                                      |- stack
                                      |- heap
                                      |- fds: 0(stdin),1(stdout),2(stderr)
```

---

## 3. Syscalls: a API real do SO

Seu codigo Python pede operacoes de alto nivel. Quem concretiza isso e o kernel via syscall:

- `open()` -> abre arquivo
- `read()` / `write()` -> I/O
- `socket()` / `connect()` -> rede
- `fork()` / `execve()` -> cria e troca processo
- `mmap()` / `brk()` -> memoria

Exemplo mental:

```python
with open("clientes.csv") as f:
    data = f.read()
```

na pratica vira cadeia de chamadas no SO: abrir arquivo, ler blocos do disco, devolver bytes para o processo Python.

---

## 4. stdin, stdout, stderr: encanamento padrao

Todo processo nasce com 3 canais:

- `0` -> **stdin** (entrada)
- `1` -> **stdout** (saida normal)
- `2` -> **stderr** (erros/log de falha)

Isso permite observabilidade e composicao em pipelines:

```bash
python etl.py > out.log 2> err.log
```

- sucesso vai para `out.log`
- erros vao para `err.log`

Em dados isso evita misturar resultado com diagnostico.

---

## 5. Pipes: output de um processo vira input de outro

O operador `|` cria um pipe no kernel conectando processos.

```bash
cat vendas.csv | grep "SP" | wc -l
```

Leitura de engenharia:

1. `cat` le arquivo e escreve em stdout.
2. kernel empurra bytes para stdin do `grep`.
3. saida filtrada vai para `wc -l`.

Esse modelo e a base conceitual de ETL por estagios:

```text
extract -> filter -> aggregate -> sink
```

---

## 6. Comandos Bash uteis para Data Engineering

### 6.1 Inspecionar processos

```bash
ps aux | grep python
top
```

Quando usar: script travado, CPU alta, leak suspeito.

### 6.2 Ver memoria da maquina

```bash
free -h
```

Quando usar: confirmar pressao de RAM antes de culpar pandas.

### 6.3 Ver uso de disco

```bash
df -h
du -sh ./data
```

Quando usar: pipeline falha por "No space left on device".

### 6.4 Ver arquivos/sockets abertos

```bash
lsof -p <PID>
ss -tulpen
```

Quando usar: conexoes presas, handle de arquivo vazando.

### 6.5 Buscar e transformar rapido no shell

```bash
grep -i "error" pipeline.log | awk '{print $1, $2, $NF}' | head
```

Quando usar: triagem inicial antes de abrir notebook.

---

## 7. Onde isso encaixa no dia a dia

Exemplo: job Python de ingestao ficou lento.

Checklist rapido:

1. `top` -> CPU saturada ou I/O wait?
2. `free -h` -> RAM no limite?
3. `df -h` -> disco lotado?
4. `lsof -p PID` -> arquivos/sockets demais?
5. logs separados (`stdout` vs `stderr`) para diagnostico limpo.

Sem essa base de SO, debug vira chute.

---

## 8. Pontes para as proximas aulas

- **Para 2.4 (Stack vs Heap):** stack e heap sao regioes de memoria do processo criado pelo SO.
- **Para 2.5 (Memoria em Python):** `pymalloc` reaproveita memoria, mas o kernel decide entrega real de paginas.
- **Para 2.5 (Pandas/Polars/Spark):** gargalo pode ser CPU, RAM, disco ou rede; nao apenas "Python lento".

---

## Resumo Executivo

- Bash orquestra comandos; Linux executa e isola processos.
- Python conversa com o mundo real via syscalls do SO.
- `stdin/stdout/stderr` + pipes formam a espinha de automacao Unix.
- Diagnostico de dados exige ler sinais de processo, memoria, I/O e disco.
