import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

// ----------------------
// TYPES
// ----------------------
export interface Bansos {
  id: string;
  desaId: string;
  nama: string;
  deskripsi: string | null;
  penyelenggara: string;
  jenisBantuan: string;
  targetPenerima: 'INDIVIDU' | 'KELUARGA';
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  status: string;
  totalPenerima: number;
  kuota: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BansosPenerima {
  id: string;
  bansosId: string;
  pendudukId: string | null;
  keluargaId: string | null;
  status: string;
  tanggalDiterima: string | null;
  keterangan: string | null;
  createdAt: string;
  
  // Relations
  penduduk?: {
    nik: string;
    namaLengkap: string;
    alamatLengkap?: string;
  } | null;
  keluarga?: {
    noKk: string;
    kepalaKeluarga?: {
      namaLengkap: string;
      alamatLengkap?: string;
    };
  } | null;
}

// ----------------------
// API CALLS
// ----------------------
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Terjadi kesalahan');
  return json;
};

// ----------------------
// HOOKS
// ----------------------

export function useBansos(options?: { status?: string }) {
  return useQuery({
    queryKey: ['bansos', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      
      const res = await fetch(`${API_URL}/cms/bansos?${params.toString()}`, {
        headers: getHeaders()
      });
      return handleResponse(res).then(d => d.data as Bansos[]);
    }
  });
}

export function useBansosDetail(id: string) {
  return useQuery({
    queryKey: ['bansos', id],
    queryFn: async () => {
      if (!id) throw new Error('ID is required');
      const res = await fetch(`${API_URL}/cms/bansos/${id}`, {
        headers: getHeaders()
      });
      return handleResponse(res).then(d => d.data as Bansos);
    },
    enabled: !!id
  });
}

export function useBansosPenerima(bansosId: string) {
  return useQuery({
    queryKey: ['bansos', bansosId, 'penerima'],
    queryFn: async () => {
      if (!bansosId) throw new Error('Bansos ID is required');
      const res = await fetch(`${API_URL}/cms/bansos/${bansosId}/penerima`, {
        headers: getHeaders()
      });
      return handleResponse(res).then(d => d.data as BansosPenerima[]);
    },
    enabled: !!bansosId
  });
}

export function useCreateBansos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Bansos>) => {
      const res = await fetch(`${API_URL}/cms/bansos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bansos'] });
    }
  });
}

export function useUpdateBansos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Bansos> }) => {
      const res = await fetch(`${API_URL}/cms/bansos/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bansos'] });
      queryClient.invalidateQueries({ queryKey: ['bansos', variables.id] });
    }
  });
}

export function useDeleteBansos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/cms/bansos/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bansos'] });
    }
  });
}

export function useAddBansosPenerima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bansosId, data }: { bansosId: string, data: Partial<BansosPenerima> }) => {
      const res = await fetch(`${API_URL}/cms/bansos/${bansosId}/penerima`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bansos', variables.bansosId, 'penerima'] });
      queryClient.invalidateQueries({ queryKey: ['bansos'] });
    }
  });
}

export function useUpdateBansosPenerima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<BansosPenerima>, bansosId: string }) => {
      const res = await fetch(`${API_URL}/cms/bansos/penerima/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bansos', variables.bansosId, 'penerima'] });
    }
  });
}

export function useDeleteBansosPenerima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string, bansosId: string }) => {
      const res = await fetch(`${API_URL}/cms/bansos/penerima/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bansos', variables.bansosId, 'penerima'] });
      queryClient.invalidateQueries({ queryKey: ['bansos'] });
    }
  });
}
