import { CityStatus, Connection, Packet, FirewallRule, DNSStep, TLSStep, ChallengeData, ChallengeResult, Building } from './types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = {
  getCityStatus: async (): Promise<CityStatus> => {
    const res = await fetch(`${API_BASE}/api/city/status`);
    if (!res.ok) throw new Error('Failed to fetch city status');
    return res.json();
  },
  getConnections: async (): Promise<Connection[]> => {
    const res = await fetch(`${API_BASE}/api/city/connections`);
    if (!res.ok) throw new Error('Failed to fetch connections');
    return res.json();
  },
  sendPacket: async (packet: { source: string; destination: string; protocol: string; payload: string }): Promise<Packet> => {
    const res = await fetch(`${API_BASE}/api/packets/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
    });
    if (!res.ok) throw new Error('Failed to send packet');
    return res.json();
  },
  getPortDetails: async (service: string): Promise<Building> => {
    const res = await fetch(`${API_BASE}/api/ports/${service}`);
    if (!res.ok) throw new Error('Failed to fetch port details');
    return res.json();
  },
  toggleFirewall: async (enabled: boolean): Promise<{ enabled: boolean; rules: FirewallRule[] }> => {
    const res = await fetch(`${API_BASE}/api/firewall/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error('Failed to toggle firewall');
    return res.json();
  },
  getFirewallRules: async (): Promise<FirewallRule[]> => {
    const res = await fetch(`${API_BASE}/api/firewall/rules`);
    if (!res.ok) throw new Error('Failed to fetch firewall rules');
    return res.json();
  },
  addFirewallRule: async (rule: Partial<FirewallRule>): Promise<FirewallRule[]> => {
    const res = await fetch(`${API_BASE}/api/firewall/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error('Failed to add firewall rule');
    return res.json();
  },
  resolveDNS: async (name: string): Promise<DNSStep[]> => {
    const res = await fetch(`${API_BASE}/api/dns/resolve/${name}`);
    if (!res.ok) throw new Error('Failed to resolve DNS');
    return res.json();
  },
  getTLSHandshake: async (): Promise<{ steps: TLSStep[] }> => {
    const res = await fetch(`${API_BASE}/api/tls/handshake`);
    if (!res.ok) throw new Error('Failed to fetch TLS handshake');
    return res.json();
  },
  getChallenges: async (): Promise<ChallengeData[]> => {
    const res = await fetch(`${API_BASE}/api/challenges`);
    if (!res.ok) throw new Error('Failed to fetch challenges');
    return res.json();
  },
  submitChallenge: async (challenge_id: string, answer: string | number | Record<string, unknown>): Promise<ChallengeResult> => {
    const res = await fetch(`${API_BASE}/api/challenges/${challenge_id}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id, answer }),
    });
    if (!res.ok) throw new Error('Failed to submit challenge');
    return res.json();
  }
};
