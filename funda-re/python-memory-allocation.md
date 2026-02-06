# Python Memory Allocation: Stack vs Heap

Technical documentation explaining how Python (CPython) manages memory allocation for stack and heap, with data engineering analogies.

---

## TL;DR: The Big Picture

```
┌─────────────────────────────────────────┐
│  Python Code: x = [1, 2, 3]            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Call Stack (Stack Memory)              │
│  ┌───────────────────────────────────┐  │
│  │  x (reference/pointer) → [address]│  │ ← Stack: 8 bytes (pointer)
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓ points to
┌─────────────────────────────────────────┐
│  Heap Memory (Private Python Heap)      │
│  ┌───────────────────────────────────┐  │
│  │  PyObject: [1, 2, 3]              │  │ ← Heap: actual object
│  │  - ob_refcnt: 1                   │  │
│  │  - ob_type: list                  │  │
│  │  - items: [1, 2, 3]               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Stack**: Pointers/references to local variables  
**Heap**: All Python objects (lists, dicts, strings, ints, etc.)

---

## Analogy: Data Lake vs Metadata Catalog

Think of it this way (DE analogy):

| Concept | Python Memory | Data Engineering |
|----------|---------------|------------------|
| **Stack** | Local references | Metadata catalog / Glue Catalog |
| **Heap** | Actual objects | Data Lake (S3, ADLS) |
| **Variable** | Stack pointer | Table entry in catalog |
| **Object** | Heap data | Parquet files in S3 |

When you do `df = spark.read.parquet(path)`:
- `df` (variable) = **stack** (local reference)
- The actual DataFrame = **heap** (object with data)

---

## Stack Memory in Python

### What Goes on the Stack?

```python
def process_data(batch_id):
    size = 1000        # Stack: reference to int
    name = "batch_1"   # Stack: reference to string
    data = [1, 2, 3]   # Stack: reference to list
    
    # All local variables are REFERENCES on the stack
    # The actual objects (int, str, list) are on the HEAP
```

### Stack Characteristics in Python

- ✅ **Call frames**: each function has its own frame on the stack
- ✅ **Local pointers**: local variables = addresses (8 bytes each)
- ✅ **Automatic**: frame is created when function is called, destroyed on return
- ✅ **Fast**: trivial allocation (just increment stack pointer)
- ⚠️ **Small**: typically ~8MB (limit for deep recursion)

### Stack Frame Layout

```python
def outer():
    x = 10          # Stack: reference
    inner(x)

def inner(y):       # New frame on stack
    z = y * 2       # Stack: reference
    return z
```

**Stack during execution:**
```
┌──────────────────────┐ ← Stack Top
│ inner() frame        │
│  y → heap(10)        │
│  z → heap(20)        │
├──────────────────────┤
│ outer() frame        │
│  x → heap(10)        │
├──────────────────────┤
│ main() frame         │
└──────────────────────┘ ← Stack Bottom
```

When `inner()` returns, its frame is **destroyed** (but heap objects remain if there are other references).

---

## Heap Memory in Python

### Everything is an Object = Everything on the Heap

```python
# ALL these values go on the HEAP
a = 42              # int object on heap
b = "hello"         # str object on heap
c = [1, 2, 3]       # list object on heap
d = {"k": "v"}      # dict object on heap

# The variables (a, b, c, d) are pointers on the STACK
```

### CPython Private Heap Architecture

CPython has a **private heap** managed by the **pymalloc allocator**:

```
OS Virtual Memory
    ↓
┌─────────────────────────────────────────┐
│  Python Process Memory                  │
│  ┌───────────────────────────────────┐  │
│  │  Internal Use + Non-Object Memory │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  OBJECT HEAP (your code uses)     │  │
│  │  → Arenas → Pools → Blocks        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Pymalloc: 3-Layer Architecture

Think of it like organizing data in a Data Lake:

#### 1. Arenas (Highest Level) = S3 Bucket Region
- **Size**: 256 KB (32-bit) or 1 MB (64-bit)
- **Analogy**: Entire S3 prefix like `s3://lake/year=2024/month=01/`
- **Key feature**: Only arenas can be **truly freed** back to OS
- Think: "I can delete the entire partition and return disk space to AWS"

