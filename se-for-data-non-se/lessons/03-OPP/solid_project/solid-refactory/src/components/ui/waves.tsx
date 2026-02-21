import React, { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Perlin noise implementation
// ---------------------------------------------------------------------------

class Grad {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot2(x: number, y: number): number {
    return this.x * x + this.y * y;
  }
}

class Noise {
  private grad3: Grad[];
  private p: number[];
  private perm: number[];
  private gradP: Grad[];

  constructor() {
    this.grad3 = [
      new Grad(1, 1, 0),
      new Grad(-1, 1, 0),
      new Grad(1, -1, 0),
      new Grad(-1, -1, 0),
      new Grad(1, 0, 1),
      new Grad(-1, 0, 1),
      new Grad(1, 0, -1),
      new Grad(-1, 0, -1),
      new Grad(0, 1, 1),
      new Grad(0, -1, 1),
      new Grad(0, 1, -1),
      new Grad(0, -1, -1),
    ];

    this.p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
      120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57,
      177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74,
      165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60,
      211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65,
      25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200,
      196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
      52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
      207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
      119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
      129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112,
      104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179,
      162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181,
      199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
      138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66,
      215, 61, 156, 180,
    ];

    this.perm = new Array(512);
    this.gradP = new Array(512);
    this.seed(0);
  }

  seed(seed: number): void {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;
    for (let i = 0; i < 256; i++) {
      const v =
        i & 1
          ? this.p[i] ^ (seed & 255)
          : this.p[i] ^ ((seed >> 8) & 255);
      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }

  perlin2(x: number, y: number): number {
    let X = Math.floor(x);
    let Y = Math.floor(y);
    x -= X;
    y -= Y;
    X &= 255;
    Y &= 255;

    const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
    const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
    const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
    const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);

    const u = this.fade(x);
    return this.lerp(
      this.lerp(n00, n10, u),
      this.lerp(n01, n11, u),
      this.fade(y)
    );
  }
}

// ---------------------------------------------------------------------------
// Point type definitions
// ---------------------------------------------------------------------------

interface WaveOffset {
  x: number;
  y: number;
}

