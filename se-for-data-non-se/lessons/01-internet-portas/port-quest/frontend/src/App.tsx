import React, { useState, useEffect, useCallback } from 'react';
import { Building, CityStatus } from './types/city';
import { useSSE } from './hooks/useSSE';
import CityCanvas from './components/CityCanvas';
import BuildingInfo from './components/BuildingInfo';
import MetricsSidebar from './components/MetricsSidebar';
import URLBar from './components/URLBar';
import FirewallToggle from './components/FirewallToggle';
import TLSToggle from './components/TLSToggle';
import ChallengeMode from './components/ChallengeMode';

const FALLBACK_STATUS: CityStatus = {
  buildings: [
    {
      id: '1',
      name: 'Command Center',
      service: 'frontend',
      port: 3000,
      status: 'running',
      networks: ['city-public'],
      description: 'React frontend served by Vite dev server',
      connections: [],
    },
    {
      id: '2',
      name: 'City Gate',
      service: 'gateway',
      port: 80,
      status: 'running',
      networks: ['city-public', 'city-internal'],
      description: 'Nginx reverse proxy - the entry point to the city',
      connections: [],
    },
    {
      id: '3',
      name: 'City Hall',
      service: 'api',
      port: 8000,
      status: 'running',
      networks: ['city-internal'],
      description: 'FastAPI application server handling business logic',
      connections: [],
    },
    {
      id: '4',
      name: 'Municipal Archive',
      service: 'database',
      port: 5432,
      status: 'running',
      networks: ['city-internal'],
      description: "PostgreSQL database - the city's permanent records",
      connections: [],
    },
  ],
  connections: [],
  active_connections: 0,
  packets_per_second: 0,
  firewall_enabled: false,
  tls_enabled: false,
};

export default function App() {
  const [cityStatus, setCityStatus] = useState<CityStatus | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [firewallEnabled, setFirewallEnabled] = useState(false);
  const [tlsEnabled, setTlsEnabled] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  const { packets, connected } = useSSE();

  useEffect(() => {
    fetch('/api/city/status')
      .then((r) => r.json())
      .then((data: CityStatus) => {
        setCityStatus(data);
        setFirewallEnabled(data.firewall_enabled);
        setTlsEnabled(data.tls_enabled);
      })
      .catch(() => {
        setCityStatus(FALLBACK_STATUS);
      });
  }, []);

  const handleURLSend = useCallback((_url: string) => {
    // packet animation is triggered by SSE
  }, []);

  if (!cityStatus) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingText}>INITIALIZING CONTAINER CITY...</div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <URLBar onSend={handleURLSend} />

      <div style={styles.main}>
        <MetricsSidebar
          packets={packets}
          connected={connected}
          activeConnections={cityStatus.active_connections}
          packetsPerSecond={cityStatus.packets_per_second}
        />

        <div style={styles.canvasWrap}>
          <CityCanvas
            buildings={cityStatus.buildings}
            packets={packets}
            onBuildingClick={setSelectedBuilding}
            firewallEnabled={firewallEnabled}
            tlsEnabled={tlsEnabled}
          />
        </div>

        {selectedBuilding && (
          <BuildingInfo
            building={selectedBuilding}
            onClose={() => setSelectedBuilding(null)}
          />
        )}
      </div>

      <div style={styles.controls}>
        <FirewallToggle enabled={firewallEnabled} onToggle={setFirewallEnabled} />
        <TLSToggle enabled={tlsEnabled} onToggle={setTlsEnabled} />
        <button onClick={() => setShowChallenge(true)} style={styles.challengeBtn}>
          CHALLENGES
        </button>
      </div>

      {showChallenge && <ChallengeMode onClose={() => setShowChallenge(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a1a',
    color: '#e0e0ff',
    fontFamily: '"Courier New", monospace',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: '8px 16px',
    borderTop: '1px solid rgba(60,60,120,0.3)',
    background: 'rgba(8,8,24,0.95)',
    position: 'relative',
  },
  challengeBtn: {
    background: 'rgba(100,50,200,0.15)',
    border: '1px solid rgba(150,80,255,0.4)',
    borderRadius: 6,
    padding: '8px 20px',
    color: '#bb66ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 2,
    cursor: 'pointer',
  },
  loading: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a1a',
  },
  loadingText: {
    color: '#00ccff',
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 3,
  },
};
