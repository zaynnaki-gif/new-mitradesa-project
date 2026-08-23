/**
 * useKecamatan Hook
 * Fetches districts (kecamatan) from the API
 * Filtered by kabupatenId when provided, otherwise returns all
 */

import { useQuery } from '@tanstack/react-query';
import { Kecamatan } from '@/types';
import { API_URL } from '@/lib/constants';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchKecamatan(kabupatenId?: string): Promise<Kecamatan[]> {
  const url = kabupatenId
    ? `${API_URL}/wilayah/kecamatan?kabupatenId=${kabupatenId}`
    : `${API_URL}/wilayah/kecamatan`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Gagal mengambil data kecamatan');
  }

  const result: ApiResponse<Kecamatan[]> = await response.json();
  return result.data || [];
}

export function useKecamatan(kabupatenId?: string) {
  return useQuery<Kecamatan[]>({
    queryKey: ['wilayah', 'kecamatan', kabupatenId ?? 'all'],
    queryFn: () => fetchKecamatan(kabupatenId),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
