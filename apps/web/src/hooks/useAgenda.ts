import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface Agenda {
  id: string;
  desaId: string;
  judul: string;
  slug: string;
  deskripsi: string;
  lokasi: string;
  penyelenggara: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'MENDATANG' | 'BERLANGSUNG' | 'SELESAI' | 'BATAL';
  isAktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAgendaList(limit?: number) {
  const [data, setData] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgenda = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL(`${API_URL}/public/agenda`);
      if (limit) url.searchParams.append('limit', limit.toString());
      
      const response = await fetch(url.toString());
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Gagal memuat data Agenda');
      setData(result.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data Agenda');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  return { data, loading, error, refetch: fetchAgenda };
}
