import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

interface RefItem {
  id: string;
  kode: string;
  nama: string;
  isAktif?: boolean;
}

const fetchReference = async (endpoint: string, token: string): Promise<RefItem[]> => {
  const res = await fetch(`${API_URL}/reference/${endpoint}?limit=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  const json = await res.json();
  if (json.success) {
    return (json.data || []).filter((item: RefItem) => item.isAktif !== false);
  }
  throw new Error(json.message || 'Failed to fetch reference');
};

export function useReference(endpoint: string, token: string) {
  return useQuery({
    queryKey: ['reference', endpoint],
    queryFn: () => fetchReference(endpoint, token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
