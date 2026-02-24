from __future__ import annotations

import json
import struct

from fastapi import APIRouter, HTTPException

from src.config import SANDBOX_PY_CONTAINER, SANDBOX_C_CONTAINER
from src.models.bytes_models import (
    BytesCompareRequest,
    BytesCompareResponse,
    BytesEncodeRequest,
    BytesEncodeResponse,
    TypeSizeDetail,
)
from src.services.sandbox import run_in_sandbox

router = APIRouter()

# C type sizes (standard on x86_64)
C_TYPE_SIZES = {
    "int": 4,
    "float": 4,
    "double": 8,
    "char": 1,
    "long": 8,
    "short": 2,
    "str": None,  # depends on length
}


@router.post("/compare", response_model=BytesCompareResponse)
async def compare_sizes(req: BytesCompareRequest):
    """Compare C vs Python type sizes for a given value."""
    c_type = req.type if req.type in C_TYPE_SIZES else "int"

    # Get C size
    if c_type == "str":
        c_size = len(req.value) + 1  # +1 for null terminator
        c_type_name = f"char[{c_size}]"
    else:
        c_size = C_TYPE_SIZES.get(c_type, 4)
        c_type_name = c_type

    # Get Python size via sandbox
    py_code = f"import sys; print(sys.getsizeof({repr(req.value) if req.type == 'str' else req.value}))"
    try:
        exit_code, stdout, stderr = run_in_sandbox(
            SANDBOX_PY_CONTAINER,
            ["python3", "-c", py_code],
        )
        py_size = int(stdout.strip()) if exit_code == 0 and stdout.strip().isdigit() else 28
    except Exception:
        # Fallback to known Python sizes
        py_size_map = {"int": 28, "float": 24, "str": 49 + len(req.value), "char": 50}
        py_size = py_size_map.get(req.type, 28)

    py_type = {"int": "int", "float": "float", "str": "str", "char": "str"}.get(req.type, "int")

    details = {
        "c": TypeSizeDetail(
            base_size=c_size,
            overhead="none (raw value)",
            components=[f"{c_type_name}: {c_size} bytes"],
        ),
        "python": TypeSizeDetail(
            base_size=py_size,
            overhead="PyObject header (refcount + type pointer + value)",
            components=[
                "ob_refcnt: 8 bytes",
                "ob_type: 8 bytes",
                f"ob_size + value: {py_size - 16} bytes",
            ],
        ),
    }

    return BytesCompareResponse(
        c_size=c_size,
        py_size=py_size,
        c_type=c_type_name,
        py_type=py_type,
        details=details,
    )


@router.post("/encode", response_model=BytesEncodeResponse)
async def encode_text(req: BytesEncodeRequest):
    """Encode text and return byte representations."""
    try:
        encoded = req.text.encode(req.encoding)
    except (UnicodeEncodeError, LookupError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    bytes_list = list(encoded)
    binary = [f"{b:08b}" for b in encoded]
    hex_list = [f"{b:02x}" for b in encoded]

    return BytesEncodeResponse(
        bytes_list=bytes_list,
        binary=binary,
        hex=hex_list,
        total_bytes=len(encoded),
    )
