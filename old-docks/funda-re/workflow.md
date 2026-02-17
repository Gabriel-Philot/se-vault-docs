## Workflow

---
description: Extract SE fundamentals content from URLs into documents
---
# SE Fundamentals Content Extraction Workflow
This workflow extracts real content from URLs about Software Engineering fundamentals and saves them in separate markdown documents for NotebookLLM import.
## How to Use
In each new conversation, execute:
```
Execute task [NUMBER] from extract-se-docs workflow, saving to ~/Documents/studies/se-vault/funda-re/[FILE_NAME].md
```
Example:
```
Execute task 1 from extract-se-docs workflow, saving to ~/Documents/studies/se-vault/funda-re/stack-heap.md
```
---
## Task 1: Stack vs Heap Memory
**Objective:** Extract complete content about stack and heap memory
**URLs to process:**
1. https://www.baeldung.com/java-stack-heap
2. https://www.geeksforgeeks.org/stack-vs-heap-memory-allocation/
3. https://www.educative.io/answers/stack-vs-heap-memory
4. https://courses.cs.vt.edu/~cs2505/fall2018/notes/T02.MemoryOrganization.pdf
5. https://courses.engr.illinois.edu/cs225/fa2022/resources/stack-heap/
6. https://stackoverflow.com/questions/79923/what-and-where-are-the-stack-and-heap
7. https://medium.com/@CodeWithHonor/difference-between-stack-and-heap-memory-4d2all904ed7
**Steps:**
1. Use `read_url_content` for each URL above
2. For each article, extract:
   - Technical definitions of stack and heap
   - Fundamental differences (LIFO, allocation, speed, size limits)
   - Use cases (when to use each)
   - Performance implications
   - Relevant diagrams or code examples
3. Organize extracted content into sections:
   - **Fundamentals**: What stack/heap are
   - **Technical Differences**: Comparison table
   - **Performance**: Speed, cache, memory access patterns
   - **Use Cases**: When to use each
   - **Code Examples**: Practical examples
4. Save everything in a single well-formatted markdown document
5. Include citations and source links in footer of each section
**Expected output:** 1 markdown file (~3000-5000 words) with consolidated technical content
---
## Task 2: Python vs C - Language Differences
**Objective:** Extract content about differences between Python and C
**URLs to process:**
1. https://unstop.com/blog/difference-between-c-and-python
2. https://www.nerdyelectronics.com/python-vs-c-speed/
3. https://www.geeksforgeeks.org/difference-between-c-and-python/
4. https://medium.com/@tyastropheus/tricky-python-ii-memory-management-3e7b7b581a08
5. https://www.reddit.com/r/learnprogramming/comments/iugflp/c_vs_python_memory_management/
6. https://medium.com/@lucasvanmol/memory-management-in-c-vs-python-ed55524b7d40
7. https://www.reddit.com/r/learnprogramming/comments/u6pmfp/is_python_compiled_or_interpreted/
8. https://www.geeksforgeeks.org/is-python-compiled-or-interpreted-language/
9. https://stackoverflow.com/questions/6889747/is-python-interpreted-or-compiled-or-both
**Steps:**
1. Use `read_url_content` for each URL
2. For each article, extract:
   - Execution models (compiled vs interpreted/bytecode)
   - Memory management (manual vs automatic/GC)
   - Performance benchmarks and concrete numbers
   - Development vs execution trade-offs
   - Pointers vs references
   - Side-by-side code examples
3. Organize into sections:
   - **Execution Models**: Compilation, interpretation, bytecode
   - **Memory Management**: malloc/free vs GC, overhead comparisons
   - **Performance**: Benchmarks, speed comparisons, use cases
   - **Development Trade-offs**: Dev speed vs runtime speed
   - **When to Choose Each**: Decision framework
