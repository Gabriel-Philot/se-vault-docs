# Abstract Methods em Spark Pipelines

## O que é `@abstractmethod`?

`@abstractmethod` é um decorador Python que define um **contrato**: métodos marcados assim **devem** ser implementados pelas subclasses.

```python
from abc import ABC, abstractmethod

class BasePipeline(ABC):
    @abstractmethod
    def process(self):
        """Subclasses DEVEM implementar este método"""
        pass
```

- **Não executa nada** - é apenas uma garantia de que o código vai seguir um padrão
- **Serve como documentação viva** - mostra o que é obrigatório implementar
- **IDE avisa** se você esquecer de implementar

---

## Quando Usar em Pipelines Spark?

### ✓ Use quando:
- Você tem múltiplas pipelines com **estrutura similar**
- Quer garantir **padronização** entre tasks
- Precisa de **lógica comum** (logging, schema casting, etc.)
- Quer facilitar **onboarding** de novos devs

### ✗ Não use quando:
- Só tem uma pipeline (overkill)
- Pipelines são muito diferentes entre si
- Não há lógica compartilhada

---

## Arquitetura Recomendada

```
repo/
├── utils/
│   └── pipeline_base.py          ← Classe abstrata (contrato)
│
└── tasks/
    ├── poc_vendors_intermediate.py    ← Implementa o contrato
    ├── poc_customers_intermediate.py  ← Implementa o contrato
    └── poc_orders_intermediate.py     ← Implementa o contrato
```

### `utils/pipeline_base.py` (Camada de Proteção)

```python
from abc import ABC, abstractmethod
from pyspark.sql import SparkSession, DataFrame
from typing import List
import logging

logger = logging.getLogger(__name__)

class BasePipeline(ABC):
    """Contrato que TODAS as pipelines devem seguir
    
    Este é um guardrail que garante:
    - Estrutura consistente entre tasks
    - Métodos obrigatórios são implementados
    - Lógica comum (logging, casting) em um só lugar
    """
    
    def __init__(self, countries: List[str], start_date: str, catalog: str, schema_df):
        self.countries = countries
        self.start_date = start_date
        self.reference_date = start_date
        self.catalog = catalog
        self.schema_df = schema_df
    
    @abstractmethod
    def create_views_and_build_final(
        self, 
        spark: SparkSession, 
        countries: List[str], 
        reference_date: str
    ) -> DataFrame:
        """OBRIGATÓRIO: Cada pipeline DEVE implementar sua lógica de transformação
        
        Args:
            spark: SparkSession instance
            countries: List of country codes
            reference_date: Reference date (YYYY-MM-DD)
            
        Returns:
            DataFrame: Transformed dataframe
        """
        pass
    
    # Método concreto (padrão para TODAS as pipelines)
    def main(self) -> DataFrame:
        """Orquestra a pipeline - IGUAL para todas as tasks
        
        Returns:
            DataFrame: Final dataframe cast to schema
        """
        logger.info(f"Processing pipeline: {self.__class__.__name__}")
        logger.info(f"Countries: {self.countries}")
        logger.info(f"Reference date: {self.reference_date}")
        
        # Chama método abstrato (implementado na subclasse)
        final_df = self.create_views_and_build_final(
            self.spark,
            self.countries,
            self.reference_date
        )
        
        # Lógica comum
        return self._cast_to_schema(final_df)
    
    def _cast_to_schema(self, df: DataFrame) -> DataFrame:
        """Aplica schema - comum para todas"""
        return cast_df_to_schema(df, self.schema_df)
```

### `tasks/poc_vendors_intermediate.py` (Implementação Concreta)

```python
from utils.pipeline_base import BasePipeline
from pyspark.sql import SparkSession, DataFrame
from typing import List

class PocVendorsBaseIntermediate(BasePipeline):
    """Pipeline de Vendors - implementa o contrato"""
    
    def __init__(self, countries: List[str], start_date: str, catalog: str, schema_df):
        super().__init__(countries, start_date, catalog, schema_df)
        self.spark = get_spark_with_optimization()
    
    def create_views_and_build_final(
        self,
        spark: SparkSession,
        countries: List[str],
        reference_date: str
    ) -> DataFrame:
        """Implementação obrigatória - lógica específica do Vendors"""
        return build_poc_vendors_base_intermediate_df(
            spark,
            countries,
            reference_date
        )
```

