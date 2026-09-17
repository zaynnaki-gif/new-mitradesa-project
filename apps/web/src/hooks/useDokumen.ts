import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

export interface DokumenDefinition {
  id: string;
  layananId: string;
  kode: string;
  nama: string;
  slug: string;
  deskripsi?: string;
  isActive: boolean;
  layanan?: {
    kode: string;
    nama: string;
  };
  _count?: {
    templates: number;
    instan: number;
  };
}

export interface DocumentInstance {
  id: string;
  dokumenId: string;
  permintaanId?: string;
  templateVersionId: string;
  nomorDokumen: string;
  judul: string;
  status: string;
  fileUrl?: string;
  verificationToken?: string;
  generatedAt: string;
  signedAt?: string;
  dokumen?: { id: string; kode: string; nama: string };
  templateVersion?: {
    id: string;
    version: number;
    template?: { id: string; nama: string };
  };
  signature?: {
    id: string;
    penandatangan?: { nama: string; jabatan: string; nip?: string };
    signedAt: string;
  };
  permintaan?: {
    id: string;
    nomorPermintaan: string;
    penduduk?: {
      nik: string;
      namaLengkap: string;
    };
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DokumenResponse {
  success: boolean;
  data: DokumenDefinition[];
  message: string;
  meta: PaginationMeta;
}

interface DocumentInstanceResponse {
  success: boolean;
  data: DocumentInstance[];
  message: string;
  meta: PaginationMeta;
}

interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  layananId?: string;
  status?: string;
}

export function useDokumen(options: FetchOptions = {}, token?: string) {
  return useQuery<DokumenResponse, Error>({
    queryKey: ['dokumen', options],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.search) queryParams.append('search', options.search);
      if (options.layananId) queryParams.append('layananId', options.layananId);

      const url = `${API_URL}/documents?${queryParams.toString()}`;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data dokumen');
      }

      return result;
    },
    enabled: !!token, 
  });
}

export function useDokumenInstances(options: FetchOptions = {}, token?: string) {
  return useQuery<DocumentInstanceResponse, Error>({
    queryKey: ['dokumen-instances', options],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.search) queryParams.append('search', options.search);
      if (options.status) queryParams.append('status', options.status);

      const url = `${API_URL}/api/documents/instances?${queryParams.toString()}`;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data instances dokumen');
      }

      return result;
    },
    enabled: !!token,
  });
}

export function useDokumenInstance(id: string | null, token?: string) {
  return useQuery<{ success: boolean; data: DocumentInstance; message: string }, Error>({
    queryKey: ['dokumen-instance-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('ID Dokumen tidak ditemukan');
      
      const response = await fetch(`${API_URL}/documents/instances/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil detail dokumen');
      }
      return result;
    },
    enabled: !!id && !!token,
  });
}

export interface Signatory {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  isActive: boolean;
}

export function useSignatories(token?: string) {
  return useQuery<{ success: boolean; data: Signatory[]; message: string }, Error>({
    queryKey: ['signatories'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/signatories?isActive=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil daftar penandatangan');
      }
      return result;
    },
    enabled: !!token,
  });
}

export function useSignDokumen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, penandatanganId, token }: { id: string; penandatanganId: string; token: string }) => {
      const response = await fetch(`${API_URL}/documents/${id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ penandatanganId })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menandatangani dokumen');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dokumen-instance-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dokumen-instances'] });
    }
  });
}

export function useRevokeDokumen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const response = await fetch(`${API_URL}/documents/${id}/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mencabut dokumen');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dokumen-instance-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dokumen-instances'] });
    }
  });
}
