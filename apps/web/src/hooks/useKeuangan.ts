import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';

export interface BukuBankEntry {
  id: string;
  tanggal: string;
  bank: string;
  uraian: string;
  kodeBukti: string | null;
  debit: number;
  kredit: number;
  saldo: number;
  rekonsiliasi: boolean;
  createdAt: string;
}

export interface KasUmumEntry {
  id: string;
  tanggal: string;
  jenis: 'KAS_MASUK' | 'KAS_KELUAR';
  uraian: string;
  jumlah: number;
  saldo: number;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ================= Buku Bank =================

export function useBukuBankList(page: number, search: string, token: string) {
  return useQuery({
    queryKey: ['buku-bank', page, search],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
      });
      const data = await safeFetchJson(`${API_URL}/keuangan/buku-bank?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.error?.message || 'Gagal memuat buku bank');
      return data as { data: BukuBankEntry[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function useSaveBukuBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, token }: { id?: string; data: Partial<BukuBankEntry>; token: string }) => {
      const url = id ? `${API_URL}/keuangan/buku-bank/${id}` : `${API_URL}/keuangan/buku-bank`;
      const method = id ? 'PATCH' : 'POST';
      const res = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menyimpan buku bank');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buku-bank'] });
    },
  });
}

export function useDeleteBukuBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/keuangan/buku-bank/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus buku bank');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buku-bank'] });
    },
  });
}

// ================= Kas Umum =================

export function useKasUmumList(page: number, tahun: string, bulan: string, jenis: string, token: string) {
  return useQuery({
    queryKey: ['kas-umum', page, tahun, bulan, jenis],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        tahun,
        ...(bulan && { bulan }),
        ...(jenis && { jenis }),
      });
      const data = await safeFetchJson(`${API_URL}/kas-umum?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.error?.message || 'Gagal memuat kas umum');
      return data as { data: KasUmumEntry[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function useKasUmumSaldo(token: string) {
  return useQuery({
    queryKey: ['kas-umum-saldo'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const data = await safeFetchJson(`${API_URL}/kas-umum/saldo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error('Gagal memuat saldo');
      return data.data as { saldo: number };
    },
    enabled: !!token,
  });
}

export function useSaveKasUmum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, token }: { id?: string; data: Partial<KasUmumEntry>; token: string }) => {
      const url = id ? `${API_URL}/kas-umum/${id}` : `${API_URL}/kas-umum`;
      const method = id ? 'PATCH' : 'POST';
      const res = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menyimpan kas umum');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kas-umum'] });
      queryClient.invalidateQueries({ queryKey: ['kas-umum-saldo'] });
    },
  });
}

export function useDeleteKasUmum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/kas-umum/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus kas umum');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kas-umum'] });
      queryClient.invalidateQueries({ queryKey: ['kas-umum-saldo'] });
    },
  });
}
