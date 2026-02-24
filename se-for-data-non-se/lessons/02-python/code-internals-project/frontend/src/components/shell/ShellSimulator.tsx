import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Command, HardDrive, Server, TerminalSquare } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useSSE } from "../../hooks/useSSE";
import type {
  FilesystemResponse,
  SwitchUserResponse,
} from "../../lib/types";
import { BashStartupChain } from "./BashStartupChain";
import { EnvVariablesPanel } from "./EnvVariablesPanel";
import { FilesystemTree } from "./FilesystemTree";
import { PipeVisualizer } from "./PipeVisualizer";
import { ProcessDiagram } from "./ProcessDiagram";
import { StreamVisualizer } from "./StreamVisualizer";
import { UserCompare } from "./UserCompare";

const AVAILABLE_COMMANDS = [
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
  "clear",
];

const BLOCKED_COMMANDS = ["rm", "mv", "cp", "sudo", "su", "curl", "wget", "python", "bash"];

const STREAM_COLOR: Record<string, string> = {
  stdout: "text-ci-text",
  stderr: "text-ci-red",
  system: "text-ci-muted",
};

const STREAM_PREFIX: Record<string, string> = {
  stdout: "out",
  stderr: "err",
  system: "sys",
};

export function ShellSimulator() {
  const [command, setCommand] = useState("");
  const [currentUser, setCurrentUser] = useState("alice");
  const [env, setEnv] = useState<Record<string, string>>({});
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [fs, setFs] = useState<FilesystemResponse | null>(null);
  const [fsError, setFsError] = useState<string | null>(null);
  const [fsStatus, setFsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [history, setHistory] = useState<string[]>([]);
  const historyIdxRef = useRef(-1);
  const [sseBody, setSseBody] = useState<Record<string, unknown> | null>(null);
  const [lastCommand, setLastCommand] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  const { events, status, error: streamError, clear: clearStream } = useSSE("/api/shell/exec", sseBody);

  const normalizeApiError = useCallback((err: unknown, fallback: string) => {
    const raw = err instanceof Error ? err.message : String(err ?? "");
    const lower = raw.toLowerCase();

    if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
      return "Backend is unavailable. Start or restart the API service, then try again.";
    }
    if (lower.includes("503") || lower.includes("sandbox") || lower.includes("container")) {
      return "Sandbox is not running. Start the sandbox containers and retry.";
    }
    if (lower.includes("500")) {
      return "Backend returned an internal error. Check API logs, then retry.";
    }

    return `${fallback}: ${raw || "Unknown error"}`;
  }, []);

  const fetchFilesystem = useCallback((user: string) => {
    setFsStatus("loading");
    setFsError(null);
    apiFetch<FilesystemResponse>(`/api/shell/filesystem?user=${encodeURIComponent(user)}`)
      .then((res) => {
        setFs(res);
        setFsStatus("ready");
      })
      .catch((err) => {
        setFs(null);
        setFsStatus("error");
        setFsError(
          normalizeApiError(
            err,
            "Unable to load filesystem metadata"
          )
        );
      });
  }, [normalizeApiError]);

  // Initial user context + filesystem
  useEffect(() => {
    handleSwitchUser(currentUser);
    fetchFilesystem(currentUser);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchUser = useCallback(async (user: string) => {
    setSwitchError(null);
    try {
      const res = await apiFetch<SwitchUserResponse>("/api/shell/switch-user", {
        method: "POST",
        body: JSON.stringify({ user }),
      });
      setCurrentUser(res.user);
      setEnv(res.env);
      fetchFilesystem(res.user);
    } catch (err) {
      setSwitchError(normalizeApiError(err, "Failed to switch user"));
    }
  }, [fetchFilesystem, normalizeApiError]);

  const handleSubmit = useCallback(() => {
    const trimmed = command.trim();
    if (!trimmed) return;

    if (trimmed === "clear") {
      clearStream();
      setCommand("");
      return;
    }

    setHistory((prev) => [...prev, trimmed]);
    historyIdxRef.current = -1;
    setLastCommand(trimmed);
    setSseBody({ command: trimmed, user: currentUser });
    setCommand("");
  }, [clearStream, command, currentUser]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = historyIdxRef.current;
        const next = prev === -1 ? history.length - 1 : Math.max(0, prev - 1);
        if (next >= 0 && next < history.length) {
          setCommand(history[next]);
          historyIdxRef.current = next;
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = historyIdxRef.current + 1;
        if (next >= history.length) {
          setCommand("");
          historyIdxRef.current = -1;
        } else {
          setCommand(history[next]);
          historyIdxRef.current = next;
        }
      }
    },
    [handleSubmit, history]
  );

  const activeLayer = useMemo(() => {
    if (status === "streaming") return 2;
    if (status === "done") return 0;
    return 0;
  }, [status]);

  useEffect(() => {
    const el = terminalScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [events, status]);

  useEffect(() => {
    const latest = events[events.length - 1];
    if (!latest?.cwd) return;
    setEnv((prev) => ({
      ...prev,
      PWD: latest.cwd as string,
    }));
  }, [events]);

  useEffect(() => {
    if (!lastCommand) return;
    if (status !== "done" && status !== "error") return;
    fetchFilesystem(currentUser);
  }, [currentUser, fetchFilesystem, lastCommand, status]);

  const promptPath = useMemo(() => {
    const pwd = env.PWD;
    const home = env.HOME;
    if (!pwd) return "~";
    if (home && pwd.startsWith(home)) {
      const suffix = pwd.slice(home.length);
      return suffix ? `~${suffix}` : "~";
    }
    return pwd;
  }, [env.HOME, env.PWD]);

  return (
    <div className="space-y-6">
      <div className="mb-1">
        <div className="mb-2 text-xs font-mono font-semibold uppercase tracking-[0.22em] text-ci-green">
          Panel 02
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-ci-text sm:text-4xl">
          Shell &amp; Process Explorer
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ci-muted sm:text-base">
          Explore Linux filesystem, streams, pipes, and process execution.
        </p>
        <div className="mt-4 h-px w-full max-w-xs bg-linear-to-r from-transparent via-ci-green/45 to-transparent" />
      </div>

      {switchError && (
        <div className="text-sm text-ci-red bg-ci-red/10 rounded-lg p-2">
          {switchError}
        </div>
      )}

      {fsError && (
        <div className="text-sm text-ci-red bg-ci-red/10 rounded-lg p-2">
          {fsError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/30 p-4 shadow-lg shadow-black/15 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-ci-border pb-3">
            <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-ci-green">Filesystem</h3>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
              fsStatus === "ready"
                ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
                : fsStatus === "error"
                  ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
                  : "border-ci-border bg-ci-surface text-ci-dim"
            }`}>
              <HardDrive size={11} />
              {fsStatus}
            </span>
          </div>

          {fs ? (
            <div className="space-y-4">
              <UserCompare
                currentUser={currentUser}
                users={fs.users}
                onSwitchUser={handleSwitchUser}
              />
              <FilesystemTree tree={fs.tree} currentUser={currentUser} />
              <EnvVariablesPanel env={env} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-ci-border bg-ci-panel/60 p-3 text-xs text-ci-dim">
              Filesystem data unavailable. Retry when the API is ready.
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/40 p-4 shadow-lg shadow-black/15">
            <div className="pointer-events-none absolute inset-0 ambient-grid opacity-25" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="animate-scan-line absolute inset-x-0 top-[-40%] h-24 bg-linear-to-b from-transparent via-ci-cyan/12 to-transparent" />
            </div>

            <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ci-border pb-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-ci-green">
                <TerminalSquare size={14} />
                Terminal Session
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                status === "streaming"
                  ? "border-ci-amber/40 bg-ci-amber/15 text-ci-amber"
                  : status === "error"
                    ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
                    : status === "done"
                      ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
                      : "border-ci-border bg-ci-surface text-ci-dim"
              }`}>
                <Server size={11} />
                {status}
              </span>
            </div>

            <div className="relative flex min-h-[30rem] flex-col rounded-lg border border-ci-border bg-ci-bg/70 p-3 font-mono text-sm">
              <div ref={terminalScrollRef} className="min-h-0 flex-1 overflow-y-auto pr-2">
                {events.length === 0 && status === "idle" && (
                  <div className="text-ci-dim">Run a command to start the shell stream.</div>
                )}

                {events.map((evt, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[auto_1fr] gap-2 ${STREAM_COLOR[evt.stream] ?? "text-ci-text"}`}
                  >
                    <span className="text-[10px] uppercase tracking-wide text-ci-dim">
                      {STREAM_PREFIX[evt.stream] ?? "log"}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{evt.data}</span>
                  </div>
                ))}

                {streamError && (
                  <div className="mt-2 whitespace-pre-wrap rounded border border-ci-red/35 bg-ci-red/10 px-2 py-1 text-xs text-ci-red">
                    {streamError}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-ci-border pt-3">
                <span className="text-ci-green">{currentUser}@sandbox:{promptPath}$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Shell command input"
                  className="shell-command-input flex-1 bg-transparent text-ci-text outline-none placeholder:text-ci-dim selection:bg-ci-green/25 selection:text-ci-text focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                  placeholder="Type a command and press Enter..."
                />
                <span
                  aria-hidden
                  className="h-4 w-2 rounded-xs bg-ci-green/90 animate-cursor-blink"
                />
              </div>
            </div>
          </div>

          <ProcessDiagram activeLayer={activeLayer} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/35 p-4 shadow-lg shadow-black/10 lg:col-span-2">
          <div className="mb-3 text-xs font-mono uppercase tracking-[0.14em] text-ci-green">Advanced Internals</div>
          <div className="space-y-4">
            <StreamVisualizer events={events} />
            <PipeVisualizer command={lastCommand} events={events} />
            <BashStartupChain />
          </div>
        </div>

        <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/35 p-4 shadow-lg shadow-black/10">
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-ci-muted">
            <Command size={14} className="text-ci-green" />
            Available Commands
          </h3>

          <div className="mb-3 rounded-lg border border-ci-border bg-ci-bg/60 p-3 text-xs text-ci-dim">
            Use pipes with <span className="font-mono text-ci-text">|</span> for chained commands. Example: <span className="font-mono text-ci-green">ls | grep txt | wc</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_COMMANDS.map((cmd) => (
              <span
                key={cmd}
                className="rounded border border-ci-border bg-ci-surface/70 px-2 py-1 font-mono text-[11px] text-ci-text"
              >
                {cmd}
              </span>
            ))}
          </div>

          <div className="mt-4 border-t border-ci-border pt-3 text-xs text-ci-dim">
            Blocked for safety: <span className="font-mono text-ci-red">{BLOCKED_COMMANDS.join(", ")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
