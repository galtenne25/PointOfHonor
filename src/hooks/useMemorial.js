import { useMemo } from 'react';
import { memorialSites } from '../data/mockData';

export function useMemorial(id) {
  return useMemo(() => {
    const parsed = parseInt(id, 10);
    if (Number.isNaN(parsed)) return null;
    return memorialSites.find(s => s.id === parsed) ?? null;
  }, [id]);
}
