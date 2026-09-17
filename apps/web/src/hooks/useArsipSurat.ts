import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

export interface SuratMasuk {
  id: string;
  nomorSurat: string;
  tanggalSurat: string;
  tanggalDiterima: string;
  pengirim: string;
  perihal: string;
  status: 'DITERIMA' | 'DIPROSES' | 'SELESAI' | 'DIARSIPKAN';
  disposisi: Disposisi[];
}

export interface Disposisi {
  id: string;
  tujuan: string;
  instruksi: string;
  tanggalSelesai: string | null;
  status: 'PENDING' | 'DIPROSES' | 'SELESAI';
  createdAt: string;
}

export interface SuratKeluar {
  id: string;
  nomorDokumen: string;
  judul: string;
  tujuan: string | null;
  status: string;
  createdAt: string;
  dokumen: { kode: string; nama: string };
  fileUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };
  message: string;
}

export const useSuratMasukList = (search: string, token: string, enabled: boolean) => {
  return useQuery<ApiResponse<SuratMasuk>, Error>({
    queryKey: ['surat-masuk', search],
    queryFn: async () => {
      const url = new URL(`${API_URL}/arsip-surat/masuk`);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat surat masuk');
      return data;
    },
    enabled: enabled && !!token,
  });
};

export const useSuratKeluarList = (search: string, token: string, enabled: boolean, status?: string) => {
  return useQuery<ApiResponse<SuratKeluar>, Error>({
    queryKey: ['surat-keluar', search, status],
    queryFn: async () => {
      const url = new URL(`${API_URL}/arsip-surat/keluar`);
      if (search) url.searchParams.append('search', search);
      if (status) url.searchParams.append('status', status);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat surat keluar');
      return data;
    },
    enabled: enabled && !!token,
  });
};

export const useCreateDisposisi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ suratId, data, token }: { suratId: string; data: Partial<Disposisi>; token: string }) => {
      const response = await fetch(`${API_URL}/arsip-surat/masuk/${suratId}/disposisi`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menambahkan disposisi');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
    },
  });
};

export const useUpdateStatusMasuk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, token }: { id: string; status: string; token: string }) => {
      const response = await fetch(`${API_URL}/arsip-surat/masuk/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal mengubah status');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
    },
  });
};

export const useCreateSuratMasuk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, token }: { data: Partial<SuratMasuk>; token: string }) => {
      const response = await fetch(`${API_URL}/arsip-surat/masuk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menambah surat masuk');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
    },
  });
};

export const useSignTte = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const response = await fetch(`${API_URL}/arsip-surat/keluar/${id}/sign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menyetujui dokumen');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-keluar'] });
    },
  });
};
