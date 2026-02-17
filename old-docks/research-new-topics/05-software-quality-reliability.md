# Software Quality & Reliability

## Introduction

Software quality and reliability are critical concerns for data engineers who build and maintain data pipelines, ETL processes, and data platforms. Unlike traditional software engineering, data systems face unique challenges: they must handle unpredictable data volumes, deal with external dependencies (APIs, databases, cloud services), process potentially malformed data, and maintain high availability for downstream consumers.

This guide covers five essential areas that every data engineer should master:
1. **Error Handling and Resilience Patterns** - Building systems that gracefully handle failures
2. **Performance Profiling and Optimization** - Identifying and resolving bottlenecks
3. **Security Best Practices** - Protecting sensitive data and credentials
4. **Testing Strategies for Data Systems** - Ensuring data quality and pipeline reliability
5. **Documentation** - Maintaining clear records of architectural decisions and APIs

Each section builds upon your existing knowledge of OOP, memory management, and design patterns, providing practical implementations you can apply immediately to your data engineering work.

---

## 1. Error Handling and Resilience Patterns

### What is it?

Resilience patterns are design strategies that help systems recover gracefully from failures. In distributed data systems, failures are not exceptional - they're expected. Networks fail, APIs rate-limit requests, databases become temporarily unavailable, and cloud services experience outages.

The two most important resilience patterns for data engineers are:

- **Circuit Breaker Pattern**: Prevents a system from repeatedly trying to execute an operation that's likely to fail, giving the failing service time to recover.
- **Retry Pattern**: Automatically retries failed operations with configurable delays and backoff strategies.

### Why it matters for Data Engineers

Data pipelines often interact with:
- External APIs (rate limits, temporary outages)
- Databases (connection pool exhaustion, deadlocks)
- Cloud storage (S3, GCS - network timeouts)
- Message queues (Kafka, RabbitMQ - broker unavailability)
- Third-party data providers (unpredictable availability)

Without proper resilience patterns, a single transient failure can cascade through your entire pipeline, causing data loss or processing delays.

### Prerequisites

- Understanding of exception handling in Python
- Familiarity with decorators
- Basic knowledge of state machines
- Understanding of threading/concurrency concepts

### Implementation Example

```python
"""
Resilience Patterns for Data Engineering
========================================
Production-ready implementations of Circuit Breaker and Retry patterns.
"""

import time
import random
import logging
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from functools import wraps
from typing import Callable, Optional, Type, Tuple, Any
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# CIRCUIT BREAKER PATTERN
# =============================================================================

class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation, requests flow through
    OPEN = "open"          # Failure threshold exceeded, requests blocked
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior."""
    failure_threshold: int = 5          # Failures before opening circuit
    success_threshold: int = 2          # Successes in half-open to close
    timeout: float = 30.0               # Seconds before attempting recovery
    excluded_exceptions: Tuple[Type[Exception], ...] = ()  # Don't count these as failures


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open and blocking requests."""
    pass


class CircuitBreaker:
    """
    Thread-safe Circuit Breaker implementation.

    Usage:
        cb = CircuitBreaker(name="database", config=CircuitBreakerConfig(failure_threshold=3))

        @cb
        def query_database():
            return db.execute("SELECT * FROM users")
    """

    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[datetime] = None
        self._lock = threading.RLock()

    @property
    def state(self) -> CircuitState:
        with self._lock:
            if self._state == CircuitState.OPEN:
                # Check if timeout has elapsed
                if self._last_failure_time:
                    elapsed = datetime.now() - self._last_failure_time
                    if elapsed >= timedelta(seconds=self.config.timeout):
                        logger.info(f"Circuit '{self.name}': OPEN -> HALF_OPEN (timeout elapsed)")
                        self._state = CircuitState.HALF_OPEN
                        self._success_count = 0
            return self._state

    def _record_success(self) -> None:
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.config.success_threshold:
                    logger.info(f"Circuit '{self.name}': HALF_OPEN -> CLOSED (recovery confirmed)")
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0  # Reset on success

    def _record_failure(self) -> None:
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = datetime.now()

            if self._state == CircuitState.HALF_OPEN:
                logger.warning(f"Circuit '{self.name}': HALF_OPEN -> OPEN (failure during recovery)")
                self._state = CircuitState.OPEN
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.config.failure_threshold:
                    logger.warning(f"Circuit '{self.name}': CLOSED -> OPEN (threshold exceeded)")
                    self._state = CircuitState.OPEN

    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if self.state == CircuitState.OPEN:
                raise CircuitBreakerOpenError(
                    f"Circuit '{self.name}' is OPEN. Service unavailable."
                )

            try:
                result = func(*args, **kwargs)
                self._record_success()
                return result
            except self.config.excluded_exceptions:
                raise  # Don't count excluded exceptions as failures
            except Exception as e:
                self._record_failure()
                raise

        return wrapper


# =============================================================================
# RETRY PATTERN WITH EXPONENTIAL BACKOFF
# =============================================================================

@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_attempts: int = 3
    base_delay: float = 1.0              # Initial delay in seconds
    max_delay: float = 60.0              # Maximum delay cap
    exponential_base: float = 2.0        # Multiplier for exponential backoff
    jitter: bool = True                  # Add randomness to prevent thundering herd
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,)


def retry_with_backoff(config: Optional[RetryConfig] = None):
    """
    Decorator that retries a function with exponential backoff.

    Usage:
        @retry_with_backoff(RetryConfig(max_attempts=5, base_delay=2.0))
        def fetch_data_from_api():
            return requests.get("https://api.example.com/data")
    """
    config = config or RetryConfig()

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(1, config.max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e

                    if attempt == config.max_attempts:
                        logger.error(f"All {config.max_attempts} attempts failed for {func.__name__}")
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(
                        config.base_delay * (config.exponential_base ** (attempt - 1)),
                        config.max_delay
                    )

                    # Add jitter to prevent thundering herd
                    if config.jitter:
                        delay = delay * (0.5 + random.random())

                    logger.warning(
                        f"Attempt {attempt}/{config.max_attempts} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator


# =============================================================================
# COMBINED RESILIENCE: CIRCUIT BREAKER + RETRY
# =============================================================================

class ResilientOperation:
    """
    Combines Circuit Breaker and Retry patterns for robust operation execution.

    Usage:
        resilient = ResilientOperation(
            name="external_api",
            circuit_config=CircuitBreakerConfig(failure_threshold=5),
            retry_config=RetryConfig(max_attempts=3)
        )

        @resilient
        def call_external_api():
            return requests.get("https://api.example.com/data")
    """

    def __init__(
        self,
        name: str,
        circuit_config: Optional[CircuitBreakerConfig] = None,
        retry_config: Optional[RetryConfig] = None
    ):
        self.circuit_breaker = CircuitBreaker(name, circuit_config)
        self.retry_config = retry_config or RetryConfig()

    def __call__(self, func: Callable) -> Callable:
        # Apply retry first (inner), then circuit breaker (outer)
        # This means: retry within the circuit, circuit tracks overall health

        @wraps(func)
        def wrapper(*args, **kwargs):
            if self.circuit_breaker.state == CircuitState.OPEN:
                raise CircuitBreakerOpenError(
                    f"Circuit '{self.circuit_breaker.name}' is OPEN"
                )

            last_exception = None
            for attempt in range(1, self.retry_config.max_attempts + 1):
                try:
                    result = func(*args, **kwargs)
                    self.circuit_breaker._record_success()
                    return result
                except self.retry_config.retryable_exceptions as e:
                    last_exception = e

                    if attempt == self.retry_config.max_attempts:
                        self.circuit_breaker._record_failure()
                        raise

                    delay = min(
                        self.retry_config.base_delay *
                        (self.retry_config.exponential_base ** (attempt - 1)),
                        self.retry_config.max_delay
                    )
                    if self.retry_config.jitter:
                        delay *= (0.5 + random.random())

                    logger.warning(f"Attempt {attempt} failed, retrying in {delay:.2f}s")
                    time.sleep(delay)

            raise last_exception

        return wrapper


# =============================================================================
# PRACTICAL EXAMPLE: DATA PIPELINE WITH RESILIENCE
# =============================================================================

class DataPipelineError(Exception):
    """Base exception for pipeline errors."""
    pass


class TransientError(DataPipelineError):
    """Transient error that may resolve on retry."""
    pass


class PermanentError(DataPipelineError):
    """Permanent error that should not be retried."""
    pass


# Simulated external service
class ExternalDataService:
    """Simulates an unreliable external data service."""

    def __init__(self, failure_rate: float = 0.3):
        self.failure_rate = failure_rate
        self.call_count = 0

    def fetch_data(self, query: str) -> dict:
        self.call_count += 1
        if random.random() < self.failure_rate:
            raise TransientError(f"Service temporarily unavailable (call #{self.call_count})")
        return {"query": query, "results": [1, 2, 3], "timestamp": datetime.now().isoformat()}


# Create resilient wrapper for the service
resilient_api = ResilientOperation(
    name="external_data_service",
    circuit_config=CircuitBreakerConfig(
        failure_threshold=5,
        timeout=30.0,
        excluded_exceptions=(PermanentError,)  # Don't trip circuit for permanent errors
    ),
    retry_config=RetryConfig(
        max_attempts=3,
        base_delay=1.0,
        retryable_exceptions=(TransientError,)  # Only retry transient errors
    )
)


class DataPipeline:
    """Example data pipeline using resilience patterns."""

    def __init__(self, service: ExternalDataService):
        self.service = service

    @resilient_api
    def extract_data(self, query: str) -> dict:
        """Extract data with automatic retry and circuit breaking."""
        return self.service.fetch_data(query)

    def run_pipeline(self, queries: list[str]) -> list[dict]:
        """Run the full pipeline with error handling."""
        results = []

        for query in queries:
            try:
                data = self.extract_data(query)
                results.append({"status": "success", "data": data})
            except CircuitBreakerOpenError as e:
                logger.error(f"Circuit open, skipping query '{query}': {e}")
                results.append({"status": "circuit_open", "query": query})
            except TransientError as e:
                logger.error(f"Transient error after retries for '{query}': {e}")
                results.append({"status": "failed", "query": query, "error": str(e)})

        return results


# Example usage
if __name__ == "__main__":
    service = ExternalDataService(failure_rate=0.4)
    pipeline = DataPipeline(service)

    queries = ["SELECT * FROM users", "SELECT * FROM orders", "SELECT * FROM products"]
    results = pipeline.run_pipeline(queries)

    for result in results:
        print(result)
```

### Real-world Application

**Scenario: ETL Pipeline Fetching Data from Multiple APIs**

