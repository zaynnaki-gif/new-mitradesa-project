import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/constants';

export interface Potensi {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string;
  kategori: string;
  gambarUrl?: string;
  lokasi?: string;
  kontak?: string;
  isAktif: boolean;
}

export function usePotensiList(params?: { kategori?: string; search?: string; page?: number; limit?: number }) {
  const [data, setData] = useState<Potensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPotensi = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (params?.kategori) queryParams.append('kategori', params.kategori);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const res = await fetch(`${API_URL}/public/potensi?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data potensi');
      
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [params?.kategori, params?.search, params?.page, params?.limit]);

  useEffect(() => {
    fetchPotensi();
  }, [fetchPotensi]);

  return { data, loading, error, refetch: fetchPotensi };
}

export function usePotensi(slug: string) {
  const [data, setData] = useState<Potensi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPotensi = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/public/potensi/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error('Potensi tidak ditemukan');
      
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchPotensi();
  }, [fetchPotensi, slug]);

  return { data, loading, error, refetch: fetchPotensi };
}
