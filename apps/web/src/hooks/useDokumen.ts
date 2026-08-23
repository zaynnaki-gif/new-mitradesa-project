import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';

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

interface DokumenResponse {
  success: boolean;
  data: DokumenDefinition[];
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useDokumen(options?: { page?: number; limit?: number; search?: string; layananId?: string }) {
  const [data, setData] = useState<DokumenDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const { token } = useAuthStore();

  const fetchDokumen = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (options?.page) queryParams.append('page', options.page.toString());
      if (options?.limit) queryParams.append('limit', options.limit.toString());
      if (options?.search) queryParams.append('search', options.search);
      if (options?.layananId) queryParams.append('layananId', options.layananId);

      const url = `${API_URL}/documents/definitions?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json() as DokumenResponse;

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data dokumen');
      }

      if (result.success) {
        setData(result.data || []);
        if (result.meta) {
          setMeta(result.meta);
        }
      }
    } catch (err: any) {
      console.error('Error fetching dokumen:', err);
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [options?.page, options?.limit, options?.search, options?.layananId, token]);

  useEffect(() => {
    fetchDokumen();
  }, [fetchDokumen]);

  return { data, loading, error, meta, refetch: fetchDokumen };
}
