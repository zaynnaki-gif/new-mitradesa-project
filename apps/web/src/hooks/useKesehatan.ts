import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

// ==========================================
// BUMIL (IBU HAMIL)
// ==========================================
export interface Bumil {
  id: string;
  pendudukId: string;
  namaLengkap: string;
  nik: string;
  telepon?: string;
  alamat?: string;
  trimester?: number;
  dusun?: string;
  rt?: string;
  rw?: string;
  createdAt: string;
}

export function useBumilList(options: { page?: number; limit?: number; search?: string; trimester?: string }, token: string) {
  return useQuery({
    queryKey: ['bumil', options],
    queryFn: async () => {
      const url = new URL(`${API_URL}/bumil`);
      if (options.page) url.searchParams.append('page', options.page.toString());
      if (options.limit) url.searchParams.append('limit', options.limit.toString());
      if (options.search) url.searchParams.append('search', options.search);
      if (options.trimester) url.searchParams.append('trimester', options.trimester);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal memuat data ibu hamil');
      return {
        data: (result.data || []) as Bumil[],
        meta: result.meta as { page: number; limit: number; total: number; totalPages: number }
      };
    },
    enabled: !!token,
  });
}

export function useBumilStats(token: string) {
  return useQuery({
    queryKey: ['bumil', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/bumil/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal memuat statistik ibu hamil');
      return result.data as { total: number; byTrimester: { trimester: number; count: number }[] };
    },
    enabled: !!token,
  });
}

export function useSaveBumil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, token }: { id?: string; payload: any; token: string }) => {
      const url = id ? `${API_URL}/bumil/${id}` : `${API_URL}/bumil`;
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
      queryClient.invalidateQueries({ queryKey: ['bumil'] });
    },
  });
}

export function useDeleteBumil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await fetch(`${API_URL}/bumil/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal menghapus data');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bumil'] });
    },
  });
}

// ==========================================
// POSYANDU KUNJUNGAN
// ==========================================
export interface Kunjungan {
  id: string;
  tanggalKunjungan: string;
  pendudukId: string;
  penduduk?: { id: string; nik: string; namaLengkap: string; tanggalLahir: string; jenisKelamin: 'L' | 'P' };
  kategori: 'IBU_HAMIL' | 'BALITA' | 'LANSIA' | 'UMUM';
  mingguKehamilan?: number;
  tekananDarah?: string;
  beratBadanIbu?: number;
  beratBadan?: number;
  panjangBadan?: number;
  lingkarKepala?: number;
  statusGizi?: string;
  tekananDarahUmum?: string;
  gulaDarah?: number;
  imunisasi?: string;
  vitamin?: string;
  catatan?: string;
  createdAt: string;
}

export function useKunjunganList(options: { page?: number; limit?: number; search?: string; kategori?: string; tanggalMulai?: string; tanggalSelesai?: string }, token: string) {
  return useQuery({
    queryKey: ['posyandu', 'kunjungan', options],
    queryFn: async () => {
      const url = new URL(`${API_URL}/posyandu/kunjungan`);
      if (options.page) url.searchParams.append('page', options.page.toString());
      if (options.limit) url.searchParams.append('limit', options.limit.toString());
      if (options.search) url.searchParams.append('search', options.search);
      if (options.kategori) url.searchParams.append('kategori', options.kategori);
      if (options.tanggalMulai) url.searchParams.append('tanggalMulai', options.tanggalMulai);
      if (options.tanggalSelesai) url.searchParams.append('tanggalSelesai', options.tanggalSelesai);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal memuat data kunjungan');
      return {
        data: (result.data || []) as Kunjungan[],
        meta: result.meta as { page: number; limit: number; total: number; totalPages: number }
      };
    },
    enabled: !!token,
  });
}

export function useSaveKunjungan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, token }: { id?: string; payload: any; token: string }) => {
      const url = id ? `${API_URL}/posyandu/kunjungan/${id}` : `${API_URL}/posyandu/kunjungan`;
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
      queryClient.invalidateQueries({ queryKey: ['posyandu', 'kunjungan'] });
    },
  });
}

export function useDeleteKunjungan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await fetch(`${API_URL}/posyandu/kunjungan/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || 'Gagal menghapus data');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posyandu', 'kunjungan'] });
    },
  });
}
