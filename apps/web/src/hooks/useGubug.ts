/**
 * useGubug Hook
 * Fetches gubug (dusun) from the API
 */

import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

interface Gubug {
  id: number;
  kode: string;
  nama: string;
  desaId: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchGubug(desaId?: number): Promise<Gubug[]> {
  const url = desaId
    ? `${API_URL}/wilayah/gubug?desaId=${desaId}`
    : `${API_URL}/wilayah/gubug`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Gagal mengambil data gubug');
  }

  const result: ApiResponse<Gubug[]> = await response.json();
  return result.data || [];
}

export function useGubug(desaId?: number) {
  return useQuery<Gubug[]>({
    queryKey: ['wilayah', 'gubug', desaId],
    queryFn: () => fetchGubug(desaId),
    enabled: !!desaId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
