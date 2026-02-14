import React, { useState } from 'react';

interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function FirewallToggle({ enabled, onToggle }: Props) {
  const [blocked, setBlocked] = useState(0);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const next = !enabled;
    try {
      await fetch('/api/firewall/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      onToggle(next);
      if (next) setBlocked((b) => b + 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <button onClick={toggle} disabled={loading} style={styles.btn}>
        <span style={{ fontSize: 16 }}>{enabled ? '🛡' : '○'}</span>
        <span style={styles.label}>FIREWALL</span>
      </button>
      <div
        style={{
          ...styles.indicator,
          background: enabled ? 'rgba(255,50,50,0.15)' : 'rgba(60,60,120,0.15)',
          borderColor: enabled ? 'rgba(255,50,50,0.5)' : 'rgba(60,60,120,0.3)',
          boxShadow: enabled ? '0 0 12px rgba(255,50,50,0.3)' : 'none',
        }}
      >
        <span style={{ color: enabled ? '#ff6666' : '#555', fontSize: 10, fontFamily: 'monospace' }}>
          {enabled ? 'ACTIVE' : 'OFF'}
        </span>
        {enabled && (
          <span style={{ color: '#ff8888', fontSize: 9, fontFamily: 'monospace' }}>
            {blocked} blocked
          </span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  btn: {
    background: 'rgba(40,20,20,0.6)',
    border: '1px solid rgba(255,80,80,0.3)',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#e0e0ff',
  },
  label: { fontSize: 10, fontFamily: 'monospace', color: '#cc8888', letterSpacing: 1 },
  indicator: {
    padding: '2px 8px',
    borderRadius: 3,
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
};
