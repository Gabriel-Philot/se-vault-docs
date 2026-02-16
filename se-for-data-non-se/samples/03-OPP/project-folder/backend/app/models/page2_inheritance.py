from pydantic import BaseModel
from .common import Attribute, Method, OOPClass


class TreeNode(BaseModel):
    name: str
    parent: str | None = None
    children: list[str] = []
    attributes: list[Attribute] = []
    methods: list[Method] = []


class InheritanceTree(BaseModel):
    nodes: list[TreeNode]


class CreateChildRequest(BaseModel):
    child_name: str
    parent_name: str
    own_attributes: list[Attribute] = []
    own_methods: list[Method] = []
    overridden_methods: list[Method] = []


class CreateChildResponse(BaseModel):
    child: OOPClass
    python_code: str
    message: str


class ResolvedClassResponse(BaseModel):
    name: str
    parent: str | None
    all_attributes: list[Attribute]
    all_methods: list[Method]
    python_code: str
