# Spark Source Validation Caching

## Problem

In Spark pipelines that read multiple sources, it's common to have:
- **Validation** at the start (checks if source has data for the day)
- **Same source read multiple times** (different joins, distributed transformations)

**Challenge:** How to validate each source **only once** even if it's read multiple times in the pipeline?

## Solution: Python's `lru_cache`

Use `@lru_cache` to cache the **validation result** (not the DataFrame).

```python
from functools import lru_cache

class SourceReader:
    def __init__(self, spark):
        self.spark = spark
    
    @lru_cache(maxsize=128)
    def _validate_source(self, source_path: str, date: str) -> bool:
        """
        Validation with automatic caching.
        Runs only 1x per unique (source_path, date) combination.
        """
        print(f"🔍 [VALIDATING] {source_path} for {date}")
        
        try:
            # Your validation logic (e.g., check DBFS)
            dbutils.fs.ls(f"{source_path}/date={date}")
            return True
        except:
            return False
    
    def read_source(self, source_path: str, date: str):
        """Reads source with cached validation."""
        if not self._validate_source(source_path, date):
            raise ValueError(f"No data: {source_path} on {date}")
        
        return self.spark.read.parquet(f"{source_path}/date={date}")
```

## Usage Example

```python
reader = SourceReader(spark)
date = "2026-01-22"

# Join 1: Sales + Customers
df_sales_1 = reader.read_source("/data/sales", date)    # ✅ VALIDATES
df_customers = reader.read_source("/data/customers", date)  # ✅ VALIDATES

# Join 2: Sales + Products
df_sales_2 = reader.read_source("/data/sales", date)    # ⚡ CACHE HIT (doesn't validate)
df_products = reader.read_source("/data/products", date)   # ✅ VALIDATES

# Join 3: Sales + Orders
df_sales_3 = reader.read_source("/data/sales", date)    # ⚡ CACHE HIT (doesn't validate)
df_orders = reader.read_source("/data/orders", date)      # ✅ VALIDATES

# Result:
# - 6 read_source calls
# - 4 validations executed (/data/sales validated 1x, used 3x)
```

### Debug: View Cache Statistics

```python
# After pipeline runs
print(reader._validate_source.cache_info())
# CacheInfo(hits=2, misses=4, maxsize=128, currsize=4)
```

**Explanation:**
- `hits=2`: Two cache hits (sales 2nd and 3rd time)
- `misses=4`: Four validations executed (sales 1x, customers 1x, products 1x, orders 1x)
- `currsize=4`: Four unique sources in cache

### Clear Cache (if needed)

```python
reader._validate_source.cache_clear()  # Removes all cache entries
```

## How It Works Internally

`lru_cache` creates an internal dictionary using **arguments as key**:

```python
# First call
_validate_source("/data/sales", "2026-01-22")
# Cache: {("/data/sales", "2026-01-22"): True}
# Executes validation ✅

# Second call (same arguments)
_validate_source("/data/sales", "2026-01-22")
# Found in cache: ("/data/sales", "2026-01-22") → True
# Does NOT execute validation, returns from cache ⚡

# Third call (different date)
_validate_source("/data/sales", "2026-01-23")
# Cache: {
#     ("/data/sales", "2026-01-22"): True,
#     ("/data/sales", "2026-01-23"): True  # New entry
# }
# Executes validation ✅ (different key)
```

## Memory Usage

With 20 sources per execution:
- **Validation cache:** ~5-10 KB (negligible)
- Each entry: `(source_path, date) → bool`

```python
# Example of cache in memory (20 sources)
{
    ("/data/sales", "2026-01-22"): True,
    ("/data/customers", "2026-01-22"): True,
    ("/data/products", "2026-01-22"): True,
    # ... 17 more sources
    # Total: a few KB of memory
}
```

## What `lru_cache` Does NOT Do

❌ **Does not cache DataFrames**, only validation results (True/False).

