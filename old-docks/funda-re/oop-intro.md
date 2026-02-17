# OOP Basics - Classes, Objects, and Self

## What is OOP?

**Object-Oriented Programming (OOP)** is a programming paradigm that organizes code around **objects** rather than functions and logic. An object bundles data (attributes) and behavior (methods) into a single entity.

### Why Use OOP?

- **Modularity**: Code is organized into self-contained units (objects)
- **Reusability**: Classes can be reused across different parts of your application
- **Maintainability**: Changes to a class propagate to all instances automatically
- **Encapsulation**: Data and methods are bundled together, hiding internal complexity
- **Natural modeling**: Maps well to real-world entities and relationships

---

## What is `self`?

In Python, `self` is a **reference to the instance of the class** - the actual object that's calling the method.

### Key Points:

**`self` is NOT a keyword** - it's just a convention. You could name it anything (but don't).

When you call a method on an object:
```python
dog.bark()  # You write this
```

Python internally translates it to:
```python
Dog.bark(dog)  # Python does this behind the scenes
```

**Why explicit?**
- Python requires you to explicitly receive the instance as the first parameter
- `self` lets you access the instance's attributes and methods
- Without `self`, methods wouldn't know which object's data to work with

**What happens under the hood:**
1. You call `my_dog.bark()`
2. Python looks up the `bark` method in the `Dog` class
3. Python passes `my_dog` as the first argument to `bark()`
4. Inside `bark()`, `self` refers to `my_dog`
5. Any attribute access like `self.name` gets `my_dog.name`

---

## Summary: Key Concepts

✅ **Class**: Blueprint/template that defines structure and behavior  
✅ **Object**: Concrete instance created from a class  
✅ **`self`**: Reference to the current instance inside methods  
✅ **Attributes**: Data stored in each instance (e.g., `self.name`)  
✅ **Methods**: Functions defined in a class that operate on instances  
✅ **Instantiation**: Creating an object from a class (`Dog()`)  
✅ **Independence**: Each object maintains its own state  

---

## Complete Flow: Dog Class Example

```python
# Define the class (blueprint)
class Dog:
    def __init__(self, name, age):
        """Constructor - called when creating a new Dog instance"""
        self.name = name  # Instance attribute
        self.age = age    # Instance attribute
        self.energy = 100 # Default attribute
    
    def bark(self):
        """Instance method - operates on this specific dog"""
        return f"{self.name} says: Woof!"
    
    def play(self, minutes):
        """Method that modifies instance state"""
        self.energy -= minutes * 2
        return f"{self.name} played for {minutes} min. Energy: {self.energy}"
    
    def rest(self):
        """Method that restores state"""
        self.energy = 100
        return f"{self.name} is fully rested!"


# Create instances (objects)
dog1 = Dog("Rex", 5)
dog2 = Dog("Bella", 3)

# Each object has its own state
print(dog1.name)        # Output: Rex
print(dog2.name)        # Output: Bella

# Call methods on instances
print(dog1.bark())      # Output: Rex says: Woof!
print(dog2.bark())      # Output: Bella says: Woof!

# Modify state independently
print(dog1.play(20))    # Output: Rex played for 20 min. Energy: 60
print(dog2.energy)      # Output: 100 (unchanged - different object!)

# Verify independence
print(f"Dog1 energy: {dog1.energy}")  # 60
print(f"Dog2 energy: {dog2.energy}")  # 100
```

**What happened:**
1. `Dog` class defines the structure (attributes) and behavior (methods)
2. `dog1` and `dog2` are **independent instances** with separate memory
3. When `dog1.play(20)` runs, only `dog1.energy` changes
4. `dog2` remains unaffected - each object manages its own state

---

## Data Engineering Analogy

| OOP Concept | Data Engineering Equivalent |
|-------------|----------------------------|
| **Class** | Table schema / DDL (CREATE TABLE) |
| **Object/Instance** | Row in a table |
| **Attributes** | Columns in a table |
| **Method** | Stored procedure / UDF that operates on rows |
| **`__init__`** | DEFAULT values + constraints in schema |
| **Creating instance** | INSERT statement |

