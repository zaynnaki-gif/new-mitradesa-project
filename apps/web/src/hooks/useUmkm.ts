import { useState, useCallback, useEffect } from 'react';
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

export function useUmkmList(options: { limit?: number; search?: string; kategori?: string } = {}) {
  const [data, setData] = useState<Umkm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);

  const fetchUmkms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL(`${API_URL}/public/umkm`);
      if (options.limit) url.searchParams.append('limit', options.limit.toString());
      if (options.search) url.searchParams.append('search', options.search);
      if (options.kategori) url.searchParams.append('kategori', options.kategori);

      const response = await fetch(url.toString());
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat data UMKM');
      setData(result.data || []);
      setMeta(result.meta || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data UMKM');
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.search, options.kategori]);

  useEffect(() => {
    fetchUmkms();
  }, [fetchUmkms]);

  return { data, loading, error, meta, refetch: fetchUmkms };
}

export function useUmkmDetail(slug: string) {
  const [data, setData] = useState<Umkm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUmkm = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/public/umkm/${slug}`);
      const result = await response.json();
      if (response.status === 404) {
        setError('UMKM tidak ditemukan');
        setData(null);
        return;
      }
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat detail UMKM');
      setData(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat detail UMKM');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchUmkm();
  }, [fetchUmkm]);

  return { data, loading, error, refetch: fetchUmkm };
}
