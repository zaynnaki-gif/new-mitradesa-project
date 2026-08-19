import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface PerangkatDesaPublic {
  id: string;
  nama: string;
  jabatan: string;
  status: string;
  fotoUrl: string | null;
}

interface PerangkatDesaListResponse {
  success: boolean;
  data: PerangkatDesaPublic[];
  message: string;
}

export function usePerangkatDesa(): {
  data: PerangkatDesaPublic[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<PerangkatDesaPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerangkatDesa = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/perangkat-desa/public?aktif=true`);

      if (!res.ok) {
        throw new Error('Gagal memuat data perangkat desa');
      }

      const result: PerangkatDesaListResponse = await res.json();

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

  useEffect(() => {
    fetchPerangkatDesa();
  }, []);

  return { data, loading, error, refetch: fetchPerangkatDesa };
}
