from pydantic import BaseModel
from .common import Attribute


class AccessRequest(BaseModel):
    class_name: str
    instance_name: str
    attribute_name: str


class AccessResponse(BaseModel):
    allowed: bool
    message: str
    python_code: str
    value: str | None = None


class CallMethodRequest(BaseModel):
    class_name: str
    instance_name: str
    method_name: str
    args: list[str] = []


class CallMethodResponse(BaseModel):
    success: bool
    message: str
    python_code: str
    result: str | None = None


class EncapsulationDemo(BaseModel):
    class_name: str
    public_attrs: list[Attribute]
    private_attrs: list[Attribute]
    getters: list[str]
    setters: list[str]
    python_code: str
