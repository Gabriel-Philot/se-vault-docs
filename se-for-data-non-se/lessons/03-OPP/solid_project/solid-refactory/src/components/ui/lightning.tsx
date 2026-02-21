import React, { useEffect, useRef } from "react";

interface LightningProps {
  color?: string;
  speed?: number;
}

export const Lightning: React.FC<LightningProps> = ({
  color = "#8b5cf6",
  speed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    class Bolt {
      x: number;
      y: number;
      path: { x: number; y: number }[];
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = 0;
        this.path = [{ x: this.x, y: this.y }];
        this.alpha = 1;
        this.generatePath();
      }

      generatePath() {
        let curX = this.x;
        let curY = this.y;
        while (curY < height) {
          curX += (Math.random() - 0.5) * 50;
          curY += Math.random() * 50;
          this.path.push({ x: curX, y: curY });
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.globalAlpha = this.alpha;
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
          ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      update() {
        this.alpha -= 0.02 * speed;
        return this.alpha > 0;
      }
    }

    let bolts: Bolt[] = [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (Math.random() < 0.05) {
        bolts.push(new Bolt());
      }

      bolts = bolts.filter((bolt) => {
        bolt.draw(ctx);
        return bolt.update();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-20"
    />
  );
};
