from __future__ import annotations
from pydantic import BaseModel


class BytesCompareRequest(BaseModel):
    value: str
    type: str = "int"  # int, float, str, char


class TypeSizeDetail(BaseModel):
    base_size: int
    overhead: str
    components: list[str]


class BytesCompareResponse(BaseModel):
    c_size: int
    py_size: int
    c_type: str
    py_type: str
    details: dict[str, TypeSizeDetail]


class BytesEncodeRequest(BaseModel):
    text: str
    encoding: str = "utf-8"


class BytesEncodeResponse(BaseModel):
    bytes_list: list[int]
    binary: list[str]
    hex: list[str]
    total_bytes: int
