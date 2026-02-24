from __future__ import annotations
from pydantic import BaseModel


class MemoryTraceRequest(BaseModel):
    code: str


class MemoryTraceResponse(BaseModel):
    session_id: str
    total_steps: int


class StackVariable(BaseModel):
    name: str
    type: str
    value: str
    points_to_heap: bool = False


class StackFrame(BaseModel):
    function: str
    variables: list[StackVariable]
    return_addr: str = "0x0"


class HeapBlock(BaseModel):
    address: str
    size: int
    type: str
    status: str  # "allocated", "freed"
    allocated_by: str


class StepResponse(BaseModel):
    step: int
    line: int
    action: str  # "stack_push", "stack_pop", "heap_alloc", "heap_free", "line"
    description: str
    stack: list[StackFrame]
    heap: list[HeapBlock]
    refcounts: dict[str, int] | None = None
