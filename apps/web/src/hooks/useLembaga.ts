import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

export interface Lembaga {
  id: string;
  jenis: string;
  nama: string;
  deskripsi?: string;
  status: string;
  createdAt: string;
}

export function useLembagaList(options: { page?: number; limit?: number; jenis?: string; search?: string; status?: string }, token: string) {
  return useQuery({
    queryKey: ['lembaga', options],
    queryFn: async () => {
      const url = new URL(`${API_URL}/lembaga`);
      if (options.page) url.searchParams.append('page', options.page.toString());
      if (options.limit) url.searchParams.append('limit', options.limit.toString());
      if (options.jenis) url.searchParams.append('jenis', options.jenis);
      if (options.search) url.searchParams.append('search', options.search);
      if (options.status) url.searchParams.append('status', options.status);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal memuat data');
      return {
        data: (result.data || []) as Lembaga[],
        meta: result.meta as { page: number; limit: number; total: number; totalPages: number }
      };
    },
    enabled: !!token,
  });
}

export function useSaveLembaga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, token }: { id?: string; payload: any; token: string }) => {
      const url = id ? `${API_URL}/lembaga/${id}` : `${API_URL}/lembaga`;
      const method = id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal menyimpan data');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga'] });
    },
  });
}

export function useDeleteLembaga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await fetch(`${API_URL}/lembaga/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal menghapus data');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga'] });
    },
  });
}