Consider a data pipeline that aggregates data from Salesforce, HubSpot, and a custom REST API. Each service has different reliability characteristics:

1. **Salesforce API**: Generally reliable but has strict rate limits
2. **HubSpot API**: Occasional timeouts during high traffic
3. **Custom API**: Runs on limited infrastructure, prone to failures

Implementation strategy:
- Use separate circuit breakers for each service (isolate failures)
- Configure longer timeouts for HubSpot (known timeout issues)
- Implement aggressive retries with short delays for the custom API
- Use fallback strategies when circuits open (cached data, default values)

```python
# Production configuration example
salesforce_resilient = ResilientOperation(
    name="salesforce",
    circuit_config=CircuitBreakerConfig(failure_threshold=10, timeout=60),
    retry_config=RetryConfig(max_attempts=2, base_delay=5.0)  # Respect rate limits
)

hubspot_resilient = ResilientOperation(
    name="hubspot",
    circuit_config=CircuitBreakerConfig(failure_threshold=5, timeout=120),
    retry_config=RetryConfig(max_attempts=4, base_delay=2.0)
)

custom_api_resilient = ResilientOperation(
    name="custom_api",
    circuit_config=CircuitBreakerConfig(failure_threshold=3, timeout=30),
    retry_config=RetryConfig(max_attempts=5, base_delay=0.5)
)
```

### Learning Resources

