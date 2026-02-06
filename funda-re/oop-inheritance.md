# Inheritance in OOP

## What is Inheritance?

**Inheritance** is a fundamental OOP pillar that allows a class (child/derived class) to inherit attributes and methods from another class (parent/base class). This mechanism enables:

- **Code Reuse**: Write common functionality once in the base class
- **Hierarchy**: Establish relationships between classes (is-a relationship)
- **Extensibility**: Add or override functionality in derived classes
- **Polymorphism**: Treat derived classes as instances of the base class

## Base Classes and Derived Classes

```python
# Base class (parent)
class Animal:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def speak(self):
        return "Some generic sound"
    
    def info(self):
        return f"{self.name} is {self.age} years old"

# Derived class (child)
class Dog(Animal):
    def __init__(self, name, age, breed):
        super().__init__(name, age)  # Call parent constructor
        self.breed = breed
    
    def speak(self):  # Override parent method
        return "Woof!"
    
    def fetch(self):  # New method specific to Dog
        return f"{self.name} is fetching the ball!"

# Another derived class
class Cat(Animal):
    def __init__(self, name, age, color):
        super().__init__(name, age)
        self.color = color
    
    def speak(self):  # Override parent method
        return "Meow!"
    
    def climb(self):  # New method specific to Cat
        return f"{self.name} is climbing a tree!"
```

## super() and Method Overriding

### super() Function
- Calls the parent class's method
- Essential for proper initialization in inheritance chains
- Provides access to parent methods even when overridden

### Method Overriding
- Child class can replace parent's method with its own implementation
- Maintains the same method signature
- Use `super()` to extend (not just replace) parent behavior

```python
class BaseLogger:
    def __init__(self, log_level):
        self.log_level = log_level
    
    def log(self, message):
        print(f"[{self.log_level}] {message}")

class TimestampLogger(BaseLogger):
    def __init__(self, log_level, timestamp_format="%Y-%m-%d %H:%M:%S"):
        super().__init__(log_level)  # Initialize parent
        self.timestamp_format = timestamp_format
    
    def log(self, message):
        from datetime import datetime
        timestamp = datetime.now().strftime(self.timestamp_format)
        # Extend parent behavior
        super().log(f"[{timestamp}] {message}")
```

## Summary

✅ **Inheritance enables code reuse** through base and derived classes  
✅ **Base class** contains common attributes and methods shared by children  
✅ **Derived class** inherits from base and can add/override functionality  
✅ **super()** accesses parent class methods and constructors  
✅ **Method overriding** allows customizing behavior in derived classes  
✅ **Hierarchy** establishes logical relationships between classes  
✅ **Use inheritance** for "is-a" relationships (Dog is an Animal)  
✅ **Avoid multiple inheritance** unless absolutely necessary (complexity, diamond problem)

## Complete Flow: Animal → Dog/Cat Example

