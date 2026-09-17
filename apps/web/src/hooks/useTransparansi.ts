import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '@/lib/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ApbdesItem {
  id: string;
  apbdesId: string;
  kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN';
  nama: string;
  anggaran: number;
  realisasi: number;
}

export interface Apbdes {
  id: string;
  desaId: string;
  tahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  totalPembiayaan: number;
  isAktif: boolean;
  dokumenUrl: string | null;
  items: ApbdesItem[];
  createdAt: string;
}

// PUBLIC HOOKS
export function useApbdes() {
  const [data, setData] = useState<Apbdes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApbdes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/public/transparansi/apbdes`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat data');
      setData(result.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data Transparansi APBDes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApbdes();
  }, [fetchApbdes]);

  return { data, loading, error, refetch: fetchApbdes };
}

export interface PublicRkpdes {
  id: string;
  rpjmdesBidangId: string;
  tahun: number;
  namaKegiatan: string;
  lokasi: string | null;
  perkiraanBiaya: number | null;
  apbdesItemId: string | null;
}

export interface PublicRpjmdesBidang {
  id: string;
  rpjmdesId: string;
  namaBidang: string;
  rkpdes: PublicRkpdes[];
}

export interface PublicRpjmdes {
  id: string;
  periode: string;
  visi: string;
  misi: string;
  status: string;
  bidangs: PublicRpjmdesBidang[];
}

export function useRpjmdes() {
  const [data, setData] = useState<PublicRpjmdes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRpjmdes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/public/transparansi/rpjmdes`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat data');
      setData(result.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data Transparansi RPJMDes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRpjmdes();
  }, [fetchRpjmdes]);

  return { data, loading, error, refetch: fetchRpjmdes };
}

// ADMIN HOOKS
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export function useAdminApbdesList(page: number, tahunSearch: string, token: string) {
  return useQuery({
    queryKey: ['adminApbdesList', page, tahunSearch],
    queryFn: async (): Promise<ListResponse<Apbdes>> => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (tahunSearch) params.set('tahun', tahunSearch);

      const res = await fetch(`${API_URL}/transparansi?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Gagal memuat data APBDes');
      }
      return res.json();
    },
    enabled: !!token,
  });
}

export function useCreateApbdes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, token }: { payload: any; token: string }) => {
      const res = await fetch(`${API_URL}/transparansi`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal membuat APBDes');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApbdesList'] });
    },
  });
}

export function useUpdateApbdes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, token }: { id: string; payload: any; token: string }) => {
      const res = await fetch(`${API_URL}/transparansi/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal update APBDes');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApbdesList'] });
    },
  });
}

export function useDeleteApbdes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await fetch(`${API_URL}/transparansi/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal menghapus APBDes');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApbdesList'] });
    },
  });
}
