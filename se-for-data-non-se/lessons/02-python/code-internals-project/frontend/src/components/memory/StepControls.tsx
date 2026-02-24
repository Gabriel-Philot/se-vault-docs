import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

interface StepControlsProps {
  hasTrace?: boolean;
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function StepControls({
  hasTrace = true,
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSpeedChange,
}: StepControlsProps) {
  const iconButtonClass =
    "rounded-lg border border-ci-border/80 bg-ci-surface/60 p-2 text-ci-muted transition-all duration-200 hover:border-ci-blue/40 hover:bg-ci-surface hover:text-ci-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:cursor-not-allowed disabled:opacity-30";

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
  const canMoveBack = hasTrace && currentStep > 0;
  const canMoveForward = hasTrace && currentStep < totalSteps - 1;
  const canPlayPause = hasTrace && totalSteps > 0;

  return (
    <div className="rounded-xl border border-ci-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-ci-panel)_96%,transparent)_0%,color-mix(in_srgb,var(--color-ci-surface)_68%,transparent)_100%)] p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            disabled={!hasTrace}
            className={iconButtonClass}
            aria-label="Reset"
            title="Reset trace"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onStepBack}
            disabled={!canMoveBack}
            className={iconButtonClass}
            aria-label="Step back"
            title="Step back"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!canPlayPause}
            className="rounded-lg border border-ci-green/40 bg-ci-green/10 p-2 text-ci-green transition-all duration-200 hover:scale-[1.03] hover:bg-ci-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={isPlaying ? "Pause" : "Play"}
            title={
              hasTrace
                ? isPlaying
                  ? "Pause playback"
                  : "Start playback"
                : "Run Trace first"
            }
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={onStepForward}
            disabled={!canMoveForward}
            className={iconButtonClass}
            aria-label="Step forward"
            title="Step forward"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-mono">
            <span className="text-ci-muted">
              {hasTrace ? `Step ${currentStep + 1} / ${totalSteps}` : "Step 0 / 0"}
            </span>
            <span className="text-ci-dim">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full border border-ci-border bg-ci-bg/70"
            role="progressbar"
            aria-label="Trace progress"
            aria-valuemin={0}
            aria-valuemax={Math.max(totalSteps, 1)}
            aria-valuenow={hasTrace ? currentStep + 1 : 0}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-ci-blue to-ci-cyan transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ci-dim">Speed</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            aria-label="Playback speed"
            className="w-24 accent-ci-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
          />
          <span className="w-9 text-right text-xs font-mono text-ci-green">{speed}x</span>
        </div>
      </div>
      {!hasTrace ? (
        <p className="mt-2 text-[11px] font-mono text-ci-dim">Run Trace first to enable playback controls.</p>
      ) : null}
    </div>
  );
}
