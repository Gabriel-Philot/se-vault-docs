import { useRef, useEffect } from 'react';
import { RUNNERS } from '../types/race';
import type { RunnerName, RunnerState } from '../types/race';

interface Props {
  runners: Record<RunnerName, RunnerState>;
  isRacing: boolean;
}

const STAGE_LABELS = ['Load & Filter', 'Aggregate', 'Join & Sort'];
const LANE_HEIGHT = 64;
const LANE_GAP = 8;
const LEFT_MARGIN = 130;
const RIGHT_MARGIN = 30;
const TOP_MARGIN = 40;

export default function RaceTrack({ runners, isRacing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedProgress = useRef<Record<RunnerName, number>>({
    'pure-python': 0,
    pandas: 0,
    polars: 0,
    duckdb: 0,
  });
  const rafRef = useRef<number>(0);
  const runnersRef = useRef(runners);
  const isRacingRef = useRef(isRacing);

  // Keep refs in sync without re-running the effect
  runnersRef.current = runners;
  isRacingRef.current = isRacing;

  // Reset animated progress when runners are reset (new race)
  const allZero = RUNNERS.every((r) => runners[r.name].progress === 0);
  if (allZero) {
    animatedProgress.current = {
      'pure-python': 0,
      pandas: 0,
      polars: 0,
      duckdb: 0,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    function draw() {
      const currentRunners = runnersRef.current;
      const racing = isRacingRef.current;

      const w = canvas!.getBoundingClientRect().width;
      const h = canvas!.getBoundingClientRect().height;
      ctx!.clearRect(0, 0, w, h);

      const trackWidth = w - LEFT_MARGIN - RIGHT_MARGIN;

      // Stage labels
      ctx!.font = '11px Inter, sans-serif';
      ctx!.fillStyle = '#666';
      ctx!.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const x = LEFT_MARGIN + (trackWidth / 3) * i + trackWidth / 6;
        ctx!.fillText(STAGE_LABELS[i], x, TOP_MARGIN - 12);
      }

      // Stage dividers
      ctx!.setLineDash([6, 4]);
      ctx!.strokeStyle = '#333';
      ctx!.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const x = LEFT_MARGIN + (trackWidth / 3) * i;
        ctx!.beginPath();
        ctx!.moveTo(x, TOP_MARGIN);
        ctx!.lineTo(x, TOP_MARGIN + RUNNERS.length * (LANE_HEIGHT + LANE_GAP));
        ctx!.stroke();
      }
      ctx!.setLineDash([]);

      // Start line
      ctx!.strokeStyle = '#444';
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(LEFT_MARGIN, TOP_MARGIN);
      ctx!.lineTo(LEFT_MARGIN, TOP_MARGIN + RUNNERS.length * (LANE_HEIGHT + LANE_GAP));
      ctx!.stroke();

      // Lanes
      RUNNERS.forEach((cfg, i) => {
        const y = TOP_MARGIN + i * (LANE_HEIGHT + LANE_GAP);
        const state = currentRunners[cfg.name];

        // Lane background
        ctx!.fillStyle = '#111';
        ctx!.beginPath();
        ctx!.roundRect(LEFT_MARGIN, y, trackWidth, LANE_HEIGHT, 6);
        ctx!.fill();

        // Runner label
        ctx!.font = '600 13px Inter, sans-serif';
        ctx!.fillStyle = cfg.color;
        ctx!.textAlign = 'right';
        ctx!.fillText(cfg.label, LEFT_MARGIN - 12, y + LANE_HEIGHT / 2 + 5);

        // Smooth progress
        const target = state.progress;
        const current = animatedProgress.current[cfg.name];
        animatedProgress.current[cfg.name] += (target - current) * 0.08;

        const progress = animatedProgress.current[cfg.name];
        const carX = LEFT_MARGIN + progress * (trackWidth - 40);
        const carY = y + LANE_HEIGHT / 2;

        // Trail glow
        if (progress > 0.01) {
          const grad = ctx!.createLinearGradient(LEFT_MARGIN, 0, carX, 0);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, cfg.color + '30');
          ctx!.fillStyle = grad;
          ctx!.fillRect(LEFT_MARGIN, y + 8, carX - LEFT_MARGIN, LANE_HEIGHT - 16);
        }

        // Car body
        const carW = 36;
        const carH = 20;
        ctx!.fillStyle = cfg.color;
        ctx!.shadowColor = cfg.color;
        ctx!.shadowBlur = state.finished ? 16 : 8;
        ctx!.beginPath();
        ctx!.roundRect(carX, carY - carH / 2, carW, carH, 4);
        ctx!.fill();
        ctx!.shadowBlur = 0;

        // Speed lines when racing
        if (racing && state.stageStatus === 'started') {
          ctx!.strokeStyle = cfg.color + '40';
          ctx!.lineWidth = 1;
          for (let l = 1; l <= 3; l++) {
            ctx!.beginPath();
            ctx!.moveTo(carX - l * 12, carY - 4 + l * 4);
            ctx!.lineTo(carX - l * 12 - 10, carY - 4 + l * 4);
            ctx!.stroke();
          }
        }

        // Checkered flag when finished
        if (state.finished) {
          ctx!.font = '16px serif';
          ctx!.textAlign = 'left';
          ctx!.fillText('\u{1F3C1}', carX + carW + 4, carY + 6);
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []); // Run once on mount; reads runner data via refs

  const totalHeight = TOP_MARGIN + RUNNERS.length * (LANE_HEIGHT + LANE_GAP) + 10;

  return (
    <div className="race-track-container">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: totalHeight }}
        data-testid="race-canvas"
      />
    </div>
  );
}
