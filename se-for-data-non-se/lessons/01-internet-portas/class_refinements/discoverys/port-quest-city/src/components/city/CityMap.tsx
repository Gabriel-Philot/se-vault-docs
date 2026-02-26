import React, { useEffect, useRef, useState } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { URLBar } from './URLBar';
import { BuildingDrawer } from './BuildingDrawer';
import { useCityStatus } from '../../hooks/useCityStatus';
import { useSSE } from '../../hooks/useSSE';
import { Building } from '../../lib/types';
import { BUILDING_COLORS, PROTOCOL_COLORS } from '../../lib/constants';

// Helper to draw isometric building
function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, label: string, port: number, status: string) {
  const width = 60;
  const height = 80;
  const depth = 40;

  ctx.save();
  ctx.translate(x, y);

  // Glow
  ctx.shadowColor = glow;
  ctx.shadowBlur = 15;

  // Left face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-width, height / 2);
  ctx.lineTo(-width, height / 2 - depth);
  ctx.lineTo(0, -depth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right face
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, height / 2);
  ctx.lineTo(width, height / 2 - depth);
  ctx.lineTo(0, -depth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // Top face
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -depth);
  ctx.lineTo(-width, height / 2 - depth);
  ctx.lineTo(0, -depth * 2);
  ctx.lineTo(width, height / 2 - depth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = '12px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, height / 2 + 20);

  // Port
  ctx.fillStyle = glow;
  ctx.font = 'bold 14px JetBrains Mono';
  ctx.fillText(`:${port}`, 0, -depth * 2 - 10);

  ctx.restore();
}

export function CityMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status } = useCityStatus();
  const { packets } = useSSE();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 50;

      // Draw grid/roads
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx - 150, cy + 75);
      ctx.lineTo(cx, cy + 150);
      ctx.lineTo(cx + 150, cy + 75);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Positions
      const positions: Record<string, {x: number, y: number}> = {
        frontend: { x: cx - 150, y: cy + 75 },
        gateway: { x: cx, y: cy + 150 },
        api: { x: cx + 150, y: cy + 75 },
        database: { x: cx, y: cy }
      };

      if (status?.buildings) {
        status.buildings.forEach(b => {
          const pos = positions[b.service];
          if (pos) {
            const colors = BUILDING_COLORS[b.service] || { glow: '#fff', body: '#333' };
            drawBuilding(ctx, pos.x, pos.y, colors.body, colors.glow, b.name, b.port, b.status);
          }
        });
      }

      // Draw packets (simplified animation)
      packets.slice(0, 5).forEach((p, i) => {
        const src = positions[p.source];
        const dst = positions[p.destination];
        if (src && dst) {
          const progress = (Date.now() % 2000) / 2000; // Fake progress for now
          const px = src.x + (dst.x - src.x) * progress;
          const py = src.y + (dst.y - src.y) * progress;
          
          ctx.fillStyle = PROTOCOL_COLORS[p.protocol] || '#fff';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, packets]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (status?.buildings && status.buildings.length > 0) {
      setSelectedBuilding(status.buildings[0]);
    }
  };

  return (
    <div className="relative h-[calc(100vh-8rem)] flex flex-col">
      <URLBar />
      <GlassPanel className="w-full flex-1 flex items-center justify-center relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          className="cursor-pointer"
        />
        <BuildingDrawer building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />
      </GlassPanel>
    </div>
  );
}