---

## Cuidados com Spark e Serialização

> **Importante:** Se você usar objetos em UDFs/map, eles precisam ser **serializáveis**.

### ❌ Problema: State não-serializável

```python
class BadTransformer(ABC):
    def __init__(self):
        self.spark = SparkSession.builder.getOrCreate()  # ❌ Não serializa!
        self.connection = create_db_connection()  # ❌ Não serializa!
    
    @abstractmethod
    def transform(self, df):
        pass

# Se tentar usar em UDF:
transformer = ConcreteTransformer()
df.rdd.map(lambda x: transformer.transform(x))  # ❌ ERRO: SparkSession não serializa
```

### ✓ Solução: Injete dependências ou use `@staticmethod`

**Opção 1: Injeção de dependência** (recomendado para pipelines)
```python
class GoodPipeline(BasePipeline):
    def __init__(self, ...):
        super().__init__(...)
        self.spark = get_spark()  # OK - não vai ser serializado
    
    def main(self):
        # Passa self.spark para métodos (não serializa o objeto)
        return self.create_views_and_build_final(self.spark, ...)
```

**Opção 2: Métodos estáticos** (recomendado para UDFs)
```python
class Transformer(ABC):
    @staticmethod
    @abstractmethod
    def transform(value, config):
        """Sem state - só função pura"""
        pass

# Uso em UDF:
df.rdd.map(lambda x: ConcreteTransformer.transform(x, config))  # ✓ OK
```

---

## Benefícios

### 1. Padronização
Garante que todas as tasks seguem a mesma estrutura:
```python
# Todos os pipelines têm os mesmos métodos
pipeline.main()
pipeline.create_views_and_build_final(...)
```

### 2. Validação Automática
Se esquecer de implementar um método:
```python
class IncompletePipeline(BasePipeline):
    # ❌ Esqueceu create_views_and_build_final
    pass

# Erro em tempo de execução:
# TypeError: Can't instantiate abstract class IncompletePipeline 
# without an implementation for abstract method 'create_views_and_build_final'
```

### 3. Documentação Viva
O código mostra o que é obrigatório:
```python
@abstractmethod
def create_views_and_build_final(...):
    """Este método DEVE ser implementado"""
    pass
```

### 4. Lógica Comum Centralizada
Mudanças em `main()` afetam todas as pipelines:
```python
# Adiciona logging em BasePipeline.main()
# → Todas as tasks ganham logging automaticamente
```

### 5. Onboarding Simplificado
Novo dev criando pipeline:
1. Herda de `BasePipeline`
2. IDE mostra quais métodos implementar
3. Segue o padrão existente

---

## Comparação: `@staticmethod` vs `@classmethod` vs método normal

```python
class Example:
    
    def normal_method(self):
        # Precisa de 'self' (dados da instância)
        print(self.attribute)
    
    @classmethod
    def class_method(cls):
        # Recebe 'cls' (dados da classe)
        cls.counter += 1
    
    @staticmethod
    def static_method(value):
        # NÃO recebe self nem cls
        # Função relacionada à classe (namespace)
        return value * 2
```

### Quando usar `@staticmethod`:
- Função logicamente relacionada à classe
- **Não precisa** acessar dados da instância ou classe
- Organização de código (namespace)
- **Ideal para UDFs no Spark** (evita serialização)

---

## Resumo

| Aspecto | Descrição |
|---------|-----------|
| **O que é** | Contrato que força implementação de métodos |
| **Quando usar** | Múltiplas pipelines com estrutura similar |
| **Onde colocar** | `utils/pipeline_base.py` |
| **Benefícios** | Padronização, validação, documentação viva |
| **Cuidado Spark** | Evite state não-serializável em UDFs |
| **Melhor prática** | Injete `spark` como parâmetro, não armazene na instância se for usar em UDFs |

---

## Referências

- [Python ABC Documentation](https://docs.python.org/3/library/abc.html)
- [PySpark Serialization](https://spark.apache.org/docs/latest/rdd-programming-guide.html#passing-functions-to-spark)
- Template Method Pattern
