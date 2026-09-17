import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

export interface Umkm {
  id: string;
  desaId: string;
  nama: string;
  slug: string;
  deskripsi: string;
  kategori: string;
  gambarUrl: string | null;
  harga: string | null;
  kontak: string;
  pemilik: string;
  isAktif: boolean;
  createdAt: string;
}

interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  kategori?: string;
}

export function useUmkmList(options: FetchOptions = {}, token?: string) {
  return useQuery({
    queryKey: ['umkm', options],
    queryFn: async () => {
      const url = new URL(`${API_URL}/umkm`);
      if (options.page) url.searchParams.append('page', options.page.toString());
      if (options.limit) url.searchParams.append('limit', options.limit.toString());
      if (options.search) url.searchParams.append('search', options.search);
      if (options.kategori) url.searchParams.append('kategori', options.kategori);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // If no token, maybe it's a public fetch
        url.pathname = '/api/public/umkm';
      }

      const response = await fetch(url.toString(), { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat data UMKM');
      
      return {
        data: result.data as Umkm[],
        meta: result.meta as { total: number; page: number; limit: number; totalPages: number }
      };
    },
  });
}

export function useUmkmDetail(slug: string) {
  return useQuery({
    queryKey: ['umkm', slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await fetch(`${API_URL}/public/umkm/${slug}`);
      const result = await response.json();
      if (response.status === 404) {
        return null; // or throw Error depending on requirements
      }
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat detail UMKM');
      return result.data as Umkm;
    },
    enabled: !!slug,
  });
}

export function useDeleteUmkm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await fetch(`${API_URL}/umkm/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal menghapus UMKM');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['umkm'] });
    },
  });
}

export function useSaveUmkm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      payload, 
      token 
    }: { 
      id?: string; 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: any; 
      token: string 
    }) => {
      const url = id ? `${API_URL}/umkm/${id}` : `${API_URL}/umkm`;
      const method = id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal menyimpan data UMKM');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['umkm'] });
    },
  });
}