```python
from datetime import datetime

# Base class
class Animal:
    """Base class representing a generic animal."""
    
    species_count = 0  # Class variable
    
    def __init__(self, name, age, species):
        self.name = name
        self.age = age
        self.species = species
        self.created_at = datetime.now()
        Animal.species_count += 1
    
    def speak(self):
        """Generic speak method."""
        return "Some sound"
    
    def info(self):
        """Return basic information."""
        return f"{self.name} ({self.species}), Age: {self.age}"
    
    def sleep(self):
        """Common behavior for all animals."""
        return f"{self.name} is sleeping... zzz"
    
    @classmethod
    def get_total_count(cls):
        return cls.species_count


# Derived class: Dog
class Dog(Animal):
    """Dog class inheriting from Animal."""
    
    def __init__(self, name, age, breed, is_trained=False):
        # Call parent constructor
        super().__init__(name, age, species="Dog")
        # Add Dog-specific attributes
        self.breed = breed
        self.is_trained = is_trained
    
    def speak(self):
        """Override speak method."""
        return "Woof! Woof!"
    
    def fetch(self, item="ball"):
        """Dog-specific method."""
        if self.is_trained:
            return f"{self.name} fetched the {item}!"
        return f"{self.name} doesn't know how to fetch yet."
    
    def info(self):
        """Extend parent info method."""
        base_info = super().info()
        return f"{base_info}, Breed: {self.breed}, Trained: {self.is_trained}"


# Derived class: Cat
class Cat(Animal):
    """Cat class inheriting from Animal."""
    
    def __init__(self, name, age, color, indoor=True):
        super().__init__(name, age, species="Cat")
        self.color = color
        self.indoor = indoor
    
    def speak(self):
        """Override speak method."""
        return "Meow!"
    
    def climb(self):
        """Cat-specific method."""
        location = "furniture" if self.indoor else "tree"
        return f"{self.name} is climbing the {location}!"
    
    def info(self):
        """Extend parent info method."""
        base_info = super().info()
        environment = "Indoor" if self.indoor else "Outdoor"
        return f"{base_info}, Color: {self.color}, Type: {environment}"


# Usage
if __name__ == "__main__":
    # Create instances
    dog1 = Dog("Rex", 3, "German Shepherd", is_trained=True)
    dog2 = Dog("Buddy", 1, "Golden Retriever", is_trained=False)
    cat1 = Cat("Whiskers", 2, "Orange", indoor=True)
    cat2 = Cat("Shadow", 4, "Black", indoor=False)
    
    # Polymorphism: treat all as Animals
    animals = [dog1, dog2, cat1, cat2]
    
    print("=== All Animals ===")
    for animal in animals:
        print(animal.info())
        print(f"  Sound: {animal.speak()}")
        print(f"  {animal.sleep()}")
        print()
    
    # Use specific methods
    print("=== Specific Behaviors ===")
    print(dog1.fetch())
    print(dog2.fetch("stick"))
    print(cat1.climb())
    print(cat2.climb())
    
    # Class method from base class
    print(f"\nTotal animals created: {Animal.get_total_count()}")
```

**Output:**
```
=== All Animals ===
Rex (Dog), Age: 3, Breed: German Shepherd, Trained: True
  Sound: Woof! Woof!
  Rex is sleeping... zzz

Buddy (Dog), Age: 1, Breed: Golden Retriever, Trained: False
  Sound: Woof! Woof!
  Buddy is sleeping... zzz

Whiskers (Cat), Age: 2, Color: Orange, Type: Indoor
  Sound: Meow!
  Whiskers is sleeping... zzz

Shadow (Cat), Age: 4, Color: Black, Type: Outdoor
  Sound: Meow!
  Shadow is sleeping... zzz

=== Specific Behaviors ===
Rex fetched the ball!
Buddy doesn't know how to fetch yet.
Whiskers is climbing the furniture!
Shadow is climbing the tree!

Total animals created: 4
```

## Data Engineering Analogy

### Inheritance ≈ Table Schema Inheritance

In data engineering, inheritance resembles how tables can inherit or extend structures:

| OOP Concept | Data Engineering Equivalent |
|-------------|----------------------------|
| **Base Class** | Base schema, staging table, or parent table partition |
| **Derived Class** | Extended schema with additional columns/constraints |
| **Inheritance** | Schema evolution, table partitioning, or layered architecture |
| **super()** | Including base columns before adding new ones |
| **Method Overriding** | Custom transformations while maintaining interface |

### Example: Data Lake Layers

```
Bronze Layer (Base)
  ├─ raw_timestamp
  ├─ source_system
  └─ raw_data (JSON)

     ↓ inherits + adds fields
     
Silver Layer (Extends Bronze)
  ├─ raw_timestamp      (inherited)
  ├─ source_system      (inherited)
  ├─ parsed_data        (new)
  ├─ data_quality_flag  (new)
  └─ processed_at       (new)

     ↓ inherits + adds aggregations
     
Gold Layer (Extends Silver)
  ├─ source_system      (inherited)
  ├─ aggregated_metrics (new)
  ├─ business_key       (new)
  └─ last_updated       (new)
```

### Partitioned Tables Example

