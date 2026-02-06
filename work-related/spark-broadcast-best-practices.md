# Spark Broadcast Variables: Best Practices & Performance Guide

## O Que São Broadcast Variables

Broadcast variables são um mecanismo do Spark para enviar dados do **driver → workers** de forma eficiente, armazenando uma cópia read-only em cada executor.

```
DRIVER                           WORKERS (executors)
------                           -------------------
data = {...}                     [Executor 1: cópia local]
bc = sc.broadcast(data)   →      [Executor 2: cópia local]
                                 [Executor 3: cópia local]
```

**Sem broadcast**: Cada task serializa os dados (centenas de cópias)  
**Com broadcast**: Uma cópia por executor (otimizado via BitTorrent-like protocol)

---

## Regra de Ouro: DataFrame > Collect

### ❌ Anti-Pattern: Collect + Broadcast Manual

```python
# O que analistas costumam fazer (EVITAR)
small_data = spark.sql("SELECT id, value FROM dim_table").collect()
bc_data = spark.sparkContext.broadcast({
    row['id']: row['value'] for row in small_data
})

@udf(returnType=StringType())
def enrich(id):
    return bc_data.value.get(id, 'unknown')

result = df.withColumn('enriched_value', enrich('customer_id'))
```

**Problemas**:
1. Driver coleta todos os dados (pode dar OOM se tabela crescer)
2. Conversão Row → dict é lenta e desperdiça memória
3. UDF Python é ~10x mais lenta que funções nativas
4. Spark não consegue otimizar (operador opaco)

---

### ✅ Best Practice: DataFrame + Broadcast Hint

```python
# Refatoração correta
dim_df = spark.sql("SELECT id, value FROM dim_table")
result = df.join(broadcast(dim_df), df.customer_id == dim_df.id, 'left')
```

**Vantagens**:
1. ✅ **Catalyst otimiza** - Escolhe algoritmo de join ideal (hash join)
2. ✅ **Predicate pushdown** - Filtros são empurrados pra leitura
3. ✅ **Codegen** - Join compilado é ~10x mais rápido que UDF
4. ✅ **Lazy evaluation** - Só lê o necessário
5. ✅ **Seguro** - Se dados forem grandes, Spark avisa/ajusta

---

## Quando Broadcast Hint Funciona

```python
from pyspark.sql.functions import broadcast

# ✅ Caso 1: Lookup simples (id → valor)
customers_df = spark.table('dim_customers').select('id', 'tier', 'discount')
enriched = sales_df.join(broadcast(customers_df), 'customer_id')

# ✅ Caso 2: Filtros complexos (semi-join)
vip_ids = spark.sql("SELECT id FROM customers WHERE tier = 'VIP'")
vip_sales = sales_df.join(broadcast(vip_ids), 'customer_id', 'left_semi')

# ✅ Caso 3: Múltiplas dimensões pequenas
result = fact_df \
    .join(broadcast(dim_date), 'date_id') \
    .join(broadcast(dim_product), 'product_id') \
    .join(broadcast(dim_store), 'store_id')
```

**Limite recomendado**: Dados < 1GB após compressão (ajustável via `spark.sql.autoBroadcastJoinThreshold`)

---

## Única Exceção: Lógica Python Complexa

### Quando Collect + Broadcast Manual Faz Sentido

```python
# ✅ Caso válido: Regex precompilado + lógica externa

import re
from custom_lib import validate_with_external_api

# Regras de validação que precisam ser compiladas uma vez
rules = spark.sql("SELECT pattern, action, priority FROM validation_rules").collect()

bc_rules = spark.sparkContext.broadcast([
    {
        'regex': re.compile(r['pattern']),  # Precompila regex (Python puro)
        'action': r['action'],
        'priority': r['priority']
    }
    for r in rules
])

@udf(returnType=StringType())
def apply_validation(text):
    """Lógica que NÃO tem equivalente SQL."""
    for rule in sorted(bc_rules.value, key=lambda x: x['priority']):
        match = rule['regex'].search(text)
        if match:
            # Chama API externa (impossível em SQL puro)
            return validate_with_external_api(rule['action'], match.group(0))
    return 'no_match'

df_validated = df.withColumn('validation_result', apply_validation('text_field'))
```

**Justificativas válidas para collect + broadcast**:
- ✅ Precisa precomputar objetos Python (regex compilado, modelos ML)
- ✅ Usa bibliotecas externas indisponíveis no Spark SQL
- ✅ Lógica procedural complexa (loops, condicionais aninhados)
- ✅ Dados caem confortavelmente em memória (< 100MB)

---

## Performance Comparison

### Benchmark: Enriquecer 1 bilhão de registros com lookup de 10k IDs

