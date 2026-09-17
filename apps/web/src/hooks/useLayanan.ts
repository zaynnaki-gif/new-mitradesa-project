import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';
import type { FieldDefinition } from '@/components/forms/DynamicForm';

export interface Layanan {
  id: string;
  kode: string;
  nama: string;
  slug: string;
  kategori?: string;
  deskripsi?: string;
  isActive: boolean;
  requiresDocument?: boolean;
  requiresApproval?: boolean;
  _count?: {
    permintaan: number;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LayananResponse {
  success: boolean;
  data: Layanan[];
  message: string;
  meta: PaginationMeta;
}

// ============================================
// Public Hooks
// ============================================
interface UseLayananOptions {
  limit?: number;
  page?: number;
  kategori?: string;
  search?: string;
}

export const useLayananList = (options: UseLayananOptions = {}) => {
  const { data, isLoading, error, refetch } = useQuery<LayananResponse, Error>({
    queryKey: ['public-layanan', options],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(options.limit || 20),
        page: String(options.page || 1),
      });

      if (options.kategori) params.set('kategori', options.kategori);
      if (options.search) params.set('search', options.search);

      const res = await fetch(`${API_URL}/public/layanan?${params}`);
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal memuat layanan');
      return json;
    },
  });

  return {
    data: data?.data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch,
    meta: data?.meta,
  };
};

export const useLayananDetail = (slug: string | null) => {
  const { data, isLoading, error, refetch } = useQuery<Layanan, Error>({
    queryKey: ['public-layanan-detail', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug is required');

      const res = await fetch(`${API_URL}/public/layanan/${encodeURIComponent(slug)}`);
      
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 404) throw new Error('Layanan tidak ditemukan');
        throw new Error(json.message || 'Gagal memuat layanan');
      }
      return json.data;
    },
    enabled: !!slug,
  });

  return {
    data: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};

// ============================================
// Admin Hooks
// ============================================

export const useAdminLayananList = (page: number, token: string, filter?: { search?: string; kategori?: string; isActive?: string }) => {
  return useQuery<LayananResponse, Error>({
    queryKey: ['admin-layanan', { page, ...filter }],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      const params = new URLSearchParams({
        limit: '20',
        page: String(page),
      });

      if (filter?.search) params.set('search', filter.search);
      if (filter?.kategori) params.set('kategori', filter.kategori);
      if (filter?.isActive) params.set('isActive', filter.isActive);

      const response = await fetch(`${API_URL}/services?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal memuat layanan');
      }

      return data;
    },
    enabled: !!token,
  });
};

export const useAdminLayananDetailById = (id: string | null, token: string) => {
  return useQuery<{ data: Layanan }, Error>({
    queryKey: ['admin-layanan-detail', id],
    queryFn: async () => {
      if (!id || !token) throw new Error('ID or Token is missing');

      const response = await fetch(`${API_URL}/services/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat layanan');
      }

      return data;
    },
    enabled: !!id && !!token,
  });
};

export const useCreateLayanan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, token }: { data: Partial<Layanan>; token: string }) => {
      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menambah layanan');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-layanan'] });
      queryClient.invalidateQueries({ queryKey: ['public-layanan'] });
    },
  });
};

export const useUpdateLayanan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, token }: { id: string; data: Partial<Layanan>; token: string }) => {
      const response = await fetch(`${API_URL}/services/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memperbarui layanan');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-layanan'] });
      queryClient.invalidateQueries({ queryKey: ['public-layanan'] });
      queryClient.invalidateQueries({ queryKey: ['public-layanan-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-layanan-detail'] });
    },
  });
};

export const useDeleteLayanan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const response = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus layanan');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-layanan'] });
      queryClient.invalidateQueries({ queryKey: ['public-layanan'] });
    },
  });
};

// ============================================
// Field Hooks
// ============================================

export const useLayananFields = (layananId: string | null, token: string) => {
  return useQuery<{ data: FieldDefinition[] }, Error>({
    queryKey: ['layanan-fields', layananId],
    queryFn: async () => {
      if (!layananId || !token) throw new Error('ID or Token is missing');

      const response = await fetch(`${API_URL}/services/${layananId}/fields`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat fields');
      }

      return data;
    },
    enabled: !!layananId && !!token,
  });
};

export const useSaveField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      layananId, 
      fieldId, 
      data, 
      token 
    }: { 
      layananId: string; 
      fieldId?: string | null; 
      data: Partial<FieldDefinition>; 
      token: string; 
    }) => {
      const url = fieldId 
        ? `${API_URL}/services/${layananId}/fields/${fieldId}`
        : `${API_URL}/services/${layananId}/fields`;
        
      const method = fieldId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menyimpan field');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layanan-fields', variables.layananId] });
      queryClient.invalidateQueries({ queryKey: ['admin-layanan'] }); // to update count
    },
  });
};

export const useDeleteField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ layananId, fieldId, token }: { layananId: string; fieldId: string; token: string }) => {
      const response = await fetch(`${API_URL}/services/${layananId}/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus field');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layanan-fields', variables.layananId] });
      queryClient.invalidateQueries({ queryKey: ['admin-layanan'] }); // to update count
    },
  });
};

export const useReorderFields = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ layananId, fields, token }: { layananId: string; fields: { id: string; orderIndex: number }[]; token: string }) => {
      const response = await fetch(`${API_URL}/services/${layananId}/fields/reorder`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal mengubah urutan fields');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layanan-fields', variables.layananId] });
    },
  });
};
