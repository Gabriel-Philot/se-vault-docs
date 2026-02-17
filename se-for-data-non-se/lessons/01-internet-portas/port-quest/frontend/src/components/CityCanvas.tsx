import React, { useRef, useEffect, useCallback } from 'react';
import { Building, Packet, PacketStatus } from '../types/city';

interface Props {
  buildings: Building[];
  packets: Packet[];
  onBuildingClick: (building: Building) => void;
  firewallEnabled: boolean;
  tlsEnabled: boolean;
}

/* ── isometric helpers ── */
function isoProject(gx: number, gy: number, ox: number, oy: number, tw: number, th: number) {
  return {
    x: ox + (gx - gy) * (tw / 2),
    y: oy + (gx + gy) * (th / 2),
  };
}

/* building grid positions (col, row) — spread further apart */
const BUILDING_GRID: Record<string, [number, number]> = {
  frontend: [0, 0],
  gateway: [4, 0],
  api: [4, 4],
  database: [0, 4],
};

/* colours */
const GLOW: Record<string, string> = {
  frontend: '#00ccff',
  gateway: '#00ff88',
  api: '#bb66ff',
  database: '#ff9922',
};

const BODY: Record<string, string> = {
  frontend: '#0d3b5c',
  gateway: '#0d4d33',
  api: '#3d1a6e',
  database: '#5c3a0d',
};

const PROTOCOL_COLOR: Record<string, string> = {
  HTTP: '#00ccff',
  SQL: '#ff9922',
  SSE: '#00ff88',
  gRPC: '#ff44aa',
  DNS: '#ffee44',
  TCP: '#ff9922',
};

/* ── animated packet state ── */
interface AnimPacket {
  id: string;
  fromService: string;
  toService: string;
  color: string;
  progress: number; // 0..1
  blocked: boolean;
  label: string;
}

/* road connections */
const ROADS: [string, string, string][] = [
  ['frontend', 'gateway', 'city-public'],
  ['gateway', 'api', 'city-internal'],
  ['api', 'database', 'city-internal'],
  ['frontend', 'database', 'city-internal'],
  ['gateway', 'database', 'city-internal'],
  ['frontend', 'api', 'city-public'],
];

