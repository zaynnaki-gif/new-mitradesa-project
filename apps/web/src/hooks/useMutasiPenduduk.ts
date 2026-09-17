import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

export interface MutasiPenduduk {
  id: string;
  jenisMutasi: 'LAHIR' | 'MATI' | 'PINDAH_DATANG' | 'PINDAH_PERGI';
  tanggalMutasi: string;
  nik: string;
  namaLengkap: string;
  jenisKelamin?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  nikAyah?: string;
  nikIbu?: string;
  penyebabMati?: string;
  alamatAsal?: string;
  desaAsal?: string;
  kecamatanAsal?: string;
  kabupatenAsal?: string;
  alamatTujuan?: string;
  desaTujuan?: string;
  kecamatanTujuan?: string;
  kabupatenTujuan?: string;
  keterangan?: string;
  createdAt: string;
}

export interface MutasiStats {
  tahun: number;
  lahir: number;
  mati: number;
  pindahDatang: number;
  pindahPergi: number;
  netto: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MutasiPendudukResponse {
  success: boolean;
  message: string;
  data: MutasiPenduduk[];
  meta: PaginationMeta;
}

export interface MutasiStatsResponse {
  success: boolean;
  message: string;
  data: MutasiStats;
}

export const useMutasiList = (
  page: number,
  search: string,
  jenisMutasi: string,
  tahun: string,
  token: string
) => {
  return useQuery<MutasiPendudukResponse, Error>({
    queryKey: ['mutasi-penduduk', { page, search, jenisMutasi, tahun }],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (jenisMutasi) params.append('jenisMutasi', jenisMutasi);
      if (tahun) params.append('tahun', tahun);

      const response = await fetch(`${API_URL}/mutasi-penduduk?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengambil data mutasi penduduk');
      }

      return data;
    },
    enabled: !!token,
  });
};

export const useMutasiStats = (tahun: string, token: string) => {
  return useQuery<MutasiStats, Error>({
    queryKey: ['mutasi-penduduk-stats', { tahun }],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      const response = await fetch(`${API_URL}/mutasi-penduduk/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengambil statistik mutasi');
      }

      return data.data;
    },
    enabled: !!token,
  });
};

export const useCreateMutasi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, token }: { data: Partial<MutasiPenduduk>; token: string }) => {
      const response = await fetch(`${API_URL}/mutasi-penduduk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menambah data mutasi penduduk');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-penduduk'] });
      queryClient.invalidateQueries({ queryKey: ['mutasi-penduduk-stats'] });
    },
  });
};

export const useUpdateMutasi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, token }: { id: string; data: Partial<MutasiPenduduk>; token: string }) => {
      const response = await fetch(`${API_URL}/mutasi-penduduk/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memperbarui data mutasi penduduk');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-penduduk'] });
      queryClient.invalidateQueries({ queryKey: ['mutasi-penduduk-stats'] });
    },
  });
};

export const useDeleteMutasi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const response = await fetch(`${API_URL}/mutasi-penduduk/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus data mutasi penduduk');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-penduduk'] });
      queryClient.invalidateQueries({ queryKey: ['mutasi-penduduk-stats'] });
    },
  });
};
