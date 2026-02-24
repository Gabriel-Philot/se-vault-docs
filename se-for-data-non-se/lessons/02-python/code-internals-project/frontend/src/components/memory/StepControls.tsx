import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

interface StepControlsProps {
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
    "rounded-md border border-ci-border p-1.5 text-ci-muted transition-colors duration-200 hover:bg-ci-surface hover:text-ci-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ci-border bg-ci-panel px-4 py-2.5">
      <div className="flex items-center gap-1">
        <button
          onClick={onReset}
          className={iconButtonClass}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={onStepBack}
          disabled={currentStep <= 0}
          className={iconButtonClass}
          aria-label="Step back"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="rounded-md border border-ci-green/40 bg-ci-green/10 p-1.5 text-ci-green transition-colors duration-200 hover:bg-ci-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={onStepForward}
          disabled={currentStep >= totalSteps - 1}
          className={iconButtonClass}
          aria-label="Step forward"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <span className="text-xs font-mono text-ci-muted">
        Step {currentStep + 1} / {totalSteps}
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-ci-dim">{speed}x</span>
        <input
          type="range"
          min="0.5"
          max="4"
          step="0.5"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          aria-label="Playback speed"
          className="w-20 accent-ci-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
        />
      </div>
    </div>
  );
}
