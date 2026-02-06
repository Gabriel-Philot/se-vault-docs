# Encapsulation in OOP

## What is Encapsulation?

**Encapsulation** is the OOP pillar that focuses on **hiding internal state** and **exposing only the necessary interface**. It's about bundling data and methods that operate on that data within a single unit (class), while restricting direct access to some components.

### Core Principles:
- **Data Hiding**: Internal state should not be directly accessible from outside
- **Controlled Access**: Provide public methods/properties to interact with private data
- **Interface Stability**: Internal implementation can change without breaking external code

---

## Private vs Public Attributes in Python

Python uses naming conventions to indicate access levels:

### Public Attributes
```python
class DataPipeline:
    def __init__(self):
        self.name = "ETL Pipeline"  # Public - accessible anywhere
```

### Protected Attributes (Single Underscore `_`)
```python
class DataPipeline:
    def __init__(self):
        self._config = {}  # Protected - convention: don't access directly
                          # Still technically accessible, but signals "internal use"
```

### Private Attributes (Double Underscore `__`)
```python
class DataPipeline:
    def __init__(self):
        self.__credentials = {}  # Private - name mangling applied
                                # Becomes _DataPipeline__credentials
```

**Important**: Python doesn't enforce true private access like Java/C++. The underscore conventions are **signals to developers**, not hard restrictions.

---

## Properties and Getters/Setters

Python's `@property` decorator provides a clean way to encapsulate attribute access:

```python
class DataValidator:
    def __init__(self):
        self._threshold = 0.95
    
    @property
    def threshold(self):
        """Getter - read access"""
        return self._threshold
    
    @threshold.setter
    def threshold(self, value):
        """Setter - write access with validation"""
        if not 0 <= value <= 1:
            raise ValueError("Threshold must be between 0 and 1")
        self._threshold = value

# Usage
validator = DataValidator()
print(validator.threshold)  # 0.95 (calls getter)
validator.threshold = 0.99  # Calls setter with validation
```

---

## Complete Flow Example

```python
class DataQualityChecker:
    """Encapsulated class showing private attributes and properties"""
    
    def __init__(self, dataset_name):
        self.dataset_name = dataset_name  # Public
        self._check_count = 0             # Protected
        self.__results = []                # Private
    
    @property
    def results(self):
        """Read-only access to results"""
        return self.__results.copy()  # Return copy to prevent external modification
    
    @property
    def check_count(self):
        """Read-only check count"""
        return self._check_count
    
    def add_check_result(self, passed, message):
        """Public interface to modify private state"""
        self.__results.append({
            'passed': passed,
            'message': message,
            'timestamp': datetime.now()
        })
        self._check_count += 1
    
    def get_pass_rate(self):
        """Public method exposing calculated metric"""
        if not self.__results:
            return 0.0
        passed = sum(1 for r in self.__results if r['passed'])
        return passed / len(self.__results)

# Usage
checker = DataQualityChecker("user_events")
checker.add_check_result(True, "No nulls found")
checker.add_check_result(False, "Duplicates detected")

print(f"Pass rate: {checker.get_pass_rate()}")  # 0.5
print(f"Check count: {checker.check_count}")     # 2
# checker.__results  # AttributeError - private!
```

---

## Data Engineering Analogy

### Database Views
Think of encapsulation like **SQL views**:
- **Private attributes** = underlying table structure and complex joins
- **Public interface** = the view that presents clean, simple data
- Users query the view without knowing the complexity behind it

```sql
-- Internal complexity (hidden)
CREATE VIEW customer_metrics AS
SELECT 
    c.customer_id,
    COUNT(o.order_id) as total_orders,
    SUM(o.amount) as lifetime_value
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id;

-- External interface (exposed)
SELECT * FROM customer_metrics WHERE lifetime_value > 1000;
```

### APIs and Data Access
Encapsulation mirrors **API design**:
- Internal implementation details (database queries, caching logic) are hidden
- Only specific endpoints are exposed
- Implementation can change (switch databases) without breaking client code

---

## Practical Example: Airflow Connection Manager

```python
from airflow.hooks.base import BaseHook
from typing import Optional
import logging

class SecureConnectionManager:
    """
    Encapsulates connection credentials and provides safe access methods.
    
    Benefits:
    - Credentials never exposed directly
    - Validation logic centralized
    - Audit logging built-in
    - Easy to swap connection types
    """
    
    def __init__(self, conn_id: str):
        self.__conn_id = conn_id       # Private - never expose
        self.__connection = None        # Private - cached connection
        self._logger = logging.getLogger(__name__)
    
    @property
    def conn_id(self):
        """Read-only access to connection ID"""
        return self.__conn_id
    
    def __fetch_connection(self):
        """Private method - internal implementation detail"""
        if self.__connection is None:
            self.__connection = BaseHook.get_connection(self.__conn_id)
            self._logger.info(f"Connection fetched: {self.__conn_id}")
        return self.__connection
    
    def get_uri(self) -> str:
        """Public method - safe interface to get connection URI"""
        conn = self.__fetch_connection()
        # URI might contain credentials, but access is controlled and logged
        self._logger.info(f"URI accessed for {self.__conn_id}")
        return conn.get_uri()
    
    def get_hook(self, hook_class):
        """Public method - get typed hook without exposing credentials"""
        return hook_class(conn_id=self.__conn_id)
    
    def test_connection(self) -> bool:
        """Public method - safe way to validate connection"""
        try:
            conn = self.__fetch_connection()
            conn.test_connection()
            self._logger.info(f"Connection test passed: {self.__conn_id}")
            return True
        except Exception as e:
            self._logger.error(f"Connection test failed: {e}")
            return False

# Usage in DAG
from airflow.providers.postgres.hooks.postgres import PostgresHook

def process_data(**context):
    # Credentials are encapsulated - never directly accessed
    db_manager = SecureConnectionManager("postgres_prod")
    
    # Safe, controlled access
    if db_manager.test_connection():
        hook = db_manager.get_hook(PostgresHook)
        records = hook.get_records("SELECT * FROM users LIMIT 10")
        return records
    else:
        raise ValueError("Cannot connect to database")
```

---

## Benefits of Encapsulation

### 🔒 Security
- Sensitive data (credentials, API keys) hidden from direct access
- Controlled access points make audit logging easier
- Prevents accidental exposure of internal state

### 🛠️ Maintainability
- Internal implementation can change without breaking external code
- Validation logic centralized in setters
- Clear separation between public API and internal details

### 🎯 Access Control
- Read-only properties prevent unauthorized modifications
- Methods can enforce business rules and constraints
- Interface stability reduces coupling between components

### 🧪 Testability
- Clear public interface makes mocking easier
- Private methods can be refactored without changing tests
- Behavior validation vs implementation testing

---

## Summary

✅ **Encapsulation** hides internal state and exposes controlled interfaces  
✅ Python uses **naming conventions** (`_protected`, `__private`) to signal access levels  
✅ **`@property`** decorators provide clean getter/setter patterns with validation  
✅ Similar to **database views** that hide query complexity  
✅ Similar to **APIs** that abstract data access implementation  
✅ Critical for **security** (hiding credentials), **maintainability** (internal changes), and **access control**  
✅ In data engineering, encapsulation protects sensitive connection info and provides stable interfaces  

---

## Key Takeaway

Encapsulation is about **building walls with controlled gates**. Your class's internal state is the protected city, and your public methods are the gates that control how outsiders interact with it. This prevents chaos, enforces rules, and makes systems more secure and maintainable.