interface CursorOffset {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LinePoint {
  /** Immutable base grid position */
  bx: number;
  by: number;
  /** Perlin-driven wave offset */
  wave: WaveOffset;
  /** Spring-physics cursor offset */
  cursor: CursorOffset;
}

// ---------------------------------------------------------------------------
// Props interface
// ---------------------------------------------------------------------------

interface WavesProps {
  lineColor?: string;
  backgroundColor?: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  xGap?: number;
  yGap?: number;
  friction?: number;
  tension?: number;
  maxCursorMove?: number;
  style?: React.CSSProperties;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Waves: React.FC<WavesProps> = ({
  lineColor = "rgba(255, 255, 255, 0.2)",
  backgroundColor = "transparent",
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  style,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const linesRef = useRef<LinePoint[][]>([]);
  const noiseRef = useRef<Noise>(new Noise());

  const mouse = useRef({
    x: 0,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    a: 0,
    set: false,
  });

  // Capture latest prop values in a ref so the animation loop always reads
  // the current values without needing to be recreated.
  const propsRef = useRef({
    lineColor,
    backgroundColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    xGap,
    yGap,
    friction,
    tension,
    maxCursorMove,
  });

  useEffect(() => {
    propsRef.current = {
      lineColor,
      backgroundColor,
      waveSpeedX,
      waveSpeedY,
      waveAmpX,
      waveAmpY,
      xGap,
      yGap,
      friction,
      tension,
      maxCursorMove,
    };
  }, [
    lineColor,
    backgroundColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    xGap,
    yGap,
    friction,
    tension,
    maxCursorMove,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise = noiseRef.current;

    // -----------------------------------------------------------------------
    // Build the grid of vertical-column points
    // -----------------------------------------------------------------------
    function setLines(): void {
      const { xGap, yGap } = propsRef.current;
      const w = canvas!.width;
      const h = canvas!.height;
      linesRef.current = [];

      // Extend slightly beyond the canvas edges so lines fill the viewport.
      const oWidth = w + 200;
      const oHeight = h + 30;
      const totalLines = Math.ceil(oWidth / xGap);
      const totalPoints = Math.ceil(oHeight / yGap);

      for (let i = 0; i < totalLines; i++) {
        const pts: LinePoint[] = [];
        for (let j = 0; j < totalPoints; j++) {
          pts.push({
            bx: -100 + i * xGap,
            by: -15 + j * yGap,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          });
        }
        linesRef.current.push(pts);
      }
    }

    // -----------------------------------------------------------------------
    // Resize handler — rebuild the grid whenever the canvas changes size
    // -----------------------------------------------------------------------
    function handleResize(): void {
      canvas!.width = canvas!.offsetWidth || window.innerWidth;
      canvas!.height = canvas!.offsetHeight || window.innerHeight;
      setLines();
    }

    // -----------------------------------------------------------------------
    // Mouse / pointer tracking
    // -----------------------------------------------------------------------
    function handleMouseMove(e: MouseEvent): void {
      const m = mouse.current;
      const rect = canvas!.getBoundingClientRect();
      m.x = e.clientX - rect.left;
      m.y = e.clientY - rect.top;
      if (!m.set) {
        m.sx = m.x;
        m.sy = m.y;
        m.lx = m.x;
        m.ly = m.y;
        m.set = true;
      }
    }

    function handleTouchMove(e: TouchEvent): void {
      if (e.touches.length === 0) return;
      const m = mouse.current;
      const rect = canvas!.getBoundingClientRect();
      m.x = e.touches[0].clientX - rect.left;
      m.y = e.touches[0].clientY - rect.top;
      if (!m.set) {
        m.sx = m.x;
        m.sy = m.y;
        m.lx = m.x;
        m.ly = m.y;
        m.set = true;
      }
    }

    // -----------------------------------------------------------------------
    // Per-frame mouse smoothing and velocity
    // -----------------------------------------------------------------------
    function updateMouse(): void {
      const m = mouse.current;
      if (!m.set) return;

      m.sx += (m.x - m.sx) * 0.1;
      m.sy += (m.y - m.sy) * 0.1;

      const dx = m.sx - m.lx;
      const dy = m.sy - m.ly;
      m.v = Math.hypot(dx, dy);
      m.vs += (m.v - m.vs) * 0.1;
      m.vs = Math.min(m.vs, 200);
      m.lx = m.sx;
      m.ly = m.sy;
      m.a = Math.atan2(dy, dx);
    }

    // -----------------------------------------------------------------------
    // Move points: update wave and cursor offsets (base positions unchanged)
    // -----------------------------------------------------------------------
    function movePoints(time: number): void {
      const { waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxCursorMove } =
        propsRef.current;
      const m = mouse.current;

      linesRef.current.forEach((pts) => {
        pts.forEach((p) => {
          // --- Perlin wave ---
          const noiseVal =
            noise.perlin2(
              (p.bx + p.wave.x) * waveSpeedX,
              (p.by + p.wave.y) * waveSpeedY + time * waveSpeedY
            ) * waveAmpX;

          p.wave.x = Math.cos(time * waveSpeedX) * waveAmpY + noiseVal;
          p.wave.y = Math.sin(time * waveSpeedY) * waveAmpX;

          // --- Cursor spring influence ---
          const dx = p.bx - m.sx;
          const dy = p.by - m.sy;
          const dist = Math.hypot(dx, dy);
          const influenceRadius = Math.max(175, m.vs);

          if (dist < influenceRadius) {
            const s = 1 - dist / influenceRadius;
            const f = Math.cos(dist * 0.001) * s;
            p.cursor.vx +=
              Math.cos(m.a) * f * (m.vs * maxCursorMove) * 0.00065;
            p.cursor.vy +=
              Math.sin(m.a) * f * (m.vs * maxCursorMove) * 0.00065;
          }

          // Apply friction (damping)
          p.cursor.vx *= friction;
          p.cursor.vy *= friction;

          // Integrate velocity
          p.cursor.x += p.cursor.vx * 2;
          p.cursor.y += p.cursor.vy * 2;

          // Spring pull back toward rest position
          p.cursor.x += (0 - p.cursor.x) * tension;
          p.cursor.y += (0 - p.cursor.y) * tension;
        });
      });
    }

    // -----------------------------------------------------------------------
    // Draw all vertical lines
    // -----------------------------------------------------------------------
    function drawLines(): void {
      const { lineColor, backgroundColor } = propsRef.current;
      const w = canvas!.width;
      const h = canvas!.height;

      ctx.clearRect(0, 0, w, h);

      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;

      linesRef.current.forEach((pts) => {
        ctx.beginPath();
        pts.forEach((p, i) => {
          const x = p.bx + p.wave.x + p.cursor.x;
          const y = p.by + p.wave.y + p.cursor.y;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      });
    }

    // -----------------------------------------------------------------------
    // Animation loop
    // -----------------------------------------------------------------------
    let time = 0;

    function animate(): void {
      time += 0.001;
      updateMouse();
      movePoints(time);
      drawLines();
      rafRef.current = requestAnimationFrame(animate);
    }

    // -----------------------------------------------------------------------
    // Initialise
    // -----------------------------------------------------------------------
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
    setLines();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};
