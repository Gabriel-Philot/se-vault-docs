# Filas e Mensageria: Trabalho que Não Cabe no Request

Este guia explica por que aplicações em produção precisam de filas, quais são as opções, e como isso se conecta com o mundo de dados.

---

## 0. O Problema: Tarefas que Demoram

Um usuário faz upload de um CSV de 500MB para sua API. O que acontece?

```
Opção A — Síncrono (ruim):
POST /upload → Processa 500MB → 3 minutos depois → 200 OK
(Usuário esperando, timeout do Nginx, worker bloqueado)

Opção B — Assíncrono com fila (bom):
POST /upload → Salva arquivo → Enfileira tarefa → 202 Accepted (200ms)
                                     │
                                     ▼
                              Worker processa em background
                                     │
                                     ▼
                              Notifica quando pronto
```

### A regra prática

Se uma operação demora mais de **~500ms**, ela provavelmente não deveria rodar dentro do request HTTP. Coloque na fila.

Exemplos do dia a dia:
*   Processar arquivo CSV/Parquet grande
*   Treinar/re-treinar modelo de ML
*   Gerar relatório PDF complexo
*   Enviar email/notificação
*   Rodar pipeline de ETL sob demanda

---

## 1. Conceito: Producer → Queue → Consumer

```
┌──────────┐     ┌─────────┐     ┌──────────┐
│ Producer │────▶│  Queue  │────▶│ Consumer │
│ (API)    │     │(broker) │     │ (Worker) │
└──────────┘     └─────────┘     └──────────┘
```

*   **Producer:** Quem cria a mensagem (sua API, um script, um scheduler).
*   **Queue (Broker):** O intermediário que armazena mensagens até serem consumidas.
*   **Consumer (Worker):** Quem pega a mensagem e executa o trabalho.

### Por que o intermediário?

*   **Desacoplamento:** Producer não precisa saber quem vai consumir.
*   **Buffering:** Se chegam 1000 mensagens/segundo e o worker processa 100/s, a fila absorve o pico.
*   **Resiliência:** Se o worker morre, a mensagem não se perde — fica na fila esperando.
*   **Escalabilidade:** Precisa mais velocidade? Adicione mais workers.

---

## 2. As Opções: RabbitMQ, SQS, Celery

### RabbitMQ — O Broker Clássico

*   Implementa o protocolo **AMQP** (Advanced Message Queuing Protocol).
*   Escrito em Erlang (feito para telecomunicações — concorrência nativa).
*   Mensagens são **confirmadas** (ACK): o consumer avisa que processou com sucesso.
*   Se o consumer morre antes do ACK, RabbitMQ re-entrega a mensagem.

```
Producer → Exchange → Queue → Consumer
              │
              ├── direct: mensagem vai para 1 fila específica
              ├── fanout: mensagem vai para TODAS as filas
              └── topic: mensagem vai para filas que batem com padrão
```

### Amazon SQS — Fila Gerenciada

*   Serviço gerenciado da AWS — zero infra para manter.
*   Dois tipos:
    *   **Standard:** Ordem aproximada, entrega "at least once", throughput ilimitado.
    *   **FIFO:** Ordem garantida, entrega "exactly once", 3000 msg/s.
*   **Visibility timeout:** Quando um consumer pega a mensagem, ela fica invisível por N segundos. Se não confirmar, volta para a fila.

### Celery — O Orquestrador Python

Celery **não é** um broker. É uma **abstração Python** que usa um broker (Redis ou RabbitMQ) por baixo.

```python
from celery import Celery

# Celery usando Redis como broker
app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task
def processar_arquivo(file_path: str):
    """Tarefa que roda em background."""
    df = pd.read_csv(file_path)
    resultado = transformar(df)
    salvar(resultado)
    return {"status": "ok", "linhas": len(df)}
```

```python
# Na API — enfileira a tarefa
@router.post("/upload")
async def upload(file: UploadFile):
    path = salvar_arquivo(file)
    task = processar_arquivo.delay(path)  # Retorna imediatamente
    return {"task_id": task.id, "status": "processing"}

# Endpoint para checar status
@router.get("/task/{task_id}")
async def check_task(task_id: str):
    result = AsyncResult(task_id)
    return {"status": result.status, "result": result.result}
```

### Comparação

| Aspecto | RabbitMQ | SQS | Celery |
|---------|----------|-----|--------|
| Tipo | Broker | Broker (gerenciado) | Framework Python |
| Infra | Você gerencia | AWS gerencia | Precisa de um broker |
| Protocolo | AMQP | HTTP (API AWS) | Abstrai o broker |
| Routing | Exchanges (flexível) | Filas simples | Tasks decoradas |
| Quando usar | Routing complexo, on-prem | AWS-native, serverless | App Python, Airflow |

---

## 3. Kafka: Fila ou Outra Coisa?

Kafka aparece em toda conversa sobre mensageria, mas ele é fundamentalmente diferente.

### Fila Tradicional vs Kafka

