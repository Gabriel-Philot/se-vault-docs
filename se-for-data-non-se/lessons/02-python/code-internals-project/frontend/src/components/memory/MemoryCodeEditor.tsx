import { useCallback } from "react";

interface MemoryCodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  currentLine: number | null;
}

export function MemoryCodeEditor({
  code,
  onChange,
  currentLine,
}: MemoryCodeEditorProps) {
  const lines = code.split("\n");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newCode = code.slice(0, start) + "    " + code.slice(end);
        onChange(newCode);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 4;
        });
      }
    },
    [code, onChange]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-ci-border bg-ci-panel/90 shadow-sm transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_rgba(56,189,248,0.35)]">
      <div className="border-b border-ci-border bg-ci-surface/70 px-3 py-2 text-xs font-mono text-ci-muted">
        Trace editor {currentLine ? `- line ${currentLine}` : ""}
      </div>
      <div className="flex">
        {/* Line numbers */}
        <div className="select-none border-r border-ci-border bg-ci-surface/50 px-2 py-3 text-right">
          {lines.map((_, i) => (
            <div
              key={i}
              className={`text-xs font-mono leading-5 px-1 ${
                currentLine === i + 1
                  ? "bg-ci-blue/20 text-ci-blue"
                  : "text-ci-dim"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* Editor */}
        <div className="relative flex-1">
          {/* Highlight overlay */}
          <div className="absolute inset-0 pointer-events-none py-3">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`h-5 ${currentLine === i + 1 ? "bg-ci-blue/20" : ""}`}
              />
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Write code and click Trace to walk stack and heap changes..."
            aria-label="Memory trace code editor"
            className="relative min-h-[220px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-ci-text outline-none placeholder:text-ci-dim focus-visible:outline-none"
            style={{ tabSize: 4 }}
          />
        </div>
      </div>
    </div>
  );
}
