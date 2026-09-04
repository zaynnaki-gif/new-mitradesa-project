import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface ApbdesItem {
  id: string;
  apbdesId: string;
  kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN';
  nama: string;
  anggaran: number;
  realisasi: number;
}

export interface Apbdes {
  id: string;
  desaId: string;
  tahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  totalPembiayaan: number;
  isAktif: boolean;
  dokumenUrl: string | null;
  items: ApbdesItem[];
}

export function useApbdes() {
  const [data, setData] = useState<Apbdes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApbdes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/public/transparansi/apbdes`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat data');
      setData(result.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data Transparansi APBDes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApbdes();
  }, [fetchApbdes]);

  return { data, loading, error, refetch: fetchApbdes };
}
