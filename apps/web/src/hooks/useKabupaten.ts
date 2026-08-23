/**
 * useKabupaten Hook
 * Fetches regencies (kabupaten/kota) from the API
 * Filtered by provinsiId when provided, otherwise returns all
 */

import { useQuery } from '@tanstack/react-query';
import { Kabupaten } from '@/types';
import { API_URL } from '@/lib/constants';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchKabupaten(provinsiId?: string): Promise<Kabupaten[]> {
  const url = provinsiId
    ? `${API_URL}/wilayah/kabupaten?provinsiId=${provinsiId}`
    : `${API_URL}/wilayah/kabupaten`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Gagal mengambil data kabupaten');
  }

  const result: ApiResponse<Kabupaten[]> = await response.json();
  return result.data || [];
}

export function useKabupaten(provinsiId?: string) {
  return useQuery<Kabupaten[]>({
    queryKey: ['wilayah', 'kabupaten', provinsiId ?? 'all'],
    queryFn: () => fetchKabupaten(provinsiId),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
