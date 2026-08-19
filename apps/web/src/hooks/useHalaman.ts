import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface Halaman {
  id: string;
  slug: string;
  judul: string;
  konten: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HalamanResponse {
  success: boolean;
  data: Halaman;
  message: string;
}

export function useHalaman(slug: string | null): {
  data: Halaman | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<Halaman | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchHalaman = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/public/halaman/${encodeURIComponent(slug)}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Halaman tidak ditemukan');
          }
          throw new Error('Gagal memuat halaman');
        }

        const result: HalamanResponse = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setData(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHalaman();
  }, [slug, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return { data, loading, error, refetch };
}
