# Databricks Pipeline Architecture: Design Patterns & Rationale

## Executive Summary

This document outlines the architectural decisions for our Databricks ETL pipeline, focusing on source validation, data reading, and transformation orchestration. The solution combines three design patterns to achieve optimal performance, maintainability, and testability.

## Architecture Overview

```
shared_utils/decorators.py     # Decorator Pattern (validation)
       ↓
project/sources/               # Facade Pattern (reader aggregation)
       ↓
project/transform/             # Composition Pattern (loose coupling)
       ↓
main.py                        # Orchestration layer
```

---

## Core Requirements

1. **Single validation per source**: If multiple transformations use the same data source, validation should execute only once
2. **Parametric filtering**: Support dynamic filters from Databricks widgets via `dbutils`
3. **Monitoring**: Track all source validations in a centralized table
4. **Reusability**: Validation logic must be shared across multiple projects
5. **Testability**: Components should be independently testable

---

## Design Patterns Applied

### 1. Decorator Pattern (Source Validation)

**Location**: `shared_utils/decorators.py` (cross-project repository)

**Rationale**:
- Separates validation logic from business logic (Single Responsibility Principle)
- `lru_cache` provides **global memoization** across all function calls in the session
- Validation runs once per `(source_path, execution_date)` tuple, regardless of how many times the source is read
- Transparent to calling code (decorators are non-invasive)

**Implementation**:
```python
from functools import lru_cache, wraps

@lru_cache(maxsize=128)
def _validate_source_cached(source_path: str, execution_date: str) -> bool:
    """Global cache - shared across all projects in the session."""
    print(f"[VALIDATING] {source_path} for {execution_date}")
    
    try:
        dbutils.fs.ls(f"{source_path}/date={execution_date}")
        has_data = True
    except:
        has_data = False
    
    # Log to monitoring table
    log_data = [(source_path, execution_date, "SUCCESS" if has_data else "ERROR", datetime.now())]
    df_log = spark.createDataFrame(log_data, ["source_path", "date", "status", "timestamp"])
    df_log.write.mode("append").saveAsTable("monitoring.source_checks")
    
    return has_data

def validate_source(func):
    """Decorator to validate source before reading."""
    @wraps(func)
    def wrapper(source_path: str, execution_date: str, *args, **kwargs):
        if not _validate_source_cached(source_path, execution_date):
            raise ValueError(f"No data: {source_path} on {execution_date}")
        return func(source_path, execution_date, *args, **kwargs)
    return wrapper
```

**Key Benefits**:
- ✅ Validation executes once per source/date combination
- ✅ If `read_sales()` is called 3 times → validation runs only on first call
- ✅ Monitoring logs are not duplicated
- ✅ Zero performance overhead for subsequent reads

---

### 2. Facade Pattern (SourceReader)

**Location**: `project/sources/reader.py`

**Rationale**:
- Hides complexity of multiple data sources behind a simple interface
- Provides single entry point for reading all required sources
- Encapsulates filtering logic based on `dbutils` parameters

**Implementation**:
```python
from typing import Dict
from pyspark.sql import DataFrame
from sources.silver_sources import read_sales, read_customers, read_products

class SourceReader:
    """Facade for orchestrating multiple source reads."""
    
    def __init__(self, execution_date: str, filters: Dict = None):
        self.execution_date = execution_date
        self.filters = filters or {}
    
    def read_all_sources(self) -> Dict[str, DataFrame]:
        """
        Single method to read all sources.
        Validation happens automatically via decorator.
        """
        return {
            'sales': read_sales('/silver/sales', self.execution_date, **self.filters),
            'customers': read_customers('/silver/customers', self.execution_date, **self.filters),
            'products': read_products('/silver/products', self.execution_date)
        }
```

**Individual Source Functions** (`project/sources/silver_sources.py`):
```python
from pyspark.sql import DataFrame, SparkSession
from shared_utils.decorators import validate_source

spark = SparkSession.getActiveSession()

@validate_source
def read_sales(source_path: str, execution_date: str, **filters) -> DataFrame:
    """Read sales with optional filters from dbutils."""
    df = spark.read.parquet(f"{source_path}/date={execution_date}")
    
    if filters.get('region'):
        df = df.filter(col('region') == filters['region'])
    if filters.get('store_id'):
        df = df.filter(col('store_id') == filters['store_id'])
    
    return df
```

**Key Benefits**:
- ✅ Main notebook only calls `read_all_sources()` once
- ✅ Adding new sources requires minimal code changes
- ✅ Filter logic is centralized and parameterized

---

### 3. Composition Pattern (Reader → Transformer)

**Rationale**:
This is the **critical architectural decision** that minimizes coupling.

**Why NOT Dependency Injection?**
```python
# ❌ High coupling (AVOIDED)
class DataTransformer:
    def __init__(self, reader: SourceReader):  # Knows concrete class
        self.reader = reader
    
    def run(self):
        df = self.reader.read_sales(...)  # Knows Reader's methods
```

**Problems**:
- Transformer is tightly coupled to `SourceReader` implementation
- Testing requires mocking entire `SourceReader` class
- Cannot reuse Transformer with different data sources (S3, API, local files)

