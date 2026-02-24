from __future__ import annotations
from pydantic import BaseModel


class ShellExecRequest(BaseModel):
    command: str
    user: str = "alice"


class ShellEvent(BaseModel):
    stream: str  # "stdout", "stderr", "system"
    data: str
    step: int = 0
    pipe_stage: int | None = None
    cwd: str | None = None


class FilesystemNode(BaseModel):
    name: str
    type: str  # "dir" or "file"
    permissions: str
    owner: str
    group: str
    children: list[FilesystemNode] | None = None
    content: str | None = None


class FilesystemResponse(BaseModel):
    tree: FilesystemNode
    users: list[str]


class SwitchUserRequest(BaseModel):
    user: str


class SwitchUserResponse(BaseModel):
    user: str
    home: str
    env: dict[str, str]
