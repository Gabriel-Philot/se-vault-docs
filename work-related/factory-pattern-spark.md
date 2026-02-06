# Factory Pattern para Pipelines Spark

## O que é Factory Pattern?

Factory é um padrão de criação que **centraliza a lógica de instanciação de objetos**. Em vez de construir objetos diretamente no código, você delega isso para um "factory" que decide qual classe concreta instanciar baseado em parâmetros.

```python
# Sem Factory (hardcoded)
if pipeline_type == "vendors":
    transformer = PocVendorsTransformer(config)
elif pipeline_type == "orders":
    transformer = OrdersTransformer(config)

# Com Factory (centralizado)
transformer = TransformerFactory.create_transformer(pipeline_type, config)
```

---

## Comparação: Código Atual vs Factory

### Código Atual (`poc_vendors_base_intermediate.py`)

**Problemas:**
- ❌ **Alto acoplamento**: Classe conhece detalhes específicos das fontes
- ❌ **Inflexível**: Adicionar novo pipeline = criar classe completa nova
- ❌ **Duplicação**: Repetir `__init__()`, `main()`, `run_task()` em cada pipeline
- ❌ **Não config-driven**: Tipo de pipeline hardcoded no código

```python
class PocVendorsBaseIntermediate(Config):
    def __init__(self, countries, start_date, catalog, schema_df):
        self.spark = get_spark_with_optimization()
        # ...
    
    def create_views_and_build_final(self, spark, countries, reference_date):
        # Lógica hardcoded
        final_df = build_poc_vendors_base_intermediate_df(
            spark,
            self.source_dim_contracts_scd,  # Hardcoded
            self.source_dim_contract,        # Hardcoded
            self.source_contractless,        # Hardcoded
            countries,
            reference_date,
            logger
        )
        return final_df
    
    def main(self):
        # ...
    
    def run_task(self):
        # ...
```

**Para adicionar novo pipeline (Orders):**
- Criar classe `OrdersBaseIntermediate(Config)` completa
- Copiar/colar ~100 linhas de código
- Modificar apenas `create_views_and_build_final()`

---

### Com Factory Pattern

**Vantagens:**
- ✅ **Baixo acoplamento**: Pipeline genérico, transformações específicas
- ✅ **Extensível**: Adicionar pipeline = criar Transformer + registrar
- ✅ **DRY**: Pipeline reutilizável para todos os casos
- ✅ **Config-driven**: Tipo definido em config/parâmetro