```python
# Base table definition (parent partition scheme)
class BaseEventTable:
    schema = {
        "event_id": "STRING",
        "event_timestamp": "TIMESTAMP",
        "user_id": "STRING",
        "partition_date": "DATE"
    }
    
    def get_partition_column(self):
        return "partition_date"

# Click events (inherits base + adds specific fields)
class ClickEventTable(BaseEventTable):
    schema = {
        **BaseEventTable.schema,  # Inherit base schema
        "click_target": "STRING",
        "page_url": "STRING",
        "session_id": "STRING"
    }
    
    def get_retention_days(self):
        return 90  # Click events kept for 90 days

# Purchase events (inherits base + adds different fields)
class PurchaseEventTable(BaseEventTable):
    schema = {
        **BaseEventTable.schema,  # Inherit base schema
        "order_id": "STRING",
        "amount": "DECIMAL(10,2)",
        "currency": "STRING",
        "product_ids": "ARRAY<STRING>"
    }
    
    def get_retention_days(self):
        return 2555  # ~7 years (compliance requirement)
```

## Practical Example: Airflow BaseOperator → CustomOperator

### Scenario: Custom Data Quality Operator

```python
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
from typing import Any, Dict, Optional

# Airflow's BaseOperator (simplified)
# This is the parent class provided by Airflow
# We inherit from it to create custom operators

class DataQualityOperator(BaseOperator):
    """
    Custom operator that extends BaseOperator for data quality checks.
    
    Inherits task management, logging, and execution from BaseOperator.
    Adds specific data quality validation logic.
    """
    
    # Define operator-specific template fields
    template_fields = ('table_name', 'sql_check')
    
    @apply_defaults
    def __init__(
        self,
        table_name: str,
        sql_check: str,
        min_rows: int = 1,
        conn_id: str = 'postgres_default',
        *args,
        **kwargs
    ):
        # Call parent constructor to initialize base operator features
        # (task_id, dag, retries, execution_timeout, etc.)
        super().__init__(*args, **kwargs)
        
        # Add custom attributes
        self.table_name = table_name
        self.sql_check = sql_check
        self.min_rows = min_rows
        self.conn_id = conn_id
    
    def execute(self, context: Dict[str, Any]) -> None:
        """
        Override execute method (required by BaseOperator).
        This is where our custom logic runs.
        """
        # Use inherited logging from BaseOperator
        self.log.info(f"Starting data quality check on {self.table_name}")
        
        # Get hook (inherited utility)
        from airflow.hooks.postgres_hook import PostgresHook
        hook = PostgresHook(postgres_conn_id=self.conn_id)
        
        # Check 1: Row count
        row_count = hook.get_first(f"SELECT COUNT(*) FROM {self.table_name}")[0]
        self.log.info(f"Table {self.table_name} has {row_count} rows")
        
        if row_count < self.min_rows:
            raise ValueError(
                f"Data quality check failed: {self.table_name} has {row_count} rows, "
                f"expected at least {self.min_rows}"
            )
        
        # Check 2: Custom SQL validation
        result = hook.get_first(self.sql_check)
        self.log.info(f"Custom check result: {result}")
        
        if not result[0]:
            raise ValueError(f"Custom SQL check failed for {self.table_name}")
        
        self.log.info(f"✅ All data quality checks passed for {self.table_name}")


class NullCheckOperator(DataQualityOperator):
    """
    Further specialization: Operator specifically for null checks.
    Inherits from our custom DataQualityOperator.
    """
    
    @apply_defaults
    def __init__(
        self,
        table_name: str,
        columns_to_check: list,
        *args,
        **kwargs
    ):
        # Build SQL check for null values
        null_checks = " AND ".join([
            f"COUNT(*) FILTER (WHERE {col} IS NULL) = 0"
            for col in columns_to_check
        ])
        sql_check = f"SELECT {null_checks} FROM {table_name}"
        
        # Call parent (DataQualityOperator) constructor
        super().__init__(
            table_name=table_name,
            sql_check=sql_check,
            *args,
            **kwargs
        )
        
        self.columns_to_check = columns_to_check
    
    def execute(self, context: Dict[str, Any]) -> None:
        """Extend parent execute to add specific logging."""
        self.log.info(f"Checking for nulls in columns: {self.columns_to_check}")
        # Call parent execute method
        super().execute(context)


# Usage in a DAG
from airflow import DAG
from datetime import datetime, timedelta

default_args = {
    'owner': 'data_engineering',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 21),
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'data_quality_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False
) as dag:
    
    # Use our custom operator (inherits from BaseOperator)
    quality_check = DataQualityOperator(
        task_id='check_sales_table',
        table_name='sales_fact',
        sql_check='SELECT COUNT(*) > 0 FROM sales_fact WHERE sale_date = {{ ds }}',
        min_rows=100,
        conn_id='warehouse_db'
    )
    
    # Use the specialized operator (inherits from DataQualityOperator)
    null_check = NullCheckOperator(
        task_id='check_nulls_in_sales',
        table_name='sales_fact',
        columns_to_check=['order_id', 'customer_id', 'product_id', 'sale_amount'],
        min_rows=100,
        conn_id='warehouse_db'
    )
    
    quality_check >> null_check
```

