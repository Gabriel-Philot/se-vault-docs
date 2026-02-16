from fastapi import APIRouter, HTTPException
from app.models.common import OOPClass, OOPInstance, Attribute
from app.models.page1_classes import (
    CreateClassRequest,
    CreateClassResponse,
    InstantiateRequest,
    InstantiateResponse,
    ClassCodeResponse,
)
from app.state import class_registry
from app.codegen import generate_class_code

router = APIRouter()


@router.post("/create", response_model=CreateClassResponse)
def create_class(req: CreateClassRequest):
    oop_class = req.oop_class
    python_code = generate_class_code(oop_class)
    class_registry[oop_class.name] = (oop_class, python_code)
    return CreateClassResponse(
        name=oop_class.name,
        python_code=python_code,
        message=f"Class '{oop_class.name}' created with {len(oop_class.attributes)} attribute(s) and {len(oop_class.methods)} method(s).",
    )


@router.post("/instantiate", response_model=InstantiateResponse)
def instantiate_class(req: InstantiateRequest):
    if req.class_name not in class_registry:
        raise HTTPException(status_code=404, detail=f"Class '{req.class_name}' not found. Create it first.")

    oop_class, _ = class_registry[req.class_name]

    # Build instance attributes with provided values
    instance_attrs: list[Attribute] = []
    for attr in oop_class.attributes:
        value = req.attribute_values.get(attr.name, attr.value)
        instance_attrs.append(
            Attribute(
                name=attr.name,
                type_hint=attr.type_hint,
                is_private=attr.is_private,
                value=value,
            )
        )

    instance = OOPInstance(
        class_name=req.class_name,
        instance_name=req.instance_name,
        attributes=instance_attrs,
    )

    # Generate instantiation code
    arg_parts = [f"{a.name.lstrip('_')}={_format_value(a)}" for a in instance_attrs]
    python_code = f"{req.instance_name} = {req.class_name}({', '.join(arg_parts)})"

    return InstantiateResponse(
        instance=instance,
        python_code=python_code,
        message=f"Instance '{req.instance_name}' of class '{req.class_name}' created.",
    )


@router.get("/{name}/code", response_model=ClassCodeResponse)
def get_class_code(name: str):
    if name not in class_registry:
        raise HTTPException(status_code=404, detail=f"Class '{name}' not found.")
    _, python_code = class_registry[name]
    return ClassCodeResponse(name=name, python_code=python_code)


def _format_value(attr: Attribute) -> str:
    """Format an attribute value for Python code generation."""
    if attr.value is None:
        return "None"
    if attr.type_hint == "str":
        return f"'{attr.value}'"
    return attr.value