**Real scenario:**
```python
# Creating lots of temp objects
for i in range(10000):
    temp = [0] * 100  # Many objects allocated

# After loop, if ALL objects in an arena are freed, 
# Python can return that 1MB chunk back to OS
```

#### 2. Pools (Middle Level) = Parquet File
- **Size**: 4 KB each (1 virtual memory page)
- **Analogy**: A single Parquet file like `data_part_001.parquet`
- **Important**: Each pool is **dedicated to one size class**
- States: 
  - `used` = has some free blocks (like partially written Parquet)
  - `full` = all blocks allocated (Parquet at max capacity)
  - `empty` = no data (ready to be repurposed for any size)

**Real scenario:**
```python
x = "hello"    # 5 chars → needs 48-byte block
y = "world"    # 5 chars → needs 48-byte block
z = "python"   # 6 chars → needs 48-byte block

# All three go into the SAME pool (48-byte size class)
# Python finds a pool for 48-byte blocks and uses it
```

**Pool state transition:**
```
Empty Pool → Used Pool (some blocks allocated)
Used Pool → Full Pool (all blocks allocated)
Full Pool → Used Pool (some blocks freed)
Used Pool → Empty Pool (all blocks freed → can switch size class!)
```

#### 3. Blocks (Lowest Level) = Records in Parquet
- **Size**: 8, 16, 24, 32, 40, 48, 56, 64... up to 512 bytes (8-byte increments)
- **Analogy**: Individual rows in a Parquet file
- States:
  - `untouched` = never used (like reserved disk space)
  - `free` = was used, now available (deleted row that can be reused)
  - `allocated` = currently storing a Python object

**Real scenario:**
```python
# Step 1: Allocate
a = 42  # int needs ~28 bytes → rounded to 32-byte block
# Block state: untouched → allocated

# Step 2: Delete
del a   # refcount = 0
# Block state: allocated → free (NOT returned to OS!)

# Step 3: Reuse
b = 100 # Another int → reuses the SAME 32-byte block
# Block state: free → allocated (recycled!)
```

### Visual Hierarchy with Data Lake Analogy

```
Arena (1 MB) = s3://lake/year=2024/month=01/
│
├── Pool 1 (4 KB) = data_48byte_001.parquet
│   │   Size class: 48 bytes (for strings ~5-12 chars)
│   │
│   ├── Block 1 [allocated] ← "hello" object lives here
│   ├── Block 2 [free]      ← was "world", now deleted
│   ├── Block 3 [allocated] ← "python" object
│   ├── Block 4 [untouched] ← never used yet
│   └── ... (85 blocks total in 4KB pool)
│
├── Pool 2 (4 KB) = data_32byte_001.parquet
│   │   Size class: 32 bytes (for small ints)
│   │
│   ├── Block 1 [allocated] ← int(42)
│   ├── Block 2 [allocated] ← int(100)
│   └── ... (128 blocks total)
│
└── Pool 3 (4 KB) = empty_pool.parquet
    │   Currently empty, can be assigned any size class
    └── Ready to become 64-byte pool if needed
```

### Concrete Example: Creating Objects

```python
# Scenario: You create these objects
a = 10          # int: ~28 bytes → uses 32-byte block
b = "test"      # str: ~37 bytes → uses 48-byte block  
c = [1, 2]      # list: varies, let's say → uses 64-byte block

# What happens in memory:
# 
# Arena 1 (1 MB) - existing arena with space
#   ├── Pool A (4KB, size=32)  ← int pool
#   │   └── Block [allocated] ← 'a' lives here
#   │
#   ├── Pool B (4KB, size=48)  ← string pool
#   │   └── Block [allocated] ← 'b' lives here
#   │
#   └── Pool C (4KB, size=64)  ← list pool
#       └── Block [allocated] ← 'c' lives here
```

### Why This Design?

**Problem**: Creating millions of small objects is common in Python
```python
# In Spark/data processing, you might do:
results = [process(item) for item in huge_list]
# Creates TONS of temporary objects
```

**Solution**: 
1. **Pools** prevent fragmentation (each size in its own pool)
2. **Blocks** are reused (deleted objects → free blocks)
3. **Arenas** can be freed when completely empty (return memory to OS)