```python
# 1. INTERFACE BASE
from abc import ABC, abstractmethod

class Transformer(ABC):
    def __init__(self, config):
        self.config = config
    
    @abstractmethod
    def transform(self, spark, countries, reference_date):
        """Cada implementação define sua lógica específica"""
        pass

# 2. TRANSFORMERS ESPECÍFICOS
class PocVendorsTransformer(Transformer):
    def transform(self, spark, countries, reference_date):
        return build_poc_vendors_base_intermediate_df(
            spark,
            self.config.source_dim_contracts_scd,
            self.config.source_dim_contract,
            self.config.source_contractless,
            countries,
            reference_date,
            logger
        )

class OrdersTransformer(Transformer):
    def transform(self, spark, countries, reference_date):
        # LÓGICA TOTALMENTE DIFERENTE
        orders = spark.table(self.config.source_orders)
        customers = spark.table("external.customers")
        
        return (orders
            .join(customers, "customer_id")
            .filter(F.col("country").isin(countries))
            .withColumn("order_value_category", 
                F.when(F.col("amount") > 100, "high")
                 .otherwise("low"))
        )

class DailySalesAggTransformer(Transformer):
    def transform(self, spark, countries, reference_date):
        # AGREGAÇÃO (lógica super diferente)
        sales = spark.table(self.config.source_sales)
        
        return (sales
            .groupBy("country", "product_category")
            .agg(
                F.sum("revenue").alias("total_revenue"),
                F.count("*").alias("num_orders"),
                F.avg("basket_size").alias("avg_basket")
            )
        )

# 3. FACTORY
class TransformerFactory:
    """Factory para criar transformers baseado em tipo"""
    
    @staticmethod
    def create_transformer(transformer_type, config):
        transformers = {
            "poc_vendors": PocVendorsTransformer,
            "orders": OrdersTransformer,
            "sales_agg": DailySalesAggTransformer,
        }
        
        if transformer_type not in transformers:
            raise ValueError(f"Unknown transformer type: {transformer_type}")
        
        return transformers[transformer_type](config)

# 4. PIPELINE GENÉRICO (REUTILIZÁVEL)
class IntermediatePipeline:
    """Pipeline genérico para todos os casos"""
    
    def __init__(self, transformer_type, countries, start_date, config):
        self.spark = get_spark_with_optimization()
        self.transformer = TransformerFactory.create_transformer(transformer_type, config)
        self.countries = countries
        self.start_date = start_date
        self.reference_date = start_date
        self.config = config
    
    def main(self):
        logger.info(f"Processing {self.transformer.__class__.__name__}")
        logger.info(f"Countries: {self.countries}")
        logger.info(f"Reference date: {self.reference_date}")
        
        # Chamada genérica - cada transformer implementa sua lógica
        final_df = self.transformer.transform(
            self.spark,
            self.countries,
            self.reference_date
        )
        
        return cast_df_to_schema(final_df, self.config.schema_df)
    
    def run_task(self):
        try:
            df_save = self.main()
            if not df_save.isEmpty():
                country_condition = " OR ".join([f"country = '{c.upper()}'" for c in self.countries])
                final_condition = f"reference_date = '{self.reference_date}' AND ({country_condition})"
                
                save_table(
                    data=df_save,
                    table_name=self.config.full_table_name,
                    primary_keys=self.config.primary_keys,
                    mode=self.config.mode,
                    partition_columns=self.config.partition_columns,
                    overwrite_options={"replaceWhere": final_condition}
                )
                
                logger.info(f"Process finished for {self.config.full_table_name}")
            else:
                logger.warn("df_save is empty")
        
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            raise
```

**Uso:**
```python
# POC Vendors
pipeline = IntermediatePipeline("poc_vendors", countries, start_date, config)
pipeline.run_task()

# Orders (ZERO código adicional!)
pipeline = IntermediatePipeline("orders", countries, start_date, config)
pipeline.run_task()

# Sales Agg (ZERO código adicional!)
pipeline = IntermediatePipeline("sales_agg", countries, start_date, config)
pipeline.run_task()
```

---

## Métricas: Factory vs Código Atual

| Métrica | Sem Factory | Com Factory |
|---------|-------------|-------------|
| **Adicionar novo pipeline** | ~100 linhas (classe completa) | ~15 linhas (Transformer + registro) |
| **Código duplicado** | Alto (`__init__`, `main`, `run_task`) | Zero (pipeline reutilizável) |
| **Config-driven** | Não | Sim |
| **Testabilidade** | Difícil (testar cada classe) | Fácil (testar transformers isolados) |
| **Manutenção** | Mudanças em múltiplos arquivos | Mudança no pipeline afeta todos |

---

## Impacto no Spark

### ✅ O que NÃO afeta

**Factory é código Python puro no driver**, roda antes de qualquer operação distribuída:

```python
# Tudo no DRIVER (não distribuído)
transformer = TransformerFactory.create_transformer("orders", config)  # Driver
df = transformer.transform(spark, countries, date)                     # Driver (lazy)
result = df.filter(...).groupBy(...)                                   # Driver (lazy)

# Só aqui vai pros EXECUTORS
result.write.parquet("...")  # ACTION dispara job
```

**Impacto zero** na execução distribuída.

---

### ⚠️ Cuidado: Serialização

Se passar objetos pra UDFs, vai serializar pro cluster:

