import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

export interface Penduduk {
  id: string;
  nik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  golDarah: string | null;
  agama: string | null;
  statusPerkawinan: string;
  hubunganKeluarga: string | null;
  dusun: string | null;
  rt: string | null;
  rw: string | null;
  gubugId: string | null;
  rwId: string | null;
  rtId: string | null;
  telepon: string | null;
  isAktif: boolean;
  pendidikan: string | null;
  pekerjaan: string | null;
  suku: string | null;
  namaAyahLengkap: string | null;
  namaIbuLengkap: string | null;
  wargaNegara?: string | null;
  nikAyah?: string | null;
  nikIbu?: string | null;
  pendapatan?: string | null;
  kepemilikanRumah?: string | null;
  luasRumah?: string | null;
  jumlahLantai?: string | null;
  jenisLantai?: string | null;
  jenisDinding?: string | null;
  jenisAtap?: string | null;
  kepemilikanTanah?: string | null;
  luasTanah?: string | null;
  penerangan?: string | null;
  sumberEnergiMasak?: string | null;
  mck?: string | null;
  sumberAir?: string | null;
  bantuanSosial?: string | null;
  bantuanExtra?: string | null;
  bpjsKesehatan?: string | null;
  bpjsKetenagakerjaan?: string | null;
  kepemilikanAset?: string | null;
  kondisiFisik?: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PendudukResponse {
  success: boolean;
  message: string;
  data: Penduduk[];
  meta: PaginationMeta;
}

export const usePendudukList = (
  page: number,
  search: string,
  jenisKelamin: string,
  isAktif: string,
  token: string
) => {
  return useQuery<PendudukResponse, Error>({
    queryKey: ['penduduk', { page, search, jenisKelamin, isAktif }],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (jenisKelamin) params.append('jenisKelamin', jenisKelamin);
      if (isAktif) params.append('isAktif', isAktif);

      const response = await fetch(`${API_URL}/penduduk?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengambil data penduduk');
      }

      return data;
    },
    enabled: !!token,
  });
};

export const useCreatePenduduk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, token }: { data: Partial<Penduduk>; token: string }) => {
      const response = await fetch(`${API_URL}/penduduk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menambah data penduduk');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penduduk'] });
    },
  });
};

export const useUpdatePenduduk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, token }: { id: string; data: Partial<Penduduk>; token: string }) => {
      const response = await fetch(`${API_URL}/penduduk/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memperbarui data penduduk');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penduduk'] });
    },
  });
};

export const useDeletePenduduk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const response = await fetch(`${API_URL}/penduduk/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus data penduduk');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penduduk'] });
    },
  });
};
