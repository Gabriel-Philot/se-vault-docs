from fastapi import APIRouter, HTTPException
from app.models.common import Attribute, Method, OOPClass
from app.models.page3_encapsulation import (
    AccessRequest,
    AccessResponse,
    CallMethodRequest,
    CallMethodResponse,
    EncapsulationDemo,
)
from app.state import class_registry

router = APIRouter()


@router.post("/reset")
def reset_encapsulation():
    class_registry.pop("DatabaseConnection", None)
    return {"message": "Encapsulation demo reset."}


@router.post("/access", response_model=AccessResponse)
def try_access(req: AccessRequest):
    if req.class_name not in class_registry:
        raise HTTPException(status_code=404, detail=f"Class '{req.class_name}' not found.")

    oop_class, _ = class_registry[req.class_name]

    attr = next((a for a in oop_class.attributes if a.name == req.attribute_name), None)
    if attr is None:
        raise HTTPException(
            status_code=404,
            detail=f"Attribute '{req.attribute_name}' not found on class '{req.class_name}'.",
        )

    python_code = f"{req.instance_name}.{req.attribute_name}"

    if attr.is_private:
        return AccessResponse(
            allowed=False,
            message=f"Access denied: '{req.attribute_name}' is private. Use a getter method instead.",
            python_code=f"# This would raise an AttributeError by convention:\n{python_code}  # ❌ private attribute",
        )

    return AccessResponse(
        allowed=True,
        message=f"Access allowed: '{req.attribute_name}' is public.",
        python_code=f"print({python_code})  # ✅ public attribute",
        value=attr.value,
    )


@router.post("/call-method", response_model=CallMethodResponse)
def call_method(req: CallMethodRequest):
    if req.class_name not in class_registry:
        raise HTTPException(status_code=404, detail=f"Class '{req.class_name}' not found.")

    oop_class, _ = class_registry[req.class_name]

    method = next((m for m in oop_class.methods if m.name == req.method_name), None)
    if method is None:
        raise HTTPException(
            status_code=404,
            detail=f"Method '{req.method_name}' not found on class '{req.class_name}'.",
        )

    args_str = ", ".join(req.args)
    call_code = f"{req.instance_name}.{req.method_name}({args_str})"

    # Determine if it's a getter or setter by convention
    if req.method_name.startswith("get_"):
        attr_name = f"_{req.method_name[4:]}"
        return CallMethodResponse(
            success=True,
            message=f"Getter '{req.method_name}' called — safely reads private attribute '{attr_name}'.",
            python_code=f"result = {call_code}\nprint(result)",
            result=f"<value of {attr_name}>",
        )
    elif req.method_name.startswith("set_"):
        attr_name = f"_{req.method_name[4:]}"
        return CallMethodResponse(
            success=True,
            message=f"Setter '{req.method_name}' called — safely updates private attribute '{attr_name}'.",
            python_code=f"{call_code}",
            result=f"{attr_name} updated",
        )
    else:
        return CallMethodResponse(
            success=True,
            message=f"Method '{req.method_name}' called successfully.",
            python_code=f"result = {call_code}\nprint(result)",
            result=f"<return value of {req.method_name}>",
        )


@router.get("/demo", response_model=EncapsulationDemo)
def get_demo():
    demo_class = OOPClass(
        name="DatabaseConnection",
        attributes=[
            Attribute(name="host", type_hint="str", is_private=False, value="localhost"),
            Attribute(name="port", type_hint="int", is_private=False, value="5432"),
            Attribute(name="_username", type_hint="str", is_private=True, value="admin"),
            Attribute(name="_password", type_hint="str", is_private=True, value="s3cret"),
        ],
        methods=[
            Method(name="get_username", params=[], body="return self._username"),
            Method(name="get_password", params=[], body='return "***" + self._password[-3:]'),
            Method(name="set_password", params=["new_password: str"], body="self._password = new_password"),
            Method(name="connect", params=[], body='return f"Connected to {self.host}:{self.port}"'),
        ],
    )

    # Register the demo class in shared state so other endpoints can use it
    from app.codegen import generate_class_code

    python_code = generate_class_code(demo_class)
    class_registry[demo_class.name] = (demo_class, python_code)

    public_attrs = [a for a in demo_class.attributes if not a.is_private]
    private_attrs = [a for a in demo_class.attributes if a.is_private]
    getters = [m.name for m in demo_class.methods if m.name.startswith("get_")]
    setters = [m.name for m in demo_class.methods if m.name.startswith("set_")]

    return EncapsulationDemo(
        class_name=demo_class.name,
        public_attrs=public_attrs,
        private_attrs=private_attrs,
        getters=getters,
        setters=setters,
        python_code=python_code,
    )