### Example:

```sql
-- Class definition = DDL
CREATE TABLE dogs (
    name VARCHAR(100),
    age INT,
    energy INT DEFAULT 100
);

-- Creating instances = INSERT
INSERT INTO dogs VALUES ('Rex', 5, 100);
INSERT INTO dogs VALUES ('Bella', 3, 100);

-- Each row = independent entity with same schema but different data
```

**Key insight**: Just like each row in a database table follows the same schema but contains different data, each object follows the same class structure but maintains independent state.

---

## Practical Example: DataFrameWrapper

This example shows how to wrap a pandas DataFrame in a class to add custom behavior while maintaining independence.

```python
import pandas as pd

class DataFrameWrapper:
    """Wrapper around pandas DataFrame with custom analytics"""
    
    def __init__(self, df):
        """Initialize with a DataFrame"""
        self.df = df.copy()  # Store independent copy
        self.query_count = 0  # Track usage
        self.transformations = []  # Log changes
    
    def filter_by_threshold(self, column, threshold):
        """Filter rows where column > threshold"""
        self.query_count += 1
        filtered = self.df[self.df[column] > threshold]
        self.transformations.append(f"Filtered {column} > {threshold}")
        return filtered
    
    def get_stats(self):
        """Get usage statistics for this wrapper instance"""
        return {
            'rows': len(self.df),
            'columns': len(self.df.columns),
            'queries_run': self.query_count,
            'transformations': self.transformations
        }
    
    def reset_tracking(self):
        """Reset query tracking (instance state)"""
        self.query_count = 0
        self.transformations = []


# Create sample data
sales_data = pd.DataFrame({
    'product': ['A', 'B', 'C', 'D'],
    'revenue': [100, 250, 175, 300]
})

# Create TWO independent wrappers with same data
wrapper1 = DataFrameWrapper(sales_data)
wrapper2 = DataFrameWrapper(sales_data)

# Use wrapper1
result1 = wrapper1.filter_by_threshold('revenue', 200)
print(wrapper1.get_stats())
# Output: {'rows': 4, 'columns': 2, 'queries_run': 1, 
#          'transformations': ['Filtered revenue > 200']}

# wrapper2 is completely independent
print(wrapper2.get_stats())
# Output: {'rows': 4, 'columns': 2, 'queries_run': 0, 
#          'transformations': []}

# Each wrapper tracks its own usage
wrapper2.filter_by_threshold('revenue', 150)
wrapper2.filter_by_threshold('revenue', 175)
print(wrapper2.query_count)  # Output: 2
print(wrapper1.query_count)  # Output: 1 (unchanged!)
```

### Key Observations:

🎯 **Independent Entity**: Each `DataFrameWrapper` object maintains:
- Its own copy of the DataFrame (`self.df`)
- Its own query counter (`self.query_count`)
- Its own transformation log (`self.transformations`)

🎯 **Shared Behavior**: Both objects have the same methods:
- `filter_by_threshold()`
- `get_stats()`
- `reset_tracking()`

🎯 **State Isolation**: Operations on `wrapper1` don't affect `wrapper2`

---

## The Big Picture: Independent Entities

Think of a class as a **factory** and objects as **products**:

```python
# The factory (class) defines what "Dog" means
class Dog:
    def __init__(self, name):
        self.name = name
        self.tricks = []  # Each dog learns different tricks
    
    def learn_trick(self, trick):
        self.tricks.append(trick)

# Create products (objects) from the factory
rex = Dog("Rex")
bella = Dog("Bella")

# Train them independently
rex.learn_trick("sit")
rex.learn_trick("roll over")
bella.learn_trick("fetch")

print(rex.tricks)    # ['sit', 'roll over']
print(bella.tricks)  # ['fetch']
```

**Each object is a unique entity:**
- Created from the same blueprint (class)
- Shares the same structure and behaviors (methods)
- Maintains independent state (attributes)
- Lives in separate memory locations

This is why `self` matters - it's the bridge between the shared blueprint and the unique instance.
