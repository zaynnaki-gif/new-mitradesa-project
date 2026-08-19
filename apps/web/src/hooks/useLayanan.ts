/**
 * useLayanan Hook
 * Fetches public services/layanan from the API
 */

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface Layanan {
  id: string;
  kode: string;
  nama: string;
  slug: string;
  kategori?: string;
  deskripsi?: string;
  isActive: boolean;
  _count?: {
    permintaan: number;
  };
}

interface LayananResponse {
  success: boolean;
  data: Layanan[];
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseLayananOptions {
  limit?: number;
  page?: number;
  kategori?: string;
  search?: string;
}

interface UseLayananResult {
  data: Layanan[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  meta?: LayananResponse['meta'];
}

export function useLayananList(options: UseLayananOptions = {}): UseLayananResult {
  const [data, setData] = useState<Layanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<LayananResponse['meta']>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchLayanan = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(options.limit || 20),
          page: String(options.page || 1),
        });

        if (options.kategori) {
          params.set('kategori', options.kategori);
        }

        if (options.search) {
          params.set('search', options.search);
        }

        const res = await fetch(`${API_URL}/public/layanan?${params}`);

        if (!res.ok) {
          throw new Error('Gagal memuat layanan');
        }

        const result: LayananResponse = await res.json();

        if (result.success) {
          setData(result.data || []);
          setMeta(result.meta);
        } else {
          setData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLayanan();
  }, [options.limit, options.page, options.kategori, options.search, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return { data, loading, error, refetch, meta };
}

export function useLayananDetail(slug: string | null): {
  data: Layanan | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<Layanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/public/layanan/${encodeURIComponent(slug)}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Layanan tidak ditemukan');
          }
          throw new Error('Gagal memuat layanan');
        }

        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError('Gagal memuat layanan');
          setData(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return { data, loading, error, refetch };
}
