import { useCallback, useEffect, useState } from 'react';
import type { OrderResponse } from '@repo/schemas';
import { ApiError, listOrders } from '@/api/client';

export function useOrders(refreshIntervalMs = 5000) {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      const { data } = await listOrders(1, 20);
      setOrders(data);
    } catch (caught) {
      const message = caught instanceof ApiError
        ? `Failed to load orders (${caught.status})`
        : 'Failed to load orders';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [load, refreshIntervalMs]);

  return { orders, loading, error, reload: load };
}