export default function CityCanvas({
  buildings,
  packets,
  onBuildingClick,
  firewallEnabled,
  tlsEnabled,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animPacketsRef = useRef<AnimPacket[]>([]);
  const pulseRef = useRef<Record<string, number>>({});
  const frameRef = useRef(0);
  const tooltipRef = useRef<{ x: number; y: number; text: string } | null>(null);
  const buildingScreenRef = useRef<
    { service: string; x: number; y: number; w: number; h: number; building: Building }[]
  >([]);

  /* convert packets into animation entries */
  useEffect(() => {
    const existing = new Set(animPacketsRef.current.map((p) => p.id));
    for (const pkt of packets) {
      const pktId = String(pkt.id ?? pkt.timestamp ?? Math.random());
      if (existing.has(pktId)) continue;
      const fromService = resolveService(pkt.source);
      const toService = resolveService(pkt.destination);
      if (!fromService || !toService) continue;
      animPacketsRef.current.push({
        id: pktId,
        fromService,
        toService,
        color: PROTOCOL_COLOR[pkt.protocol] ?? '#ffffff',
        progress: 0,
        blocked: pkt.status === 'blocked',
        label: `${pkt.source}:${pkt.source_port} → ${pkt.destination}:${pkt.destination_port} [${pkt.protocol}]`,
      });
      pulseRef.current[toService] = 1.0;
    }
    // trim old
    if (animPacketsRef.current.length > 60) {
      animPacketsRef.current = animPacketsRef.current.slice(-50);
    }
  }, [packets]);

  /* main render loop */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    /* dynamic tile size — scale to fill ~70% of canvas */
    const tw = Math.floor(Math.min(W, H) * 0.14); // tile width
    const th = Math.floor(tw / 2);                 // tile height (iso ratio)
    const ox = W / 2;
    const oy = H * 0.28;

    ctx.clearRect(0, 0, W, H);

    /* background gradient */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#070714');
    bg.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* subtle grid */
    ctx.strokeStyle = 'rgba(40,40,80,0.3)';
    ctx.lineWidth = 0.5;
    for (let i = -6; i <= 6; i++) {
      const a = isoProject(i, -6, ox, oy, tw, th);
      const b = isoProject(i, 6, ox, oy, tw, th);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      const c = isoProject(-6, i, ox, oy, tw, th);
      const d = isoProject(6, i, ox, oy, tw, th);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }

    /* scale factor for dynamic sizing */
    const scale = tw / 64; // base reference was 64

    /* roads */
    for (const [sA, sB, net] of ROADS) {
      const gA = BUILDING_GRID[sA];
      const gB = BUILDING_GRID[sB];
      if (!gA || !gB) continue;
      const a = isoProject(gA[0], gA[1], ox, oy, tw, th);
      const b = isoProject(gB[0], gB[1], ox, oy, tw, th);

      const roadColor =
        tlsEnabled && net === 'city-internal'
          ? '#ffd700'
          : net === 'city-public'
            ? 'rgba(0,150,255,0.35)'
            : 'rgba(200,180,50,0.25)';

      ctx.strokeStyle = roadColor;
      ctx.lineWidth = (tlsEnabled ? 5 : 4) * scale;
      ctx.setLineDash(tlsEnabled ? [] : [12 * scale, 8 * scale]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);

      /* road glow */
      if (tlsEnabled && net === 'city-internal') {
        ctx.strokeStyle = 'rgba(255,215,0,0.15)';
        ctx.lineWidth = 14 * scale;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    /* buildings */
    const frame = frameRef.current;
    buildingScreenRef.current = [];

    for (const b of buildings) {
      const grid = BUILDING_GRID[b.service];
      if (!grid) continue;
      const pos = isoProject(grid[0], grid[1], ox, oy, tw, th);
      const glow = GLOW[b.service] ?? '#ffffff';
      const body = BODY[b.service] ?? '#222244';
      const pulse = pulseRef.current[b.service] ?? 0;

      drawBuilding(ctx, pos.x, pos.y, b, glow, body, pulse, frame, tlsEnabled, scale);

      /* click hitbox — scaled */
      const hitW = 100 * scale;
      const hitH = 140 * scale;
      buildingScreenRef.current.push({
        service: b.service,
        x: pos.x - hitW / 2,
        y: pos.y - hitH,
        w: hitW,
        h: hitH,
        building: b,
      });
    }

    /* animated packets */
    const truckW = 14 * scale;
    const truckH = 10 * scale;
    const cabW = 10 * scale;
    const cabH = 6 * scale;
    for (const ap of animPacketsRef.current) {
      if (ap.progress >= 1) continue;
      ap.progress = Math.min(1, ap.progress + 0.006);

      const gA = BUILDING_GRID[ap.fromService];
      const gB = BUILDING_GRID[ap.toService];
      if (!gA || !gB) continue;
      const a = isoProject(gA[0], gA[1], ox, oy, tw, th);
      const b = isoProject(gB[0], gB[1], ox, oy, tw, th);

      let t = ap.progress;
      if (ap.blocked && t > 0.5) {
        t = 0.5 + Math.sin((t - 0.5) * Math.PI * 10) * 0.05;
      }

      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;

      /* packet truck */
      ctx.save();
      if (ap.blocked) {
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 16 * scale;
        ctx.fillStyle = '#ff4444';
      } else {
        ctx.shadowColor = ap.color;
        ctx.shadowBlur = 12 * scale;
        ctx.fillStyle = ap.color;
      }
      ctx.fillRect(px - truckW / 2, py - truckH, truckW, truckH);
      ctx.fillStyle = ap.blocked ? '#881111' : darken(ap.color);
      ctx.fillRect(px - cabW / 2, py - truckH - cabH, cabW, cabH);

      /* TLS lock icon */
      if (tlsEnabled && !ap.blocked) {
        const lockS = 4 * scale;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px - lockS / 2, py - truckH - cabH - lockS, lockS, lockS * 0.75);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.arc(px, py - truckH - cabH - lockS - 1, lockS * 0.7, Math.PI, 0);
        ctx.stroke();
      }

      /* blocked X */
      if (ap.blocked && ap.progress > 0.45) {
        const xSize = 10 * scale;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        ctx.moveTo(px - xSize, py - truckH - cabH - 4 * scale);
        ctx.lineTo(px + xSize, py + 2 * scale);
        ctx.moveTo(px + xSize, py - truckH - cabH - 4 * scale);
        ctx.lineTo(px - xSize, py + 2 * scale);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* decay pulses */
    for (const key of Object.keys(pulseRef.current)) {
      pulseRef.current[key] *= 0.96;
      if (pulseRef.current[key] < 0.01) delete pulseRef.current[key];
    }

    /* tooltip */
    const tt = tooltipRef.current;
    if (tt) {
      ctx.save();
      const ttFontSize = Math.max(11, Math.floor(12 * scale));
      ctx.font = `${ttFontSize}px "Courier New", monospace`;
      const m = ctx.measureText(tt.text);
      const ttw = m.width + 20;
      const tth = ttFontSize + 12;
      ctx.fillStyle = 'rgba(10,10,30,0.92)';
      ctx.strokeStyle = '#00ccff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tt.x - ttw / 2, tt.y - tth - 8, ttw, tth, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e0e0ff';
      ctx.textAlign = 'center';
      ctx.fillText(tt.text, tt.x, tt.y - 14);
      ctx.restore();
    }

    /* firewall shield overlay */
    if (firewallEnabled) {
      ctx.save();
      ctx.globalAlpha = 0.08 + Math.sin(frame * 0.03) * 0.04;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(20, 20, W - 40, H - 40);
      ctx.setLineDash([]);
      ctx.font = `${Math.max(12, Math.floor(14 * scale))}px monospace`;
      ctx.fillStyle = '#ff6666';
      ctx.globalAlpha = 0.6;
      ctx.fillText('FIREWALL ACTIVE', 30, 38);
      ctx.restore();
    }

    frameRef.current++;
    requestAnimationFrame(render);
  }, [buildings, firewallEnabled, tlsEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    const id = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(id);
    };
  }, [render]);

  /* click handler */
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const hit of buildingScreenRef.current) {
      if (mx >= hit.x && mx <= hit.x + hit.w && my >= hit.y && my <= hit.y + hit.h) {
        onBuildingClick(hit.building);
        return;
      }
    }
  };

  /* hover for packet tooltip */
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const canvas = canvasRef.current!;
    const cW = canvas.width;
    const cH = canvas.height;
    const htw = Math.floor(Math.min(cW, cH) * 0.14);
    const hth = Math.floor(htw / 2);
    const hox = cW / 2;
    const hoy = cH * 0.28;

    tooltipRef.current = null;
    for (const ap of animPacketsRef.current) {
      if (ap.progress >= 1) continue;
      const gA = BUILDING_GRID[ap.fromService];
      const gB = BUILDING_GRID[ap.toService];
      if (!gA || !gB) continue;
      const a = isoProject(gA[0], gA[1], hox, hoy, htw, hth);
      const b = isoProject(gB[0], gB[1], hox, hoy, htw, hth);
      const px = a.x + (b.x - a.x) * ap.progress;
      const py = a.y + (b.y - a.y) * ap.progress;
      const hitRadius = 18 * (htw / 64);
      if (Math.abs(mx - px) < hitRadius && Math.abs(my - py) < hitRadius) {
        tooltipRef.current = { x: px, y: py, text: ap.label };
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMove}
      style={{ width: '100%', height: '100%', cursor: 'pointer', display: 'block' }}
    />
  );
}

