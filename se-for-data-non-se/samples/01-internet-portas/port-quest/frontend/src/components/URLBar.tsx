import React, { useState, useCallback } from 'react';

interface Props {
  onSend: (url: string) => void;
}

const PRESETS = [
  { label: 'GET /api/health', url: 'http://api:8000/health' },
  { label: 'GET /api/ports', url: 'http://api:8000/ports' },
  { label: 'GET /api/city/status', url: 'http://api:8000/city/status' },
];

export default function URLBar({ onSend }: Props) {
  const [url, setUrl] = useState('http://api:8000/');
  const [sending, setSending] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0..4 steps

  const send = useCallback(async () => {
    setSending(true);
    setProgress(1);
    setResponseTime(null);
    const start = performance.now();

    try {
      // step 1: browser -> gateway
      await wait(200);
      setProgress(2);
      // step 2: gateway -> api
      await wait(200);
      setProgress(3);

      const res = await fetch('/api/packets/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'browser', destination: url }),
      });
      await res.json();
      setProgress(4);

      const elapsed = performance.now() - start;
      setResponseTime(Math.round(elapsed));
    } catch {
      setResponseTime(-1);
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 1500);
    }

    onSend(url);
  }, [url, onSend]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !sending) send();
  };

  return (
    <div style={styles.bar}>
      {/* address bar */}
      <div style={styles.inputRow}>
        <span style={styles.protocol}>{'>'}</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKey}
          style={styles.input}
          placeholder="http://api:8000/..."
          disabled={sending}
        />
        <button onClick={send} disabled={sending} style={styles.sendBtn}>
          {sending ? '...' : 'SEND'}
        </button>
      </div>

      {/* progress indicators */}
      <div style={styles.progressRow}>
        {['Browser', 'Gateway:80', 'API:8000', 'DB:5432'].map((step, i) => (
          <div key={step} style={styles.stepWrap}>
            <div
              style={{
                ...styles.stepDot,
                background: progress > i ? '#00ff88' : '#333',
                boxShadow: progress > i ? '0 0 6px #00ff88' : 'none',
              }}
            />
            <span style={{ fontSize: 9, color: progress > i ? '#aaffcc' : '#444' }}>{step}</span>
            {i < 3 && (
              <div
                style={{
                  ...styles.stepLine,
                  background: progress > i + 1 ? '#00ff88' : '#222',
                }}
              />
            )}
          </div>
        ))}
        {responseTime !== null && (
          <span style={styles.latency}>
            {responseTime < 0 ? 'ERROR' : `${responseTime}ms`}
          </span>
        )}
      </div>

      {/* presets */}
      <div style={styles.presets}>
        {PRESETS.map((p) => (
          <button
            key={p.url}
            onClick={() => {
              setUrl(p.url);
            }}
            style={styles.presetBtn}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    padding: '8px 16px',
    borderBottom: '1px solid rgba(60,60,120,0.3)',
    background: 'rgba(10,10,26,0.95)',
  },
  inputRow: { display: 'flex', gap: 8, alignItems: 'center' },
  protocol: {
    color: '#00ff88',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    flex: 1,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(80,80,160,0.3)',
    borderRadius: 4,
    padding: '6px 10px',
    color: '#e0e0ff',
    fontFamily: 'monospace',
    fontSize: 13,
    outline: 'none',
  },
  sendBtn: {
    background: 'rgba(0,200,100,0.15)',
    border: '1px solid rgba(0,200,100,0.4)',
    color: '#00ff88',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    marginTop: 6,
    paddingLeft: 20,
  },
  stepWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    transition: 'all 0.3s',
  },
  stepLine: {
    width: 30,
    height: 1,
    margin: '0 2px',
    transition: 'all 0.3s',
  },
  latency: {
    marginLeft: 12,
    fontSize: 11,
    color: '#00ccff',
    fontFamily: 'monospace',
  },
  presets: { display: 'flex', gap: 6, marginTop: 6 },
  presetBtn: {
    background: 'rgba(50,50,100,0.3)',
    border: '1px solid rgba(80,80,160,0.2)',
    color: '#8888cc',
    fontFamily: 'monospace',
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 3,
    cursor: 'pointer',
  },
};
