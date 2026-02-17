import React, { useEffect, useState } from 'react';
import { Building, Connection } from '../types/city';

interface Props {
  building: Building;
  onClose: () => void;
}

const stateColor: Record<string, string> = {
  LISTEN: '#00ff88',
  ESTABLISHED: '#00ccff',
  TIME_WAIT: '#ffaa00',
  CLOSE_WAIT: '#ff4444',
};

export default function BuildingInfo({ building, onClose }: Props) {
  const [connections, setConnections] = useState<Connection[]>(building.connections ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ports/${building.service}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.connections) setConnections(data.connections);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [building.service]);

  return (
    <div style={styles.panel}>
      <button onClick={onClose} style={styles.close}>
        X
      </button>

      <h2 style={styles.title}>{building.name}</h2>

      <div style={styles.row}>
        <span style={styles.label}>Service</span>
        <span style={styles.value}>{building.service}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Port</span>
        <span style={{ ...styles.value, color: '#00ccff' }}>:{building.port}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Status</span>
        <span
          style={{
            ...styles.value,
            color: building.status === 'running' ? '#00ff66' : '#ff4444',
          }}
        >
          {building.status.toUpperCase()}
        </span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Networks</span>
        <span style={styles.value}>{building.networks.join(', ')}</span>
      </div>

      <div style={styles.divider} />

      <h3 style={styles.subtitle}>
        Active Connections{' '}
        {loading && <span style={{ color: '#666', fontSize: 11 }}>loading...</span>}
      </h3>

      <div style={styles.ssPre}>
        <div style={styles.ssHeader}>State       Local Addr:Port  Peer Addr:Port</div>
        {connections.length === 0 && (
          <div style={{ color: '#555', padding: '4px 0' }}>No active connections</div>
        )}
        {connections.map((c, i) => (
          <div key={c.id || i} style={{ color: stateColor[c.state] ?? '#888' }}>
            {c.state.padEnd(12)} {c.source}:{c.source_port}  {c.destination}:{c.destination_port}
          </div>
        ))}
      </div>

      {building.description && (
        <div style={styles.desc}>{building.description}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 300,
    background: 'rgba(12,12,30,0.95)',
    border: '1px solid rgba(100,100,200,0.3)',
    borderRadius: 8,
    padding: 16,
    position: 'relative',
    overflow: 'auto',
    maxHeight: '100%',
  },
  close: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 18,
    cursor: 'pointer',
  },
  title: {
    margin: '0 0 12px',
    fontSize: 18,
    color: '#e0e0ff',
    fontFamily: '"Courier New", monospace',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    fontSize: 13,
  },
  label: { color: '#888' },
  value: { color: '#ccc', fontFamily: 'monospace' },
  divider: {
    height: 1,
    background: 'rgba(100,100,200,0.2)',
    margin: '12px 0',
  },
  subtitle: {
    fontSize: 14,
    color: '#aab',
    margin: '0 0 8px',
    fontFamily: 'monospace',
  },
  ssPre: {
    fontFamily: '"Courier New", monospace',
    fontSize: 11,
    background: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 4,
    overflowX: 'auto',
    whiteSpace: 'pre',
    lineHeight: 1.6,
  },
  ssHeader: {
    color: '#666',
    borderBottom: '1px solid #333',
    paddingBottom: 4,
    marginBottom: 4,
  },
  desc: {
    marginTop: 12,
    fontSize: 12,
    color: '#777',
    lineHeight: 1.5,
  },
};
