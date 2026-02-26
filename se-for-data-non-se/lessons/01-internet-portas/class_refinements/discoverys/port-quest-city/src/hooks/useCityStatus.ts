import { useState, useEffect } from 'react';
import { CityStatus } from '../lib/types';
import { api } from '../lib/api';

export function useCityStatus(pollingInterval = 2000) {
  const [status, setStatus] = useState<CityStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchStatus = async () => {
      try {
        const data = await api.getCityStatus();
        if (mounted) {
          setStatus(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          timeoutId = setTimeout(fetchStatus, pollingInterval);
        }
      }
    };

    fetchStatus();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [pollingInterval]);

  return { status, error };
}