### Inheritance Chain:
```
BaseOperator (Airflow core)
    ↓
DataQualityOperator (our custom operator)
    ↓
NullCheckOperator (specialized version)
```

## Practical Example: Spark DataFrame Transformations

```python
from pyspark.sql import DataFrame, SparkSession
from pyspark.sql.functions import col, count, when, current_timestamp
from typing import List, Dict

class BaseDataFrameTransformer:
    """Base class for DataFrame transformations."""
    
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self.transformation_metadata = {}
    
    def log_transformation(self, step_name: str, row_count: int):
        """Common logging for all transformations."""
        self.transformation_metadata[step_name] = {
            'row_count': row_count,
            'timestamp': current_timestamp()
        }
        print(f"[{step_name}] Processed {row_count} rows")
    
    def validate_columns(self, df: DataFrame, required_cols: List[str]) -> None:
        """Validate required columns exist."""
        missing = set(required_cols) - set(df.columns)
        if missing:
            raise ValueError(f"Missing required columns: {missing}")
    
    def transform(self, df: DataFrame) -> DataFrame:
        """Base transform method (to be overridden)."""
        raise NotImplementedError("Subclasses must implement transform()")


class BronzeTransformer(BaseDataFrameTransformer):
    """Transform raw data to Bronze layer."""
    
    def transform(self, df: DataFrame) -> DataFrame:
        """Add metadata and basic cleaning."""
        # Call parent validation
        self.validate_columns(df, ['id', 'raw_data'])
        
        # Add bronze metadata
        bronze_df = df.withColumn('ingestion_timestamp', current_timestamp()) \
                      .withColumn('source_layer', when(col('id').isNotNull(), 'bronze'))
        
        # Log using inherited method
        self.log_transformation('bronze_ingestion', bronze_df.count())
        
        return bronze_df


class SilverTransformer(BronzeTransformer):
    """Transform Bronze to Silver layer with data quality."""
    
    def __init__(self, spark: SparkSession, quality_rules: Dict[str, str]):
        super().__init__(spark)
        self.quality_rules = quality_rules
    
    def apply_quality_flags(self, df: DataFrame) -> DataFrame:
        """Add data quality flags based on rules."""
        quality_df = df
        
        for rule_name, rule_condition in self.quality_rules.items():
            quality_df = quality_df.withColumn(
                f'quality_{rule_name}',
                when(col(rule_condition).isNotNull(), 'PASS').otherwise('FAIL')
            )
        
        return quality_df
    
    def transform(self, df: DataFrame) -> DataFrame:
        """Extend bronze transformation with quality checks."""
        # First apply bronze transformations
        bronze_df = super().transform(df)
        
        # Then add silver-specific logic
        silver_df = self.apply_quality_flags(bronze_df) \
                        .withColumn('processed_timestamp', current_timestamp()) \
                        .withColumn('source_layer', when(col('id').isNotNull(), 'silver'))
        
        self.log_transformation('silver_processing', silver_df.count())
        
        return silver_df


class GoldTransformer(SilverTransformer):
    """Transform Silver to Gold layer with business logic."""
    
    def __init__(self, spark: SparkSession, quality_rules: Dict[str, str], 
                 aggregation_keys: List[str]):
        super().__init__(spark, quality_rules)
        self.aggregation_keys = aggregation_keys
    
    def transform(self, df: DataFrame) -> DataFrame:
        """Create aggregated gold table."""
        # Apply silver transformations first
        silver_df = super().transform(df)
        
        # Filter only quality-passed records
        clean_df = silver_df.filter(
            col('quality_id_check') == 'PASS'
        )
        
        # Aggregate to gold layer
        gold_df = clean_df.groupBy(*self.aggregation_keys) \
                          .agg(count('*').alias('record_count')) \
                          .withColumn('aggregation_timestamp', current_timestamp()) \
                          .withColumn('source_layer', when(col('record_count') > 0, 'gold'))
        
        self.log_transformation('gold_aggregation', gold_df.count())
        
        return gold_df


# Usage
spark = SparkSession.builder.appName("InheritanceExample").getOrCreate()

raw_data = spark.createDataFrame([
    (1, "data1"),
    (2, "data2"),
    (None, "data3"),  # Quality issue
], ['id', 'raw_data'])

# Chain of transformers using inheritance
bronze = BronzeTransformer(spark)
silver = SilverTransformer(spark, quality_rules={'id_check': 'id'})
gold = GoldTransformer(spark, quality_rules={'id_check': 'id'}, 
                       aggregation_keys=['source_layer'])

# Execute transformation pipeline
bronze_df = bronze.transform(raw_data)
silver_df = silver.transform(raw_data)
gold_df = gold.transform(raw_data)

gold_df.show()
```

