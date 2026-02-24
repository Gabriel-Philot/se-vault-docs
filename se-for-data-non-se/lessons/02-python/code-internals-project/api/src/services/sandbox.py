from __future__ import annotations

import shlex
import uuid

import docker
from docker.errors import APIError, NotFound

from src.config import EXECUTION_TIMEOUT, MAX_CODE_LENGTH, MAX_OUTPUT_LENGTH

BLOCKED_IMPORTS = {
    "os",
    "subprocess",
    "shutil",
    "socket",
    "http",
    "urllib",
    "ftplib",
    "smtplib",
    "telnetlib",
    "ctypes",
    "multiprocessing",
    "threading",
    "signal",
    "resource",
    "pty",
    "fcntl",
}

BLOCKED_C_FUNCTIONS = {
    "system",
    "popen",
    "execve",
    "execvp",
    "socket",
    "connect",
    "bind",
    "listen",
}

BLOCKED_C_HEADERS = {
    "sys/socket.h",
    "netinet/in.h",
    "arpa/inet.h",
    "sys/ptrace.h",
}

_client: docker.DockerClient | None = None


def get_docker_client() -> docker.DockerClient:
    global _client
    if _client is None:
        _client = docker.from_env()
    return _client


def validate_python_code(code: str) -> str | None:
    if len(code) > MAX_CODE_LENGTH:
        return f"Code too long ({len(code)} chars, max {MAX_CODE_LENGTH})"
    for imp in BLOCKED_IMPORTS:
        if f"import {imp}" in code or f"from {imp}" in code:
            return f"Blocked import: {imp}"
    return None


def validate_c_code(code: str) -> str | None:
    if len(code) > MAX_CODE_LENGTH:
        return f"Code too long ({len(code)} chars, max {MAX_CODE_LENGTH})"
    for func in BLOCKED_C_FUNCTIONS:
        if f"{func}(" in code:
            return f"Blocked function: {func}"
    for header in BLOCKED_C_HEADERS:
        if f"#include <{header}>" in code or f'#include "{header}"' in code:
            return f"Blocked header: {header}"
    return None


def run_in_sandbox(
    container_name: str,
    command: list[str],
    stdin_data: str | None = None,
    timeout: int = EXECUTION_TIMEOUT,
) -> tuple[int, str, str]:
    """Execute a command in a running sandbox container via docker exec.

    Returns (exit_code, stdout, stderr).
    """
    client = get_docker_client()
    try:
        container = client.containers.get(container_name)
    except NotFound:
        raise RuntimeError(f"Sandbox container '{container_name}' not found")

    if stdin_data is not None:
        marker = f"MM_EOF_{uuid.uuid4().hex}"
        shell_command = (
            "tmp_file=/tmp/stdin.mm && "
            f"cat <<'{marker}' > \"$tmp_file\"\n"
            f"{stdin_data}\n"
            f"{marker}\n"
            f'{shlex.join(command)} < "$tmp_file"; '
            'status=$?; rm -f "$tmp_file"; exit $status'
        )
        command = ["sh", "-lc", shell_command]
        stdin_data = None

    try:
        exec_result = container.exec_run(
            command,
            stdin=False,
            stdout=True,
            stderr=True,
            demux=True,
            environment={"TIMEOUT": str(timeout)},
        )
    except APIError as e:
        raise RuntimeError(f"Sandbox command failed: {e.explanation or str(e)}")

    stdout_data = ""
    stderr_data = ""
    if exec_result.output:
        if isinstance(exec_result.output, tuple):
            stdout_raw, stderr_raw = exec_result.output
            stdout_data = (stdout_raw or b"").decode(errors="replace")[
                :MAX_OUTPUT_LENGTH
            ]
            stderr_data = (stderr_raw or b"").decode(errors="replace")[
                :MAX_OUTPUT_LENGTH
            ]
        else:
            stdout_data = exec_result.output.decode(errors="replace")[
                :MAX_OUTPUT_LENGTH
            ]

    return exec_result.exit_code or 0, stdout_data, stderr_data