```python
def read_source(self, source_path: str, date: str):
    self._validate_source(source_path, date)     # ✅ Cache here (True/False)
    return self.spark.read.parquet(path)         # ❌ Reads parquet every time
```

If you call `read_source` 3x for the same source:
- ✅ Validates 1x (cached)
- ⚠️ Reads parquet 3x (no DataFrame cache)

## DataFrame Caching (If Needed)

If the same table is read **many times** and you want to avoid I/O:

```python
class SourceReader:
    def __init__(self, spark):
        self.spark = spark
        self._df_cache = {}  # DataFrame cache
    
    @lru_cache(maxsize=128)
    def _validate_source(self, source_path: str, date: str) -> bool:
        """Validation cache (lightweight)."""
        dbutils.fs.ls(f"{source_path}/date={date}")
        return True
    
    def read_source(self, source_path: str, date: str, cache_df: bool = False):
        """
        Args:
            cache_df: True to cache DataFrame in Spark (memory intensive)
        """
        # Validation with cache (lightweight)
        if not self._validate_source(source_path, date):
            raise ValueError(f"No data: {source_path}")
        
        cache_key = (source_path, date)
        
        if cache_df:
            # DataFrame cache (heavy)
            if cache_key not in self._df_cache:
                df = self.spark.read.parquet(f"{source_path}/date={date}")
                df = df.cache()  # Cache in Spark
                self._df_cache[cache_key] = df
            return self._df_cache[cache_key]
        else:
            # No DF cache
            return self.spark.read.parquet(f"{source_path}/date={date}")

# Usage
df_sales_1 = reader.read_source("/data/sales", date, cache_df=True)  # Reads + caches
df_sales_2 = reader.read_source("/data/sales", date, cache_df=True)  # Returns cached
```

**Warning:** DataFrame caching uses executor memory (can cause OOM with many large tables).

## Singleton vs lru_cache in Spark

### ❌ Singleton Does NOT Work Well with Distributed Spark

```python
class SourceValidationCache:
    _instance = None  # Singleton
    _cache = {}
```

**Problem:**
- ✅ Works in the **driver**
- ❌ **Each executor creates its own instance** (they don't share memory)

**When it works:** If validation runs **only on the driver** (before distributed transformations), Singleton works.

**When it does NOT work:** If you use Singleton inside UDFs or transformations that run on executors.

### ✅ lru_cache Is Better

- Built-in to Python
- Thread-safe
- Supports multiple arguments
- Memory limit with `maxsize`
- Easy debugging with `.cache_info()`

## Alternatives Considered

| Solution | When to Use |
|---------|-------------|
| **`@lru_cache`** | ✅ **Recommended** for source validation |
| **Singleton** | ⚠️ Works on driver, but `lru_cache` is more idiomatic |
| **Instance cache** | OK, but `lru_cache` is cleaner |
| **Custom decorator** | Only if you need complex logic beyond caching |
| **DF cache (`.cache()`)** | Only if same table read 5+ times and you have spare memory |

## Requirements for `lru_cache`

⚠️ **Arguments must be hashable:**

```python
# ✅ Works
_validate_source("/data/sales", "2026-01-22")  # str, str

# ❌ Doesn't work
_validate_source("/data/sales", ["col1", "col2"])  # list isn't hashable

# ✅ Use tuple instead of list
_validate_source("/data/sales", ("col1", "col2"))  # tuple is hashable
```

## Summary

✅ **Use `@lru_cache` for validation** to ensure each source is validated only 1x  
✅ **Memory negligible** (~5-10 KB for 20 sources)  
✅ **Works on driver** where validations typically run  
✅ **Simple and idiomatic** in Python  
❌ **Does not cache DataFrames** (only validation)  
⚠️ **Add DF cache** only if measurements show actual repeated I/O  

**For pipelines with ~20 sources where some repeat in joins:** `lru_cache` solves the problem without additional complexity.
