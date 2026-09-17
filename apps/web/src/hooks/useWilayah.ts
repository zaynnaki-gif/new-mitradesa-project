import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

interface Gubug {
  id: string;
  kode: string;
  nama: string;
}

interface Rw {
  id: string;
  gubugId: string;
  kode: string;
  nama: string;
}

interface Rt {
  id: string;
  rwId: string;
  kode: string;
}

interface WilayahTreeData {
  gubug: Gubug[];
  rw: Rw[];
  rt: Rt[];
}

export function useWilayahTree(desaId: string) {
  return useQuery({
    queryKey: ['wilayah-tree', desaId],
    queryFn: async (): Promise<WilayahTreeData> => {
      if (!desaId) return { gubug: [], rw: [], rt: [] };
      const response = await fetch(`${API_URL}/wilayah/dropdown?desaId=${desaId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Failed to fetch wilayah');
      
      // Map data to expected types
      return {
        gubug: (result.data.gubug || []).map((g: any) => ({
          id: g.id.toString(), kode: g.kode, nama: g.nama,
        })),
        rw: (result.data.rw || []).map((r: any) => ({
          id: r.id.toString(), gubugId: r.gubugId.toString(), kode: r.kode, nama: r.nama,
        })),
        rt: (result.data.rt || []).map((rt: any) => ({
          id: rt.id.toString(), rwId: rt.rwId.toString(), kode: rt.kode,
        }))
      };
    },
    enabled: !!desaId,
  });
}

// Mutations
export type Level = 'gubug' | 'rw' | 'rt';

export function useCreateWilayah(desaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ level, data, token }: { level: Level, data: any, token: string }) => {
      const response = await fetch(`${API_URL}/wilayah/${level}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || `Gagal membuat ${level}`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wilayah-tree', desaId] });
    }
  });
}

export function useUpdateWilayah(desaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ level, id, data, token }: { level: Level, id: string, data: any, token: string }) => {
      const response = await fetch(`${API_URL}/wilayah/${level}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || `Gagal mengubah ${level}`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wilayah-tree', desaId] });
    }
  });
}

export function useDeleteWilayah(desaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ level, id, token }: { level: Level, id: string, token: string }) => {
      const response = await fetch(`${API_URL}/wilayah/${level}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || `Gagal menghapus ${level}`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wilayah-tree', desaId] });
    }
  });
}
