import React, { useEffect, useRef, useState } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { URLBar } from './URLBar';
import { BuildingDrawer } from './BuildingDrawer';
import { useCityStatus } from '../../hooks/useCityStatus';
import { useSSE } from '../../hooks/useSSE';
import { Building } from '../../lib/types';
import { BUILDING_COLORS, PROTOCOL_COLORS } from '../../lib/constants';

type ServiceKey = 'frontend' | 'gateway' | 'api' | 'database';
type MapPosition = { x: number; y: number };
type Hitbox = { service: ServiceKey; x: number; y: number; width: number; height: number };
type PacketOrbKey = 'HTTP' | 'SQL' | 'DNS';
type PacketSendPulse = {
  id: number;
  createdAt: number;
  protocol: string;
  destination: ServiceKey;
};

type SpriteConfig = {
  url: string;
  width: number;
  height: number;
  labelOffsetY: number;
  portOffsetY: number;
  glowBlur: number;
  hitboxScaleX: number;
  hitboxScaleY: number;
  hitboxOffsetY: number;
};

const SPRITE_CONFIG: Record<ServiceKey, SpriteConfig> = {
  frontend: {
    url: '/city-assets/building-command-center-v1.png',
    width: 176,
    height: 202,
    labelOffsetY: 22,
    portOffsetY: -20,
    glowBlur: 10,
    hitboxScaleX: 0.72,
    hitboxScaleY: 0.76,
    hitboxOffsetY: 0,
  },
  gateway: {
    url: '/city-assets/building-city-gate-v1.png',
    width: 182,
    height: 208,
    labelOffsetY: 22,
    portOffsetY: -20,
    glowBlur: 10,
    hitboxScaleX: 0.72,
    hitboxScaleY: 0.76,
    hitboxOffsetY: 4,
  },
  api: {
    url: '/city-assets/building-city-hall-v1.png',
    width: 192,
    height: 220,
    labelOffsetY: 22,
    portOffsetY: -20,
    glowBlur: 10,
    hitboxScaleX: 0.72,
    hitboxScaleY: 0.76,
    hitboxOffsetY: 0,
  },
  database: {
    url: '/city-assets/building-municipal-archive-v1.png',
    width: 176,
    height: 202,
    labelOffsetY: 22,
    portOffsetY: -20,
    glowBlur: 10,
    hitboxScaleX: 0.72,
    hitboxScaleY: 0.76,
    hitboxOffsetY: -2,
  },
};

const PACKET_ORB_ASSETS: Record<PacketOrbKey, string> = {
  HTTP: '/city-assets/packet-http-v1.png',
  SQL: '/city-assets/packet-sql-v1.png',
  DNS: '/city-assets/packet-dns-v1.png',
};

function normalizePacketOrbKey(protocol: string): PacketOrbKey {
  const upper = protocol.toUpperCase();
  if (upper === 'DNS') return 'DNS';
  if (upper === 'SQL' || upper === 'TCP') return 'SQL';
  return 'HTTP';
}

function isServiceKey(value: string): value is ServiceKey {
  return value === 'frontend' || value === 'gateway' || value === 'api' || value === 'database';
}

function getDesktopPositions(canvas: HTMLCanvasElement, drawerOpen: boolean): Record<ServiceKey, MapPosition> {
  if (drawerOpen) {
    const cx = canvas.width / 2 - 125;
    const cy = canvas.height / 2 - 70;
    return {
      frontend: { x: cx - 245, y: cy + 170 },
      gateway: { x: cx - 20, y: cy + 330 },
      api: { x: cx + 240, y: cy + 155 },
      database: { x: cx + 15, y: cy - 55 },
    };
  }

  const cx = canvas.width / 2 - 80;
  const cy = canvas.height / 2 - 72;
  return {
    frontend: { x: cx - 240, y: cy + 172 },
    gateway: { x: cx - 10, y: cy + 325 },
    api: { x: cx + 240, y: cy + 172 },
    database: { x: cx + 10, y: cy - 52 },
  };
}

function resolveServiceKeyFromText(value: string): ServiceKey {
  const lower = value.toLowerCase();
  if (lower.includes('gate') || lower.includes('nginx')) return 'gateway';
  if (lower.includes('api') || lower.includes('hall') || lower.includes('fastapi')) return 'api';
  if (lower.includes('db') || lower.includes('postgres') || lower.includes('sql') || lower.includes('database') || lower.includes('archive')) {
    return 'database';
  }
  if (lower.includes('front') || lower.includes('browser') || lower.includes('command')) return 'frontend';
  return 'gateway';
}

function drawFallbackBuildingBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  glow: string,
  status: string,
  width: number,
  height: number
) {
  const alpha = status === 'stopped' ? 0.55 : 1;
  const w = Math.round(width * 0.6);
  const h = Math.round(height * 0.58);
  const depth = Math.round(height * 0.22);

  ctx.save();
  ctx.translate(x, y + 10);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(-w / 2, -h / 6);
  ctx.lineTo(-w / 2, h / 2);
  ctx.lineTo(0, h / 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.85;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(w / 2, -h / 6);
  ctx.lineTo(w / 2, h / 2);
  ctx.lineTo(0, h / 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.75;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2 - depth);
  ctx.lineTo(-w / 2, -h / 6 - depth / 2);
  ctx.lineTo(0, -h / 2);
  ctx.lineTo(w / 2, -h / 6 - depth / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawBuildingSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  image: HTMLImageElement | null | undefined,
  config: SpriteConfig,
  glow: string,
  color: string,
  status: string
) {
  const alpha = status === 'running' ? 1 : status === 'error' ? 0.85 : 0.6;
  const left = x - config.width / 2;
  const top = y - config.height / 2;

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(x, y + config.height * 0.28, config.width * 0.28, config.height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = glow;
    ctx.shadowBlur = config.glowBlur;
    ctx.drawImage(image, left, top, config.width, config.height);
    ctx.restore();
    return;
  }

  drawFallbackBuildingBody(ctx, x, y, color, glow, status, config.width, config.height);
}

function drawBuildingLabels(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  config: SpriteConfig,
  glow: string,
  label: string,
  port: number
) {
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Inter';
  ctx.fillText(label, x, y + config.height / 2 + config.labelOffsetY);

  ctx.fillStyle = glow;
  ctx.font = 'bold 14px JetBrains Mono';
  ctx.fillText(`:${port}`, x, y - config.height / 2 + config.portOffsetY);
  ctx.restore();
}

function getHitboxes(positions: Record<ServiceKey, MapPosition>): Hitbox[] {
  return (Object.entries(SPRITE_CONFIG) as Array<[ServiceKey, SpriteConfig]>).map(([service, cfg]) => {
    const pos = positions[service];
    const width = cfg.width * cfg.hitboxScaleX;
    const height = cfg.height * cfg.hitboxScaleY;
    return {
      service,
      x: pos.x - width / 2,
      y: pos.y - height / 2 + cfg.hitboxOffsetY,
      width,
      height,
    };
  });
}

function resolveBuildingAtPoint(hitboxes: Hitbox[], x: number, y: number): ServiceKey | null {
  for (const hitbox of hitboxes) {
    if (x >= hitbox.x && x <= hitbox.x + hitbox.width && y >= hitbox.y && y <= hitbox.y + hitbox.height) {
      return hitbox.service;
    }
  }

  let nearest: { service: ServiceKey; distSq: number } | null = null;
  for (const hitbox of hitboxes) {
    const cx = hitbox.x + hitbox.width / 2;
    const cy = hitbox.y + hitbox.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const distSq = dx * dx + dy * dy;
    if (!nearest || distSq < nearest.distSq) {
      nearest = { service: hitbox.service, distSq };
    }
  }

  return nearest && nearest.distSq <= 80 * 80 ? nearest.service : null;
}

function hashText(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function drawPacketOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  protocol: string,
  image: HTMLImageElement | null | undefined,
  timeFactor: number
) {
  const color = PROTOCOL_COLORS[protocol] || '#ffffff';
  const size = 16 + (protocol.toUpperCase() === 'DNS' ? 2 : 0) + (Math.sin(timeFactor * Math.PI * 2) + 1) * 2.2;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.globalAlpha = 0.9;

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x - size, y - size, size * 2, size * 2);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSendPulsePath(
  ctx: CanvasRenderingContext2D,
  from: MapPosition,
  to: MapPosition,
  progress: number,
  color: string
) {
  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped <= 0) return;

  const px = from.x + (to.x - from.x) * clamped;
  const py = from.y + (to.y - from.y) * clamped;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.restore();
}

function drawImpactBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number,
  color: string
) {
  const t = Math.max(0, Math.min(1, intensity));
  if (t <= 0) return;

  const ringRadius = 10 + (1 - t) * 42;
  const alpha = t * 0.9;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;

  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.45;
  ctx.beginPath();
  ctx.arc(x, y, 10 + t * 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDatabaseLockdown(
  ctx: CanvasRenderingContext2D,
  pos: MapPosition,
  config: SpriteConfig,
  now: number
) {
  const pulse = (Math.sin(now / 320) + 1) / 2;
  const ringColor = pulse > 0.45 ? '#ff9922' : '#ff4444';
  const baseY = pos.y + config.height * 0.24;
  const rx = config.width * 0.34 + pulse * 6;
  const ry = config.height * 0.12 + pulse * 3;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = 14;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.ellipse(pos.x, baseY, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // DB endpoint shield marker / blocked policy cue
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#0b0f19';
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2;
  const badgeX = pos.x + config.width * 0.22;
  const badgeY = pos.y - config.height * 0.12;
  const badgeW = 34;
  const badgeH = 24;
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(badgeX - badgeW / 2 + r, badgeY - badgeH / 2);
  ctx.lineTo(badgeX + badgeW / 2 - r, badgeY - badgeH / 2);
  ctx.quadraticCurveTo(badgeX + badgeW / 2, badgeY - badgeH / 2, badgeX + badgeW / 2, badgeY - badgeH / 2 + r);
  ctx.lineTo(badgeX + badgeW / 2, badgeY + badgeH / 2 - r);
  ctx.quadraticCurveTo(badgeX + badgeW / 2, badgeY + badgeH / 2, badgeX + badgeW / 2 - r, badgeY + badgeH / 2);
  ctx.lineTo(badgeX - badgeW / 2 + r, badgeY + badgeH / 2);
  ctx.quadraticCurveTo(badgeX - badgeW / 2, badgeY + badgeH / 2, badgeX - badgeW / 2, badgeY + badgeH / 2 - r);
  ctx.lineTo(badgeX - badgeW / 2, badgeY - badgeH / 2 + r);
  ctx.quadraticCurveTo(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeX - badgeW / 2 + r, badgeY - badgeH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = ringColor;
  ctx.font = 'bold 12px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillText('LOCK', badgeX, badgeY + 4);

  // small blocked slash near api->db route endpoint
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(pos.x - 18, pos.y + 6);
  ctx.lineTo(pos.x + 10, pos.y - 10);
  ctx.stroke();
  ctx.restore();
}

export function CityMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteImagesRef = useRef<Partial<Record<ServiceKey, HTMLImageElement | null>>>({});
  const orbImagesRef = useRef<Partial<Record<PacketOrbKey, HTMLImageElement | null>>>({});
  const sendPulsesRef = useRef<PacketSendPulse[]>([]);
  const nextPulseIdRef = useRef(1);
  const { status } = useCityStatus();
  const { packets } = useSSE();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  useEffect(() => {
    let active = true;

    (Object.entries(SPRITE_CONFIG) as Array<[ServiceKey, SpriteConfig]>).forEach(([service, cfg]) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!active) return;
        spriteImagesRef.current[service] = img;
      };
      img.onerror = () => {
        if (!active) return;
        spriteImagesRef.current[service] = null;
      };
      img.src = cfg.url;
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    (Object.entries(PACKET_ORB_ASSETS) as Array<[PacketOrbKey, string]>).forEach(([key, url]) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!active) return;
        orbImagesRef.current[key] = img;
      };
      img.onerror = () => {
        if (!active) return;
        orbImagesRef.current[key] = null;
      };
      img.src = url;
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onSend = (evt: Event) => {
      const custom = evt as CustomEvent<{ destination?: string; protocol?: string }>;
      const destination = resolveServiceKeyFromText(custom.detail?.destination || 'gateway');
      const protocol = custom.detail?.protocol || 'HTTP';
      const pulse: PacketSendPulse = {
        id: nextPulseIdRef.current++,
        createdAt: performance.now(),
        protocol,
        destination,
      };
      sendPulsesRef.current = [pulse, ...sendPulsesRef.current].slice(0, 8);
    };

    window.addEventListener('portquest:packet-send', onSend as EventListener);
    return () => {
      window.removeEventListener('portquest:packet-send', onSend as EventListener);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const drawerOpen = Boolean(selectedBuilding);
      const positions = getDesktopPositions(canvas, drawerOpen);
      const now = performance.now();

      // Draw grid/roads using the desktop layout centroid.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([5, 5]);
      const roadPoints: ServiceKey[] = ['frontend', 'gateway', 'api', 'database'];
      roadPoints.forEach((service, index) => {
        const p = positions[service];
        if (index === 0) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          return;
        }
        ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(positions.gateway.x, positions.gateway.y);
      ctx.lineTo(positions.database.x, positions.database.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const drawableBuildings: Array<{ building: Building; service: ServiceKey; pos: MapPosition }> = [];
      if (status?.buildings) {
        status.buildings.forEach((b) => {
          if (!isServiceKey(b.service)) return;
          const pos = positions[b.service];
          if (!pos) return;
          drawableBuildings.push({ building: b, service: b.service, pos });
        });
      }

      drawableBuildings.forEach(({ building, service, pos }) => {
        const colors = BUILDING_COLORS[service] || { glow: '#fff', body: '#333' };
        drawBuildingSprite(
          ctx,
          pos.x,
          pos.y,
          spriteImagesRef.current[service],
          SPRITE_CONFIG[service],
          colors.glow,
          colors.body,
          building.status
        );
      });

      if (status?.firewall_enabled) {
        drawDatabaseLockdown(ctx, positions.database, SPRITE_CONFIG.database, now);
      }

      const activePulses = sendPulsesRef.current.filter((pulse) => now - pulse.createdAt < 1600);
      sendPulsesRef.current = activePulses;

      activePulses.forEach((pulse) => {
        const age = now - pulse.createdAt;
        const gate = positions.gateway;
        const front = positions.frontend;
        const dest = positions[pulse.destination];
        const pulseColor = PROTOCOL_COLORS[pulse.protocol] || '#00ccff';

        drawSendPulsePath(ctx, front, gate, age / 420, pulseColor);
        drawImpactBurst(ctx, gate.x, gate.y - 6, 1 - Math.abs(age - 320) / 380, '#00ff88');

        if (pulse.destination !== 'gateway' && age > 220) {
          drawSendPulsePath(ctx, gate, dest, (age - 220) / 520, pulseColor);
        }
        if (age > 520) {
          drawImpactBurst(ctx, dest.x, dest.y - 8, 1 - Math.abs(age - 760) / 420, pulseColor);
        }
      });

      // Draw packets (simplified animation)
      packets.slice(0, 8).forEach((p, i) => {
        if (!isServiceKey(p.source) || !isServiceKey(p.destination)) return;
        const src = positions[p.source];
        const dst = positions[p.destination];
        if (src && dst) {
          const phase = (hashText(`${p.id}-${p.timestamp}`) % 1000) / 1000;
          const progress = (((Date.now() % 2200) / 2200) + phase + i * 0.08) % 1;
          const px = src.x + (dst.x - src.x) * progress;
          const py = src.y + (dst.y - src.y) * progress;
          const orbKey = normalizePacketOrbKey(p.protocol);
          const orbImage = orbImagesRef.current[orbKey];

          ctx.save();
          ctx.strokeStyle = `${PROTOCOL_COLORS[p.protocol] || '#ffffff'}55`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.restore();

          drawPacketOrb(ctx, px, py, p.protocol, orbImage, progress);
        }
      });

      // Draw labels on top so traffic does not reduce readability.
      drawableBuildings.forEach(({ building, service, pos }) => {
        const colors = BUILDING_COLORS[service] || { glow: '#fff', body: '#333' };
        drawBuildingLabels(ctx, pos.x, pos.y, SPRITE_CONFIG[service], colors.glow, building.name, building.port);
      });

      // Packet effects use the official orb assets in /city-assets with glow and impact overlays.
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, packets, selectedBuilding]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!status?.buildings?.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
    const positions = getDesktopPositions(canvas, Boolean(selectedBuilding));
    const service = resolveBuildingAtPoint(getHitboxes(positions), x, y);
    if (!service) return;

    const building = status.buildings.find((b) => b.service === service);
    if (building) {
      setSelectedBuilding(building);
    }
  };

  return (
    <div className="relative h-[calc(100vh-8rem)] flex flex-col">
      <URLBar />
      <GlassPanel className="w-full flex-1 flex items-center justify-center relative overflow-hidden">
        <div
          className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
            selectedBuilding ? 'md:pr-[25rem] md:pl-4' : 'px-2'
          }`}
        >
          <canvas
            ref={canvasRef}
            width={1040}
            height={800}
            onClick={handleCanvasClick}
            className="cursor-pointer w-full max-w-[1040px] h-auto"
          />
        </div>
        <BuildingDrawer building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />
      </GlassPanel>
    </div>
  );
}
