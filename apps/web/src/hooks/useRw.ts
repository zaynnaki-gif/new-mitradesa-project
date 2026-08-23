/**
 * useRw Hook
 * Fetches RW data from the API
 */

import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

interface Rw {
  id: number;
  kode: string;
  nama: string;
  gubugId: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchRw(gubugId?: number): Promise<Rw[]> {
  const url = gubugId
    ? `${API_URL}/wilayah/rw?gubugId=${gubugId}`
    : `${API_URL}/wilayah/rw`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Gagal mengambil data RW');
  }

  const result: ApiResponse<Rw[]> = await response.json();
  return result.data || [];
}

export function useRw(gubugId?: number) {
  return useQuery<Rw[]>({
    queryKey: ['wilayah', 'rw', gubugId],
    queryFn: () => fetchRw(gubugId),
    enabled: !!gubugId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