/* ── drawing helpers ── */

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  b: Building,
  glow: string,
  body: string,
  pulse: number,
  frame: number,
  tls: boolean,
  scale: number,
) {
  const bw = Math.floor(50 * scale);
  const baseHeights: Record<string, number> = {
    frontend: 90,
    gateway: 60,
    api: 78,
    database: 55,
  };
  const bh = Math.floor((baseHeights[b.service] ?? 65) * scale);
  const topH = Math.floor(14 * scale); // top face half-height
  const topH2 = topH * 2;

  ctx.save();

  /* glow pulse */
  if (pulse > 0) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 40 * pulse * scale;
  }

  /* building base shadow */
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 6 * scale, bw * 0.7, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  /* isometric box - top face */
  ctx.fillStyle = lighten(body, 30);
  ctx.beginPath();
  ctx.moveTo(x, y - bh);
  ctx.lineTo(x + bw / 2, y - bh + topH);
  ctx.lineTo(x, y - bh + topH2);
  ctx.lineTo(x - bw / 2, y - bh + topH);
  ctx.closePath();
  ctx.fill();

  /* left face */
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - bw / 2, y - bh + topH);
  ctx.lineTo(x, y - bh + topH2);
  ctx.lineTo(x, y + 8 * scale);
  ctx.lineTo(x - bw / 2, y - 6 * scale);
  ctx.closePath();
  ctx.fill();

  /* right face */
  ctx.fillStyle = darken(body, 20);
  ctx.beginPath();
  ctx.moveTo(x + bw / 2, y - bh + topH);
  ctx.lineTo(x, y - bh + topH2);
  ctx.lineTo(x, y + 8 * scale);
  ctx.lineTo(x + bw / 2, y - 6 * scale);
  ctx.closePath();
  ctx.fill();

  /* windows (pixel art dots) */
  ctx.fillStyle = glow;
  const winSize = Math.max(3, Math.floor(5 * scale));
  const winGap = Math.floor(16 * scale);
  const winRows = Math.floor((bh - 30 * scale) / winGap);
  for (let r = 0; r < winRows; r++) {
    const wy = y - bh + Math.floor(38 * scale) + r * winGap;
    ctx.globalAlpha = 0.5 + Math.sin(frame * 0.05 + r) * 0.3;
    ctx.fillRect(x - bw / 2 + 6 * scale, wy, winSize, winSize);
    ctx.fillRect(x - bw / 2 + 16 * scale, wy, winSize, winSize);
    ctx.fillRect(x + bw / 2 - (6 + winSize) * scale, wy, winSize, winSize);
    ctx.fillRect(x + bw / 2 - (16 + winSize) * scale, wy, winSize, winSize);
  }
  ctx.globalAlpha = 1;

  /* door (port entrance) */
  const doorGlow = 0.6 + Math.sin(frame * 0.04) * 0.3;
  const doorW = Math.floor(12 * scale);
  const doorH = Math.floor(14 * scale);
  ctx.fillStyle = glow;
  ctx.globalAlpha = doorGlow;
  ctx.fillRect(x - doorW / 2, y - 6 * scale, doorW, doorH);
  ctx.globalAlpha = 1;

  /* port number above building */
  ctx.shadowColor = glow;
  ctx.shadowBlur = 14 * scale;
  const portFontSize = Math.max(14, Math.floor(18 * scale));
  ctx.font = `bold ${portFontSize}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = glow;
  ctx.fillText(`:${b.port}`, x, y - bh - 12 * scale);

  /* building name */
  ctx.shadowBlur = 6 * scale;
  const nameFontSize = Math.max(10, Math.floor(13 * scale));
  ctx.font = `${nameFontSize}px "Courier New", monospace`;
  ctx.fillStyle = '#c0c0e0';
  ctx.fillText(b.name, x, y + 24 * scale);

  /* TLS shield */
  if (tls) {
    const tlsSize = Math.max(14, Math.floor(18 * scale));
    ctx.font = `${tlsSize}px sans-serif`;
    ctx.fillText('🔒', x + bw / 2 + 4 * scale, y - bh + 8 * scale);
  }

  /* status dot */
  ctx.shadowBlur = 0;
  const statusColor =
    b.status === 'running' ? '#00ff66' : b.status === 'error' ? '#ff3333' : '#666666';
  ctx.fillStyle = statusColor;
  ctx.beginPath();
  ctx.arc(x + bw / 2 + 6 * scale, y - bh + 22 * scale, 4 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function resolveService(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('frontend') || lower.includes('browser') || lower.includes('command'))
    return 'frontend';
  if (lower.includes('gateway') || lower.includes('gate') || lower.includes('nginx'))
    return 'gateway';
  if (lower.includes('api') || lower.includes('hall') || lower.includes('fastapi'))
    return 'api';
  if (
    lower.includes('database') ||
    lower.includes('db') ||
    lower.includes('postgres') ||
    lower.includes('archive')
  )
    return 'database';
  return null;
}

function darken(hex: string, amt = 30): string {
  return adjustColor(hex, -amt);
}

function lighten(hex: string, amt = 30): string {
  return adjustColor(hex, amt);
}

function adjustColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
