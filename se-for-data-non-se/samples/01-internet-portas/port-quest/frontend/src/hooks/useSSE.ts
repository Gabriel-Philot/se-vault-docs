import { useState, useEffect, useRef, useCallback } from 'react';
import { Packet } from '../types/city';

const MAX_PACKETS = 50;
const RECONNECT_DELAY = 3000;

export function useSSE() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/packets/stream');
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    // Backend sends named "packet" events via sse-starlette
    es.addEventListener('packet', (event: MessageEvent) => {
      try {
        const packet: Packet = JSON.parse(event.data);
        setPackets((prev) => {
          const next = [packet, ...prev];
          return next.slice(0, MAX_PACKETS);
        });
      } catch {
        // ignore malformed events
      }
    });

    // Also handle heartbeat events (optional, for connection keep-alive)
    es.addEventListener('heartbeat', () => {
      // keep-alive, nothing to do
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  return { packets, connected };
}
