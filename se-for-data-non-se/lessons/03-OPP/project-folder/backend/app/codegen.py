"""Shared code generation utilities used across routers."""

from app.models.common import OOPClass


def generate_class_code(oop_class: OOPClass) -> str:
    """Generate a real Python class definition string from an OOPClass model."""
    lines: list[str] = []
    lines.append(f"class {oop_class.name}:")

    # Build __init__
    init_params = ["self"]
    init_body: list[str] = []
    for attr in oop_class.attributes:
        param_name = attr.name.lstrip("_")
        init_params.append(f"{param_name}: {attr.type_hint}")
        init_body.append(f"        self.{attr.name} = {param_name}")

    if init_body or not oop_class.methods:
        lines.append(f"    def __init__({', '.join(init_params)}):")
        if init_body:
            lines.extend(init_body)
        else:
            lines.append("        pass")

    # Additional methods
    for method in oop_class.methods:
        params = ", ".join(["self"] + method.params)
        lines.append("")
        lines.append(f"    def {method.name}({params}):")
        for body_line in method.body.strip().splitlines():
            lines.append(f"        {body_line}")

    # Handle completely empty class
    if len(lines) == 1:
        lines.append("    pass")

    return "\n".join(lines)
