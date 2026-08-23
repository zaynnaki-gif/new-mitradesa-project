/**
 * useRt Hook
 * Fetches RT data from the API
 */

import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

interface Rt {
  id: number;
  kode: string;
  rwId: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchRt(rwId?: number): Promise<Rt[]> {
  const url = rwId
    ? `${API_URL}/wilayah/rt?rwId=${rwId}`
    : `${API_URL}/wilayah/rt`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Gagal mengambil data RT');
  }

  const result: ApiResponse<Rt[]> = await response.json();
  return result.data || [];
}

export function useRt(rwId?: number) {
  return useQuery<Rt[]>({
    queryKey: ['wilayah', 'rt', rwId],
    queryFn: () => fetchRt(rwId),
    enabled: !!rwId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
