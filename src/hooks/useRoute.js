import { useMemo } from 'react';
import { routes } from '../data/routesData';

export function useRoute(id) {
  return useMemo(() => {
    const parsed = parseInt(id, 10);
    if (Number.isNaN(parsed)) return null;
    return routes.find(r => r.id === parsed) ?? null;
  }, [id]);
}
