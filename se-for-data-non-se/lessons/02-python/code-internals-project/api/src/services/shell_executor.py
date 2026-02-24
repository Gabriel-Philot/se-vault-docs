from __future__ import annotations

import json
from typing import AsyncIterator

from src.models.shell_models import (
    FilesystemNode,
    FilesystemResponse,
    ShellEvent,
    SwitchUserResponse,
)

SHELL_WHITELIST = {
    "ls", "cat", "echo", "grep", "wc", "head",
    "tail", "sort", "uniq", "tr", "cut", "sed",
    "awk", "tee", "diff", "comm", "cd", "pwd",
    "whoami", "id", "chmod", "env", "printenv",
    "export", "date", "uname",
}

BLOCKED_COMMANDS = {
    "rm", "mv", "cp", "chown", "sudo", "su",
    "apt", "pip", "python", "python3", "bash",
    "sh", "curl", "wget", "nc", "ncat",
}

USER_CONTEXTS: dict[str, dict] = {
    "alice": {
        "home": "/home/alice",
        "uid": 1000,
        "gid": 1000,
        "shell": "/bin/bash",
        "env": {
            "HOME": "/home/alice",
            "USER": "alice",
            "SHELL": "/bin/bash",
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "PWD": "/home/alice",
            "LANG": "en_US.UTF-8",
        },
    },
    "bob": {
        "home": "/home/bob",
        "uid": 1001,
        "gid": 1001,
        "shell": "/bin/bash",
        "env": {
            "HOME": "/home/bob",
            "USER": "bob",
            "SHELL": "/bin/bash",
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "PWD": "/home/bob",
            "LANG": "en_US.UTF-8",
        },
    },
    "root": {
        "home": "/root",
        "uid": 0,
        "gid": 0,
        "shell": "/bin/bash",
        "env": {
            "HOME": "/root",
            "USER": "root",
            "SHELL": "/bin/bash",
            "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "PWD": "/root",
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

    ctx = USER_CONTEXTS[user]

    # Handle built-in commands
    parts = command.strip().split()
    cmd = parts[0]

    if cmd == "whoami":
        event = ShellEvent(stream="stdout", data=f"{user}\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "id":
        uid = ctx["uid"]
        gid = ctx["gid"]
        event = ShellEvent(stream="stdout", data=f"uid={uid}({user}) gid={gid}({user})\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "pwd":
        event = ShellEvent(stream="stdout", data=f"{ctx['env']['PWD']}\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "echo":
        text = " ".join(parts[1:])
        # Expand environment variables
        for var, val in ctx["env"].items():
            text = text.replace(f"${var}", val)
            text = text.replace(f"${{{var}}}", val)
        text = text.strip('"').strip("'")
        event = ShellEvent(stream="stdout", data=f"{text}\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "env" or cmd == "printenv":
        lines = "\n".join(f"{k}={v}" for k, v in sorted(ctx["env"].items()))
        event = ShellEvent(stream="stdout", data=f"{lines}\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "uname":
        event = ShellEvent(stream="stdout", data="Linux sandbox 5.15.0 #1 SMP x86_64 GNU/Linux\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    if cmd == "date":
        event = ShellEvent(stream="stdout", data="Mon Jan  1 00:00:00 UTC 2024\n", step=1)
        yield f"data: {event.model_dump_json()}\n\n"
        return

    # For real file system commands, execute in sandbox
    from src.config import SANDBOX_PY_CONTAINER
    from src.services.sandbox import run_in_sandbox

    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["sh", "-c", command],
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
    done = ShellEvent(stream="system", data="done", step=step)
    yield f"data: {done.model_dump_json()}\n\n"


def get_filesystem() -> FilesystemResponse:
    """Return the virtual filesystem tree."""
    tree = FilesystemNode(
        name="/",
        type="dir",
        permissions="drwxr-xr-x",
        owner="root",
        group="root",
        children=[
            FilesystemNode(
                name="bin",
                type="dir",
                permissions="drwxr-xr-x",
                owner="root",
                group="root",
                children=[
                    FilesystemNode(name="bash", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                    FilesystemNode(name="ls", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                    FilesystemNode(name="cat", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                    FilesystemNode(name="grep", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                    FilesystemNode(name="echo", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                ],
            ),
            FilesystemNode(
                name="etc",
                type="dir",
                permissions="drwxr-xr-x",
                owner="root",
                group="root",
                children=[
                    FilesystemNode(name="passwd", type="file", permissions="-rw-r--r--", owner="root", group="root",
                                   content="root:x:0:0:root:/root:/bin/bash\nalice:x:1000:1000:Alice:/home/alice:/bin/bash\nbob:x:1001:1001:Bob:/home/bob:/bin/bash\n"),
                    FilesystemNode(name="shadow", type="file", permissions="-rw-------", owner="root", group="shadow"),
                    FilesystemNode(name="profile", type="file", permissions="-rw-r--r--", owner="root", group="root",
                                   content="# /etc/profile: system-wide .profile file\nexport PATH=/usr/local/bin:/usr/bin:/bin\n"),
                    FilesystemNode(name="hostname", type="file", permissions="-rw-r--r--", owner="root", group="root",
                                   content="sandbox\n"),
                ],
            ),
            FilesystemNode(
                name="home",
                type="dir",
                permissions="drwxr-xr-x",
                owner="root",
                group="root",
                children=[
                    FilesystemNode(
                        name="alice",
                        type="dir",
                        permissions="drwxr-xr-x",
                        owner="alice",
                        group="alice",
                        children=[
                            FilesystemNode(name=".bashrc", type="file", permissions="-rw-r--r--", owner="alice", group="alice",
                                           content="# ~/.bashrc\nalias ll='ls -la'\nalias grep='grep --color=auto'\nexport PS1='\\u@sandbox:\\w\\$ '\n"),
                            FilesystemNode(name=".profile", type="file", permissions="-rw-r--r--", owner="alice", group="alice",
                                           content="# ~/.profile\nif [ -f ~/.bashrc ]; then\n    . ~/.bashrc\nfi\n"),
                            FilesystemNode(name=".ssh", type="dir", permissions="drwx------", owner="alice", group="alice", children=[]),
                            FilesystemNode(
                                name="Documents",
                                type="dir",
                                permissions="drwxr-xr-x",
                                owner="alice",
                                group="alice",
                                children=[
                                    FilesystemNode(name="notes.txt", type="file", permissions="-rw-r--r--", owner="alice", group="alice",
                                                   content="Hello from Alice's documents!\n"),
                                ],
                            ),
                        ],
                    ),
                    FilesystemNode(
                        name="bob",
                        type="dir",
                        permissions="drwxr-xr-x",
                        owner="bob",
                        group="bob",
                        children=[
                            FilesystemNode(name=".bashrc", type="file", permissions="-rw-r--r--", owner="bob", group="bob",
                                           content="# ~/.bashrc\nexport PS1='\\u@sandbox:\\w\\$ '\n"),
                            FilesystemNode(name=".profile", type="file", permissions="-rw-r--r--", owner="bob", group="bob",
                                           content="# ~/.profile\nif [ -f ~/.bashrc ]; then\n    . ~/.bashrc\nfi\n"),
                        ],
                    ),
                ],
            ),
            FilesystemNode(
                name="root",
                type="dir",
                permissions="drwx------",
                owner="root",
                group="root",
                children=[
                    FilesystemNode(name=".bashrc", type="file", permissions="-rw-r--r--", owner="root", group="root",
                                   content="# ~/.bashrc\nexport PS1='root@sandbox:\\w# '\n"),
                ],
            ),
            FilesystemNode(name="tmp", type="dir", permissions="drwxrwxrwt", owner="root", group="root", children=[]),
            FilesystemNode(
                name="usr",
                type="dir",
                permissions="drwxr-xr-x",
                owner="root",
                group="root",
                children=[
                    FilesystemNode(
                        name="bin",
                        type="dir",
                        permissions="drwxr-xr-x",
                        owner="root",
                        group="root",
                        children=[
                            FilesystemNode(name="python3", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                            FilesystemNode(name="gcc", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                            FilesystemNode(name="wc", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                            FilesystemNode(name="sort", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                            FilesystemNode(name="head", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                            FilesystemNode(name="tail", type="file", permissions="-rwxr-xr-x", owner="root", group="root"),
                        ],
                    ),
                ],
            ),
            FilesystemNode(name="var", type="dir", permissions="drwxr-xr-x", owner="root", group="root", children=[
                FilesystemNode(name="log", type="dir", permissions="drwxr-xr-x", owner="root", group="root", children=[]),
            ]),
        ],
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