- **Official Documentation**:
  - [Microsoft Azure - Circuit Breaker Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
  - [AWS - Implementing Health Checks](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/implement-the-circuit-breaker-pattern.html)

- **Libraries**:
  - [pybreaker](https://github.com/danielfm/pybreaker) - Production-ready circuit breaker for Python
  - [tenacity](https://github.com/jd/tenacity) - Robust retry library with extensive configuration options
  - [resilience4j](https://resilience4j.readme.io/) - Java library with excellent documentation applicable to understanding patterns

- **Engineering Blogs**:
  - [Netflix Tech Blog - Fault Tolerance in a High Volume, Distributed System](https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a)
  - [Uber Engineering - Reliable Reprocessing](https://eng.uber.com/reliable-reprocessing/)

### Difficulty Level

**Intermediate** - Requires understanding of exception handling, decorators, and state management. The concepts are straightforward but proper implementation requires careful consideration of edge cases and thread safety.

---

## 2. Performance Profiling and Optimization

### What is it?

Performance profiling is the process of measuring where your code spends time and resources. Optimization is the subsequent process of improving those areas. For data engineers, this typically involves:

- **CPU Profiling**: Finding computationally expensive operations
- **Memory Profiling**: Identifying memory leaks and excessive allocations
- **I/O Profiling**: Measuring database queries, file operations, and network calls
- **Concurrency Analysis**: Finding bottlenecks in parallel processing

### Why it matters for Data Engineers

Data engineering workloads are characterized by:
- Processing large datasets (millions/billions of rows)
- Complex transformations that can be CPU-bound
- High memory usage for aggregations and joins
- I/O-heavy operations (reading/writing to storage)

A 10% performance improvement in a daily batch job that runs for 10 hours saves 1 hour every day. Over a year, that's 365 hours of compute costs and faster data availability for stakeholders.

### Prerequisites

- Understanding of Python execution model
- Basic knowledge of time/space complexity
- Familiarity with Python data structures and their performance characteristics
- Understanding of memory management (stack vs heap, garbage collection)

### Implementation Example

```python
"""
Performance Profiling and Optimization for Data Engineering
==========================================================
Comprehensive profiling toolkit with practical optimization examples.
"""

import cProfile
import pstats
import io
import time
import tracemalloc
import functools
import sys
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Callable, Any, Optional, List, Dict
from collections import defaultdict
import gc


# =============================================================================
# PROFILING UTILITIES
# =============================================================================

@contextmanager
def timer(description: str = "Operation"):
    """Simple context manager for timing code blocks."""
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{description}: {elapsed:.4f} seconds")


def profile_function(func: Callable) -> Callable:
    """
    Decorator that profiles a function using cProfile.

    Usage:
        @profile_function
        def expensive_operation():
            ...
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()

        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()

            # Generate statistics
            stream = io.StringIO()
            stats = pstats.Stats(profiler, stream=stream)
            stats.sort_stats('cumulative')
            stats.print_stats(20)  # Top 20 functions
            print(f"\n=== Profile for {func.__name__} ===")
            print(stream.getvalue())

        return result
    return wrapper


@contextmanager
def memory_profile(description: str = "Memory"):
    """
    Context manager for tracking memory allocations.

    Usage:
        with memory_profile("Data loading"):
            df = load_large_dataset()
    """
    tracemalloc.start()
    gc.collect()  # Clean up before measurement

    yield

    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    print(f"{description}:")
    print(f"  Current memory: {current / 1024 / 1024:.2f} MB")
    print(f"  Peak memory: {peak / 1024 / 1024:.2f} MB")


@dataclass
class ProfileResult:
    """Container for profiling results."""
    function_name: str
    execution_time: float
    memory_current: int
    memory_peak: int
    call_count: int = 1


class PerformanceProfiler:
    """
    Comprehensive performance profiler for data pipelines.

    Usage:
        profiler = PerformanceProfiler()

        with profiler.profile("extract"):
            data = extract_data()

        with profiler.profile("transform"):
            transformed = transform_data(data)

        profiler.print_report()
    """

    def __init__(self):
        self.results: List[ProfileResult] = []
        self._call_counts: Dict[str, int] = defaultdict(int)

    @contextmanager
    def profile(self, name: str):
        """Profile a code block."""
        self._call_counts[name] += 1

        tracemalloc.start()
        gc.collect()
        start_time = time.perf_counter()

        yield

        elapsed = time.perf_counter() - start_time
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        self.results.append(ProfileResult(
            function_name=name,
            execution_time=elapsed,
            memory_current=current,
            memory_peak=peak,
            call_count=self._call_counts[name]
        ))

    def print_report(self):
        """Print a formatted performance report."""
        print("\n" + "=" * 70)
        print("PERFORMANCE REPORT")
        print("=" * 70)

        total_time = sum(r.execution_time for r in self.results)

        # Group by function name
        by_function: Dict[str, List[ProfileResult]] = defaultdict(list)
        for result in self.results:
            by_function[result.function_name].append(result)

        print(f"\n{'Function':<25} {'Calls':>6} {'Total Time':>12} {'Avg Time':>12} {'Peak Mem':>12}")
        print("-" * 70)

        for name, results in sorted(by_function.items(),
                                     key=lambda x: sum(r.execution_time for r in x[1]),
                                     reverse=True):
            total = sum(r.execution_time for r in results)
            avg = total / len(results)
            peak = max(r.memory_peak for r in results)
            pct = (total / total_time * 100) if total_time > 0 else 0

            print(f"{name:<25} {len(results):>6} {total:>10.4f}s {avg:>10.4f}s {peak/1024/1024:>10.2f}MB")

        print("-" * 70)
        print(f"{'TOTAL':<25} {'':<6} {total_time:>10.4f}s")
        print("=" * 70)


# =============================================================================
# OPTIMIZATION PATTERNS
# =============================================================================

class OptimizationExamples:
    """
    Demonstrates common optimization patterns for data engineering.
    """

    @staticmethod
    def example_1_generator_vs_list():
        """
        Memory optimization: Generators vs Lists

        For large datasets, generators process one item at a time,
        avoiding loading everything into memory.
        """
        print("\n=== Generator vs List Comparison ===")

        def process_items_list(n: int) -> list:
            """Memory-inefficient: stores all items in memory."""
            return [i ** 2 for i in range(n)]

        def process_items_generator(n: int):
            """Memory-efficient: yields one item at a time."""
            for i in range(n):
                yield i ** 2

        n = 1_000_000

        # List approach
        with memory_profile("List comprehension"):
            result_list = process_items_list(n)
            total = sum(result_list)

        # Generator approach
        with memory_profile("Generator"):
            result_gen = process_items_generator(n)
            total = sum(result_gen)

    @staticmethod
    def example_2_chunked_processing():
        """
        Processing large files in chunks to control memory usage.
        """
        print("\n=== Chunked Processing ===")

        def process_large_dataset_naive(data: List[dict]) -> List[dict]:
            """Naive approach: processes entire dataset at once."""
            results = []
            for record in data:
                # Simulate transformation
                transformed = {k: v.upper() if isinstance(v, str) else v
                              for k, v in record.items()}
                results.append(transformed)
            return results

        def process_large_dataset_chunked(data: List[dict], chunk_size: int = 10000):
            """
            Chunked approach: processes and yields results in batches.
            Useful for writing results incrementally.
            """
            for i in range(0, len(data), chunk_size):
                chunk = data[i:i + chunk_size]
                chunk_results = []
                for record in chunk:
                    transformed = {k: v.upper() if isinstance(v, str) else v
                                  for k, v in record.items()}
                    chunk_results.append(transformed)
                yield chunk_results
                # In real scenario: write chunk to disk/database here

        # Simulate large dataset
        large_data = [{"name": f"user_{i}", "value": i} for i in range(100_000)]

        with timer("Naive processing"):
            _ = process_large_dataset_naive(large_data)

        with timer("Chunked processing"):
            for chunk in process_large_dataset_chunked(large_data, chunk_size=10000):
                pass  # Would write to output here

    @staticmethod
    def example_3_string_concatenation():
        """
        String optimization: join() vs concatenation.
        """
        print("\n=== String Concatenation ===")

        n = 100_000

        # Slow: creates new string object each iteration
        with timer("Concatenation with +"):
            result = ""
            for i in range(n):
                result += str(i)

        # Fast: builds list, joins once
        with timer("Join method"):
            parts = [str(i) for i in range(n)]
            result = "".join(parts)

    @staticmethod
    def example_4_lookup_optimization():
        """
        Data structure optimization: List vs Set vs Dict for lookups.
        """
        print("\n=== Lookup Optimization ===")

        n = 100_000
        search_items = list(range(0, n, 100))  # Items to search for

        # Create data structures
        data_list = list(range(n))
        data_set = set(range(n))
        data_dict = {i: True for i in range(n)}

        # List lookup: O(n) per lookup
        with timer(f"List lookup ({len(search_items)} searches)"):
            found = [item for item in search_items if item in data_list]

        # Set lookup: O(1) per lookup
        with timer(f"Set lookup ({len(search_items)} searches)"):
            found = [item for item in search_items if item in data_set]

        # Dict lookup: O(1) per lookup
        with timer(f"Dict lookup ({len(search_items)} searches)"):
            found = [item for item in search_items if item in data_dict]

    @staticmethod
    def example_5_caching_expensive_operations():
        """
        Caching repeated expensive computations.
        """
        print("\n=== Caching with functools.lru_cache ===")

        def expensive_computation(n: int) -> int:
            """Simulates an expensive computation."""
            time.sleep(0.01)  # Simulate I/O or complex calculation
            return sum(i ** 2 for i in range(n))

        @functools.lru_cache(maxsize=128)
        def cached_computation(n: int) -> int:
            """Same computation with caching."""
            time.sleep(0.01)
            return sum(i ** 2 for i in range(n))

        test_values = [100, 200, 100, 300, 200, 100, 400, 100]  # Note: repeated values

        with timer("Without cache"):
            results = [expensive_computation(v) for v in test_values]

        with timer("With cache"):
            results = [cached_computation(v) for v in test_values]

        print(f"Cache info: {cached_computation.cache_info()}")


# =============================================================================
# PRACTICAL EXAMPLE: PROFILING A DATA PIPELINE
# =============================================================================

def simulate_data_pipeline():
    """Demonstrates profiling a complete data pipeline."""

    print("\n" + "=" * 70)
    print("DATA PIPELINE PROFILING EXAMPLE")
    print("=" * 70)

    profiler = PerformanceProfiler()

    # Simulate extract phase
    with profiler.profile("extract_from_source"):
        time.sleep(0.1)  # Simulate API call
        raw_data = [{"id": i, "name": f"item_{i}", "value": i * 1.5}
                    for i in range(50000)]

    # Simulate transform phase
    with profiler.profile("transform_clean"):
        cleaned = [{k: v for k, v in record.items() if v is not None}
                   for record in raw_data]

    with profiler.profile("transform_enrich"):
        enriched = [{**record, "category": "A" if record["value"] > 25000 else "B"}
                    for record in cleaned]

    with profiler.profile("transform_aggregate"):
        aggregated = defaultdict(list)
        for record in enriched:
            aggregated[record["category"]].append(record["value"])
        summary = {k: sum(v) / len(v) for k, v in aggregated.items()}

    # Simulate load phase
    with profiler.profile("load_to_destination"):
        time.sleep(0.05)  # Simulate database write
        # In reality: write to database/file

    profiler.print_report()
    return summary


# Example usage
if __name__ == "__main__":
    # Run optimization examples
    examples = OptimizationExamples()
    examples.example_1_generator_vs_list()
    examples.example_4_lookup_optimization()
    examples.example_5_caching_expensive_operations()

    # Profile a data pipeline
    result = simulate_data_pipeline()
    print(f"\nPipeline result: {result}")
```

### Real-world Application

**Scenario: Optimizing a Daily Batch Processing Job**

A data engineering team has a daily job that processes 100 million records from a data lake. The job takes 8 hours to complete, and stakeholders want data available by 6 AM.

Profiling revealed:
1. **40% of time**: Reading data from S3 (I/O bound)
2. **35% of time**: String parsing and date conversions (CPU bound)
3. **15% of time**: Aggregations requiring shuffles (Memory bound)
4. **10% of time**: Writing results to the data warehouse

Optimizations applied:
1. **Parallel S3 reads**: Used multi-threaded readers with appropriate partition sizes
2. **Vectorized string operations**: Replaced row-by-row processing with pandas/polars vectorized operations
3. **Memory-efficient aggregations**: Used incremental aggregation instead of full dataset groupby
4. **Batch inserts**: Increased batch size for warehouse writes, reduced connection overhead

Result: Job completion time reduced from 8 hours to 2.5 hours.

### Learning Resources

- **Official Documentation**:
  - [Python cProfile documentation](https://docs.python.org/3/library/profile.html)
  - [Python tracemalloc documentation](https://docs.python.org/3/library/tracemalloc.html)
  - [Python Performance Tips](https://wiki.python.org/moin/PythonSpeed/PerformanceTips)

- **Tools**:
  - [py-spy](https://github.com/benfred/py-spy) - Sampling profiler for Python (low overhead)
  - [memory_profiler](https://github.com/pythonprofilers/memory_profiler) - Line-by-line memory profiling
  - [Scalene](https://github.com/plasma-umass/scalene) - High-performance CPU, GPU, and memory profiler
  - [line_profiler](https://github.com/pyutils/line_profiler) - Line-by-line time profiling

- **Engineering Blogs**:
  - [Instagram Engineering - Python Memory Management](https://instagram-engineering.com/dismissing-python-garbage-collection-at-instagram-4dca40b29172)
  - [Dropbox Tech Blog - Optimizing Python](https://dropbox.tech/infrastructure/optimizing-web-servers-for-high-throughput-and-low-latency)

### Difficulty Level

**Intermediate to Advanced** - Basic profiling is straightforward, but interpreting results and implementing effective optimizations requires experience and deep understanding of Python internals.

---

## 3. Security Best Practices

### What is it?

Security in data engineering encompasses protecting sensitive data throughout its lifecycle and ensuring that systems are resilient to attacks. Key areas include:

- **Secrets Management**: Securely storing and accessing credentials, API keys, and certificates
- **Authentication & Authorization**: Verifying identity and controlling access to resources
- **Data Protection**: Encrypting data at rest and in transit
- **Audit Logging**: Tracking access and changes for compliance and forensics

### Why it matters for Data Engineers

Data engineers often have access to:
- Database credentials for production systems
- API keys for third-party services (payment processors, analytics platforms)
- PII (Personally Identifiable Information) of users
- Sensitive business data (financial records, trade secrets)

A single exposed credential can lead to data breaches, regulatory fines (GDPR, HIPAA), and loss of customer trust. The 2024 MOVEit breach demonstrated how a single vulnerability in a data transfer tool affected thousands of organizations.

### Prerequisites

- Understanding of environment variables
- Basic knowledge of encryption (symmetric vs asymmetric)
- Familiarity with HTTP authentication mechanisms
- Understanding of the principle of least privilege

### Implementation Example

```python
"""
Security Best Practices for Data Engineering
============================================
Patterns for secrets management, authentication, and secure data handling.
"""

import os
import hashlib
import hmac
import base64
import json
import logging
from dataclasses import dataclass
from typing import Optional, Dict, Any
from functools import wraps
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
import secrets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# SECRETS MANAGEMENT
# =============================================================================

class SecretsProvider(ABC):
    """Abstract base class for secrets providers."""

    @abstractmethod
    def get_secret(self, key: str) -> Optional[str]:
        """Retrieve a secret by key."""
        pass

    @abstractmethod
    def set_secret(self, key: str, value: str) -> bool:
        """Store a secret."""
        pass


class EnvironmentSecretsProvider(SecretsProvider):
    """
    Secrets provider using environment variables.
    Suitable for: Local development, containerized environments.

    Usage:
        provider = EnvironmentSecretsProvider(prefix="MYAPP_")
        db_password = provider.get_secret("DB_PASSWORD")
        # Looks for: MYAPP_DB_PASSWORD environment variable
    """

    def __init__(self, prefix: str = ""):
        self.prefix = prefix

    def get_secret(self, key: str) -> Optional[str]:
        env_key = f"{self.prefix}{key}"
        value = os.environ.get(env_key)
        if value is None:
            logger.warning(f"Secret not found: {env_key}")
        return value

    def set_secret(self, key: str, value: str) -> bool:
        """Note: Only sets for current process, not persistent."""
        os.environ[f"{self.prefix}{key}"] = value
        return True


class VaultSecretsProvider(SecretsProvider):
    """
    Secrets provider for HashiCorp Vault.
    Suitable for: Production environments with centralized secrets management.

    Usage:
        provider = VaultSecretsProvider(
            vault_addr="https://vault.example.com",
            token=os.environ.get("VAULT_TOKEN"),
            mount_point="secret"
        )
        api_key = provider.get_secret("external_api/api_key")
    """

    def __init__(
        self,
        vault_addr: str,
        token: str,
        mount_point: str = "secret",
        namespace: Optional[str] = None
    ):
        self.vault_addr = vault_addr
        self.token = token
        self.mount_point = mount_point
        self.namespace = namespace

        # In production, you would use the hvac library:
        # import hvac
        # self.client = hvac.Client(url=vault_addr, token=token, namespace=namespace)

    def get_secret(self, key: str) -> Optional[str]:
        """
        Retrieve secret from Vault.

        In production, this would be:
        secret = self.client.secrets.kv.v2.read_secret_version(
            path=key,
            mount_point=self.mount_point
        )
        return secret['data']['data']['value']
        """
        logger.info(f"Would fetch secret from Vault: {self.mount_point}/{key}")
        # Placeholder for demonstration
        return None

    def set_secret(self, key: str, value: str) -> bool:
        """Store secret in Vault."""
        logger.info(f"Would store secret in Vault: {self.mount_point}/{key}")
        return True


class SecretsManager:
    """
    Unified secrets manager with caching and fallback providers.

    Usage:
        manager = SecretsManager(
            providers=[
                VaultSecretsProvider(...),      # Primary: production secrets
                EnvironmentSecretsProvider(),  # Fallback: local development
            ],
            cache_ttl=300  # Cache secrets for 5 minutes
        )

        db_password = manager.get_secret("DB_PASSWORD")
    """

    def __init__(
        self,
        providers: list[SecretsProvider],
        cache_ttl: int = 300
    ):
        self.providers = providers
        self.cache_ttl = cache_ttl
        self._cache: Dict[str, tuple[str, datetime]] = {}

    def get_secret(self, key: str, use_cache: bool = True) -> Optional[str]:
        """
        Get secret with caching and fallback to multiple providers.
        """
        # Check cache first
        if use_cache and key in self._cache:
            value, cached_at = self._cache[key]
            if datetime.now() - cached_at < timedelta(seconds=self.cache_ttl):
                return value
            else:
                del self._cache[key]

        # Try each provider in order
        for provider in self.providers:
            value = provider.get_secret(key)
            if value is not None:
                self._cache[key] = (value, datetime.now())
                return value

        return None

    def clear_cache(self):
        """Clear the secrets cache."""
        self._cache.clear()


# =============================================================================
# AUTHENTICATION PATTERNS
# =============================================================================

@dataclass
class APICredentials:
    """Container for API credentials."""
    api_key: str
    api_secret: str

    def __repr__(self):
        """Prevent accidental logging of secrets."""
        return f"APICredentials(api_key='***', api_secret='***')"


class HMACAuthenticator:
    """
    HMAC-based request signing for API authentication.
    Used by: AWS Signature, many financial APIs.

    Usage:
        auth = HMACAuthenticator(api_key="key", api_secret="secret")
        signature = auth.sign_request("POST", "/api/data", payload)
        headers = {"X-API-Key": auth.api_key, "X-Signature": signature}
    """

    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self._api_secret = api_secret.encode('utf-8')

    def sign_request(
        self,
        method: str,
        path: str,
        body: Optional[str] = None,
        timestamp: Optional[str] = None
    ) -> str:
        """
        Generate HMAC signature for a request.
        """
        timestamp = timestamp or datetime.utcnow().isoformat()

        # Construct the string to sign
        string_to_sign = f"{method}\n{path}\n{timestamp}\n{body or ''}"

        # Generate HMAC-SHA256 signature
        signature = hmac.new(
            self._api_secret,
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).digest()

        return base64.b64encode(signature).decode('utf-8')

    def verify_signature(
        self,
        signature: str,
        method: str,
        path: str,
        body: Optional[str] = None,
        timestamp: Optional[str] = None
    ) -> bool:
        """Verify a request signature."""
        expected = self.sign_request(method, path, body, timestamp)
        return hmac.compare_digest(signature, expected)


class TokenBucket:
    """
    Rate limiter using token bucket algorithm.
    Prevents credential stuffing and brute force attacks.

    Usage:
        limiter = TokenBucket(rate=10, capacity=100)  # 10 requests/second, burst of 100

        if limiter.consume():
            process_request()
        else:
            raise RateLimitExceeded()
    """

    def __init__(self, rate: float, capacity: int):
        self.rate = rate  # tokens per second
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = datetime.now()

    def consume(self, tokens: int = 1) -> bool:
        """Try to consume tokens, returns True if successful."""
        self._refill()

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    def _refill(self):
        """Refill tokens based on time elapsed."""
        now = datetime.now()
        elapsed = (now - self.last_update).total_seconds()
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_update = now


# =============================================================================
# DATA PROTECTION
# =============================================================================

class DataMasker:
    """
    Utility for masking sensitive data in logs and outputs.

    Usage:
        masker = DataMasker()
        safe_data = masker.mask_dict(user_record)
        logger.info(f"Processing user: {safe_data}")
    """

    SENSITIVE_PATTERNS = [
        'password', 'secret', 'token', 'api_key', 'apikey',
        'authorization', 'auth', 'credential', 'ssn',
        'social_security', 'credit_card', 'card_number'
    ]

    def __init__(self, mask_char: str = '*', visible_chars: int = 4):
        self.mask_char = mask_char
        self.visible_chars = visible_chars

    def mask_value(self, value: str, keep_end: bool = True) -> str:
        """Mask a sensitive value, optionally keeping last N characters."""
        if len(value) <= self.visible_chars:
            return self.mask_char * len(value)

        if keep_end:
            return self.mask_char * (len(value) - self.visible_chars) + value[-self.visible_chars:]
        return value[:self.visible_chars] + self.mask_char * (len(value) - self.visible_chars)

    def mask_dict(self, data: Dict[str, Any], depth: int = 0) -> Dict[str, Any]:
        """Recursively mask sensitive values in a dictionary."""
        if depth > 10:  # Prevent infinite recursion
            return {"_masked": "max_depth_exceeded"}

        masked = {}
        for key, value in data.items():
            key_lower = key.lower()
            is_sensitive = any(pattern in key_lower for pattern in self.SENSITIVE_PATTERNS)

            if isinstance(value, dict):
                masked[key] = self.mask_dict(value, depth + 1)
            elif isinstance(value, str) and is_sensitive:
                masked[key] = self.mask_value(value)
            else:
                masked[key] = value

        return masked


def secure_log(func):
    """
    Decorator that masks sensitive data in function arguments before logging.
    """
    masker = DataMasker()

    @wraps(func)
    def wrapper(*args, **kwargs):
        # Mask kwargs for logging
        safe_kwargs = {k: masker.mask_value(str(v)) if any(
            p in k.lower() for p in DataMasker.SENSITIVE_PATTERNS
        ) else v for k, v in kwargs.items()}

        logger.info(f"Calling {func.__name__} with kwargs: {safe_kwargs}")
        return func(*args, **kwargs)

    return wrapper


# =============================================================================
# AUDIT LOGGING
# =============================================================================

@dataclass
class AuditEvent:
    """Represents an auditable event."""
    timestamp: datetime
    action: str
    actor: str
    resource: str
    resource_id: Optional[str]
    status: str
    details: Dict[str, Any]
    ip_address: Optional[str] = None


class AuditLogger:
    """
    Structured audit logging for compliance and security monitoring.

    Usage:
        audit = AuditLogger(service_name="data-pipeline")

        audit.log_access(
            actor="user@example.com",
            resource="customer_data",
            resource_id="table_123",
            status="success"
        )
    """

    def __init__(self, service_name: str):
        self.service_name = service_name
        self.logger = logging.getLogger(f"audit.{service_name}")
        self.logger.setLevel(logging.INFO)

    def _emit(self, event: AuditEvent):
        """Emit an audit event."""
        log_entry = {
            "timestamp": event.timestamp.isoformat(),
            "service": self.service_name,
            "action": event.action,
            "actor": event.actor,
            "resource": event.resource,
            "resource_id": event.resource_id,
            "status": event.status,
            "details": event.details,
            "ip_address": event.ip_address
        }
        self.logger.info(json.dumps(log_entry))

    def log_access(
        self,
        actor: str,
        resource: str,
        resource_id: Optional[str] = None,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        """Log a data access event."""
        self._emit(AuditEvent(
            timestamp=datetime.now(),
            action="access",
            actor=actor,
            resource=resource,
            resource_id=resource_id,
            status=status,
            details=details or {},
            ip_address=ip_address
        ))

    def log_modification(
        self,
        actor: str,
        resource: str,
        resource_id: str,
        operation: str,  # create, update, delete
        status: str = "success",
        details: Optional[Dict[str, Any]] = None
    ):
        """Log a data modification event."""
        self._emit(AuditEvent(
            timestamp=datetime.now(),
            action=f"modify_{operation}",
            actor=actor,
            resource=resource,
            resource_id=resource_id,
            status=status,
            details=details or {}
        ))


# =============================================================================
# PRACTICAL EXAMPLE: SECURE DATA PIPELINE
# =============================================================================

class SecureDataPipeline:
    """Example of a data pipeline with security best practices."""

    def __init__(self, secrets_manager: SecretsManager):
        self.secrets = secrets_manager
        self.masker = DataMasker()
        self.audit = AuditLogger("secure-pipeline")
        self._db_connection = None

    def connect_to_database(self, actor: str):
        """
        Securely connect to database using managed secrets.
        """
        # Retrieve credentials from secrets manager (not hardcoded!)
        db_host = self.secrets.get_secret("DB_HOST")
        db_user = self.secrets.get_secret("DB_USER")
        db_password = self.secrets.get_secret("DB_PASSWORD")

        if not all([db_host, db_user, db_password]):
            self.audit.log_access(
                actor=actor,
                resource="database",
                status="failed",
                details={"reason": "missing_credentials"}
            )
            raise ValueError("Database credentials not configured")

        # In production: establish actual connection
        # self._db_connection = psycopg2.connect(
        #     host=db_host, user=db_user, password=db_password
        # )

        self.audit.log_access(
            actor=actor,
            resource="database",
            status="success",
            details={"host": db_host, "user": db_user}  # Never log password!
        )

        logger.info(f"Connected to database as {db_user}@{db_host}")
        return True

    @secure_log
    def process_user_data(self, user_id: str, api_key: str, password: str):
        """
        Process user data with automatic sensitive data masking in logs.
        The @secure_log decorator masks api_key and password in logs.
        """
        # Processing logic here
        return {"status": "processed", "user_id": user_id}


# Example usage
if __name__ == "__main__":
    # Set up secrets manager with fallback providers
    secrets_manager = SecretsManager(providers=[
        EnvironmentSecretsProvider(prefix="PIPELINE_"),
    ])

    # Set some example secrets (in production, these come from environment/vault)
    os.environ["PIPELINE_DB_HOST"] = "localhost"
    os.environ["PIPELINE_DB_USER"] = "pipeline_user"
    os.environ["PIPELINE_DB_PASSWORD"] = "super_secret_password_123"

    # Create secure pipeline
    pipeline = SecureDataPipeline(secrets_manager)

    # Connect to database
    pipeline.connect_to_database(actor="data_engineer@company.com")

    # Process with automatic masking
    pipeline.process_user_data(
        user_id="12345",
        api_key="sk-abc123def456",
        password="user_password"
    )

    # Demonstrate data masking
    masker = DataMasker()
    sensitive_record = {
        "user_id": "12345",
        "email": "user@example.com",
        "password": "secret123",
        "api_key": "sk-live-abc123def456ghi789",
        "nested": {
            "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        }
    }

    print("\nOriginal record:")
    print(sensitive_record)
    print("\nMasked record (safe to log):")
    print(masker.mask_dict(sensitive_record))
```

### Real-world Application

**Scenario: Multi-Tenant Data Platform**

A data platform serves multiple customers, each with their own databases and API credentials. Security requirements include:

1. **Secrets Management**: Each tenant has unique database credentials stored in HashiCorp Vault
2. **Access Control**: Data engineers can only access tenants assigned to them
3. **Audit Trail**: All data access must be logged for SOC 2 compliance
4. **Data Isolation**: One tenant's data should never be visible to another

Implementation:
- Vault paths: `/secret/tenants/{tenant_id}/database`
- Short-lived database credentials rotated every 24 hours
- Audit logs shipped to immutable storage (S3 with object lock)
- Row-level security in database with tenant_id filters

### Learning Resources

- **Official Documentation**:
  - [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
  - [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/)
  - [OWASP Security Cheat Sheets](https://cheatsheetseries.owasp.org/)

- **Libraries**:
  - [hvac](https://github.com/hvac/hvac) - HashiCorp Vault client for Python
  - [boto3 Secrets Manager](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/secretsmanager.html)
  - [python-dotenv](https://github.com/theskumar/python-dotenv) - Environment variable management

- **Engineering Blogs**:
  - [Netflix Tech Blog - Credential Management](https://netflixtechblog.com/netflix-secrets-management-with-vault-4c6a9bc3f1d0)
  - [Spotify Engineering - Secrets at Scale](https://engineering.atspotify.com/2024/03/managing-secrets-at-scale/)

### Difficulty Level

**Intermediate** - The concepts are straightforward, but implementing them correctly requires attention to detail. Common mistakes include logging secrets, hardcoding credentials, and improper error handling that leaks sensitive information.

---

## 4. Testing Strategies for Data Systems

### What is it?

Testing data systems involves validating both code correctness and data quality. Unlike traditional software testing, data testing must also verify:

- **Data Quality**: Accuracy, completeness, consistency, timeliness
- **Schema Evolution**: Changes don't break downstream consumers
- **Performance**: Processing completes within SLAs
- **Idempotency**: Re-running produces consistent results

Key testing types for data systems:
- **Unit Tests**: Test individual functions and transformations
- **Integration Tests**: Test interactions with databases, APIs, and file systems
- **Data Quality Tests**: Validate data against business rules
- **Contract Tests**: Ensure schema compatibility between producers and consumers

### Why it matters for Data Engineers

Data bugs are expensive because they:
- Propagate downstream, affecting multiple reports and ML models
- Are often discovered late (when stakeholders notice incorrect numbers)
- Require costly backfills to correct
- Can lead to poor business decisions based on faulty data

The "garbage in, garbage out" principle means that catching issues early through testing is far cheaper than fixing them in production.

### Prerequisites

- Familiarity with pytest or unittest
- Understanding of mocking and fixtures
- Basic knowledge of SQL and data transformations
- Understanding of data quality dimensions (accuracy, completeness, etc.)

### Implementation Example

```python
"""
Testing Strategies for Data Systems
===================================
Comprehensive testing patterns for data pipelines and transformations.
"""

import pytest
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime, date
from decimal import Decimal
from abc import ABC, abstractmethod
import json


# =============================================================================
# DATA QUALITY VALIDATION FRAMEWORK
# =============================================================================

@dataclass
class ValidationResult:
    """Result of a data validation check."""
    check_name: str
    passed: bool
    message: str
    severity: str  # "error", "warning", "info"
    details: Optional[Dict[str, Any]] = None


class DataValidator(ABC):
    """Abstract base class for data validators."""

    @abstractmethod
    def validate(self, data: Any) -> ValidationResult:
        pass


class NotNullValidator(DataValidator):
    """Validates that a field is not null/None."""

    def __init__(self, field_name: str, severity: str = "error"):
        self.field_name = field_name
        self.severity = severity

    def validate(self, record: Dict[str, Any]) -> ValidationResult:
        value = record.get(self.field_name)
        passed = value is not None
        return ValidationResult(
            check_name=f"not_null_{self.field_name}",
            passed=passed,
            message=f"Field '{self.field_name}' is {'not null' if passed else 'null'}",
            severity=self.severity
        )


class RangeValidator(DataValidator):
    """Validates that a numeric field is within a range."""

    def __init__(
        self,
        field_name: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        severity: str = "error"
    ):
        self.field_name = field_name
        self.min_value = min_value
        self.max_value = max_value
        self.severity = severity

    def validate(self, record: Dict[str, Any]) -> ValidationResult:
        value = record.get(self.field_name)

        if value is None:
            return ValidationResult(
                check_name=f"range_{self.field_name}",
                passed=True,  # Null check is separate concern
                message=f"Field '{self.field_name}' is null, skipping range check",
                severity="info"
            )

        in_range = True
        if self.min_value is not None and value < self.min_value:
            in_range = False
        if self.max_value is not None and value > self.max_value:
            in_range = False

        return ValidationResult(
            check_name=f"range_{self.field_name}",
            passed=in_range,
            message=f"Field '{self.field_name}' value {value} is {'within' if in_range else 'outside'} range [{self.min_value}, {self.max_value}]",
            severity=self.severity,
            details={"value": value, "min": self.min_value, "max": self.max_value}
        )


class UniqueValidator(DataValidator):
    """Validates that values in a field are unique across records."""

    def __init__(self, field_name: str, severity: str = "error"):
        self.field_name = field_name
        self.severity = severity
        self._seen_values = set()

    def validate(self, record: Dict[str, Any]) -> ValidationResult:
        value = record.get(self.field_name)

        if value in self._seen_values:
            return ValidationResult(
                check_name=f"unique_{self.field_name}",
                passed=False,
                message=f"Duplicate value '{value}' in field '{self.field_name}'",
                severity=self.severity,
                details={"duplicate_value": value}
            )

        self._seen_values.add(value)
        return ValidationResult(
            check_name=f"unique_{self.field_name}",
            passed=True,
            message=f"Value '{value}' is unique",
            severity="info"
        )

    def reset(self):
        """Reset seen values for new validation run."""
        self._seen_values.clear()


class ReferentialIntegrityValidator(DataValidator):
    """Validates that foreign key values exist in reference data."""

    def __init__(
        self,
        field_name: str,
        reference_values: set,
        severity: str = "error"
    ):
        self.field_name = field_name
        self.reference_values = reference_values
        self.severity = severity

    def validate(self, record: Dict[str, Any]) -> ValidationResult:
        value = record.get(self.field_name)
        exists = value in self.reference_values

        return ValidationResult(
            check_name=f"referential_integrity_{self.field_name}",
            passed=exists,
            message=f"Value '{value}' {'exists' if exists else 'does not exist'} in reference data",
            severity=self.severity
        )


class DataQualityChecker:
    """
    Orchestrates multiple data quality validators.

    Usage:
        checker = DataQualityChecker()
        checker.add_validator(NotNullValidator("id"))
        checker.add_validator(RangeValidator("amount", min_value=0))

        results = checker.validate_dataset(records)
        checker.print_report(results)
    """

    def __init__(self):
        self.validators: List[DataValidator] = []

    def add_validator(self, validator: DataValidator):
        self.validators.append(validator)
        return self  # Enable chaining

    def validate_record(self, record: Dict[str, Any]) -> List[ValidationResult]:
        return [validator.validate(record) for validator in self.validators]

    def validate_dataset(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate all records and aggregate results."""
        all_results = []
        failed_records = []

        for i, record in enumerate(records):
            record_results = self.validate_record(record)
            all_results.extend(record_results)

            errors = [r for r in record_results if not r.passed and r.severity == "error"]
            if errors:
                failed_records.append({
                    "record_index": i,
                    "record": record,
                    "errors": [r.message for r in errors]
                })

        # Aggregate statistics
        total_checks = len(all_results)
        passed_checks = sum(1 for r in all_results if r.passed)

        return {
            "total_records": len(records),
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "failed_checks": total_checks - passed_checks,
            "pass_rate": passed_checks / total_checks if total_checks > 0 else 0,
            "failed_records": failed_records,
            "all_results": all_results
        }

    def print_report(self, results: Dict[str, Any]):
        """Print a formatted validation report."""
        print("\n" + "=" * 60)
        print("DATA QUALITY REPORT")
        print("=" * 60)
        print(f"Total Records: {results['total_records']}")
        print(f"Total Checks: {results['total_checks']}")
        print(f"Passed: {results['passed_checks']}")
        print(f"Failed: {results['failed_checks']}")
        print(f"Pass Rate: {results['pass_rate']:.2%}")

        if results['failed_records']:
            print(f"\nFailed Records ({len(results['failed_records'])}):")
            for failed in results['failed_records'][:5]:  # Show first 5
                print(f"  Record {failed['record_index']}: {failed['errors']}")


# =============================================================================
# TEST FIXTURES AND FACTORIES
# =============================================================================

class DataFactory:
    """
    Factory for creating test data with controlled variations.

    Usage:
        factory = DataFactory()
        valid_record = factory.create_order()
        invalid_record = factory.create_order(amount=-100)  # Override for edge case
    """

    @staticmethod
    def create_order(
        order_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        amount: Optional[float] = None,
        status: Optional[str] = None,
        created_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Create a test order record with sensible defaults."""
        return {
            "order_id": order_id or f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "customer_id": customer_id or "CUST-001",
            "amount": amount if amount is not None else 99.99,
            "status": status or "pending",
            "created_at": created_at or datetime.now()
        }

    @staticmethod
    def create_order_batch(count: int, **overrides) -> List[Dict[str, Any]]:
        """Create multiple order records."""
        return [
            DataFactory.create_order(
                order_id=f"ORD-{i:06d}",
                **overrides
            )
            for i in range(count)
        ]


# =============================================================================
# PYTEST TEST EXAMPLES
# =============================================================================

class TestDataTransformations:
    """Example test class for data transformation functions."""

    def test_normalize_customer_name_basic(self):
        """Test basic name normalization."""
        # Arrange
        input_name = "  john DOE  "
        expected = "John Doe"

        # Act
        result = normalize_customer_name(input_name)

        # Assert
        assert result == expected

    def test_normalize_customer_name_empty(self):
        """Test empty string handling."""
        assert normalize_customer_name("") == ""
        assert normalize_customer_name(None) is None

    def test_calculate_order_total_with_discount(self):
        """Test order total calculation with discount."""
        # Arrange
        items = [
            {"price": 100.00, "quantity": 2},
            {"price": 50.00, "quantity": 1}
        ]
        discount_percent = 10

        # Act
        total = calculate_order_total(items, discount_percent)

        # Assert
        expected = (100 * 2 + 50 * 1) * 0.9  # 225.00
        assert total == Decimal("225.00")

    def test_calculate_order_total_no_negative(self):
        """Test that discounts cannot make total negative."""
        items = [{"price": 10.00, "quantity": 1}]

        # Even with 200% discount, total should be 0, not negative
        total = calculate_order_total(items, discount_percent=200)
        assert total >= 0


class TestDataQuality:
    """Example test class for data quality validations."""

    @pytest.fixture
    def valid_orders(self):
        """Fixture providing valid test orders."""
        return DataFactory.create_order_batch(10)

    @pytest.fixture
    def quality_checker(self):
        """Fixture providing configured quality checker."""
        checker = DataQualityChecker()
        checker.add_validator(NotNullValidator("order_id"))
        checker.add_validator(NotNullValidator("customer_id"))
        checker.add_validator(RangeValidator("amount", min_value=0, max_value=10000))
        return checker

    def test_valid_orders_pass_quality_checks(self, valid_orders, quality_checker):
        """All valid orders should pass quality checks."""
        results = quality_checker.validate_dataset(valid_orders)
        assert results['pass_rate'] == 1.0

    def test_negative_amount_fails_validation(self, quality_checker):
        """Orders with negative amounts should fail."""
        invalid_order = DataFactory.create_order(amount=-50.00)

        results = quality_checker.validate_dataset([invalid_order])

        assert results['failed_checks'] > 0
        assert any('range_amount' in r.check_name
                  for r in results['all_results'] if not r.passed)

    def test_null_customer_fails_validation(self, quality_checker):
        """Orders with null customer_id should fail."""
        invalid_order = DataFactory.create_order()
        invalid_order['customer_id'] = None

        results = quality_checker.validate_dataset([invalid_order])

        failed = [r for r in results['all_results']
                 if not r.passed and 'customer_id' in r.check_name]
        assert len(failed) > 0


class TestDataPipelineIntegration:
    """Integration tests for complete pipeline flows."""

    @pytest.fixture
    def mock_database(self, mocker):
        """Mock database connection for integration tests."""
        mock_conn = mocker.MagicMock()
        mock_conn.execute.return_value.fetchall.return_value = [
            (1, "Product A", 10.00),
            (2, "Product B", 20.00),
        ]
        return mock_conn

    def test_extract_transform_load_pipeline(self, mock_database):
        """Test complete ETL pipeline with mocked dependencies."""
        # This test verifies the pipeline orchestration
        # without hitting real external systems

        # Arrange
        pipeline = DataPipeline(database=mock_database)

        # Act
        result = pipeline.run(
            source_table="products",
            dest_table="products_transformed"
        )

        # Assert
        assert result['status'] == 'success'
        assert result['records_processed'] == 2


# =============================================================================
# CONTRACT TESTING FOR SCHEMAS
# =============================================================================

@dataclass
class SchemaField:
    """Definition of a schema field."""
    name: str
    field_type: type
    nullable: bool = True
    constraints: Optional[Dict[str, Any]] = None


class SchemaContract:
    """
    Schema contract for validating data structure compatibility.

    Usage:
        contract = SchemaContract("orders_v1")
        contract.add_field(SchemaField("order_id", str, nullable=False))
        contract.add_field(SchemaField("amount", float, nullable=False))

        is_valid = contract.validate_record(order_data)
    """

    def __init__(self, name: str, version: str = "1.0"):
        self.name = name
        self.version = version
        self.fields: Dict[str, SchemaField] = {}

    def add_field(self, field: SchemaField):
        self.fields[field.name] = field
        return self

    def validate_record(self, record: Dict[str, Any]) -> List[str]:
        """Validate a record against the schema contract."""
        errors = []

        for field_name, field_def in self.fields.items():
            value = record.get(field_name)

            # Check required fields
            if value is None and not field_def.nullable:
                errors.append(f"Required field '{field_name}' is missing or null")
                continue

            # Check type (if value present)
            if value is not None and not isinstance(value, field_def.field_type):
                errors.append(
                    f"Field '{field_name}' has wrong type: "
                    f"expected {field_def.field_type.__name__}, "
                    f"got {type(value).__name__}"
                )

        return errors

    def is_compatible_with(self, other: 'SchemaContract') -> tuple[bool, List[str]]:
        """
        Check if this schema is backward compatible with another.
        Used for schema evolution validation.
        """
        breaking_changes = []

        # Check for removed required fields
        for field_name, field_def in other.fields.items():
            if field_name not in self.fields and not field_def.nullable:
                breaking_changes.append(
                    f"Required field '{field_name}' was removed"
                )

        # Check for type changes
        for field_name, field_def in self.fields.items():
            if field_name in other.fields:
                other_field = other.fields[field_name]
                if field_def.field_type != other_field.field_type:
                    breaking_changes.append(
                        f"Field '{field_name}' type changed from "
                        f"{other_field.field_type.__name__} to {field_def.field_type.__name__}"
                    )

        return len(breaking_changes) == 0, breaking_changes


# =============================================================================
# HELPER FUNCTIONS (Referenced in tests)
# =============================================================================

def normalize_customer_name(name: Optional[str]) -> Optional[str]:
    """Normalize a customer name."""
    if name is None:
        return None
    return name.strip().title()


def calculate_order_total(
    items: List[Dict[str, Any]],
    discount_percent: float = 0
) -> Decimal:
    """Calculate order total with optional discount."""
    subtotal = sum(
        Decimal(str(item['price'])) * item['quantity']
        for item in items
    )
    discount_multiplier = max(0, 1 - discount_percent / 100)
    total = subtotal * Decimal(str(discount_multiplier))
    return max(Decimal('0'), total.quantize(Decimal('0.01')))


class DataPipeline:
    """Simple data pipeline for testing demonstration."""

    def __init__(self, database):
        self.database = database

    def run(self, source_table: str, dest_table: str) -> Dict[str, Any]:
        """Run the pipeline."""
        # Extract
        rows = self.database.execute(f"SELECT * FROM {source_table}").fetchall()

        # Transform (example: add processed_at timestamp)
        transformed = [(*row, datetime.now()) for row in rows]

        # Load (simulated)
        return {
            'status': 'success',
            'records_processed': len(transformed)
        }


# Example usage
if __name__ == "__main__":
    # Demonstrate data quality checking
    factory = DataFactory()

    # Create mixed dataset with valid and invalid records
    test_data = [
        factory.create_order(order_id="ORD-001", amount=100.00),
        factory.create_order(order_id="ORD-002", amount=-50.00),  # Invalid: negative
        factory.create_order(order_id="ORD-003", customer_id=None),  # Invalid: null customer
        factory.create_order(order_id="ORD-004", amount=15000.00),  # Invalid: exceeds max
    ]

    # Configure quality checker
    checker = DataQualityChecker()
    checker.add_validator(NotNullValidator("order_id"))
    checker.add_validator(NotNullValidator("customer_id"))
    checker.add_validator(RangeValidator("amount", min_value=0, max_value=10000))

    # Run validation
    results = checker.validate_dataset(test_data)
    checker.print_report(results)
```

### Real-world Application

**Scenario: Testing a Customer 360 Pipeline**

A Customer 360 pipeline aggregates data from multiple sources (CRM, transactions, website analytics) to create a unified customer view. Testing requirements:

1. **Unit Tests**: Test each transformation function in isolation
2. **Schema Contract Tests**: Ensure changes to source schemas don't break the pipeline
3. **Data Quality Tests**: Validate merged records have required fields
4. **Reconciliation Tests**: Verify record counts match between source and destination
5. **Performance Tests**: Ensure pipeline completes within 4-hour SLA

Test organization:
```
tests/
  unit/
    test_transformations.py
    test_deduplication.py
  integration/
    test_source_connectors.py
    test_warehouse_writer.py
  data_quality/
    test_customer_schema.py
    test_record_completeness.py
  performance/
    test_pipeline_sla.py
```

### Learning Resources

- **Official Documentation**:
  - [pytest Documentation](https://docs.pytest.org/)
  - [Great Expectations](https://docs.greatexpectations.io/) - Data quality framework
  - [dbt Tests](https://docs.getdbt.com/docs/build/data-tests) - SQL-based data testing

- **Libraries**:
  - [pytest-mock](https://github.com/pytest-dev/pytest-mock) - Mocking for pytest
  - [factory_boy](https://github.com/FactoryBoy/factory_boy) - Test data factories
  - [hypothesis](https://hypothesis.readthedocs.io/) - Property-based testing
  - [pandera](https://github.com/unionai-oss/pandera) - DataFrame validation

- **Engineering Blogs**:
  - [Uber Engineering - Data Quality at Scale](https://eng.uber.com/data-quality-at-uber/)
  - [Netflix Tech Blog - Data Quality Monitoring](https://netflixtechblog.com/data-quality-monitoring-at-netflix-3c3e8d2e0c3d)

### Difficulty Level

**Intermediate** - Writing basic tests is straightforward, but designing comprehensive test strategies that cover edge cases, integration points, and data quality requires experience and domain knowledge.

---

## 5. Documentation

### What is it?

Documentation in software engineering encompasses all written artifacts that describe how systems work, why decisions were made, and how to use APIs and interfaces. For data engineers, key documentation types include:

- **Architecture Decision Records (ADRs)**: Documents explaining significant technical decisions
- **API Documentation**: Reference guides for data APIs and interfaces
- **Data Dictionaries**: Descriptions of data elements, their meanings, and relationships
- **Runbooks**: Operational procedures for managing and troubleshooting systems

### Why it matters for Data Engineers

Data systems are often:
- Long-lived (running for years with accumulated technical debt)
- Maintained by rotating team members
- Integrated with many downstream systems
- Subject to compliance requirements (audit trails, data lineage)

Good documentation ensures:
- New team members can onboard quickly
- Past decisions are understood (avoiding repeated mistakes)
- Downstream consumers can integrate correctly
- Operational issues can be resolved quickly

### Prerequisites

- Basic Markdown familiarity
- Understanding of software architecture concepts
- Experience with API design and usage
- Familiarity with version control (Git)

### Implementation Example

```python
"""
Documentation Patterns for Data Engineering
==========================================
Templates and tools for maintaining effective documentation.
"""

import json
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum
from pathlib import Path


# =============================================================================
# ARCHITECTURE DECISION RECORDS (ADRs)
# =============================================================================

class ADRStatus(Enum):
    """Status of an Architecture Decision Record."""
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    DEPRECATED = "deprecated"
    SUPERSEDED = "superseded"


@dataclass
class ADR:
    """
    Architecture Decision Record template.

    Based on Michael Nygard's ADR format:
    https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
    """
    title: str
    number: int
    status: ADRStatus
    date: datetime
    context: str
    decision: str
    consequences: str
    deciders: List[str] = field(default_factory=list)
    supersedes: Optional[int] = None
    superseded_by: Optional[int] = None
    related: List[int] = field(default_factory=list)

    def to_markdown(self) -> str:
        """Generate Markdown representation of the ADR."""
        supersedes_text = f"\n**Supersedes:** ADR-{self.supersedes:04d}" if self.supersedes else ""
        superseded_text = f"\n**Superseded by:** ADR-{self.superseded_by:04d}" if self.superseded_by else ""
        related_text = f"\n**Related:** {', '.join(f'ADR-{r:04d}' for r in self.related)}" if self.related else ""

        return f"""# ADR-{self.number:04d}: {self.title}

**Status:** {self.status.value.title()}
**Date:** {self.date.strftime('%Y-%m-%d')}
**Deciders:** {', '.join(self.deciders)}{supersedes_text}{superseded_text}{related_text}

## Context

{self.context}

## Decision

{self.decision}

## Consequences

{self.consequences}
"""


class ADRRepository:
    """
    Repository for managing Architecture Decision Records.

    Usage:
        repo = ADRRepository(Path("./docs/adr"))

        adr = ADR(
            title="Use PostgreSQL for transactional data",
            number=repo.next_number(),
            status=ADRStatus.ACCEPTED,
            date=datetime.now(),
            context="We need a database for our application...",
            decision="We will use PostgreSQL because...",
            consequences="This means we will need to...",
            deciders=["Alice", "Bob"]
        )

        repo.save(adr)
    """

    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)

    def next_number(self) -> int:
        """Get the next available ADR number."""
        existing = list(self.base_path.glob("*.md"))
        if not existing:
            return 1

        numbers = []
        for f in existing:
            try:
                num = int(f.stem.split('-')[0])
                numbers.append(num)
            except (ValueError, IndexError):
                continue

        return max(numbers, default=0) + 1

    def save(self, adr: ADR) -> Path:
        """Save an ADR to a Markdown file."""
        filename = f"{adr.number:04d}-{adr.title.lower().replace(' ', '-')}.md"
        filepath = self.base_path / filename
        filepath.write_text(adr.to_markdown())
        return filepath


# =============================================================================
# API DOCUMENTATION
# =============================================================================

@dataclass
class APIParameter:
    """API parameter definition."""
    name: str
    param_type: str
    required: bool
    description: str
    default: Optional[Any] = None
    example: Optional[Any] = None


@dataclass
class APIEndpoint:
    """API endpoint definition."""
    method: str
    path: str
    summary: str
    description: str
    parameters: List[APIParameter] = field(default_factory=list)
    request_body: Optional[Dict[str, Any]] = None
    responses: Dict[int, Dict[str, Any]] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)


class APIDocGenerator:
    """
    Generate API documentation in Markdown format.

    Usage:
        generator = APIDocGenerator(
            title="Data Pipeline API",
            version="1.0.0",
            description="API for managing data pipelines"
        )

        generator.add_endpoint(APIEndpoint(
            method="POST",
            path="/pipelines/{pipeline_id}/run",
            summary="Trigger a pipeline run",
            description="Starts a new run of the specified pipeline",
            parameters=[
                APIParameter("pipeline_id", "string", True, "Pipeline identifier"),
                APIParameter("async", "boolean", False, "Run asynchronously", default=True)
            ],
            responses={
                200: {"description": "Run started successfully"},
                404: {"description": "Pipeline not found"}
            }
        ))

        docs = generator.generate_markdown()
    """

    def __init__(self, title: str, version: str, description: str):
        self.title = title
        self.version = version
        self.description = description
        self.endpoints: List[APIEndpoint] = []

    def add_endpoint(self, endpoint: APIEndpoint):
        self.endpoints.append(endpoint)

    def generate_markdown(self) -> str:
        """Generate Markdown documentation for all endpoints."""
        sections = [
            f"# {self.title}",
            f"**Version:** {self.version}",
            "",
            self.description,
            "",
            "## Table of Contents",
            ""
        ]

        # Generate TOC
        for endpoint in self.endpoints:
            anchor = f"{endpoint.method.lower()}-{endpoint.path.replace('/', '-').replace('{', '').replace('}', '')}"
            sections.append(f"- [{endpoint.method} {endpoint.path}](#{anchor})")

        sections.append("\n---\n")

        # Generate endpoint documentation
        for endpoint in self.endpoints:
            sections.append(self._endpoint_to_markdown(endpoint))

        return "\n".join(sections)

    def _endpoint_to_markdown(self, endpoint: APIEndpoint) -> str:
        """Generate Markdown for a single endpoint."""
        lines = [
            f"## {endpoint.method} {endpoint.path}",
            "",
            f"**{endpoint.summary}**",
            "",
            endpoint.description,
            ""
        ]

        if endpoint.parameters:
            lines.extend([
                "### Parameters",
                "",
                "| Name | Type | Required | Description | Default |",
                "|------|------|----------|-------------|---------|"
            ])
            for param in endpoint.parameters:
                default = param.default if param.default is not None else "-"
                required = "Yes" if param.required else "No"
                lines.append(
                    f"| `{param.name}` | {param.param_type} | {required} | {param.description} | {default} |"
                )
            lines.append("")

        if endpoint.responses:
            lines.extend([
                "### Responses",
                "",
                "| Status | Description |",
                "|--------|-------------|"
            ])
            for status, response in endpoint.responses.items():
                lines.append(f"| {status} | {response.get('description', '')} |")
            lines.append("")

        lines.append("---\n")
        return "\n".join(lines)


# =============================================================================
# DATA DICTIONARY
# =============================================================================

@dataclass
class ColumnDefinition:
    """Definition of a data column/field."""
    name: str
    data_type: str
    description: str
    nullable: bool = True
    primary_key: bool = False
    foreign_key: Optional[str] = None
    example: Optional[str] = None
    business_rules: Optional[str] = None
    pii: bool = False  # Personally Identifiable Information flag


@dataclass
class TableDefinition:
    """Definition of a data table/entity."""
    name: str
    description: str
    columns: List[ColumnDefinition]
    owner: str
    source_system: Optional[str] = None
    update_frequency: Optional[str] = None
    retention_policy: Optional[str] = None


class DataDictionary:
    """
    Generate and maintain a data dictionary.

    Usage:
        dd = DataDictionary("Customer Data Warehouse")

        dd.add_table(TableDefinition(
            name="dim_customer",
            description="Customer dimension table",
            owner="data-engineering-team",
            source_system="CRM",
            update_frequency="Daily",
            columns=[
                ColumnDefinition(
                    name="customer_id",
                    data_type="BIGINT",
                    description="Unique customer identifier",
                    nullable=False,
                    primary_key=True
                ),
                ColumnDefinition(
                    name="email",
                    data_type="VARCHAR(255)",
                    description="Customer email address",
                    pii=True,
                    example="user@example.com"
                )
            ]
        ))

        docs = dd.generate_markdown()
    """

    def __init__(self, project_name: str):
        self.project_name = project_name
        self.tables: Dict[str, TableDefinition] = {}

    def add_table(self, table: TableDefinition):
        self.tables[table.name] = table

    def generate_markdown(self) -> str:
        """Generate Markdown documentation for the data dictionary."""
        sections = [
            f"# Data Dictionary: {self.project_name}",
            "",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Table of Contents",
            ""
        ]

        for table_name in sorted(self.tables.keys()):
            sections.append(f"- [{table_name}](#{table_name.replace('_', '-')})")

        sections.append("\n---\n")

        for table_name in sorted(self.tables.keys()):
            sections.append(self._table_to_markdown(self.tables[table_name]))

        return "\n".join(sections)

    def _table_to_markdown(self, table: TableDefinition) -> str:
        """Generate Markdown for a single table."""
        pii_columns = [c for c in table.columns if c.pii]
        pii_warning = ""
        if pii_columns:
            pii_warning = f"\n> **Warning:** This table contains PII fields: {', '.join(c.name for c in pii_columns)}\n"

        lines = [
            f"## {table.name}",
            "",
            table.description,
            pii_warning,
            f"**Owner:** {table.owner}  ",
            f"**Source System:** {table.source_system or 'N/A'}  ",
            f"**Update Frequency:** {table.update_frequency or 'N/A'}  ",
            f"**Retention Policy:** {table.retention_policy or 'N/A'}",
            "",
            "### Columns",
            "",
            "| Column | Type | Nullable | PK | FK | Description |",
            "|--------|------|----------|----|----|-------------|"
        ]

        for col in table.columns:
            pk = "Yes" if col.primary_key else ""
            fk = col.foreign_key or ""
            nullable = "Yes" if col.nullable else "No"
            lines.append(
                f"| `{col.name}` | {col.data_type} | {nullable} | {pk} | {fk} | {col.description} |"
            )

        lines.append("\n---\n")
        return "\n".join(lines)


# =============================================================================
# RUNBOOK TEMPLATE
# =============================================================================

@dataclass
class RunbookStep:
    """A step in a runbook procedure."""
    number: int
    action: str
    expected_result: Optional[str] = None
    rollback: Optional[str] = None
    command: Optional[str] = None


@dataclass
class Runbook:
    """
    Operational runbook template.

    Usage:
        runbook = Runbook(
            title="Pipeline Failure Recovery",
            description="Steps to recover from pipeline failures",
            owner="data-engineering-team",
            severity="P2"
        )

        runbook.add_step(RunbookStep(
            number=1,
            action="Check pipeline logs in Airflow",
            command="airflow tasks logs pipeline_name task_name 2024-01-15",
            expected_result="Log output showing error details"
        ))
    """
    title: str
    description: str
    owner: str
    severity: str
    prerequisites: List[str] = field(default_factory=list)
    steps: List[RunbookStep] = field(default_factory=list)
    troubleshooting: Dict[str, str] = field(default_factory=dict)
    contacts: Dict[str, str] = field(default_factory=dict)

    def add_step(self, step: RunbookStep):
        self.steps.append(step)

    def to_markdown(self) -> str:
        """Generate Markdown documentation for the runbook."""
        lines = [
            f"# Runbook: {self.title}",
            "",
            f"**Severity:** {self.severity}  ",
            f"**Owner:** {self.owner}  ",
            f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d')}",
            "",
            "## Description",
            "",
            self.description,
            ""
        ]

        if self.prerequisites:
            lines.extend([
                "## Prerequisites",
                "",
                *[f"- {p}" for p in self.prerequisites],
                ""
            ])

        if self.contacts:
            lines.extend([
                "## Contacts",
                "",
                "| Role | Contact |",
                "|------|---------|",
                *[f"| {role} | {contact} |" for role, contact in self.contacts.items()],
                ""
            ])

        lines.extend([
            "## Procedure",
            ""
        ])

        for step in self.steps:
            lines.append(f"### Step {step.number}: {step.action}")
            lines.append("")

            if step.command:
                lines.extend([
                    "**Command:**",
                    "```bash",
                    step.command,
                    "```",
                    ""
                ])

            if step.expected_result:
                lines.append(f"**Expected Result:** {step.expected_result}")
                lines.append("")

            if step.rollback:
                lines.append(f"**Rollback:** {step.rollback}")
                lines.append("")

        if self.troubleshooting:
            lines.extend([
                "## Troubleshooting",
                "",
                "| Issue | Solution |",
                "|-------|----------|",
                *[f"| {issue} | {solution} |" for issue, solution in self.troubleshooting.items()],
                ""
            ])

        return "\n".join(lines)


# =============================================================================
# EXAMPLE: GENERATING DOCUMENTATION FOR A DATA PIPELINE
# =============================================================================

def generate_sample_documentation():
    """Generate sample documentation for a fictional data pipeline."""

    # 1. Create an ADR
    adr = ADR(
        title="Use Apache Kafka for Event Streaming",
        number=1,
        status=ADRStatus.ACCEPTED,
        date=datetime(2024, 1, 15),
        context="""Our data platform needs to handle real-time event streaming from multiple sources.
We currently use batch processing which introduces latency of up to 24 hours.
Business stakeholders require near-real-time data availability (< 5 minutes latency).""",
        decision="""We will use Apache Kafka as our event streaming platform because:

1. **Proven scalability**: Handles millions of events per second
2. **Strong ecosystem**: Connectors for most data sources
3. **Team expertise**: Several team members have Kafka experience
4. **Cost**: Open source with managed options available (Confluent, AWS MSK)

We rejected alternatives:
- **RabbitMQ**: Better for traditional messaging, not optimized for high-throughput streaming
- **AWS Kinesis**: Vendor lock-in concerns
- **Pulsar**: Less mature ecosystem""",
        consequences="""**Positive:**
- Near-real-time data availability
- Decoupled architecture allowing independent scaling
- Built-in replay capability for reprocessing

**Negative:**
- Additional infrastructure to manage
- Team training required for operations
- Increased complexity in debugging distributed issues

**Neutral:**
- Need to establish retention policies
- Schema registry decision pending (separate ADR)""",
        deciders=["Alice Chen", "Bob Smith", "Carol Johnson"]
    )

    print("=" * 60)
    print("ARCHITECTURE DECISION RECORD")
    print("=" * 60)
    print(adr.to_markdown())

    # 2. Create API documentation
    api_gen = APIDocGenerator(
        title="Pipeline Management API",
        version="2.0.0",
        description="REST API for managing data pipelines, jobs, and schedules."
    )

    api_gen.add_endpoint(APIEndpoint(
        method="POST",
        path="/api/v2/pipelines/{pipeline_id}/runs",
        summary="Trigger a pipeline run",
        description="Starts a new execution of the specified pipeline with optional parameters.",
        parameters=[
            APIParameter("pipeline_id", "string", True, "Unique pipeline identifier", example="etl-customers-daily"),
            APIParameter("async", "boolean", False, "Run asynchronously", default=True),
            APIParameter("priority", "string", False, "Execution priority", default="normal", example="high")
        ],
        request_body={
            "parameters": {"type": "object", "description": "Pipeline parameters"},
            "notify": {"type": "array", "description": "Email addresses to notify"}
        },
        responses={
            202: {"description": "Run accepted and queued"},
            400: {"description": "Invalid parameters"},
            404: {"description": "Pipeline not found"},
            409: {"description": "Pipeline already running"}
        },
        tags=["Pipelines", "Execution"]
    ))

    print("\n" + "=" * 60)
    print("API DOCUMENTATION")
    print("=" * 60)
    print(api_gen.generate_markdown())

    # 3. Create data dictionary
    dd = DataDictionary("Sales Analytics Warehouse")

    dd.add_table(TableDefinition(
        name="fact_orders",
        description="Order transaction facts including amounts, quantities, and timestamps.",
        owner="sales-analytics-team",
        source_system="Salesforce",
        update_frequency="Hourly",
        retention_policy="7 years",
        columns=[
            ColumnDefinition("order_id", "BIGINT", "Unique order identifier", False, True),
            ColumnDefinition("customer_id", "BIGINT", "Reference to dim_customer", False, False, "dim_customer.customer_id"),
            ColumnDefinition("order_date", "DATE", "Date the order was placed", False),
            ColumnDefinition("total_amount", "DECIMAL(18,2)", "Total order amount in USD", False),
            ColumnDefinition("discount_amount", "DECIMAL(18,2)", "Discount applied", True),
            ColumnDefinition("created_at", "TIMESTAMP", "Record creation timestamp", False)
        ]
    ))

    dd.add_table(TableDefinition(
        name="dim_customer",
        description="Customer dimension with demographics and contact information.",
        owner="customer-data-team",
        source_system="CRM",
        update_frequency="Daily",
        columns=[
            ColumnDefinition("customer_id", "BIGINT", "Unique customer identifier", False, True),
            ColumnDefinition("email", "VARCHAR(255)", "Customer email address", True, pii=True, example="user@example.com"),
            ColumnDefinition("first_name", "VARCHAR(100)", "Customer first name", True, pii=True),
            ColumnDefinition("last_name", "VARCHAR(100)", "Customer last name", True, pii=True),
            ColumnDefinition("segment", "VARCHAR(50)", "Customer segment classification", True, business_rules="Values: 'enterprise', 'smb', 'consumer'")
        ]
    ))

    print("\n" + "=" * 60)
    print("DATA DICTIONARY")
    print("=" * 60)
    print(dd.generate_markdown())

    # 4. Create runbook
    runbook = Runbook(
        title="Pipeline Failure Recovery",
        description="Steps to diagnose and recover from data pipeline failures.",
        owner="data-engineering-team",
        severity="P2",
        prerequisites=[
            "Access to Airflow web UI",
            "kubectl configured for production cluster",
            "Access to CloudWatch logs"
        ],
        contacts={
            "Primary On-Call": "oncall@company.com",
            "Data Platform Lead": "platform-lead@company.com",
            "Database Team": "#db-team (Slack)"
        },
        troubleshooting={
            "OOM errors": "Increase memory allocation in pipeline config, consider data partitioning",
            "Connection timeout": "Check network policies, verify database is accessible",
            "Schema mismatch": "Check source system for schema changes, update transformation logic"
        }
    )

    runbook.add_step(RunbookStep(
        number=1,
        action="Identify the failing task in Airflow",
        command="airflow tasks list pipeline_name --tree",
        expected_result="Tree view showing task dependencies and failed task highlighted"
    ))

    runbook.add_step(RunbookStep(
        number=2,
        action="Check task logs for error details",
        command="airflow tasks logs pipeline_name failed_task 2024-01-15",
        expected_result="Log output showing the specific error message and stack trace"
    ))

    runbook.add_step(RunbookStep(
        number=3,
        action="If OOM error, increase memory and retry",
        command="kubectl edit deployment pipeline-worker -n data-platform",
        expected_result="Deployment updated with new memory limits",
        rollback="kubectl rollout undo deployment/pipeline-worker -n data-platform"
    ))

    print("\n" + "=" * 60)
    print("RUNBOOK")
    print("=" * 60)
    print(runbook.to_markdown())


# Example usage
if __name__ == "__main__":
    generate_sample_documentation()
```

### Real-world Application

**Scenario: Migrating a Legacy Data Warehouse**

A company is migrating from an on-premise Oracle data warehouse to Snowflake. Documentation requirements:

1. **ADRs for key decisions**:
   - Why Snowflake over BigQuery/Redshift
   - Schema design changes (star schema vs denormalized)
   - Migration approach (big bang vs incremental)

2. **Data Dictionary updates**:
   - Document all tables being migrated
   - Map Oracle data types to Snowflake equivalents
   - Flag deprecated tables not being migrated

3. **API Documentation**:
   - New data access APIs for Snowflake
   - Deprecation notices for Oracle-based APIs

4. **Runbooks**:
   - Migration verification procedures
   - Rollback procedures if issues discovered
   - Post-migration validation steps

### Learning Resources

- **Official Documentation**:
  - [ADR GitHub Organization](https://adr.github.io/) - Comprehensive ADR resources
  - [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) - API documentation standard
  - [Diátaxis Documentation Framework](https://diataxis.fr/) - Systematic approach to documentation

- **Tools**:
  - [adr-tools](https://github.com/npryce/adr-tools) - Command-line tools for ADRs
  - [Swagger/OpenAPI](https://swagger.io/) - API documentation ecosystem
  - [MkDocs](https://www.mkdocs.org/) - Static site generator for documentation
  - [dbt docs](https://docs.getdbt.com/reference/commands/cmd-docs) - Auto-generated data documentation

- **Engineering Blogs**:
  - [Spotify Engineering - Why We Use ADRs](https://engineering.atspotify.com/2020/04/when-should-i-write-an-architecture-decision-record/)
  - [GitHub Engineering - ADRs at GitHub](https://github.blog/engineering/architecture-optimization/why-write-adrs/)

### Difficulty Level

**Beginner to Intermediate** - Writing documentation is accessible to all skill levels, but creating truly useful documentation that balances completeness with maintainability requires practice and understanding of your audience.

---

## Summary

This guide covered five essential areas of software quality and reliability for data engineers:

### Key Takeaways

1. **Error Handling and Resilience Patterns**
   - Implement circuit breakers to prevent cascade failures
   - Use exponential backoff with jitter for retries
   - Design for failure - assume external services will fail

2. **Performance Profiling and Optimization**
   - Profile before optimizing - measure, don't guess
   - Focus on I/O and memory for data-heavy workloads
   - Use generators and chunking for large datasets

3. **Security Best Practices**
   - Never hardcode secrets - use secrets managers
   - Implement audit logging for compliance
   - Mask sensitive data in logs and error messages

4. **Testing Strategies for Data Systems**
   - Test data quality, not just code correctness
   - Use schema contracts for producer-consumer relationships
   - Build test data factories for consistent test cases

5. **Documentation**
   - Write ADRs for significant technical decisions
   - Maintain data dictionaries with PII flags
   - Create runbooks for operational procedures

### Applying These Concepts

Start by identifying the weakest area in your current projects:
- **Many production incidents?** Focus on resilience patterns
- **Slow pipelines?** Invest in profiling and optimization
- **Security concerns?** Implement proper secrets management
- **Frequent bugs?** Strengthen your testing strategy
- **Onboarding takes forever?** Improve documentation

The code examples in this guide are production-ready foundations. Adapt them to your specific technology stack and organizational requirements.

---

## References

### Books
- Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media.
- Nygard, M. (2018). *Release It! Design and Deploy Production-Ready Software* (2nd ed.). Pragmatic Bookshelf.
- Humble, J., & Farley, D. (2010). *Continuous Delivery*. Addison-Wesley.

### Official Documentation
- [Python Documentation - Profiling](https://docs.python.org/3/library/profile.html)
- [pytest Documentation](https://docs.pytest.org/)
- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)

### Standards and Specifications
- [OWASP Security Guidelines](https://owasp.org/)
- [OpenAPI Specification](https://spec.openapis.org/)
- [ADR GitHub Organization](https://adr.github.io/)

### Engineering Blogs
- [Netflix Tech Blog](https://netflixtechblog.com/)
- [Uber Engineering](https://eng.uber.com/)
- [Spotify Engineering](https://engineering.atspotify.com/)
- [Airbnb Engineering](https://medium.com/airbnb-engineering)

### Libraries and Tools
- **Resilience**: [tenacity](https://github.com/jd/tenacity), [pybreaker](https://github.com/danielfm/pybreaker)
- **Profiling**: [py-spy](https://github.com/benfred/py-spy), [Scalene](https://github.com/plasma-umass/scalene)
- **Testing**: [pytest](https://pytest.org/), [hypothesis](https://hypothesis.readthedocs.io/), [pandera](https://pandera.readthedocs.io/)
- **Documentation**: [MkDocs](https://www.mkdocs.org/), [Sphinx](https://www.sphinx-doc.org/)
