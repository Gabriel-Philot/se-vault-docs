# Polymorphism in OOP

**Date:** 2026-01-21

## Concept

**Polymorphism** = "Many forms" → Same interface, different behaviors.

Objects of different classes can be treated uniformly if they share the same interface (method names). The actual implementation varies by class, but the caller doesn't need to know the specifics.

### Key Aspects

- **Duck Typing (Python):** "If it walks like a duck and quacks like a duck, it's a duck"
  - Python doesn't check object types, only that required methods exist
  - Runtime flexibility, no explicit interfaces needed
  
- **Method Overriding:** Child classes redefine parent methods with specific implementations

- **Benefit:** Write generic code that works with multiple types without modification

---

## Summary

- ✅ Polymorphism allows same method name to behave differently across classes
- ✅ Duck typing in Python enables implicit polymorphism (no interfaces required)
- ✅ Method overriding allows subclasses to customize inherited behavior
- ✅ Enables writing flexible, extensible code that works with multiple types
- ✅ Reduces coupling - caller doesn't need to know implementation details

---

## Complete Flow: Different Classes, Same Interface

```python
from abc import ABC, abstractmethod

class DataReader(ABC):
    """Base class defining the interface"""
    
    @abstractmethod
    def read(self, path: str) -> dict:
        """All readers must implement this method"""
        pass
    
    @abstractmethod
    def get_format(self) -> str:
        pass


class CSVReader(DataReader):
    """CSV implementation"""
    
    def read(self, path: str) -> dict:
        print(f"Reading CSV from {path}")
        # Simulate CSV parsing logic
        return {
            "format": "csv",
            "data": [["col1", "col2"], ["val1", "val2"]],
            "delimiter": ","
        }
    
    def get_format(self) -> str:
        return "CSV"


class ParquetReader(DataReader):
    """Parquet implementation"""
    
    def read(self, path: str) -> dict:
        print(f"Reading Parquet from {path}")
        # Simulate Parquet parsing logic
        return {
            "format": "parquet",
            "data": {"col1": ["val1"], "col2": ["val2"]},
            "compression": "snappy"
        }
    
    def get_format(self) -> str:
        return "Parquet"


class JSONReader(DataReader):
    """JSON implementation"""
    
    def read(self, path: str) -> dict:
        print(f"Reading JSON from {path}")
        # Simulate JSON parsing logic
        return {
            "format": "json",
            "data": [{"col1": "val1", "col2": "val2"}],
            "encoding": "utf-8"
        }
    
    def get_format(self) -> str:
        return "JSON"


# Polymorphic function - works with ANY DataReader
def process_data(reader: DataReader, path: str) -> None:
    """
    This function doesn't care about the specific reader type.
    It just calls read() - polymorphism handles the rest.
    """
    print(f"\nProcessing with {reader.get_format()} reader...")
    data = reader.read(path)
    print(f"Retrieved data: {data}")
    print(f"Data structure: {type(data['data'])}")


# Usage: Same function, different behaviors
if __name__ == "__main__":
    readers = [
        CSVReader(),
        ParquetReader(),
        JSONReader()
    ]
    
    paths = [
        "/data/sales.csv",
        "/data/sales.parquet",
        "/data/sales.json"
    ]
    
    # Polymorphism in action
    for reader, path in zip(readers, paths):
        process_data(reader, path)
        # Same method call, different internal behavior
```

**Output:**
```
Processing with CSV reader...
Reading CSV from /data/sales.csv
Retrieved data: {'format': 'csv', 'data': [['col1', 'col2'], ['val1', 'val2']], 'delimiter': ','}
Data structure: <class 'list'>

Processing with Parquet reader...
Reading Parquet from /data/sales.parquet
Retrieved data: {'format': 'parquet', 'data': {'col1': ['val1'], 'col2': ['val2']}, 'compression': 'snappy'}
Data structure: <class 'dict'>

Processing with JSON reader...
Reading JSON from /data/sales.json
Retrieved data: {'format': 'json', 'data': [{'col1': 'val1', 'col2': 'val2'}], 'encoding': 'utf-8'}
Data structure: <class 'list'>
```

---

## Data Engineering Analogy

### Analogy 1: Data Source Connectors

Different data sources (S3, PostgreSQL, MySQL, API) all expose a standardized `read()` method:

