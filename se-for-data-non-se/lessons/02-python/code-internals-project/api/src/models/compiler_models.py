from __future__ import annotations
from pydantic import BaseModel


class CompileCRequest(BaseModel):
    code: str
    optimization: str = "-O0"


class CompileStage(BaseModel):
    name: str
    status: str  # "success", "error"
    output_preview: str | None = None
    time_ms: float
    object_size: int | None = None
    binary_size: int | None = None


class CompileCResponse(BaseModel):
    stages: list[CompileStage]
    output: str
    exec_time_ms: float
    compile_time_ms: float
    binary_size: int
    peak_rss_kb: int | None = None


class InterpretPythonRequest(BaseModel):
    code: str


class Opcode(BaseModel):
    offset: int
    opname: str
    arg: int | None = None
    argval: str | None = None
    line: int | None = None


class InterpretPythonResponse(BaseModel):
    bytecode_raw: str
    opcodes: list[Opcode]
    output: str
    exec_time_ms: float
    pyc_size: int
    peak_rss_kb: int | None = None
    error: str | None = None
