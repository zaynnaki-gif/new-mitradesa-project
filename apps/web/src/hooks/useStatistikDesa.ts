import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface StatistikDemografi {
  name: string;
  count: number;
}

export interface StatistikDesa {
  penduduk: {
    total: number;
    lakiLaki: number;
    perempuan: number;
  };
  keluarga: number;
  surat: {
    masuk: number;
    keluar: number;
  };
  wilayah: {
    dusun: number;
    rt: number;
    rw: number;
  };
  distribusi: {
    agama: StatistikDemografi[];
    pendidikan: StatistikDemografi[];
    pekerjaan: StatistikDemografi[];
    golDarah: StatistikDemografi[];
    statusPerkawinan: StatistikDemografi[];
  };
}

export interface StatistikDesaResponse {
  success: boolean;
  data: StatistikDesa;
  message: string;
}

export function useStatistikDesa(): {
  data: StatistikDesa | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<StatistikDesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStatistik = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/public/statistik`);

        if (!res.ok) {
          throw new Error('Gagal memuat statistik desa');
        }

        const result: StatistikDesaResponse = await res.json();

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

    fetchStatistik();
  }, [refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return { data, loading, error, refetch };
}