**Why Composition? (CHOSEN APPROACH)**
```python
# ✅ Low coupling
class DataTransformer:
    def __init__(self, execution_date: str):
        self.execution_date = execution_date
    
    def transform_and_save(self, sources: Dict[str, DataFrame]) -> DataFrame:
        """
        Receives pre-loaded DataFrames via dict.
        No knowledge of HOW data was read.
        """
        df_sales = sources['sales']
        df_customers = sources['customers']
        df_products = sources['products']
        
        # Transformation logic
        df_enriched = df_sales \
            .join(df_customers, 'customer_id', 'left') \
            .join(df_products, 'product_id', 'left')
        
        # If we need to read sales AGAIN for another transformation
        from sources.silver_sources import read_sales
        df_sales_summary = read_sales('/silver/sales', self.execution_date)
        # ⚡ CACHE HIT - validation does NOT re-run
        
        # Save transformations
        df_enriched.write.mode("overwrite").saveAsTable("gold.sales_enriched")
        df_sales_summary.groupBy('region').count() \
            .write.mode("overwrite").saveAsTable("gold.sales_summary")
        
        return df_enriched
```

**Key Benefits**:
- ✅ **Testability**: Mock is just `{'sales': mock_df, 'customers': mock_df}`
- ✅ **Flexibility**: Transformer works with ANY dict of DataFrames (local, S3, API, etc.)
- ✅ **Low coupling**: Transformer has zero knowledge of `SourceReader` class
- ✅ **Maintainability**: Changes to Reader don't propagate to Transformer

---

## Main Orchestration Layer

**Location**: `main.py` (Databricks notebook)

```python
# Databricks notebook source

from sources.reader import SourceReader
from transform.transformer import DataTransformer

# COMMAND ----------
# Get parameters from Databricks widgets
dbutils.widgets.text("execution_date", "2026-01-22")
dbutils.widgets.text("region", "")

execution_date = dbutils.widgets.get("execution_date")
region = dbutils.widgets.get("region")

filters = {'region': region} if region else {}

# COMMAND ----------
# Step 1: Read all sources (validation runs here)
reader = SourceReader(execution_date, filters)
sources = reader.read_all_sources()
# First call to read_sales → validation executes
# First call to read_customers → validation executes

print(f"✅ Sources loaded: {list(sources.keys())}")

# COMMAND ----------
# Step 2: Transform and save
transformer = DataTransformer(execution_date)
result = transformer.transform_and_save(sources)
# If transformer calls read_sales again → validation SKIPPED (cache hit)

print(f"✅ Pipeline completed. Rows: {result.count()}")
```

---

## Execution Flow & Cache Behavior

```
1. main.py calls reader.read_all_sources()
   ├─ read_sales() → @validate_source → VALIDATES ✅ → READS → LOGS to monitoring
   ├─ read_customers() → @validate_source → VALIDATES ✅ → READS → LOGS
   └─ read_products() → @validate_source → VALIDATES ✅ → READS → LOGS

2. main.py calls transformer.transform_and_save(sources_dict)
   ├─ Uses pre-loaded DataFrames from dict
   └─ If read_sales() is called again:
      └─ @validate_source → CACHE HIT ⚡ → SKIPS validation → READS only
         (No re-validation, no duplicate monitoring logs)
```

---

## Testing Strategy

**Unit Test Example**:
```python
import pytest
from transform.transformer import DataTransformer

def test_transformer_with_mock_data():
    # Mock data as simple dict - no class mocking needed
    mock_sources = {
        'sales': spark.createDataFrame([(1, 'A', 100)], ['id', 'region', 'amount']),
        'customers': spark.createDataFrame([(1, 'John')], ['id', 'name']),
        'products': spark.createDataFrame([(1, 'Widget')], ['id', 'product'])
    }
    
    transformer = DataTransformer('2026-01-22')
    result = transformer.transform_and_save(mock_sources)
    
    assert result.count() > 0
```

**Why This Works**:
- No need to mock `SourceReader` class
- No need to mock Spark read operations
- Pure data structure passing (dict of DataFrames)

---

## Comparison: Alternative Approaches

| Approach | Coupling | Testability | Flexibility | Complexity |
|----------|----------|-------------|-------------|------------|
| **Composition (Chosen)** | Low | High | High | Low |
| Dependency Injection | Medium | Medium | Medium | Low |
| Pipeline Pattern | Low | High | Very High | High |
| Inheritance | High | Low | Low | Medium |

**Verdict**: Composition provides the best balance for our use case.

---

## Monitoring & Observability

All source validations are logged to `monitoring.source_checks`:

```sql
SELECT 
    source_path,
    date,
    status,
    COUNT(*) as validation_count,
    MAX(timestamp) as last_check
FROM monitoring.source_checks
WHERE date >= current_date() - 7
GROUP BY source_path, date, status
ORDER BY last_check DESC
```

**Expected behavior**:
- Each source/date combination should have **exactly 1 entry per pipeline run**
- Multiple transformations using same source → still only 1 validation log

---

## Scalability Considerations

1. **Cache limitations**: `lru_cache(maxsize=128)` is sufficient for typical pipelines with <100 sources
2. **Session scope**: Cache persists for entire Spark session (all notebook cells)
3. **Multi-node clusters**: Cache is local to driver node (validation is driver-side operation)
4. **Memory footprint**: Cache stores only `(source_path, execution_date) → bool`, negligible overhead

---

## Recommendations for Implementation

1. **Phase 1**: Implement decorator in `shared_utils` repository
2. **Phase 2**: Refactor existing source functions to use `@validate_source`
3. **Phase 3**: Create `SourceReader` facade for project-specific sources
4. **Phase 4**: Refactor transformers to accept dict instead of Reader instance
5. **Phase 5**: Monitor `monitoring.source_checks` for duplicate validations (should be zero)

---

## Conclusion

This architecture achieves all core requirements:
- ✅ Single validation per source (via `lru_cache`)
- ✅ Parametric filtering (via `dbutils` → `SourceReader`)
- ✅ Centralized monitoring (decorator-based logging)
- ✅ Cross-project reusability (shared decorator)
- ✅ High testability (composition-based design)

The combination of **Decorator + Facade + Composition** patterns provides a clean separation of concerns while maintaining simplicity and performance.
