import { useEffect, useRef } from "react";

export function LetterGlitch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      if (prefersReducedMotion) {
        drawStatic();
      }
    };

    window.addEventListener("resize", resize);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}|:<>?";
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100;
    }

    const drawStatic = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 1)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      
      columns = Math.floor(width / fontSize);
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < height / fontSize; j++) {
          if (Math.random() > 0.9) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, j * fontSize);
          }
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 0.1)"; // Slate 950 with opacity for trail
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(16, 185, 129, 0.3)"; // Emerald 500 with opacity
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      columns = Math.floor(width / fontSize);
      for (let i = 0; i < columns; i++) {
        if (i >= drops.length) drops[i] = Math.random() * -100;
        
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    if (!prefersReducedMotion) {
      draw();
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 opacity-30 pointer-events-none"
    />
  );
}
