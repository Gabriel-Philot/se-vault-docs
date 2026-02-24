import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  code: string;
  language: "c" | "python" | "asm" | "bash";
  title?: string;
  maxHeight?: string;
}

const LANG_MAP: Record<string, string> = {
  c: "c",
  python: "python",
  asm: "nasm",
  bash: "bash",
};

export function CodeBlock({ code, language, title, maxHeight }: CodeBlockProps) {
  return (
    <div className="rounded-lg border border-ci-border overflow-hidden">
      {title && (
        <div className="px-3 py-1.5 bg-ci-surface border-b border-ci-border text-xs text-ci-muted font-mono">
          {title}
        </div>
      )}
      <Highlight
        theme={themes.nightOwl}
        code={code.trimEnd()}
        language={LANG_MAP[language] ?? language}
      >
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre
            className="p-4 bg-ci-panel font-mono text-sm overflow-auto"
            style={maxHeight ? { maxHeight } : undefined}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                <span className="table-cell pr-4 text-ci-dim select-none text-right w-8">
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, j) => (
                    <span key={j} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
