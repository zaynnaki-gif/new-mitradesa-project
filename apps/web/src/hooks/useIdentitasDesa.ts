/**
 * useIdentitasDesa Hook
 * Fetches village identity from the API
 */

import { useQuery } from '@tanstack/react-query';
import type { IdentitasDesa } from '@/types';
import { API_URL } from '@/lib/constants';

interface IdentitasDesaResponse extends IdentitasDesa {}

async function fetchIdentitasDesa(): Promise<IdentitasDesaResponse> {
  const response = await fetch(`${API_URL}/identitas`);

  if (!response.ok) {
    throw new Error('Failed to fetch village identity');
  }

  const result = await response.json();
  return result.data;
}

export function useIdentitasDesa() {
  return useQuery<IdentitasDesaResponse>({
    queryKey: ['identitas-desa'],
    queryFn: fetchIdentitasDesa,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
