/**
 * useDesa Hook
 * Fetches villages (desa/kelurahan) from the API
 * Filtered by kecamatanId when provided, otherwise returns all
 */

import { useQuery } from '@tanstack/react-query';
import { Desa } from '@/types';
import { API_URL } from '@/lib/constants';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchDesa(kecamatanId?: string): Promise<Desa[]> {
  const url = kecamatanId
    ? `${API_URL}/wilayah/desa?kecamatanId=${kecamatanId}`
    : `${API_URL}/wilayah/desa`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Gagal mengambil data desa');
  }

  const result: ApiResponse<Desa[]> = await response.json();
  return result.data || [];
}

export function useDesa(kecamatanId?: string) {
  return useQuery<Desa[]>({
    queryKey: ['wilayah', 'desa', kecamatanId ?? 'all'],
    queryFn: () => fetchDesa(kecamatanId),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