### Size Class Assignment Table

When you create an object needing N bytes, pymalloc rounds UP:

| Object | Approx Size | Block Size Used | Waste |
|--------|-------------|-----------------|-------|
| `x = 1` | 28 bytes | 32 bytes | 4 bytes |
| `s = "hi"` | 35 bytes | 40 bytes | 5 bytes |
| `s = "hello"` | 42 bytes | **48 bytes** | 6 bytes |
| `d = {}` | 240 bytes | 240 bytes | 0 bytes |
| `big = "x"*600` | 600+ bytes | **Uses malloc()** | N/A |

**Key insight**: Objects >512 bytes bypass pymalloc entirely and use system `malloc()`!

### Size Classes

If you request N bytes, Python rounds up to the next size class:

| Bytes Requested | Size Class | Waste |
|-----------------|------------|-------|
| 1-8 bytes | 8 bytes | ≤7 bytes |
| 9-16 bytes | 16 bytes | ≤7 bytes |
| 33-40 bytes | 40 bytes | ≤7 bytes |
| 42 bytes | **48 bytes** | 6 bytes |
| 500 bytes | 512 bytes | 12 bytes |
| **513+ bytes** | `malloc()` direct | — |

**Pymalloc only works for objects ≤512 bytes!** Larger objects use system `malloc()`.

---

## Reference Counting (Memory Management)

### How Does Python Know When to Free Heap Memory?

Every Python object has a **reference counter** (`ob_refcnt`):

```python
import sys

x = [1, 2, 3]
print(sys.getrefcount(x))  # 2 (x + function argument)

y = x  # Increment refcount
print(sys.getrefcount(x))  # 3

del y  # Decrement refcount
print(sys.getrefcount(x))  # 2
```

### PyObject Structure

Every Python object is a `PyObject`:

```c
typedef struct {
    Py_ssize_t ob_refcnt;   // Reference counter
    PyTypeObject *ob_type;  // Object type (list, int, etc)
    // ... type-specific fields
} PyObject;
```

### When is an Object Freed?

```python
def process():
    data = [1, 2, 3]  # refcount = 1
    # ...
    return            # refcount = 0 → DEALLOC immediately

# Memory for object [1,2,3] goes back to "free" pool
```

**Important**: "Free" doesn't mean returning to the OS! It means returning to the pymalloc **free block pool**.

---

## Complete Example: Stack + Heap

```python
def calculate_metrics(df):
    # STACK: local pointers
    # HEAP: objects
    
    count = len(df)           # count (stack) → int object (heap)
    avg = df['value'].mean()  # avg (stack) → float object (heap)
    result = {                 # result (stack) → dict object (heap)
        'count': count,        #   which contains references to int/float
        'avg': avg
    }
    return result             # refcount++, frame destroyed
```

**During execution:**

```
STACK (function calculate_metrics):
┌────────────────────────┐
│ df    → 0x7f8a... (arg)│
│ count → 0x7f8b...      │
│ avg   → 0x7f8c...      │
│ result→ 0x7f8d...      │
└────────────────────────┘

HEAP (objects):
┌─────────────────────────────────────┐
│ 0x7f8b... PyObject(int, value=1000) │  ← count points here
│ 0x7f8c... PyObject(float, value=42.5)│  ← avg points here
│ 0x7f8d... PyObject(dict, {           │  ← result points here
│              'count': 0x7f8b...,    │
│              'avg': 0x7f8c...       │
│           })                        │
└─────────────────────────────────────┘
```

**After return:**
- Stack frame is **destroyed**
- Heap objects **remain** (refcount > 0 because caller has reference)
- If no one else uses them: refcount = 0 → memory goes back to pool

---

## Garbage Collection (Cycles)

Reference counting **doesn't solve cycles**:

```python
class Node:
    def __init__(self):
        self.next = None

a = Node()
b = Node()
a.next = b  # a → b
b.next = a  # b → a (cycle!)

del a, b
# Refcount never reaches 0! Memory leak without GC
```

**Solution**: Python has **Generational GC** (generations 0, 1, 2) that periodically searches for cycles.

---

## Comparison: C vs Python

