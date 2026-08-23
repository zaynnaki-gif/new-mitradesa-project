/**
 * useProvinsi Hook
 * Fetches all provinces from the API
 */

import { useQuery } from '@tanstack/react-query';
import { Provinsi } from '@/types';
import { API_URL } from '@/lib/constants';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchProvinsi(): Promise<Provinsi[]> {
  const response = await fetch(`${API_URL}/wilayah/provinsi`);

  if (!response.ok) {
    throw new Error('Gagal mengambil data provinsi');
  }

  const result: ApiResponse<Provinsi[]> = await response.json();
  return result.data || [];
}

export function useProvinsi() {
  return useQuery<Provinsi[]>({
    queryKey: ['wilayah', 'provinsi'],
    queryFn: fetchProvinsi,
    staleTime: 1000 * 60 * 30, // 30 minutes - provinces rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
