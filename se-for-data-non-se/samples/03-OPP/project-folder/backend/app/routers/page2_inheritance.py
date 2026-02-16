from fastapi import APIRouter, HTTPException
from app.models.common import OOPClass, Attribute, Method
from app.models.page2_inheritance import (
    InheritanceTree,
    TreeNode,
    CreateChildRequest,
    CreateChildResponse,
    ResolvedClassResponse,
)
from app.state import class_registry

router = APIRouter()


def _resolve_attributes(name: str) -> list[Attribute]:
    """Walk the inheritance chain and collect all attributes (parent-first)."""
    if name not in class_registry:
        return []
    oop_class, _ = class_registry[name]
    parent_attrs = _resolve_attributes(oop_class.parent) if oop_class.parent else []
    own_names = {a.name for a in oop_class.attributes}
    # Keep parent attrs that aren't shadowed by own attrs
    merged = [a for a in parent_attrs if a.name not in own_names]
    merged.extend(oop_class.attributes)
    return merged


def _resolve_methods(name: str) -> list[Method]:
    """Walk the inheritance chain and collect all methods (parent-first)."""
    if name not in class_registry:
        return []
    oop_class, _ = class_registry[name]
    parent_methods = _resolve_methods(oop_class.parent) if oop_class.parent else []
    own_names = {m.name for m in oop_class.methods}
    # Keep parent methods that aren't overridden
    merged = [m for m in parent_methods if m.name not in own_names]
    merged.extend(oop_class.methods)
    return merged


def _generate_child_code(child: OOPClass, all_attrs: list[Attribute], all_methods: list[Method]) -> str:
    """Generate Python code for a child class with inheritance."""
    parent_part = f"({child.parent})" if child.parent else ""
    lines: list[str] = [f"class {child.name}{parent_part}:"]

    # __init__ with all resolved attributes, calling super().__init__ for parent attrs
    if all_attrs:
        init_params = ["self"]
        for attr in all_attrs:
            init_params.append(f"{attr.name.lstrip('_')}: {attr.type_hint}")
        lines.append(f"    def __init__({', '.join(init_params)}):")

        if child.parent:
            parent_class, _ = class_registry[child.parent]
            parent_attr_names = {a.name for a in parent_class.attributes}
            super_args = [a.name.lstrip("_") for a in all_attrs if a.name in parent_attr_names]
            if super_args:
                lines.append(f"        super().__init__({', '.join(super_args)})")

        own_attr_names = {a.name for a in child.attributes}
        for attr in all_attrs:
            if attr.name in own_attr_names:
                lines.append(f"        self.{attr.name} = {attr.name.lstrip('_')}")

    # Own methods (non-inherited)
    for method in all_methods:
        if not method.is_inherited:
            params = ", ".join(["self"] + method.params)
            lines.append("")
            lines.append(f"    def {method.name}({params}):")
            for body_line in method.body.strip().splitlines():
                lines.append(f"        {body_line}")

    if len(lines) == 1:
        lines.append("    pass")

    return "\n".join(lines)


@router.get("/tree", response_model=InheritanceTree)
def get_tree():
    children_map: dict[str | None, list[str]] = {}
    for name, (oop_class, _) in class_registry.items():
        children_map.setdefault(oop_class.parent, []).append(name)

    nodes: list[TreeNode] = []
    for name, (oop_class, _) in class_registry.items():
        nodes.append(
            TreeNode(
                name=name,
                parent=oop_class.parent,
                children=children_map.get(name, []),
                attributes=oop_class.attributes,
                methods=oop_class.methods,
            )
        )
    return InheritanceTree(nodes=nodes)


@router.post("/create-child", response_model=CreateChildResponse)
def create_child(req: CreateChildRequest):
    if req.parent_name not in class_registry:
        raise HTTPException(status_code=404, detail=f"Parent class '{req.parent_name}' not found.")

    parent_class, _ = class_registry[req.parent_name]

    # Inherited attributes from parent (marked is_inherited via resolution)
    inherited_attrs = _resolve_attributes(req.parent_name)

    # Inherited methods from parent
    inherited_methods: list[Method] = []
    overridden_names = {m.name for m in req.overridden_methods}
    for m in _resolve_methods(req.parent_name):
        if m.name not in overridden_names:
            inherited_methods.append(
                Method(name=m.name, params=m.params, body=m.body, is_inherited=True)
            )

    # Overridden methods
    overridden = [
        Method(name=m.name, params=m.params, body=m.body, is_inherited=False, is_overridden=True)
        for m in req.overridden_methods
    ]

    all_attrs = inherited_attrs + req.own_attributes
    all_methods = inherited_methods + overridden + req.own_methods

    child = OOPClass(
        name=req.child_name,
        parent=req.parent_name,
        attributes=req.own_attributes,
        methods=overridden + req.own_methods,
    )

    python_code = _generate_child_code(child, all_attrs, all_methods)
    class_registry[child.name] = (child, python_code)

    return CreateChildResponse(
        child=child,
        python_code=python_code,
        message=f"Class '{child.name}' created inheriting from '{req.parent_name}'.",
    )


@router.get("/{name}/resolved", response_model=ResolvedClassResponse)
def get_resolved(name: str):
    if name not in class_registry:
        raise HTTPException(status_code=404, detail=f"Class '{name}' not found.")

    oop_class, _ = class_registry[name]
    all_attrs = _resolve_attributes(name)
    all_methods = _resolve_methods(name)
    python_code = _generate_child_code(oop_class, all_attrs, all_methods)

    return ResolvedClassResponse(
        name=name,
        parent=oop_class.parent,
        all_attributes=all_attrs,
        all_methods=all_methods,
        python_code=python_code,
    )