| Aspect | C | Python |
|---------|---|--------|
| **Stack** | Actual local variables | Pointers/references |
| **Heap** | Manual `malloc()` | Automatic (pymalloc) |
| **Objects** | Structs on stack/heap | Always on heap |
| **Free** | Manual `free()` | Reference counting + GC |
| **Performance** | Direct, fast | Overhead (refcount, GC) |

### C Example
```c
int main() {
    int x = 10;              // Stack: direct value
    int *ptr = malloc(100);  // Heap: manual
    free(ptr);               // Manual
}
```

### Python Equivalent
```python
def main():
    x = 10                   # Stack: pointer → heap(10)
    data = [0] * 100         # Stack: pointer → heap(list)
    # No free! GC handles it
```

---

## Performance Implications

### Why is Python Slower?

1. **Everything on heap**: even `x = 1` allocates object on heap
2. **Reference counting**: every assignment increments/decrements
3. **GC overhead**: periodically searches for cycles
4. **Indirection**: stack → heap always (cache miss)

### CPython Optimizations

**Integer interning** (cache -5 to 256):
```python
a = 10
b = 10
print(a is b)  # True! Same object on heap
```

**String interning** (small strings):
```python
x = "hello"
y = "hello"
print(x is y)  # True! Share memory
```

---

## Practical Tips (Data Engineering)

### 1. Large Datasets → Don't Use Lists

```python
# ❌ Bad: each int is PyObject (28+ bytes)
data = [1, 2, 3, ..., 1_000_000]  # ~28 MB!!

# ✅ Good: contiguous array (8 bytes per int)
import numpy as np
data = np.array([1, 2, 3, ..., 1_000_000])  # ~8 MB
```

### 2. Avoid Creating Objects in Loops

```python
# ❌ Bad: creates millions of objects
for i in range(1_000_000):
    x = i * 2  # New PyObject every iteration

# ✅ Good: vectorized operations
import numpy as np
x = np.arange(1_000_000) * 2  # One allocation
```

### 3. Use Generators for Streams

```python
# ❌ Bad: entire list in memory
def read_file(path):
    return [line for line in open(path)]  # Heap explodes

# ✅ Good: lazy evaluation
def read_file(path):
    for line in open(path):
        yield line  # One object at a time
```

### 4. Clean Up Large References

```python
import pandas as pd

df = pd.read_parquet("huge_file.parquet")  # 10 GB on heap
# ... process
del df  # Force refcount = 0

# Optional: force GC
import gc
gc.collect()
```

---

## Debugging Memory

### Check Refcount

```python
import sys

x = [1, 2, 3]
print(sys.getrefcount(x))  # 2 (x + argument)

y = x
print(sys.getrefcount(x))  # 3
```

### Memory Profiling

```bash
# Install
pip install memory-profiler

# Use
@profile
def my_function():
    data = [0] * 10**6
    return data
```

```bash
python -m memory_profiler script.py
```

### Tracemalloc (Built-in)

```python
import tracemalloc

tracemalloc.start()

# Your code
data = [0] * 10**6

current, peak = tracemalloc.get_traced_memory()
print(f"Current: {current / 1024 / 1024:.2f} MB")
print(f"Peak: {peak / 1024 / 1024:.2f} MB")

tracemalloc.stop()
```

---

## Key Takeaways

1. **Stack in Python** = call frames with local pointers/references
2. **Heap in Python** = ALL objects (int, str, list, dict, etc.)
3. **Pymalloc** = optimized allocator for small objects (≤512 bytes)
4. **Reference Counting** = automatic memory management (+ GC for cycles)
5. **Performance** = inevitable overhead vs C, but optimizations exist (NumPy, Cython)

---

## References

- [Real Python - Memory Management](https://realpython.com/python-memory-management/)
- [CPython Source - obmalloc.c](https://github.com/python/cpython/blob/main/Objects/obmalloc.c)
- [Python Docs - Memory Management](https://docs.python.org/3/c-api/memory.html)
- [PEP 442 - Safe Object Finalization](https://peps.python.org/pep-0442/)

---

*Document created: 2026-01-20*  
*Target audience: Data Engineers reviewing fundamentals*  
*Format: Technical documentation with DE analogies*
c