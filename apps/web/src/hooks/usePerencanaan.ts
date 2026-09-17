import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';

export interface ApbdesItem {
  id: string;
  apbdesId: string;
  kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN';
  nama: string;
  anggaran: number;
  realization: number;
  createdAt: string;
  Rkpdes?: {
    id: string;
    namaKegiatan: string;
  };
}

export interface Apbdes {
  id: string;
  tahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  totalPembiayaan: number;
  isAktif: boolean;
  items: ApbdesItem[];
}

export interface RkpdesOption {
  id: string;
  tahun: number;
  namaKegiatan: string;
  apbdesItemId: string | null;
}

export function useRkpdesByTahun(tahun: string, token: string) {
  return useQuery({
    queryKey: ['rkpdes-by-tahun', tahun],
    queryFn: async () => {
      if (!token || !tahun) return [];
      const data = await safeFetchJson(`${API_URL}/cms/perencanaan/rkpdes?tahun=${tahun}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.error?.message || 'Gagal memuat daftar RKPDes');
      return data.data as RkpdesOption[];
    },
    enabled: !!token && !!tahun,
  });
}

export function useApbdesList(tahun: string, token: string) {
  return useQuery({
    queryKey: ['apbdes', tahun],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await safeFetchJson(`${API_URL}/transparansi?tahun=${tahun}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.error?.message || 'Gagal memuat APBDes list');
      return data.data as Apbdes[];
    },
    enabled: !!token,
  });
}

export function useApbdesDetail(apbdesId: string | null, token: string) {
  return useQuery({
    queryKey: ['apbdes-detail', apbdesId],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      if (!apbdesId) return null;
      const data = await safeFetchJson(`${API_URL}/transparansi/${apbdesId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.error?.message || 'Gagal memuat APBDes detail');
      return data.data as Apbdes;
    },
    enabled: !!token && !!apbdesId,
  });
}

export function useSaveApbdesItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ apbdesId, itemId, data, token }: { apbdesId: string; itemId?: string; data: Partial<ApbdesItem>; token: string }) => {
      const url = itemId 
        ? `${API_URL}/transparansi/${apbdesId}/items/${itemId}`
        : `${API_URL}/transparansi/${apbdesId}/items`;
      const method = itemId ? 'PATCH' : 'POST';
      const res = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menyimpan item APBDes');
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apbdes-detail', variables.apbdesId] });
      queryClient.invalidateQueries({ queryKey: ['apbdes'] });
    },
  });
}

export function useDeleteApbdesItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ apbdesId, itemId, token }: { apbdesId: string; itemId: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/transparansi/${apbdesId}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus item APBDes');
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apbdes-detail', variables.apbdesId] });
      queryClient.invalidateQueries({ queryKey: ['apbdes'] });
    },
  });
}
