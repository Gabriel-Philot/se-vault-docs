"""Shared in-memory state used across routers."""

from app.models.common import OOPClass

# class name -> (OOPClass, python_code)
class_registry: dict[str, tuple[OOPClass, str]] = {}
