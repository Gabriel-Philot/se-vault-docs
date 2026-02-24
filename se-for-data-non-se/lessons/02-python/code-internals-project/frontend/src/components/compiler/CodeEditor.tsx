import { useCallback } from "react";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: "c" | "python";
  readOnly?: boolean;
}

export function CodeEditor({
  code,
  onChange,
  language,
  readOnly = false,
}: CodeEditorProps) {
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
    <div className="relative overflow-hidden rounded-xl border border-ci-border bg-ci-panel/90 shadow-sm transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_rgba(56,189,248,0.35)]">
      <div className="flex items-center justify-between border-b border-ci-border bg-ci-surface/70 px-3 py-2">
        <span className="text-xs font-mono uppercase tracking-wide text-ci-muted">{language}</span>
      </div>
      <div className="flex">
        {/* Line numbers */}
        <div className="select-none border-r border-ci-border bg-ci-surface/50 px-2 py-3 text-right">
          {lines.map((_, i) => (
            <div key={i} className="text-xs font-mono text-ci-dim leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        {/* Editor */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          placeholder={language === "c" ? "Write C source code..." : "Write Python source code..."}
          aria-label={`${language} code editor`}
          className="min-h-[220px] flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-ci-text outline-none placeholder:text-ci-dim focus-visible:outline-none"
          style={{ tabSize: 4 }}
        />
      </div>
    </div>
  );
}
