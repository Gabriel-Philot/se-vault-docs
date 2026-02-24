import { CodeBlock } from "../shared/CodeBlock";

interface AssemblyViewProps {
  assembly: string | null;
}

export function AssemblyView({ assembly }: AssemblyViewProps) {
  if (!assembly) {
    return (
      <div className="rounded-xl border border-ci-border bg-ci-panel p-4">
        <h3 className="text-sm font-medium text-ci-muted mb-2">
          Assembly Output
        </h3>
        <p className="text-xs text-ci-dim">
          Compile C code to inspect generated assembly instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ci-border bg-ci-panel p-4">
      <h3 className="mb-2 text-sm font-medium text-ci-muted">
        Assembly Output
      </h3>
      <CodeBlock code={assembly} language="asm" maxHeight="300px" />
    </div>
  );
}