```python
class S3Connector:
    def read(self, location):
        # AWS SDK calls, handle credentials, pagination
        return data_from_s3

class PostgresConnector:
    def read(self, query):
        # SQL execution, connection pooling
        return data_from_postgres

class APIConnector:
    def read(self, endpoint):
        # HTTP requests, rate limiting, retries
        return data_from_api
```

**Your ETL pipeline doesn't care about the source**:
```python
def extract(connector, location):
    return connector.read(location)  # Polymorphism!
```

Same `extract()` function works with S3, databases, APIs - you just swap the connector.

### Analogy 2: File Format Parsers

CSV, Parquet, JSON parsers all implement `parse()`:

```python
# Your processing logic remains unchanged
def load_and_transform(parser, file_path):
    raw_data = parser.parse(file_path)
    # Apply transformations...
    return transformed_data
```

Add support for Avro? Just create `AvroParser` with `parse()` method. No changes to `load_and_transform()`.

---

## Practical Example: Airflow Hooks

Airflow uses polymorphism extensively with Hook classes:

```python
from airflow.hooks.base import BaseHook

# All hooks inherit from BaseHook
# but implement get_conn() differently

class S3Hook(BaseHook):
    def get_conn(self):
        """Returns boto3 S3 client"""
        return boto3.client('s3', **self.credentials)
    
    def read_key(self, key, bucket):
        conn = self.get_conn()
        return conn.get_object(Bucket=bucket, Key=key)


class PostgresHook(BaseHook):
    def get_conn(self):
        """Returns psycopg2 connection"""
        return psycopg2.connect(**self.connection_params)
    
    def run_query(self, sql):
        conn = self.get_conn()
        return conn.execute(sql)


class HttpHook(BaseHook):
    def get_conn(self):
        """Returns requests.Session"""
        session = requests.Session()
        session.headers.update(self.headers)
        return session
    
    def run(self, endpoint, method='GET'):
        conn = self.get_conn()
        return conn.request(method, endpoint)
```

**Polymorphic usage in a DAG:**

```python
def transfer_data(source_hook: BaseHook, dest_hook: BaseHook):
    """
    Works with ANY hook combination:
    - S3Hook → PostgresHook
    - PostgresHook → S3Hook  
    - HttpHook → S3Hook
    """
    # Get connections polymorphically
    source_conn = source_hook.get_conn()
    dest_conn = dest_hook.get_conn()
    
    # Transfer logic...
    # Both hooks provide get_conn(), but implementations differ
```

---

## Practical Example: Spark Readers

Spark DataFrameReader exposes unified API for different formats:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("polymorphism").getOrCreate()

# Same pattern, different readers internally
df_csv = spark.read.csv("s3://bucket/data.csv", header=True)
df_parquet = spark.read.parquet("s3://bucket/data.parquet")
df_json = spark.read.json("s3://bucket/data.json")
df_jdbc = spark.read.jdbc(url, table, properties)

# All return DataFrame - polymorphism in action
# Your transformation code doesn't care about source format

def apply_transformations(df):
    """Works with DataFrame from ANY source"""
    return df.filter(...).select(...).groupBy(...)

# Polymorphic processing
result_csv = apply_transformations(df_csv)
result_parquet = apply_transformations(df_parquet)
result_json = apply_transformations(df_json)
```

**Under the hood:** Spark's reader implementations differ completely (CSV parser vs. Parquet columnar reader vs. JSON parser), but expose the same DataFrame interface.

---

## Benefits

1. **Flexibility:** Add new types without modifying existing code
   - New reader? Implement `read()` method, done.
   
2. **Extensibility:** Swap implementations at runtime
   - Switch from CSV to Parquet by changing one object instantiation
   
3. **Cleaner Code:** Write generic algorithms once
   - `process_data(reader, path)` works for all current and future readers
   
4. **Maintainability:** Single source of truth for interfaces
   - Change interface → all implementations must comply
   
5. **Testability:** Easy to mock different behaviors
   - Create `MockReader` for testing without touching real data sources

---

## Key Takeaway

Polymorphism = **Code to the interface, not the implementation.**

In data engineering: Build pipelines that accept "any object with a `read()` method" instead of hardcoding "CSVReader only". This makes systems flexible, extensible, and far easier to maintain as requirements evolve.