```python
# Setup
big_df = spark.range(1_000_000_000).withColumn('customer_id', (col('id') % 10000))
dim = spark.range(10_000).withColumn('tier', lit('Gold'))

# Teste 1: Collect + Broadcast + UDF ⏱️ ~8 min
data = dim.collect()
bc = spark.sparkContext.broadcast({r['id']: r['tier'] for r in data})
@udf(...)
def lookup(id): return bc.value.get(id)
result = big_df.withColumn('tier', lookup('customer_id'))

# Teste 2: DataFrame + Broadcast Hint ⚡ ~2 min (4x mais rápido)
result = big_df.join(broadcast(dim.select('id', 'tier')), 
                      big_df.customer_id == dim.id, 'left')

# Teste 3: Join sem Broadcast 🐌 ~15 min (shuffle gigante)
result = big_df.join(dim, big_df.customer_id == dim.id, 'left')
```

---

## Anti-Patterns Comuns

### ❌ 1. Broadcast de Dados Grandes

```python
# ERRADO: Tabela de 5GB
huge_df = spark.table('fact_sales_history')  # 5GB
result = df.join(broadcast(huge_df), 'id')  # OOM nos executors!

# CERTO: Deixa Spark decidir ou usa sort-merge join
result = df.join(huge_df, 'id')  # Spark usa shuffle se necessário
```

---

### ❌ 2. Collect Dentro de Loop

```python
# ERRADO: Múltiplos collects
for region in ['BR', 'US', 'EU']:
    data = spark.sql(f"... WHERE region = '{region}'").collect()
    bc = spark.sparkContext.broadcast(data)
    # Overhead gigante

# CERTO: Collect uma vez, agrupa no driver
all_data = spark.sql("SELECT region, id, value FROM ...").collect()
grouped = defaultdict(list)
for row in all_data:
    grouped[row['region']].append({'id': row['id'], 'value': row['value']})

bc_grouped = spark.sparkContext.broadcast(grouped)
```

---

### ❌ 3. Não Limpar Broadcast Antigos

```python
# ERRADO: Broadcasts acumulando em memória
for batch in batches:
    bc = spark.sparkContext.broadcast(get_batch_data(batch))
    process(bc)
    # bc nunca é limpo!

# CERTO: Cleanup explícito
for batch in batches:
    bc = spark.sparkContext.broadcast(get_batch_data(batch))
    try:
        process(bc)
    finally:
        bc.unpersist()  # Libera memória dos executors
```

---

### ❌ 4. Broadcast sem Validação de Tamanho

```python
# ERRADO: Assumir que dados são pequenos
data = expensive_query().collect()  # Pode ser 10GB!
bc = spark.sparkContext.broadcast(data)

# CERTO: Validar antes de broadcast
import sys

data = expensive_query().collect()
size_mb = sys.getsizeof(data) / (1024 ** 2)

if size_mb > 100:
    raise ValueError(f"⚠️ Dados muito grandes para broadcast: {size_mb:.2f}MB")

bc = spark.sparkContext.broadcast(data)
```

---

## Alternatives to Broadcast

### 1. Aggregação No Lugar de Collect

```python
# ❌ ERRADO
total_revenue = sum([r['revenue'] for r in df.collect()])

# ✅ CERTO
total_revenue = df.agg(sum('revenue')).first()[0]
```

---

### 2. Subquery No Lugar de Filtro Manual

```python
# ❌ ERRADO
active_ids = [r['id'] for r in spark.sql("SELECT id FROM active_users").collect()]
filtered = df.filter(col('user_id').isin(active_ids))

# ✅ CERTO: Semi-join (mais eficiente)
active_users = spark.table('active_users')
filtered = df.join(active_users, 'user_id', 'left_semi')
```

---

### 3. Window Function No Lugar de Loop

```python
# ❌ ERRADO
customers = df.select('customer_id').distinct().collect()
results = []
for c in customers:
    revenue = df.filter(col('customer_id') == c['customer_id']) \
                .agg(sum('amount')).first()[0]
    results.append((c['customer_id'], revenue))

# ✅ CERTO
from pyspark.sql.window import Window
result = df.groupBy('customer_id').agg(sum('amount').alias('total_revenue'))
```

---

## Decision Tree: Quando Usar Cada Abordagem

```
Preciso enriquecer DataFrame com dados externos?
    ↓
┌───────────────────────────────────────┐
│ Dados cabem em memória (< 1GB)?      │
└───────────────────────────────────────┘
    │
    ├─ Sim → É um join/lookup simples?
    │           │
    │           ├─ Sim → DataFrame + broadcast() hint ⚡ MELHOR
    │           │
    │           └─ Não → Precisa lógica Python complexa?
    │                      │
    │                      ├─ Sim → collect + broadcast manual ✅ OK
    │                      └─ Não → Refatora pra SQL nativo
    │
    └─ Não → Dados > 1GB
               │
               └─ Use join normal (Spark decide shuffle vs broadcast)
```

---

