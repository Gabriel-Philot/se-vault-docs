import { useCallback, useEffect, useRef, useState } from "react";

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
  const lineLabel = currentLine ? `line ${currentLine}` : "ready";
  const editorHeight = Math.min(520, Math.max(240, lines.length * 24 + 24));
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

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

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !currentLine) return;

    const lineHeight = 24;
    const targetTop = Math.max(0, (currentLine - 1) * lineHeight - lineHeight * 2);
    const targetBottom = targetTop + lineHeight * 3;
    const viewTop = ta.scrollTop;
    const viewBottom = ta.scrollTop + ta.clientHeight;

    if (targetTop < viewTop || targetBottom > viewBottom) {
      ta.scrollTop = targetTop;
      setScrollTop(targetTop);
    }
  }, [currentLine]);

  return (
    <div className="overflow-hidden rounded-2xl border border-ci-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-ci-panel)_96%,transparent)_0%,color-mix(in_srgb,var(--color-ci-surface)_70%,transparent)_100%)] shadow-sm transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_rgba(56,189,248,0.35)]">
      <div className="flex items-center justify-between border-b border-ci-border bg-ci-surface/70 px-3 py-2 text-xs font-mono">
        <span className="uppercase tracking-[0.18em] text-ci-muted">Trace Editor</span>
        <span className="rounded-full border border-ci-blue/30 bg-ci-blue/10 px-2 py-0.5 text-[10px] text-ci-blue">
          {lineLabel}
        </span>
      </div>
      <div className="flex" style={{ height: editorHeight }}>
        {/* Line numbers */}
          <div className="select-none overflow-hidden border-r border-ci-border bg-ci-surface/45 px-2 py-4 text-right">
            <div style={{ transform: `translateY(-${scrollTop}px)` }}>
          {lines.map((_, i) => (
            <div
              key={i}
              className={`h-6 rounded px-1 text-xs font-mono leading-6 ${
                currentLine === i + 1
                  ? "bg-ci-blue/20 text-ci-blue"
                  : "text-ci-dim"
              }`}
            >
              {i + 1}
            </div>
          ))}
            </div>
          </div>
          {/* Editor */}
          <div className="relative flex-1">
            {/* Highlight overlay */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden py-4">
              <div style={{ transform: `translateY(-${scrollTop}px)` }}>
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`h-6 ${currentLine === i + 1 ? "bg-ci-blue/16" : ""}`}
                />
              ))}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              spellCheck={false}
              wrap="off"
              placeholder="Write code and click Trace to walk stack and heap changes..."
              aria-label="Memory trace code editor"
              className="relative h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-sm leading-6 text-ci-text outline-none placeholder:text-ci-dim focus-visible:outline-none"
              style={{ tabSize: 4 }}
            />
          </div>
      </div>
    </div>
  );
}
