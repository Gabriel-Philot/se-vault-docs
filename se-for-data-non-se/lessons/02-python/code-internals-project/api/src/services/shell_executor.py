from __future__ import annotations

import json
import shlex
from typing import AsyncIterator

from src.models.shell_models import (
    FilesystemNode,
    FilesystemResponse,
    ShellEvent,
    SwitchUserResponse,
)

SHELL_WHITELIST = {
    "ls",
    "cat",
    "echo",
    "grep",
    "wc",
    "head",
    "tail",
    "sort",
    "uniq",
    "tr",
    "cut",
    "sed",
    "awk",
    "tee",
    "diff",
    "comm",
    "cd",
    "pwd",
    "whoami",
    "id",
    "chmod",
    "env",
    "printenv",
    "export",
    "date",
    "uname",
    "mkdir",
    "touch",
}

BLOCKED_COMMANDS = {
    "rm",
    "mv",
    "cp",
    "chown",
    "sudo",
    "su",
    "apt",
    "pip",
    "python",
    "python3",
    "bash",
    "sh",
    "curl",
    "wget",
    "nc",
    "ncat",
}

USER_CONTEXTS: dict[str, dict] = {
    "alice": {
        "home": "/tmp/alice",
        "uid": 1000,
        "gid": 1000,
        "shell": "/bin/bash",
        "env": {
            "HOME": "/tmp/alice",
            "USER": "alice",
            "SHELL": "/bin/bash",
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "PWD": "/tmp/alice",
            "LANG": "en_US.UTF-8",
        },
    },
    "bob": {
        "home": "/tmp/bob",
        "uid": 1001,
        "gid": 1001,
        "shell": "/bin/bash",
        "env": {
            "HOME": "/tmp/bob",
            "USER": "bob",
            "SHELL": "/bin/bash",
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "PWD": "/tmp/bob",
            "LANG": "en_US.UTF-8",
        },
    },
    "root": {
        "home": "/tmp/root",
        "uid": 0,
        "gid": 0,
        "shell": "/bin/bash",
        "env": {
            "HOME": "/tmp/root",
            "USER": "root",
            "SHELL": "/bin/bash",
            "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "PWD": "/tmp/root",
            "LANG": "en_US.UTF-8",
        },
    },
}


def validate_command(command: str) -> str | None:
    """Validate command against whitelist. Returns error message or None."""
    parts = command.strip().split()
    if not parts:
        return "Empty command"

    # Handle pipes - validate each segment
    segments = command.split("|")
    for segment in segments:
        cmd = segment.strip().split()[0] if segment.strip() else ""
        if cmd in BLOCKED_COMMANDS:
            return f"Command not allowed: {cmd}"
        if cmd and cmd not in SHELL_WHITELIST:
            return f"Unknown command: {cmd}. Available: {', '.join(sorted(SHELL_WHITELIST))}"

    return None


def _resolve_cd_target(target: str | None, home: str, current: str) -> str:
    if not target or target == "~":
        return home
    if target.startswith("~/"):
        return home.rstrip("/") + "/" + target[2:]
    if target.startswith("/"):
        return target
    if current.endswith("/"):
        return current + target
    return current + "/" + target


def _norm_path(path: str) -> str:
    parts: list[str] = []
    for piece in path.split("/"):
        if piece == "" or piece == ".":
            continue
        if piece == "..":
            if parts:
                parts.pop()
            continue
        parts.append(piece)
    return "/" + "/".join(parts)


def _ensure_user_home(user: str) -> None:
    from src.config import SANDBOX_PY_CONTAINER
    from src.services.sandbox import run_in_sandbox

    home = USER_CONTEXTS[user]["home"]
    run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["sh", "-lc", f"mkdir -p {shlex.quote(home)}"],
    )


