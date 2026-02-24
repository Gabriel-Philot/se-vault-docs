import type { PanelId } from "./types";

export const ASCII_PRINTABLE_START = 32;

export const PANEL_CONFIG: Array<{
  id: PanelId;
  label: string;
  accent: string;
}> = [
  { id: "bytes", label: "Bytes Explorer", accent: "ci-cyan" },
  { id: "shell", label: "Shell & Process", accent: "ci-green" },
  { id: "compiler", label: "Compiled vs Interpreted", accent: "ci-amber" },
  { id: "memory", label: "Stack vs Heap", accent: "ci-purple" },
];

export const C_SNIPPETS: Array<{ name: string; code: string }> = [
  {
    name: "fibonacci",
    code: `#include <stdio.h>
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
int main() {
    printf("fibonacci(10) = %d\\n", fibonacci(10));
    return 0;
}`,
  },
  {
    name: "malloc_demo",
    code: `#include <stdio.h>
#include <stdlib.h>
int main() {
    int *arr = (int *)malloc(10 * sizeof(int));
    for (int i = 0; i < 10; i++) arr[i] = i * i;
    printf("arr[5] = %d\\n", arr[5]);
    free(arr);
    return 0;
}`,
  },
  {
    name: "stack_overflow",
    code: `#include <stdio.h>
void recurse(int depth) {
    int local_var = depth;
    printf("depth: %d, addr: %p\\n", depth, (void *)&local_var);
    recurse(depth + 1);
}
int main() {
    recurse(0);
    return 0;
}`,
  },
];

export const PY_SNIPPETS: Array<{ name: string; code: string }> = [
  {
    name: "fibonacci",
    code: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(f"fibonacci(10) = {fibonacci(10)}")`,
  },
  {
    name: "memory_demo",
    code: `def create_objects():
    a = [1, 2, 3]
    b = a
    c = [4, 5, 6]
    del a
    return b, c

result = create_objects()
print(result)`,
  },
  {
    name: "refcount_demo",
    code: `import sys
a = [1, 2, 3]
print(f"refcount: {sys.getrefcount(a)}")
b = a
print(f"refcount after b=a: {sys.getrefcount(a)}")
del b
print(f"refcount after del b: {sys.getrefcount(a)}")`,
  },
];
