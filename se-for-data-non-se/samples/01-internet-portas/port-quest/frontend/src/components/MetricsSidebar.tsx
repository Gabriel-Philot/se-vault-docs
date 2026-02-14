import React, { useRef, useEffect, useState } from 'react';
import { Packet } from '../types/city';

interface Props {
  packets: Packet[];
  connected: boolean;
  activeConnections: number;
  packetsPerSecond: number;
}

export default function MetricsSidebar({
  packets,
  connected,
  activeConnections,
  packetsPerSecond,
}: Props) {
  const graphRef = useRef<HTMLCanvasElement>(null);
  const latencyHistory = useRef<number[]>([]);
  const [displayPPS, setDisplayPPS] = useState(0);

  /* animate packets-per-second counter */
  useEffect(() => {
    const step = () => {
      setDisplayPPS((prev) => {
        const diff = packetsPerSecond - prev;
        if (Math.abs(diff) < 0.5) return packetsPerSecond;
        return prev + diff * 0.15;
      });
    };
    const id = setInterval(step, 60);
    return () => clearInterval(id);
  }, [packetsPerSecond]);

  /* latency graph */
  useEffect(() => {
    if (packets.length > 0 && packets[0].latency_ms != null) {
      latencyHistory.current.push(packets[0].latency_ms);
      if (latencyHistory.current.length > 30) latencyHistory.current.shift();
    }

    const canvas = graphRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const data = latencyHistory.current;
    if (data.length < 2) return;

    const max = Math.max(...data, 1);
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (v / max) * (H - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    /* fill under */
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,200,255,0.08)';
    ctx.fill();
  }, [packets]);

  return (
    <div style={styles.sidebar}>
      <h3 style={styles.heading}>METRICS</h3>

      {/* connection status */}
      <div style={styles.statusRow}>
        <div
          style={{
            ...styles.dot,
            background: connected ? '#00ff66' : '#ff3333',
            boxShadow: connected ? '0 0 8px #00ff66' : '0 0 8px #ff3333',
          }}
        />
        <span style={{ color: connected ? '#00ff66' : '#ff4444', fontSize: 12 }}>
          {connected ? 'SSE CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>

      {/* counters */}
      <div style={styles.metric}>
        <span style={styles.metricLabel}>Packets/sec</span>
        <span style={styles.metricValue}>{Math.round(displayPPS)}</span>
      </div>
      <div style={styles.metric}>
        <span style={styles.metricLabel}>Active Connections</span>
        <span style={styles.metricValue}>{activeConnections}</span>
      </div>

      {/* latency graph */}
      <div style={styles.graphBox}>
        <span style={styles.graphLabel}>Latency (ms)</span>
        <canvas ref={graphRef} width={200} height={60} style={{ width: '100%', height: 60 }} />
      </div>

      {/* recent packets */}
      <h4 style={styles.subHeading}>RECENT PACKETS</h4>
      <div style={styles.packetList}>
        {packets.slice(0, 15).map((p) => (
          <div key={p.id} style={styles.packetRow}>
            <span style={{ color: protocolColor(p.protocol), fontWeight: 'bold', width: 36 }}>
              {p.protocol}
            </span>
            <span style={styles.packetPath}>
              {p.source}→{p.destination}
            </span>
            <span style={styles.packetLatency}>{p.latency_ms ?? '?'}ms</span>
          </div>
        ))}
        {packets.length === 0 && (
          <div style={{ color: '#444', fontSize: 11, padding: 8 }}>Waiting for packets...</div>
        )}
      </div>
    </div>
  );
}

function protocolColor(proto: string): string {
  switch (proto) {
    case 'HTTP':
      return '#00ccff';
    case 'SQL':
      return '#ff9922';
    case 'SSE':
      return '#00ff88';
    case 'gRPC':
      return '#ff44aa';
    default:
      return '#888';
  }
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    background: 'rgba(8,8,24,0.9)',
    borderRight: '1px solid rgba(60,60,120,0.3)',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflow: 'auto',
  },
  heading: {
    margin: 0,
    fontSize: 13,
    color: '#8888cc',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid rgba(60,60,120,0.15)',
  },
  metricLabel: { fontSize: 11, color: '#777' },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ccff',
    fontFamily: 'monospace',
  },
  graphBox: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    padding: 6,
  },
  graphLabel: { fontSize: 10, color: '#555' },
  subHeading: {
    margin: 0,
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  packetList: {
    flex: 1,
    overflow: 'auto',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  packetRow: {
    display: 'flex',
    gap: 4,
    padding: '2px 0',
    borderBottom: '1px solid rgba(40,40,80,0.2)',
    alignItems: 'center',
  },
  packetPath: {
    flex: 1,
    color: '#888',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  packetLatency: { color: '#555', width: 36, textAlign: 'right' },
};