4. Save in markdown document
5. Include comparison tables and benchmarks with numbers
**Expected output:** 1 markdown file (~3000-5000 words)
---
## Task 3: Python OOP - When to Use & Limitations
**Objective:** Extract content about OOP in Python, use cases and limitations
**URLs to process:**
1. https://www.w3schools.com/python/python_classes.asp
2. https://realpython.com/python3-object-oriented-programming/
3. https://www.youtube.com/watch?v=pTB0EiLXUC8
4. https://python.plainenglish.io/5-disadvantages-of-object-oriented-programming-in-python-99e1d1b5e42e
5. https://www.quora.com/Why-is-object-oriented-programming-in-Python-slow
6. https://python.plainenglish.io/why-is-python-so-slow-understanding-the-performance-limitations-a5d0c5d0e6ae
7. https://www.reddit.com/r/learnpython/comments/11fzi40/when_to_use_oop_and_when_not_to/
8. https://codefinity.com/blog/Functional-Programming-in-Python
9. https://www.qodo.ai/blog/oop-vs-functional-programming-in-python/
10. https://www.datacamp.com/tutorial/functional-programming-in-python
11. https://medium.com/@shaistha24/functional-programming-vs-object-oriented-programming-oop-which-is-better-82172e53a526
**Steps:**
1. Use `read_url_content` for each URL
2. For each article, extract:
   - OOP principles (encapsulation, inheritance, polymorphism)
   - When OOP makes sense (ideal use cases)
   - Limitations and drawbacks (performance, complexity, GIL)
   - OOP vs Functional Programming in Python
   - Practical examples of each paradigm
   - Anti-patterns (over-engineering, misuse)
3. Organize into sections:
   - **OOP Fundamentals**: Basic principles
   - **When to Use OOP**: Complex systems, frameworks, stateful logic
   - **OOP Limitations**: Performance overhead, complexity, memory
   - **When NOT to Use OOP**: Data pipelines, simple scripts, parallel processing
   - **OOP vs Functional**: Trade-offs, decision framework
   - **Code Examples**: Practical comparisons
4. Save in markdown document
5. Include code examples showing each paradigm
**Expected output:** 1 markdown file (~3500-6000 words)
---
## Task 4: Best Practices & Common Pitfalls
**Objective:** Extract content about optimization, debugging and common errors
**URLs to process:**
1. https://stackoverflow.com/questions/24057331/is-accessing-data-in-the-heap-faster-than-from-the-stack
2. https://levelup.gitconnected.com/a-guide-to-memory-management-in-go-e52891e9b678
3. https://medium.com/@CodeWithHonor/understanding-stack-and-heap-memory-2daac281326e
4. https://medium.com/@sameh.sherif04/common-memory-management-mistakes-in-c-and-how-to-avoid-them-ae94d214a19b
5. https://www.hoist-point.com/memory-management-in-c-best-practices/
**Steps:**
1. Use `read_url_content` for each URL
2. For each article, extract:
   - Optimization strategies (object pooling, pre-allocation, escape analysis)
   - Common pitfalls (memory leaks, stack overflow, dangling pointers, double free)
   - Debugging techniques (Valgrind, profiling)
   - Performance optimization patterns
   - Memory alignment and cache considerations
   - Smart pointers and RAII patterns
3. Organize into sections:
   - **Optimization Strategies**: Concrete techniques with examples
   - **Common Pitfalls**: Stack overflow, memory leaks, fragmentation
   - **Prevention Techniques**: How to avoid each problem
   - **Debugging Tools**: Valgrind, sanitizers, profilers
   - **Senior Engineer Checklist**: Summarized best practices
4. Save in markdown document
5. Include code snippets of common errors and solutions
**Expected output:** 1 markdown file (~2500-4000 words)
---
## Technical Notes
**For failing URLs:**
- If PDF or video (YouTube), document that it requires manual extraction
- Continue with other links
- At the end, list which URLs failed and why
**Final document formatting:**
- Use markdown headers (##, ###)
- Code blocks with syntax highlighting
- Tables for comparisons
- Blockquotes for important concepts
- Links back to original source in each section
**Quality over quantity:**
- Focus on dense technical content
- Remove marketing fluff and ads
- Keep relevant code examples
- Preserve benchmarks and concrete numbers