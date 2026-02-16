from pydantic import BaseModel


class Attribute(BaseModel):
    name: str
    type_hint: str  # "str", "int", "float", etc.
    is_private: bool  # starts with _
    value: str | None = None  # current value (for instances)


class Method(BaseModel):
    name: str
    params: list[str]
    body: str  # Python code
    is_inherited: bool = False
    is_overridden: bool = False


class OOPClass(BaseModel):
    name: str
    parent: str | None = None
    attributes: list[Attribute] = []
    methods: list[Method] = []


class OOPInstance(BaseModel):
    class_name: str
    instance_name: str
    attributes: list[Attribute]  # with actual values


class ExecutionResult(BaseModel):
    stdout: str
    python_code: str
    success: bool
    error: str | None = None