## When to Use Inheritance

### ✅ Use Inheritance When:

1. **Clear "is-a" relationship exists**
   - A Dog IS-A Animal
   - A CustomOperator IS-A BaseOperator
   - A SilverTable IS-A BaseTable

2. **Significant code reuse opportunity**
   - Multiple derived classes share common behavior
   - Base class provides valuable default implementations

3. **Extending frameworks**
   - Airflow operators, Spark transformers
   - Plugin architectures requiring specific base classes

4. **Polymorphism needed**
   - Treating different types uniformly (all Animals can speak())

### ❌ Avoid Inheritance When:

1. **Relationship is "has-a" not "is-a"**
   - Use composition instead
   - Example: Car HAS-A Engine (don't inherit from Engine)

2. **Multiple inheritance creates complexity**
   - **Diamond problem**: When a class inherits from two classes that share a common ancestor
   ```python
   # AVOID: Diamond problem
   class A:
       def method(self): print("A")
   
   class B(A):
       def method(self): print("B")
   
   class C(A):
       def method(self): print("C")
   
   class D(B, C):  # Which method() to use? B's or C's?
       pass
   ```
   - Python uses MRO (Method Resolution Order), but it's confusing
   - Prefer composition or mixins for complex scenarios

3. **Deep inheritance hierarchies**
   - More than 2-3 levels becomes hard to maintain
   - Fragile base class problem: changes to base affect all children

4. **Base class changes frequently**
   - Unstable base classes break derived classes
   - Consider interfaces/protocols instead

5. **You need multiple behaviors from unrelated classes**
   - Use composition, dependency injection, or protocols
   ```python
   # BETTER: Composition over inheritance
   class Engine:
       def start(self): return "Engine started"
   
   class Car:
       def __init__(self):
           self.engine = Engine()  # HAS-A relationship
       
       def start(self):
           return self.engine.start()
   ```

### Best Practice: Favor Composition Over Inheritance

```python
# ❌ Over-engineering with inheritance
class LoggerMixin:
    def log(self, msg): print(msg)

class ValidatorMixin:
    def validate(self, data): return True

class DataProcessor(LoggerMixin, ValidatorMixin):  # Multiple inheritance
    pass

# ✅ Better: Composition
class Logger:
    def log(self, msg): print(msg)

class Validator:
    def validate(self, data): return True

class DataProcessor:
    def __init__(self):
        self.logger = Logger()
        self.validator = Validator()
```

---

**Remember**: Inheritance is a powerful tool, but not always the right one. For data engineering, it's most useful when extending frameworks (Airflow, Spark) or creating schema hierarchies. For business logic, composition is often cleaner and more flexible.
