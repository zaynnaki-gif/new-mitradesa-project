import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

// ==========================================
// PERANGKAT DESA (Public)
// ==========================================
export interface PerangkatDesaPublic {
  id: string;
  nama: string;
  jabatan: string;
  status: string;
  fotoUrl: string | null;
}

export function usePerangkatDesa() {
  return useQuery({
    queryKey: ['perangkat-desa', 'public'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/perangkat-desa/public?aktif=true`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal memuat data');
      return (result.data || []) as PerangkatDesaPublic[];
    },
  });
}

// ==========================================
// PERANGKAT DESA (Admin)
// ==========================================
export interface PerangkatDesaAdmin {
  id: string;
  pendudukId: string;
  pendudukNik: string;
  pendudukNama: string;
  desaId: string;
  desaNama: string;
  jabatan: string;
  status: string;
  fotoUrl: string | null;
  accountId: string | null;
  accountUsername: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isAktif: boolean;
}

export function usePerangkatDesaList(options: { page?: number; limit?: number; search?: string; status?: string }, token: string) {
  return useQuery({
    queryKey: ['perangkat-desa', 'admin', options],
    queryFn: async () => {
      const url = new URL(`${API_URL}/perangkat-desa`);
      if (options.page) url.searchParams.append('page', options.page.toString());
      if (options.limit) url.searchParams.append('limit', options.limit.toString());
      if (options.search) url.searchParams.append('search', options.search);
      if (options.status) url.searchParams.append('status', options.status);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal memuat data');
      return {
        data: (result.data || []) as PerangkatDesaAdmin[],
        meta: result.meta as { page: number; limit: number; total: number; totalPages: number }
      };
    },
    enabled: !!token,
  });
}

export function useSavePerangkatDesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, token }: { id?: string; payload: any; token: string }) => {
      const url = id ? `${API_URL}/perangkat-desa/${id}` : `${API_URL}/perangkat-desa`;
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
      queryClient.invalidateQueries({ queryKey: ['perangkat-desa'] });
    },
  });
}

export function useDeletePerangkatDesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await fetch(`${API_URL}/perangkat-desa/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal menghapus data');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perangkat-desa'] });
    },
  });
}
