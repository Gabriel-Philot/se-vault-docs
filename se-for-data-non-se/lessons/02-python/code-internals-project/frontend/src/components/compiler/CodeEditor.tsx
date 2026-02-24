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
  const fileName = language === "c" ? "main.c" : "main.py";
  const accent = language === "c" ? "text-ci-amber" : "text-ci-blue";

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
      <div className="flex items-center justify-between border-b border-ci-border bg-[linear-gradient(100deg,rgba(30,41,59,0.72),rgba(15,23,42,0.92))] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ci-red/80" />
          <span className="h-2 w-2 rounded-full bg-ci-amber/80" />
          <span className="h-2 w-2 rounded-full bg-ci-green/80" />
        </div>
        <span className="text-xs font-mono text-ci-muted">{fileName}</span>
        <span className={`text-[10px] font-mono uppercase tracking-wide ${accent}`}>{language}</span>
      </div>
      <div className="flex">
        <div className="select-none border-r border-ci-border bg-ci-surface/45 px-2 py-3 text-right">
          {lines.map((_, i) => (
            <div key={i} className="text-xs font-mono text-ci-dim leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          placeholder={language === "c" ? "Write C source code..." : "Write Python source code..."}
          aria-label={`${language} code editor`}
          className="min-h-[240px] flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-ci-text outline-none placeholder:text-ci-dim focus-visible:outline-none"
          style={{ tabSize: 4 }}
        />
      </div>
    </div>
  );
}
