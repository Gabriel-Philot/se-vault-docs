export enum BuildingStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export enum ConnectionState {
  LISTEN = 'LISTEN',
  ESTABLISHED = 'ESTABLISHED',
  TIME_WAIT = 'TIME_WAIT',
  CLOSE_WAIT = 'CLOSE_WAIT',
}

export enum PacketStatus {
  TRAVELING = 'traveling',
  DELIVERED = 'delivered',
  BLOCKED = 'blocked',
  DROPPED = 'dropped',
}

export interface Connection {
  id: string;
  source: string;
  source_port: number;
  destination: string;
  destination_port: number;
  port: number;
  state: string;
  protocol: string;
}

export interface Building {
  id: string;
  name: string;
  service: string;       // "frontend" | "gateway" | "api" | "database"
  port: number;          // 3000, 80, 8000, 5432
  status: string;        // "running" | "stopped" | "error"
  networks: string[];    // ["city-public"] or ["city-internal"] or both
  description: string;
  connections: Connection[];
}

export interface Packet {
  id: string;
  source: string;
  source_port: number;
  destination: string;
  destination_port: number;
  protocol: string;       // "HTTP" | "SQL" | "SSE" | "gRPC" | "DNS" | "TCP"
  payload_preview: string;
  status: string;         // "traveling" | "delivered" | "blocked" | "dropped"
  timestamp: string;
  latency_ms: number;
}

export interface FirewallRule {
  id: string;
  source: string;
  destination: string;
  port: number;
  action: string;        // "ALLOW" | "BLOCK" | "DENY"
  enabled: boolean;
}

export interface DNSStep {
  step_number: number;
  description: string;
  server: string;
  query: string;
  response: string;
  latency_ms: number;
}

export interface TLSStep {
  step_number: number;
  name: string;           // "Client Hello", "Server Hello", "Certificate", etc.
  description: string;
  data: Record<string, unknown>;
}

export interface ChallengeData {
  id: string;
  title: string;
  description: string;
  hints: string[];
  type: 'port_match' | 'firewall' | 'dns' | 'protocol';
}

export interface ChallengeSubmission {
  challenge_id: string;
  answer: string | number | Record<string, unknown>;
}

export interface ChallengeResult {
  correct: boolean;
  message: string;
  explanation: string;
  score: number;
}

export interface CityStatus {
  buildings: Building[];
  connections: Connection[];
  active_connections: number;
  packets_per_second: number;
  firewall_enabled: boolean;
  tls_enabled: boolean;
}
