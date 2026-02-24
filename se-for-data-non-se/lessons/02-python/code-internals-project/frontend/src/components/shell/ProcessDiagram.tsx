import { Cpu, Terminal, UserRound, Wrench } from "lucide-react";

const LAYERS = [
  {
    label: "User",
    icon: UserRound,
    activeClass:
      "border-ci-green/40 bg-linear-to-r from-ci-green/16 to-ci-green/6 text-ci-green shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ci-green)_18%,transparent)]",
  },
  {
    label: "Shell",
    icon: Terminal,
    activeClass:
      "border-ci-green/45 bg-linear-to-r from-ci-green/14 to-ci-green/6 text-ci-green shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ci-green)_18%,transparent)]",
  },
  {
    label: "Kernel",
    icon: Wrench,
    activeClass:
      "border-ci-amber/40 bg-linear-to-r from-ci-amber/16 to-ci-amber/6 text-ci-amber shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ci-amber)_18%,transparent)]",
  },
  {
    label: "Hardware",
    icon: Cpu,
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
      <h3 className="mb-4 text-xs font-mono uppercase tracking-[0.14em] text-ci-green">
        Execution Flow
      </h3>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {LAYERS.map(({ label, activeClass, icon: Icon }, i) => {
          const isActive = i <= highlightedLayer;
          return (
            <div key={label} className="flex items-center gap-2 lg:gap-3">
              <div
                className={
                  isActive
                    ? "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-mono transition-all duration-250 " +
                      activeClass
                    : "flex flex-1 items-center justify-center gap-2 rounded-lg border border-ci-border bg-ci-panel/70 px-3 py-3 text-xs font-mono text-ci-dim transition-all duration-250"
                }
              >
                <Icon size={13} />
                <span>{label}</span>
              </div>
              {i < LAYERS.length - 1 && (
                <span className="hidden text-ci-dim lg:inline" aria-hidden="true">
                  &rarr;
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-ci-dim">
        Active layer moves to <span className="font-mono text-ci-green">Shell/Kernel</span> while command output is streaming.
      </div>
    </div>
  );
}
