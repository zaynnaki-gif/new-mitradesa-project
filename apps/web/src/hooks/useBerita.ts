import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface Kategori {
  id: string;
  nama: string;
  slug: string;
  warna: string | null;
}

export interface Penulis {
  id: string;
  username: string;
  nama?: string;
}

export interface Berita {
  id: string;
  judul: string;
  slug: string;
  excerpt: string | null;
  konten: string | null;
  gambarUrl: string | null;
  status: string;
  kategori: Kategori | null;
  penulis: Penulis | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BeritaListResponse {
  success: boolean;
  data: Berita[];
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BeritaDetailResponse {
  success: boolean;
  data: Berita;
  message: string;
}

export interface KategoriListResponse {
  success: boolean;
  data: Kategori[];
  message: string;
}

interface UseBeritaOptions {
  limit?: number;
  page?: number;
  kategori?: string;
  search?: string;
}

interface UseBeritaResult {
  data: Berita[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  meta?: BeritaListResponse['meta'];
}

export function useBeritaList(options: UseBeritaOptions = {}): UseBeritaResult {
  const [data, setData] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<BeritaListResponse['meta']>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchBerita = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(options.limit || 10),
          page: String(options.page || 1),
        });

        if (options.kategori) {
          params.set('kategori', options.kategori);
        }

        if (options.search) {
          params.set('search', options.search);
        }

        const res = await fetch(`${API_URL}/public/berita?${params}`);

        if (!res.ok) {
          throw new Error('Gagal memuat berita');
        }

        const result: BeritaListResponse = await res.json();

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

    fetchBerita();
  }, [options.limit, options.page, options.kategori, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return { data, loading, error, refetch, meta };
}

export function useBeritaDetail(slug: string | null): {
  data: Berita | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<Berita | null>(null);
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
        const res = await fetch(`${API_URL}/public/berita/${encodeURIComponent(slug)}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Berita tidak ditemukan');
          }
          throw new Error('Gagal memuat berita');
        }

        const result: BeritaDetailResponse = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError('Gagal memuat berita');
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

export function useKategori(): {
  data: Kategori[];
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKategori = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/kategori/active`);

        if (!res.ok) {
          throw new Error('Gagal memuat kategori');
        }

        const result: KategoriListResponse = await res.json();

        if (result.success) {
          setData(result.data || []);
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

    fetchKategori();
  }, []);

  return { data, loading, error };
}
