export const PROTOCOL_COLORS: Record<string, string> = {
  HTTP: '#00ccff',
  SQL: '#ff9922',
  SSE: '#00ff88',
  gRPC: '#ff44aa',
  DNS: '#ffee44',
  TCP: '#ff9922',
};

export const BUILDING_COLORS: Record<string, { glow: string; body: string }> = {
  frontend: { glow: '#00ccff', body: '#0d3b5c' },
  gateway: { glow: '#00ff88', body: '#0d4d33' },
  api: { glow: '#bb66ff', body: '#3d1a6e' },
  database: { glow: '#ff9922', body: '#5c3a0d' },
};
