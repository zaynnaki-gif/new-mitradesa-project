import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

// Types
export interface Anggota {
  id: string;
  pendudukId: string;
  nik: string;
  namaLengkap: string;
  hubungan: string;
  isAktif: boolean;
}

export interface Keluarga {
  id: string;
  noKk: string;
  kepalaId: string;
  kepalaNik: string;
  kepalaNama: string;
  alamat: string | null;
  dusun: string | null;
  rw: string | null;
  rt: string | null;
  gubugId: string | null;
  rwId: string | null;
  rtId: string | null;
  createdAt: string;
  isAktif: boolean;
}

export interface KeluargaDetail extends Keluarga {
  anggota: Anggota[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface KeluargaResponse {
  success: boolean;
  data: Keluarga[];
  meta: PaginationMeta;
}

export interface KeluargaDetailResponse {
  success: boolean;
  data: KeluargaDetail;
}

// Hooks

export function useKeluargaList(page: number = 1, search: string = '', token: string) {
  return useQuery({
    queryKey: ['keluarga', { page, search }],
    queryFn: async (): Promise<KeluargaResponse> => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.append('search', search);

      const response = await fetch(`${API_URL}/keluarga?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch');
      return result;
    },
    enabled: !!token,
  });
}

export function useKeluargaDetail(id: string, token: string) {
  return useQuery({
    queryKey: ['keluarga', id],
    queryFn: async (): Promise<KeluargaDetail> => {
      const response = await fetch(`${API_URL}/keluarga/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch detail');
      return result.data;
    },
    enabled: !!id && !!token,
  });
}

export function useCreateKeluarga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, token }: { data: any, token: string }) => {
      const response = await fetch(`${API_URL}/keluarga`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal membuat keluarga');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keluarga'] });
    },
  });
}

export function useUpdateKeluarga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, token }: { id: string, data: any, token: string }) => {
      const response = await fetch(`${API_URL}/keluarga/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal mengubah keluarga');
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keluarga'] });
      queryClient.invalidateQueries({ queryKey: ['keluarga', variables.id] });
    },
  });
}

export function useDeleteKeluarga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string, token: string }) => {
      const response = await fetch(`${API_URL}/keluarga/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menghapus keluarga');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keluarga'] });
    },
  });
}

export function useAddAnggota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ keluargaId, data, token }: { keluargaId: string, data: any, token: string }) => {
      const response = await fetch(`${API_URL}/keluarga/${keluargaId}/anggota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menambah anggota');
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keluarga', variables.keluargaId] });
    },
  });
}

export function useRemoveAnggota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ keluargaId, anggotaId, token }: { keluargaId: string, anggotaId: string, token: string }) => {
      const response = await fetch(`${API_URL}/keluarga/${keluargaId}/anggota/${anggotaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menghapus anggota');
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keluarga', variables.keluargaId] });
    },
  });
}
