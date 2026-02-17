# Abstraction in OOP

## What is Abstraction?

Abstraction is the OOP pillar that focuses on **hiding complexity** and **showing only essential features** to the user. It defines a contract (what must be done) without specifying implementation details (how it's done).

Think of it as:
- **What vs How**: Define what operations are available, not how they're implemented
- **Interface over Implementation**: Users interact with a clean interface, not messy internals
- **Enforcement**: Forces child classes to implement specific behaviors

## Abstract Base Classes (ABC) in Python

Python provides the `abc` module to create abstract base classes. These are classes that:
- Cannot be instantiated directly
- Define methods that **must** be implemented by child classes
- Serve as templates/contracts for derived classes

```python
from abc import ABC, abstractmethod

class AbstractClass(ABC):
    @abstractmethod
    def required_method(self):
        """This method MUST be implemented by child classes"""
        pass
    
    def concrete_method(self):
        """This method is already implemented"""
        return "I'm implemented in the base class"
```

### The `@abstractmethod` Decorator

The `@abstractmethod` decorator marks a method as **required**. Any class inheriting from an ABC must implement all abstract methods, or it will also become abstract and cannot be instantiated.

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass
    
    @abstractmethod
    def perimeter(self):
        pass

# This will raise TypeError: Can't instantiate abstract class
# shape = Shape()

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius
    
    def area(self):
        return 3.14159 * self.radius ** 2
    
    def perimeter(self):
        return 2 * 3.14159 * self.radius

# This works!
circle = Circle(5)
print(f"Area: {circle.area()}")
```

## Understanding the Contract Mechanism

### Abstract Classes = Contracts

Think of an abstract class as a **legal contract** that says: *"Anyone who signs this contract MUST provide implementations for methods X, Y, and Z"*.

```python
from abc import ABC, abstractmethod

class DataSource(ABC):
    """This is a CONTRACT, not executable code"""
    
    @abstractmethod
    def connect(self):
        """Child classes MUST implement this"""
        pass  # ← This NEVER executes!
    
    @abstractmethod
    def fetch_data(self):
        """Child classes MUST implement this"""
        pass  # ← This NEVER executes!
```

### The `pass` Never Executes

**Critical point**: The `pass` keyword in abstract methods is just a placeholder. It exists because Python requires a method body, but **it never runs** because:

1. **You cannot instantiate abstract classes**:
   ```python
   # ❌ This raises TypeError
   source = DataSource()  
   # TypeError: Can't instantiate abstract class DataSource 
   # with abstract methods connect, fetch_data
   ```

2. **Only concrete implementations execute**:
   ```python
   # ✅ This works - uses the REAL implementation
   class PostgresSource(DataSource):
       def connect(self):
           return "Connected to PostgreSQL"  # ← THIS executes
       
       def fetch_data(self):
           return [1, 2, 3]  # ← THIS executes
   
   pg = PostgresSource()
   pg.connect()  # Runs PostgresSource.connect(), not the abstract pass
   ```

3. **Validation happens at instantiation time**:
   ```python
   # ❌ Forgot to implement fetch_data()
   class BrokenSource(DataSource):
       def connect(self):
           return "Connected"
       # Missing fetch_data() implementation!
   
   # This line raises TypeError before ANY code runs
   broken = BrokenSource()
   # TypeError: Can't instantiate abstract class BrokenSource 
   # with abstract method fetch_data
   ```

### Real-World Example: Why This Matters in Spark/Airflow

```python
from abc import ABC, abstractmethod

class AbstractETLOperator(ABC):
    """Contract: All ETL operators must implement these 3 methods"""
    
    @abstractmethod
    def extract(self, context):
        pass  # ← Placeholder, never runs
    
    @abstractmethod
    def transform(self, data, context):
        pass  # ← Placeholder, never runs
    
    @abstractmethod
    def load(self, data, context):
        pass  # ← Placeholder, never runs
    
    def execute(self, context):
        """This IS concrete and WILL execute"""
        # Calls the REAL implementations from child classes
        raw = self.extract(context)      # ← Calls child's extract()
        clean = self.transform(raw, context)  # ← Calls child's transform()
        result = self.load(clean, context)    # ← Calls child's load()
        return result

# ✅ Valid implementation
class SparkETL(AbstractETLOperator):
    def extract(self, context):
        return spark.read.parquet("/data/input")  # REAL code
    
    def transform(self, data, context):
        return data.filter(col("status") == "active")  # REAL code
    
    def load(self, data, context):
        data.write.parquet("/data/output")  # REAL code
        return "Success"

# Usage
etl = SparkETL()  # ✅ Instantiation succeeds (all methods implemented)
etl.execute(context)  # ✅ Runs REAL extract/transform/load, not `pass`
```

**What happens behind the scenes:**
```python
# When you call etl.execute(context):
# 1. execute() is defined in AbstractETLOperator (concrete method)
# 2. self.extract(context) looks up extract() in SparkETL (polymorphism)
# 3. Finds SparkETL.extract() and executes it (NOT the abstract pass)
# 4. Same for transform() and load()
```

### Key Takeaways on Contracts

✅ **Abstract classes define "what", not "how"**: They're contracts, not implementations  
✅ **`pass` is just a placeholder**: Required by Python syntax, never executes  
✅ **Validation is automatic**: Python prevents instantiation if contract is broken  
✅ **Concrete methods can call abstract ones**: The `execute()` method safely calls `extract/transform/load` knowing they'll be implemented  
✅ **No runtime surprises**: Errors happen at instantiation time, not when methods are called  

## Abstraction vs Encapsulation

| Aspect | Abstraction | Encapsulation |
|--------|-------------|---------------|
| **Purpose** | Hide complexity by showing only essential features | Hide internal state and protect data |
| **Focus** | What the object does (interface) | How the object stores data (implementation) |
| **Mechanism** | Abstract classes, interfaces | Private/protected members, getters/setters |
| **Level** | Design level (class hierarchy) | Implementation level (single class) |
| **Question** | "What can this do?" | "How is this protected?" |

**Simple analogy:**
- **Abstraction**: A car's steering wheel (you don't need to know about hydraulics, just turn it)
- **Encapsulation**: The car's engine is enclosed in a hood (you can't accidentally touch moving parts)

## Summary

✅ **Abstraction** hides complexity and shows only essential features  
✅ **ABC (Abstract Base Class)** cannot be instantiated directly  
✅ **@abstractmethod** forces child classes to implement specific methods  
✅ **Contract enforcement** ensures all derived classes follow the same interface  
✅ **Different from encapsulation**: abstraction is about interface design, encapsulation is about data protection  

## Complete Flow: Abstract Class Example

```python
from abc import ABC, abstractmethod

class DataValidator(ABC):
    """Abstract base class that defines the contract for data validators"""
    
    def __init__(self, name):
        self.name = name
    
    @abstractmethod
    def validate(self, data):
        """Must return True if valid, False otherwise"""
        pass
    
    @abstractmethod
    def get_error_message(self):
        """Must return a descriptive error message"""
        pass
    
    def run_validation(self, data):
        """Concrete method that uses abstract methods"""
        print(f"Running {self.name} validation...")
        if self.validate(data):
            print("✅ Validation passed!")
            return True
        else:
            print(f"❌ Validation failed: {self.get_error_message()}")
            return False


class EmailValidator(DataValidator):
    def validate(self, data):
        return "@" in data and "." in data
    
    def get_error_message(self):
        return "Email must contain '@' and '.'"


class LengthValidator(DataValidator):
    def __init__(self, name, min_length):
        super().__init__(name)
        self.min_length = min_length
    
    def validate(self, data):
        return len(data) >= self.min_length
    
    def get_error_message(self):
        return f"Data must be at least {self.min_length} characters long"


# Usage
email_validator = EmailValidator("Email Check")
email_validator.run_validation("user@example.com")  # ✅ Passes

length_validator = LengthValidator("Length Check", 10)
length_validator.run_validation("short")  # ❌ Fails
```

**Output:**
```
Running Email Check validation...
✅ Validation passed!
Running Length Check validation...
❌ Validation failed: Data must be at least 10 characters long
```

## Data Engineering Analogy

Think of abstraction like **data contracts** or **interfaces** in data engineering:

- **The Contract**: All data sources must provide `extract()`, `transform()`, `load()` methods
- **The Enforcement**: You don't care if it's extracting from S3, PostgreSQL, or an API
- **The Benefit**: Your orchestrator can treat all sources the same way

Just like how a REST API defines endpoints (GET /users, POST /users) without telling you the database schema, abstraction defines **what operations are available** without specifying **how they work internally**.

**Real-world example:**
```python
# All data sources must follow this contract
class DataSource(ABC):
    @abstractmethod
    def extract():
        """Extract data from source"""
        pass
    
    @abstractmethod
    def transform():
        """Transform data to common format"""
        pass
    
    @abstractmethod
    def load():
        """Load data to destination"""
        pass
```

Whether you're pulling from an S3 bucket, scraping a website, or querying a database, the **interface stays the same**. Your pipeline doesn't care about implementation details.

## Practical Example: Abstract ETL Operator in Airflow

```python
from abc import ABC, abstractmethod
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults

class AbstractETLOperator(BaseOperator, ABC):
    """
    Abstract ETL operator that enforces implementation of extract, transform, load.
    This ensures all ETL operators follow the same contract.
    """
    
    @apply_defaults
    def __init__(self, source_conn_id, dest_conn_id, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.source_conn_id = source_conn_id
        self.dest_conn_id = dest_conn_id
    
    @abstractmethod
    def extract(self, context):
        """
        Extract data from source.
        Must return extracted data.
        """
        pass
    
    @abstractmethod
    def transform(self, data, context):
        """
        Transform extracted data.
        Must return transformed data.
        """
        pass
    
    @abstractmethod
    def load(self, data, context):
        """
        Load transformed data to destination.
        Must return load result/status.
        """
        pass
    
    def execute(self, context):
        """Concrete method that orchestrates ETL flow"""
        self.log.info(f"Starting ETL process: {self.task_id}")
        
        # Extract
        self.log.info("Step 1/3: Extracting data...")
        raw_data = self.extract(context)
        self.log.info(f"Extracted {len(raw_data)} records")
        
        # Transform
        self.log.info("Step 2/3: Transforming data...")
        transformed_data = self.transform(raw_data, context)
        self.log.info(f"Transformed to {len(transformed_data)} records")
        
        # Load
        self.log.info("Step 3/3: Loading data...")
        result = self.load(transformed_data, context)
        
        self.log.info(f"ETL process completed: {result}")
        return result


class PostgresToS3Operator(AbstractETLOperator):
    """Concrete implementation: PostgreSQL → S3"""
    
    def extract(self, context):
        # Connect to PostgreSQL and extract data
        from airflow.hooks.postgres_hook import PostgresHook
        pg_hook = PostgresHook(postgres_conn_id=self.source_conn_id)
        
        sql = "SELECT * FROM users WHERE created_at >= {{ ds }}"
        return pg_hook.get_records(sql)
    
    def transform(self, data, context):
        # Transform to JSON format
        import json
        return [json.dumps({
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'created_at': str(row[3])
        }) for row in data]
    
    def load(self, data, context):
        # Load to S3
        from airflow.hooks.S3_hook import S3Hook
        s3_hook = S3Hook(aws_conn_id=self.dest_conn_id)
        
        file_content = '\n'.join(data)
        s3_hook.load_string(
            string_data=file_content,
            key=f"users/{{ ds }}/users.json",
            bucket_name='my-data-lake'
        )
        return f"Loaded {len(data)} records to S3"


class APIToSnowflakeOperator(AbstractETLOperator):
    """Concrete implementation: API → Snowflake"""
    
    def extract(self, context):
        # Extract from REST API
        import requests
        response = requests.get("https://api.example.com/data")
        return response.json()
    
    def transform(self, data, context):
        # Transform and clean data
        return [{
            'id': item['id'],
            'value': item['value'].upper(),
            'timestamp': context['execution_date']
        } for item in data]
    
    def load(self, data, context):
        # Load to Snowflake
        from airflow.providers.snowflake.hooks.snowflake import SnowflakeHook
        sf_hook = SnowflakeHook(snowflake_conn_id=self.dest_conn_id)
        
        sf_hook.insert_rows(
            table='raw.api_data',
            rows=data,
            target_fields=['id', 'value', 'timestamp']
        )
        return f"Loaded {len(data)} records to Snowflake"


# Usage in DAG
from airflow import DAG
from datetime import datetime

with DAG('etl_pipeline', start_date=datetime(2026, 1, 1)) as dag:
    
    postgres_to_s3 = PostgresToS3Operator(
        task_id='postgres_to_s3',
        source_conn_id='postgres_prod',
        dest_conn_id='aws_s3'
    )
    
    api_to_snowflake = APIToSnowflakeOperator(
        task_id='api_to_snowflake',
        source_conn_id='external_api',
        dest_conn_id='snowflake_dw'
    )
    
    postgres_to_s3 >> api_to_snowflake
```

## Benefits of Abstraction

### 1. Enforces Contracts
- **Compile-time safety**: You can't instantiate a class that doesn't implement required methods
- **Consistency**: All implementations follow the same interface
- **Documentation**: The abstract class serves as documentation for what methods are needed

### 2. Reduces Coupling
- **Dependency on abstractions**: Code depends on the abstract interface, not concrete implementations
- **Easy substitution**: Swap implementations without changing calling code
- **Testability**: Mock abstract classes easily for unit tests

```python
# Code depends on abstraction, not implementation
def process_data(etl_operator: AbstractETLOperator, context):
    # Works with ANY ETL operator that implements the abstract contract
    return etl_operator.execute(context)

# Can use either implementation
process_data(PostgresToS3Operator(...), context)
process_data(APIToSnowflakeOperator(...), context)
```

### 3. Improves Testability
```python
class MockETLOperator(AbstractETLOperator):
    """Mock for testing without touching real data sources"""
    
    def extract(self, context):
        return [{'id': 1, 'name': 'test'}]
    
    def transform(self, data, context):
        return data
    
    def load(self, data, context):
        return f"Mock loaded {len(data)} records"

# Test your orchestration logic without real databases
def test_etl_pipeline():
    mock_operator = MockETLOperator(
        task_id='test',
        source_conn_id='mock',
        dest_conn_id='mock'
    )
    result = mock_operator.execute({})
    assert "Mock loaded 1 records" in result
```

---

**Key Takeaway**: Abstraction is about defining **what needs to be done** (the contract) while allowing **flexibility in how it's done** (the implementation). In data engineering, this translates to creating robust, testable, and maintainable ETL pipelines that can adapt to different data sources and destinations without rewriting orchestration logic.