async def execute_shell(command: str, user: str = "alice") -> AsyncIterator[str]:
    """Execute a shell command and yield SSE events."""
    error = validate_command(command)
    if error:
        event = ShellEvent(stream="stderr", data=error, step=0)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if user not in USER_CONTEXTS:
        event = ShellEvent(stream="stderr", data=f"Unknown user: {user}", step=0)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    _ensure_user_home(user)
    ctx = USER_CONTEXTS[user]
    current_pwd = ctx["env"].get("PWD") or ctx["home"]

    # Handle built-in commands
    parts = command.strip().split()
    cmd = parts[0]

    if cmd == "cd":
        target = parts[1] if len(parts) > 1 else None
        next_dir = _norm_path(_resolve_cd_target(target, ctx["home"], current_pwd))

        from src.config import SANDBOX_PY_CONTAINER
        from src.services.sandbox import run_in_sandbox

        check_code, _, _ = run_in_sandbox(
            SANDBOX_PY_CONTAINER,
            ["sh", "-lc", f"test -d {shlex.quote(next_dir)}"],
        )

        if check_code != 0:
            event = ShellEvent(
                stream="stderr",
                data=f"cd: no such file or directory: {target or '~'}\n",
                step=1,
                cwd=current_pwd,
            )
            yield f"data: {event.model_dump_json()}\n\n"
            return

        ctx["env"]["PWD"] = next_dir
        event = ShellEvent(
            stream="system", data=f"cwd -> {next_dir}\n", step=1, cwd=next_dir
        )
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "whoami":
        event = ShellEvent(stream="stdout", data=f"{user}\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "id":
        uid = ctx["uid"]
        gid = ctx["gid"]
        event = ShellEvent(
            stream="stdout", data=f"uid={uid}({user}) gid={gid}({user})\n", step=1
        )
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "pwd":
        event = ShellEvent(
            stream="stdout",
            data=f"{ctx['env']['PWD']}\n",
            step=1,
            cwd=ctx["env"]["PWD"],
        )
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "env" or cmd == "printenv":
        lines = "\n".join(f"{k}={v}" for k, v in sorted(ctx["env"].items()))
        event = ShellEvent(stream="stdout", data=f"{lines}\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "uname":
        event = ShellEvent(
            stream="stdout",
            data="Linux sandbox 5.15.0 #1 SMP x86_64 GNU/Linux\n",
            step=1,
        )
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "date":
        event = ShellEvent(
            stream="stdout", data="Mon Jan  1 00:00:00 UTC 2024\n", step=1
        )
        yield f"data: {event.model_dump_json()}\n\n"
        return

    # For real file system commands, execute in sandbox
    from src.config import SANDBOX_PY_CONTAINER
    from src.services.sandbox import run_in_sandbox

    pwd_check, _, _ = run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["sh", "-lc", f"test -d {shlex.quote(ctx['env']['PWD'])}"],
    )
    if pwd_check != 0:
        ctx["env"]["PWD"] = ctx["home"]

    shell_command = f"cd {shlex.quote(ctx['env']['PWD'])} && {command}"
    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["sh", "-lc", shell_command],
    )

    step = 1
    if stdout:
        event = ShellEvent(stream="stdout", data=stdout, step=step)
        yield f"data: {event.model_dump_json()}\n\n"
        step += 1
    if stderr:
        event = ShellEvent(stream="stderr", data=stderr, step=step)
        yield f"data: {event.model_dump_json()}\n\n"
        step += 1

    # Signal completion
    done = ShellEvent(
        stream="system",
        data=f"done (exit={exit_code})",
        step=step,
        cwd=ctx["env"]["PWD"],
    )
    yield f"data: {done.model_dump_json()}\n\n"


def get_filesystem(user: str = "alice") -> FilesystemResponse:
    """Return a live filesystem tree for the selected user home."""
    if user not in USER_CONTEXTS:
        user = "alice"

    _ensure_user_home(user)

    from src.config import SANDBOX_PY_CONTAINER
    from src.services.sandbox import run_in_sandbox

    home = USER_CONTEXTS[user]["home"]
    script = f"""
import json
import os
import stat
import pwd
import grp

ROOT = {home!r}
MAX_DEPTH = 5
MAX_CHILDREN = 80

def perm_string(mode):
    prefix = 'd' if stat.S_ISDIR(mode) else '-'
    bits = [
        stat.S_IRUSR, stat.S_IWUSR, stat.S_IXUSR,
        stat.S_IRGRP, stat.S_IWGRP, stat.S_IXGRP,
        stat.S_IROTH, stat.S_IWOTH, stat.S_IXOTH,
    ]
    chars = []
    for i, bit in enumerate(bits):
        if mode & bit:
            chars.append('rwx'[i % 3])
        else:
            chars.append('-')
    return prefix + ''.join(chars)

def owner_name(uid):
    try:
        return pwd.getpwuid(uid).pw_name
    except KeyError:
        return str(uid)

def group_name(gid):
    try:
        return grp.getgrgid(gid).gr_name
    except KeyError:
        return str(gid)

def build_node(path, depth):
    try:
        st = os.lstat(path)
    except Exception:
        return None

    is_dir = stat.S_ISDIR(st.st_mode)
    node = {{
        'name': path if depth == 0 else os.path.basename(path),
        'type': 'directory' if is_dir else 'file',
        'permissions': perm_string(st.st_mode),
        'owner': owner_name(st.st_uid),
        'group': group_name(st.st_gid),
        'children': None,
        'content': None,
    }}

    if is_dir and depth < MAX_DEPTH:
        children = []
        try:
            entries = sorted(os.listdir(path))[:MAX_CHILDREN]
        except Exception:
            entries = []
        for name in entries:
            child_path = os.path.join(path, name)
            child = build_node(child_path, depth + 1)
            if child is not None:
                children.append(child)
        node['children'] = children

    return node

root = build_node(ROOT, 0)
if root is None:
    root = {{
        'name': ROOT,
        'type': 'directory',
        'permissions': 'd---------',
        'owner': {user!r},
        'group': {user!r},
        'children': [],
        'content': None,
    }}

print(json.dumps(root))
"""

    code, stdout, _ = run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["sh", "-lc", "python3 - <<'PY'\n" + script + "\nPY"],
    )

    if code != 0 or not stdout.strip():
        fallback = FilesystemNode(
            name=home,
            type="directory",
            permissions="drwxr-xr-x",
            owner=user,
            group=user,
            children=[],
            content=None,
        )
        return FilesystemResponse(tree=fallback, users=["alice", "bob", "root"])

    try:
        parsed = json.loads(stdout)
        tree = FilesystemNode.model_validate(parsed)
    except Exception:
        tree = FilesystemNode(
            name=home,
            type="directory",
            permissions="drwxr-xr-x",
            owner=user,
            group=user,
            children=[],
            content=None,
        )

    return FilesystemResponse(tree=tree, users=["alice", "bob", "root"])


def switch_user(user: str) -> SwitchUserResponse:
    """Switch the active user context."""
    if user not in USER_CONTEXTS:
        raise ValueError(f"Unknown user: {user}")

    ctx = USER_CONTEXTS[user]
    return SwitchUserResponse(
        user=user,
        home=ctx["home"],
        env=ctx["env"],
    )
