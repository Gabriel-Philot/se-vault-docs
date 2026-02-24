interface SnippetSelectorProps {
  snippets: Array<{ name: string; code: string }>;
  onSelect: (code: string) => void;
  language: "c" | "python";
  selectedCode?: string;
}

export function SnippetSelector({
  snippets,
  onSelect,
  language,
  selectedCode,
}: SnippetSelectorProps) {
  const toneClass =
    language === "c"
      ? {
          idle: "border-ci-amber/25 bg-ci-amber/10 text-ci-amber hover:bg-ci-amber/20",
          active: "border-ci-amber/50 bg-ci-amber/25 text-ci-amber shadow-[0_0_0_1px_rgba(251,191,36,0.2)]",
          ring: "focus-visible:ring-ci-amber/55",
        }
      : {
          idle: "border-ci-blue/25 bg-ci-blue/10 text-ci-blue hover:bg-ci-blue/20",
          active: "border-ci-blue/50 bg-ci-blue/25 text-ci-blue shadow-[0_0_0_1px_rgba(56,189,248,0.2)]",
          ring: "focus-visible:ring-ci-blue/55",
        };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={`${language} snippets`}>
      {snippets.map((snippet) => {
        const isActive = selectedCode === snippet.code;

        return (
        <button
          key={snippet.name}
          onClick={() => onSelect(snippet.code)}
          className={`rounded-md border px-3 py-1.5 text-[11px] font-mono font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg ${toneClass.ring} ${isActive ? toneClass.active : toneClass.idle}`}
          aria-pressed={isActive}
        >
          {snippet.name}
        </button>
        );
      })}
    </div>
  );
}