| Aspecto | RabbitMQ/SQS (Fila) | Kafka (Log Distribuído) |
|---------|---------------------|------------------------|
| Após consumir | Mensagem é **removida** | Mensagem **permanece** (retention) |
| Re-leitura | Não é possível | Pode re-ler desde o início |
| Consumers | Competem pela mensagem | Cada grupo lê independentemente |
| Ordenação | Por fila | Por partição |
| Analogia | Fila do banco (atendeu, saiu) | DVR de TV (gravou, assiste quando quiser, rebobina) |

### Consumo destrutivo vs Replay

```
FILA TRADICIONAL (RabbitMQ):
  Msg1 → Consumer A lê → Msg1 desaparece
  Msg2 → Consumer B lê → Msg2 desaparece

KAFKA:
  Msg1 → Consumer A lê (offset 0) → Msg1 continua lá
  Msg1 → Consumer B lê (offset 0) → Msg1 continua lá
  (Depois de 7 dias, retention policy apaga)
```

### Quando usar qual

*   **Fila (RabbitMQ/SQS):** Tarefas que precisam ser executadas **uma vez** — enviar email, processar upload, chamar API.
*   **Kafka:** Eventos que **múltiplos sistemas** precisam consumir — mudança de preço, clique do usuário, log de transação. E quando você pode precisar **re-processar** dados históricos.

---

## 4. Dead Letter Queue (DLQ): Quando Tudo Dá Errado

O que acontece se uma mensagem falha repetidamente?

```
Mensagem "processar X"
    │
    ▼ Tentativa 1 → FALHA
    ▼ Tentativa 2 → FALHA
    ▼ Tentativa 3 → FALHA
    │
    ▼
┌──────────────────┐
│ Dead Letter Queue │  ← Mensagens "envenenadas"
│                    │  ← Alguém investiga manualmente
└──────────────────┘
```

*   **DLQ** é uma fila separada para mensagens que falharam N vezes.
*   Evita que uma mensagem "envenenada" trave o sistema inteiro (retry infinito).
*   Você configura alarmes para monitorar a DLQ — se tem mensagens lá, algo está errado.

---

## 5. Conexão com Dados

| Cenário | Tecnologia | Como funciona |
|---------|-----------|---------------|
| **Airflow + Celery** | Redis/RabbitMQ como broker | Scheduler enfileira tasks → Celery workers executam |
| **SQS + Lambda** | SQS trigger | Arquivo chega no S3 → evento no SQS → Lambda processa |
| **Kafka + Spark Streaming** | Kafka como source | Eventos em tempo real → Spark consome → agrega → salva |
| **ETL sob demanda** | Celery task | API recebe request → enfileira pipeline → worker executa dbt/Spark |
| **Processamento de arquivos** | Celery + S3 | Upload → salva no S3 → enfileira → worker lê e processa |

### Cenário real: Pipeline de ingestão

```
Arquivo CSV chega via API
    │
    ▼
FastAPI salva no S3 + enfileira mensagem
    │
    ▼
Celery worker pega a mensagem
    │
    ▼
Worker: lê CSV → valida schema → transforma → salva no Data Lake
    │
    ▼
Se falha 3x → DLQ → alerta no Slack
Se sucesso → marca como processado
```

---

## 6. Anti-Padrão: Processar Tudo Síncrono

```python
# ERRADO — request trava por minutos
@router.post("/importar")
async def importar(file: UploadFile):
    df = pd.read_csv(file.file)          # 30 segundos
    df = transformar(df)                   # 2 minutos
    salvar_no_data_lake(df)               # 30 segundos
    return {"status": "ok"}               # Total: 3 minutos
    # Nginx já deu timeout. Worker ficou bloqueado.

# CORRETO — enfileira e retorna rápido
@router.post("/importar")
async def importar(file: UploadFile):
    path = salvar_temporario(file)
    task = processar_importacao.delay(path)
    return {"task_id": task.id, "status": "accepted"}
```

---

## 7. Checkpoint

> **Pergunta:** Seu time usa Airflow com CeleryExecutor e Redis como broker. Uma DAG com 200 tasks está demorando porque só existem 8 workers. Quais são as opções para resolver? (Dica: pense em escalar workers, mas também nos trade-offs.)

> **Aplicação imediata:** Verifique se o Airflow do seu time usa `SequentialExecutor`, `LocalExecutor` ou `CeleryExecutor`. Se for Celery, identifique o broker configurado e quantos workers existem.

---

## Resumo

| Conceito | O que é | Quando usar |
|----------|---------|-------------|
| **Fila** | Intermediário entre quem produz e quem consome trabalho | Tarefas > 500ms, picos de carga |
| **RabbitMQ** | Broker AMQP, routing flexível | On-prem, routing complexo |
| **SQS** | Fila gerenciada AWS | Serverless, AWS-native |
| **Celery** | Framework Python para tasks async | App Python + qualquer broker |
| **Kafka** | Log distribuído com replay | Eventos multi-consumidor, reprocessamento |
| **DLQ** | Fila para mensagens que falharam | Sempre. Sem DLQ = falha silenciosa |

A regra de ouro: **Se o usuário não precisa esperar, não faça ele esperar. Enfileira.**
