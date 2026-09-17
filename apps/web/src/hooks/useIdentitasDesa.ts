/**
 * useIdentitasDesa Hook
 * Fetches village identity from the API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  });
}

export function useUpdateIdentitasDesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, token }: { data: Partial<IdentitasDesa>, token: string }) => {
      const response = await fetch(`${API_URL}/identitas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Gagal menyimpan identitas desa');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identitas-desa'] });
    },
  });
}
