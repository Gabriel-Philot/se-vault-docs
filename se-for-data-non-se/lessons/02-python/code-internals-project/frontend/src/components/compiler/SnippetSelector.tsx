interface SnippetSelectorProps {
  snippets: Array<{ name: string; code: string }>;
  onSelect: (code: string) => void;
  language: "c" | "python";
}

export function SnippetSelector({
  snippets,
  onSelect,
  language,
}: SnippetSelectorProps) {
  const buttonClass =
    language === "c"
      ? "bg-ci-amber/10 text-ci-amber border-ci-amber/30 hover:bg-ci-amber/20 focus-visible:ring-ci-amber/50"
      : "bg-ci-blue/10 text-ci-blue border-ci-blue/30 hover:bg-ci-blue/20 focus-visible:ring-ci-blue/50";

  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label={`${language} snippets`}>
      {snippets.map((snippet) => (
        <button
          key={snippet.name}
          onClick={() => onSelect(snippet.code)}
          className={`rounded-md border px-3 py-1.5 text-xs font-mono font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg ${buttonClass}`}
        >
          {snippet.name}
        </button>
      ))}
    </div>
  );
}
