from __future__ import annotations

import os

SANDBOX_PY_CONTAINER = os.getenv("SANDBOX_PY_CONTAINER", "code-internals-sandbox-py")
SANDBOX_C_CONTAINER = os.getenv("SANDBOX_C_CONTAINER", "code-internals-sandbox-c")
EXECUTION_TIMEOUT = int(os.getenv("EXECUTION_TIMEOUT", "5"))

MAX_CODE_LENGTH = 5000
MAX_OUTPUT_LENGTH = 10000
