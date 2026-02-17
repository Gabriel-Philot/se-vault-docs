from pydantic import BaseModel
from .common import Attribute, Method, OOPClass, OOPInstance


class CreateClassRequest(BaseModel):
    oop_class: OOPClass


class CreateClassResponse(BaseModel):
    name: str
    python_code: str
    message: str


class InstantiateRequest(BaseModel):
    class_name: str
    instance_name: str
    attribute_values: dict[str, str]


class InstantiateResponse(BaseModel):
    instance: OOPInstance
    python_code: str
    message: str


class ClassCodeResponse(BaseModel):
    name: str
    python_code: str


class ExecuteRequest(BaseModel):
    code: str
