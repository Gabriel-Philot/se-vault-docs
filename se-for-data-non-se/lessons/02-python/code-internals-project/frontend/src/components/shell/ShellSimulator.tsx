import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSSE } from "../../hooks/useSSE";
import type {
  FilesystemResponse,
  SwitchUserResponse,
} from "../../lib/types";
import { StreamOutput } from "../shared/StreamOutput";
import { BashStartupChain } from "./BashStartupChain";
import { EnvVariablesPanel } from "./EnvVariablesPanel";
import { FilesystemTree } from "./FilesystemTree";
import { PipeVisualizer } from "./PipeVisualizer";
import { ProcessDiagram } from "./ProcessDiagram";
import { StreamVisualizer } from "./StreamVisualizer";
import { UserCompare } from "./UserCompare";

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

  const { events, status, error: streamError } = useSSE("/api/shell/exec", sseBody);

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

  // Fetch filesystem on mount
  useEffect(() => {
    setFsStatus("loading");
    setFsError(null);
    apiFetch<FilesystemResponse>("/api/shell/filesystem")
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

  const handleSwitchUser = useCallback(async (user: string) => {
    setSwitchError(null);
    try {
      const res = await apiFetch<SwitchUserResponse>("/api/shell/switch-user", {
        method: "POST",
        body: JSON.stringify({ user }),
      });
      setCurrentUser(res.user);
      setEnv(res.env);
    } catch (err) {
      setSwitchError(normalizeApiError(err, "Failed to switch user"));
    }
  }, [normalizeApiError]);

  const handleSubmit = useCallback(() => {
    const trimmed = command.trim();
    if (!trimmed) return;
    setHistory((prev) => [...prev, trimmed]);
    historyIdxRef.current = -1;
    setLastCommand(trimmed);
    setSseBody({ command: trimmed, user: currentUser });
    setCommand("");
  }, [command, currentUser]);

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

  return (
    <div className="space-y-4">
      {/* Terminal Input */}
      <div className="bg-ci-panel rounded-xl border border-ci-border p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full border px-2 py-0.5 ${
            status === "streaming"
              ? "border-ci-blue/40 bg-ci-blue/15 text-ci-blue"
              : status === "error"
                ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
                : status === "done"
                  ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
                  : "border-ci-border bg-ci-surface text-ci-dim"
          }`}>
            Shell API: {status}
          </span>
          <span className={`rounded-full border px-2 py-0.5 ${
            fsStatus === "ready"
              ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
              : fsStatus === "error"
                ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
                : "border-ci-border bg-ci-surface text-ci-dim"
          }`}>
            Filesystem API: {fsStatus}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-ci-green">
            {currentUser}@sandbox:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Shell command input"
            className="flex-1 bg-transparent text-ci-text outline-none"
            placeholder="Type a command..."
          />
        </div>
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

      {/* Output */}
      <StreamOutput events={events} status={status} error={streamError} />

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {fs ? (
            <UserCompare
              currentUser={currentUser}
              users={fs.users}
              onSwitchUser={handleSwitchUser}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-ci-border bg-ci-panel/60 p-3 text-xs text-ci-dim">
              User list unavailable. Filesystem metadata is still loading.
            </div>
          )}
          {fs ? (
            <FilesystemTree tree={fs.tree} currentUser={currentUser} />
          ) : (
            <div className="rounded-lg border border-dashed border-ci-border bg-ci-panel/60 p-3 text-xs text-ci-dim">
              Filesystem tree unavailable. Retry when API data is ready.
            </div>
          )}
          <BashStartupChain />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <EnvVariablesPanel env={env} />
          <StreamVisualizer events={events} />
          <PipeVisualizer command={lastCommand} events={events} />
          <ProcessDiagram activeLayer={activeLayer} />
        </div>
      </div>
    </div>
  );
}