## Configurações Importantes

```python
# Ajustar threshold de broadcast automático (padrão: 10MB)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "100MB")

# Desabilitar broadcast automático (forçar shuffle)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "-1")

# Timeout para broadcast (padrão: 300s)
spark.conf.set("spark.sql.broadcastTimeout", "600")

# Comprimir dados de broadcast (padrão: já habilitado)
spark.conf.set("spark.broadcast.compress", "true")
```

---

## Exemplo Completo: Refatoração

### Antes (Anti-Pattern)

```python
# Código original do analista
regions = spark.sql("SELECT DISTINCT region FROM sales").collect()
results = []

for region_row in regions:
    region = region_row['region']
    
    # Lookup de configurações
    config = spark.sql(f"""
        SELECT discount_rate FROM region_config 
        WHERE region = '{region}'
    """).collect()[0]
    
    # Processar vendas da região
    sales = spark.sql(f"""
        SELECT customer_id, amount 
        FROM sales 
        WHERE region = '{region}'
    """).collect()
    
    bc_discount = spark.sparkContext.broadcast(config['discount_rate'])
    
    @udf(returnType=DoubleType())
    def apply_discount(amount):
        return amount * (1 - bc_discount.value)
    
    df_region = spark.createDataFrame(sales)
    df_processed = df_region.withColumn('final_amount', apply_discount('amount'))
    
    results.append(df_processed)

final_df = reduce(DataFrame.union, results)
```

**Problemas**:
- ❌ Loop no driver (não distribuído)
- ❌ Múltiplos collects
- ❌ UDF desnecessária
- ❌ Union de múltiplos DataFrames (lento)

---

### Depois (Best Practice)

```python
# Refatoração performática
from pyspark.sql.functions import broadcast, col, when

# 1. Join com configurações (broadcast automático)
region_config = spark.table('region_config').select('region', 'discount_rate')
sales_df = spark.table('sales')

# 2. Operação distribuída em uma passada
result = sales_df.join(
    broadcast(region_config), 
    'region', 
    'left'
).withColumn(
    'final_amount', 
    col('amount') * (1 - col('discount_rate'))
).select('customer_id', 'region', 'amount', 'final_amount')
```

**Melhorias**:
- ✅ Single-pass distribuído
- ✅ Sem collect
- ✅ Sem UDF (funções nativas)
- ✅ Catalyst otimiza join + projection
- ✅ ~100x mais rápido

---

## Monitoramento de Broadcast

```python
# Ver broadcasts ativos
spark.sparkContext._jsc.sc().getPersistentRDDs()

# Spark UI → SQL tab → Detalhes do job
# Procure por: "BroadcastHashJoin" ou "BroadcastExchange"

# Logar tamanho antes de broadcast
import sys

def safe_broadcast(data, name="data"):
    size_mb = sys.getsizeof(data) / (1024 ** 2)
    print(f"📡 Broadcasting '{name}': {size_mb:.2f}MB")
    
    if size_mb > 500:
        raise ValueError(f"⚠️ {name} muito grande: {size_mb:.2f}MB")
    
    return spark.sparkContext.broadcast(data)

bc = safe_broadcast(my_data, "customer_lookup")
```

---

## Resumo: Quando Usar O Quê

| Caso de Uso | Solução | Motivo |
|-------------|---------|--------|
| **Join/lookup com dados < 1GB** | `df.join(broadcast(dim), 'id')` | Catalyst otimiza, codegen rápido |
| **Filtro por lista de IDs** | `left_semi` join ou subquery | Evita collect desnecessário |
| **Agregações (sum/avg/count)** | `df.agg(...)` nativo | Distribuído, sem driver bottleneck |
| **Lógica Python complexa** | `collect()` + `broadcast()` manual | Quando SQL não expressa a lógica |
| **Ver sample dos dados** | `df.limit(10).collect()` | Seguro, quantidade controlada |
| **Dados > 1GB** | Join sem broadcast hint | Deixa Spark decidir (shuffle se necessário) |

---

## Key Takeaways

1. **Sempre prefira DataFrame + `broadcast()` ao invés de collect + broadcast manual**
2. Collect só quando a lógica é **impossível em SQL/Spark nativo**
3. Valide tamanho dos dados antes de broadcast (< 100MB ideal, < 1GB máximo)
4. Use `unpersist()` para limpar broadcasts antigos
5. Monitore via Spark UI se broadcast está sendo aplicado (procure "BroadcastHashJoin")
6. Se UDF é sua única solução, provavelmente há uma solução SQL melhor

---

## Referências

- [Spark SQL Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)
- [Broadcast Variables Guide](https://spark.apache.org/docs/latest/rdd-programming-guide.html#broadcast-variables)
- [Join Strategies](https://spark.apache.org/docs/latest/sql-performance-tuning.html#join-strategy-hints-for-sql-queries)
