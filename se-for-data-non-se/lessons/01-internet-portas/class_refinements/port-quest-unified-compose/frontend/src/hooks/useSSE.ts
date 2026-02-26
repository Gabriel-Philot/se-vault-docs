import { useState, useEffect, useRef } from 'react';
import { Packet } from '../lib/types';

export function useSSE() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const es = new EventSource(`${API_BASE}/api/packets/stream`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.addEventListener('packet', (event) => {
        try {
          const newPacket: Packet = JSON.parse(event.data);
          setPackets((prev) => {
            const updated = [newPacket, ...prev];
            return updated.slice(0, 50); // keep last 50
          });
        } catch (err) {
          console.error('Failed to parse packet', err);
        }
      });

      es.addEventListener('heartbeat', () => {
        // keep-alive, no action needed
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return { packets, connected };
}
