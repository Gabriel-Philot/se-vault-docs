const LAYERS = [
  {
    label: "User",
    activeClass:
      "border-ci-green/40 bg-linear-to-r from-ci-green/16 to-ci-green/6 text-ci-green shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ci-green)_18%,transparent)]",
  },
  {
    label: "Shell",
    activeClass:
      "border-ci-blue/40 bg-linear-to-r from-ci-blue/16 to-ci-blue/6 text-ci-blue shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ci-blue)_18%,transparent)]",
  },
  {
    label: "Kernel",
    activeClass:
      "border-ci-amber/40 bg-linear-to-r from-ci-amber/16 to-ci-amber/6 text-ci-amber shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ci-amber)_18%,transparent)]",
  },
  {
    label: "Hardware",
    activeClass:
      "border-ci-red/40 bg-linear-to-r from-ci-red/16 to-ci-red/6 text-ci-red shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ci-red)_18%,transparent)]",
  },
];

interface ProcessDiagramProps {
  activeLayer?: number;
}

export function ProcessDiagram({ activeLayer = 0 }: ProcessDiagramProps) {
  const highlightedLayer = Math.max(0, Math.min(activeLayer, LAYERS.length - 1));

  return (
    <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/40 p-4 shadow-lg shadow-black/15">
      <h3 className="text-sm font-medium text-ci-muted mb-3">
        Process Layers
      </h3>
      <div className="space-y-2">
        {LAYERS.map(({ label, activeClass }, i) => (
          <div
            key={label}
            className={
              i <= highlightedLayer
                ? "rounded-lg border p-3 text-center text-sm font-mono transition-all duration-250 hover:-translate-y-0.5 " +
                  activeClass
                : "rounded-lg border border-ci-border bg-ci-panel/70 p-3 text-center text-sm font-mono text-ci-dim transition-all duration-250 hover:-translate-y-0.5 hover:border-ci-muted/40 hover:text-ci-muted"
            }
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
