import { useCallback, useEffect, useState } from 'react';
import type { ProductCatalogItem } from '@repo/schemas';
import { ApiError, getCatalogProducts } from '@/api/client';

export function useCatalog() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getCatalogProducts();
      setProducts(data);
    } catch (caught) {
      const message = caught instanceof ApiError
        ? `Failed to load catalog (${caught.status})`
        : 'Failed to load catalog';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { products, loading, error, reload: load };
}