```python
# ❌ MAU (serializa self pro executor)
class MyTransformer:
    def __init__(self, multiplier):
        self.multiplier = multiplier
    
    def apply_udf(self, df):
        # Closure captura self -> tenta serializar objeto inteiro
        return df.withColumn("value", 
            F.udf(lambda x: x * self.multiplier)(F.col("amount")))

# ✅ BOM (só serializa primitivo ou usa Spark nativo)
class MyTransformer:
    def __init__(self, multiplier):
        self.multiplier = multiplier
    
    def apply(self, df):
        mult = self.multiplier  # Extrai valor
        return df.withColumn("value", F.col("amount") * mult)  # Spark nativo
```

**Regra**: Use Spark nativo (`F.col()`, joins, agregações) dentro dos Transformers sempre que possível.

---

### ✅ Benefícios Específicos Spark

#### **1. Testabilidade**
```python
# Mock sem Spark real
class FakeTransformer(Transformer):
    def transform(self, spark, countries, date):
        return spark.createDataFrame([{"id": 1, "value": 100}])

# Test
result = FakeTransformer(config).transform(spark, ["BR"], "2024-01-01")
assert result.count() == 1
```

#### **2. Config-Driven Workflows (Databricks Jobs)**
```json
// Job 1
{
  "name": "daily_vendors",
  "transformer_type": "poc_vendors",
  "countries": ["PE", "PY"]
}

// Job 2 (só muda config, zero código)
{
  "name": "daily_orders",
  "transformer_type": "orders",
  "countries": ["BR"]
}
```

#### **3. Reutilização de Otimizações**
```python
class IntermediatePipeline:
    def run_task(self):
        df = self.transformer.transform(...)
        
        # TODAS transformações herdam otimizações
        df = df.repartition(self.config.num_partitions)
        df = df.cache() if self.config.cache_enabled else df
        
        df.write.partitionBy(self.config.partition_cols).parquet(...)
```

Sem Factory, você repete isso em cada classe.

---

## Resumo: Quando Usar Factory?

### ✅ Use quando:
- Você tem **múltiplos pipelines** com estrutura similar
- Quer **config-driven** pipelines (não hardcoded)
- Precisa de **extensibilidade** (adicionar novos tipos facilmente)
- Tem problema de **código duplicado**

### ❌ Não use (overkill) quando:
- Você tem apenas 1-2 pipelines únicos
- A lógica é tão específica que não há padrão reutilizável
- Equipe pequena e código simples

---

## Checklist de Implementação

- [ ] Criar classe abstrata `Transformer` com `@abstractmethod transform()`
- [ ] Migrar lógica de `build_poc_vendors_base_intermediate_df()` pra `PocVendorsTransformer`
- [ ] Criar `TransformerFactory` com registro de transformers
- [ ] Criar `IntermediatePipeline` genérico
- [ ] Testar com pipeline existente (POC Vendors)
- [ ] Adicionar novo transformer (Orders) pra validar extensibilidade
- [ ] Atualizar configs do Databricks pra usar `transformer_type`

---

## Exemplo Real: Adicionando Novo Pipeline

**Sem Factory (situação atual):**
```python
# Criar arquivo novo: orders_base_intermediate.py (~150 linhas)
class OrdersBaseIntermediate(Config):
    def __init__(self, countries, start_date, catalog, schema_df):
        # Copiar/colar __init__ do POC Vendors
        ...
    
    def create_views_and_build_final(self, ...):
        # ÚNICA parte diferente
        final_df = build_orders_df(...)
        return final_df
    
    def main(self):
        # Copiar/colar do POC Vendors
        ...
    
    def run_task(self):
        # Copiar/colar do POC Vendors
        ...
```

**Com Factory:**
```python
# Adicionar ao arquivo transformers.py (~10 linhas)
class OrdersTransformer(Transformer):
    def transform(self, spark, countries, reference_date):
        return build_orders_df(
            spark,
            self.config.source_orders,
            countries,
            reference_date,
            logger
        )

# Registrar no factory (1 linha)
transformers = {
    "poc_vendors": PocVendorsTransformer,
    "orders": OrdersTransformer,  # <-- Adicionar aqui
}
```

**Redução: de ~150 linhas pra ~11 linhas.**
