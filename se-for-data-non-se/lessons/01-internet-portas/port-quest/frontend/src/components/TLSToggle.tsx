import React, { useState } from 'react';
import { TLSStep } from '../types/city';

interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function TLSToggle({ enabled, onToggle }: Props) {
  const [steps, setSteps] = useState<TLSStep[]>([]);
  const [animating, setAnimating] = useState(false);

  const toggle = async () => {
    const next = !enabled;

    if (next) {
      setAnimating(true);
      try {
        const res = await fetch('/api/tls/handshake');
        const data = await res.json();
        if (data.steps) {
          for (const step of data.steps) {
            setSteps((prev) => [...prev, step]);
            await wait(400);
          }
        }
      } catch {
        // ignore
      }
      setAnimating(false);
      setTimeout(() => setSteps([]), 3000);
    } else {
      setSteps([]);
    }

    onToggle(next);
  };

  return (
    <div style={styles.wrap}>
      <button onClick={toggle} disabled={animating} style={styles.btn}>
        <span style={{ fontSize: 16 }}>{enabled ? '🔒' : '🔓'}</span>
        <span style={styles.label}>TLS</span>
      </button>
      <div
        style={{
          ...styles.indicator,
          background: enabled ? 'rgba(255,215,0,0.1)' : 'rgba(60,60,120,0.15)',
          borderColor: enabled ? 'rgba(255,215,0,0.4)' : 'rgba(60,60,120,0.3)',
          boxShadow: enabled ? '0 0 12px rgba(255,215,0,0.2)' : 'none',
        }}
      >
        <span
          style={{
            color: enabled ? '#ffd700' : '#555',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
        >
          {animating ? 'HANDSHAKE...' : enabled ? 'ENCRYPTED' : 'PLAIN'}
        </span>
      </div>

      {/* handshake animation */}
      {steps.length > 0 && (
        <div style={styles.stepsBox}>
          {steps.map((s) => (
            <div key={s.step_number} style={styles.step}>
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>#{s.step_number}</span>
              <span style={{ color: '#ccaa44' }}>{s.name}</span>
              <span style={{ color: '#888', fontSize: 9 }}>{s.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  btn: {
    background: 'rgba(40,35,10,0.6)',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#e0e0ff',
  },
  label: { fontSize: 10, fontFamily: 'monospace', color: '#ccaa44', letterSpacing: 1 },
  indicator: {
    padding: '2px 8px',
    borderRadius: 3,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
  },
  stepsBox: {
    position: 'absolute',
    bottom: 50,
    background: 'rgba(10,10,20,0.95)',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: 6,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 10,
    fontFamily: 'monospace',
    zIndex: 10,
  },
  step: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
};
