# Prática 03 — Filas com Celery

## O que você vai ver

- API que enfileira tasks e retorna imediatamente (202-style)
- Workers Celery consumindo tasks em background
- Status tracking (PENDING → STARTED → PROCESSING → SUCCESS/FAILURE)
- Retry automático com backoff exponencial
- 2 workers rodando em paralelo (escalabilidade)

## Subir

```bash
docker compose up --build
```

Swagger UI: http://localhost:8000/docs

Observe os logs dos workers no terminal — você vai ver eles pegando tasks.

## Testar

### 1. Fluxo básico: enfileirar e acompanhar

```bash
# Enfileira processamento de CSV
RESPONSE=$(curl -s -X POST "http://localhost:8000/process-csv?filename=vendas.csv&num_rows=50000")
echo $RESPONSE | python3 -m json.tool

# Pega o task_id
TASK_ID=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['task_id'])")

# Acompanha status (rode várias vezes)
curl -s http://localhost:8000/tasks/$TASK_ID | python3 -m json.tool
# Primeira vez: PENDING ou STARTED
# Depois: PROCESSING com progresso
# Final: SUCCESS com resultado
```

### 2. Múltiplas tasks em paralelo

```bash
# Dispara 5 tasks de uma vez
for i in {1..5}; do
  curl -s -X POST "http://localhost:8000/process-csv?filename=file_$i.csv&num_rows=$((i*10000))" &
done
wait

# Olhe os logs: os 2 workers vão dividir as tasks
docker compose logs worker worker-2 --tail=20
```

### 3. Diferentes tipos de task

```bash
# Agregação
curl -s -X POST "http://localhost:8000/aggregate?region=sudeste&month=2025-01" | python3 -m json.tool

# Envio de relatório
curl -s -X POST "http://localhost:8000/send-report?email=eu@empresa.com&report_type=vendas" | python3 -m json.tool
```

### 4. Ver retry (precisa de sorte — 20% de chance de falha)

```bash
# Dispara várias tasks — alguma vai falhar e retry
for i in {1..10}; do
  curl -s -X POST "http://localhost:8000/process-csv?filename=test_$i.csv" > /dev/null
done

# Olhe os logs do worker para ver retries
docker compose logs worker --tail=30
```

### 5. Monitorar workers

```bash
curl -s http://localhost:8000/queue/stats | python3 -m json.tool
```

### 6. Escalar workers

```bash
# Adicionar mais workers é só rodar mais containers
docker compose up --scale worker=4 -d

# Verificar
curl -s http://localhost:8000/queue/stats | python3 -m json.tool
```

## Limpar

```bash
docker compose down
```

## O que aprender

| Observação | Conclusão |
|------------|-----------|
| API retorna em <100ms | Task pesada roda em background, usuário não espera |
| Status PENDING → SUCCESS | Polling pattern para tasks longas |
| Logs dos 2 workers | Tasks distribuídas entre workers automaticamente |
| Retry com backoff | Resiliência: falha temporária não perde a task |
| `--scale worker=4` | Escalabilidade: mais workers = mais throughput |

## Conexão com o mundo real

- **Airflow + CeleryExecutor**: mesmo padrão — scheduler enfileira, workers executam
- **SQS + Lambda**: mesmo conceito, mas serverless
- **Processamento de uploads**: API recebe arquivo, enfileira, worker processa
