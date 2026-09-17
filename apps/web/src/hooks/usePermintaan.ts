import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RequestItem {
  id: string;
  layananId: string;
  layananNama?: string;
  pendudukId?: string;
  pendudukNama?: string;
  nomorPermintaan: string;
  status: string;
  dataJson?: Record<string, unknown>;
  catatan?: string;
  createdAt: string;
  submittedAt?: string;
  processedAt?: string;
  completedAt?: string;
}

export interface TemplateVersion {
  id: string;
  version: number;
  status: string;
  template?: {
    id: string;
    nama: string;
  };
}

export interface GeneratedDocument {
  id: string;
  nomorDokumen: string;
  status: string;
  fileUrl?: string;
  verificationToken?: string;
}

export interface RequestDetail extends RequestItem {
  layanan?: {
    nama: string;
    kode: string;
  };
  penduduk?: {
    namaLengkap?: string;
    nik?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    alamat?: string;
    rt?: string;
    rw?: string;
    dusun?: string;
  };
  updatedAt: string;
  creator?: { username: string };
  processor?: { username: string };
  approver?: { username: string };
  dokumen?: GeneratedDocument[];
}

export const usePermintaanList = (page: number, status: string, search: string, token: string) => {
  return useQuery<{ data: RequestItem[]; meta: PaginationMeta }, Error>({
    queryKey: ['admin-permintaan', { page, status, search }],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`${API_URL}/service-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat permintaan');
      return res.json();
    },
    enabled: !!token,
  });
};

export const usePermintaanDetail = (id: string | null, token: string) => {
  return useQuery<{ data: RequestDetail }, Error>({
    queryKey: ['admin-permintaan-detail', id],
    queryFn: async () => {
      if (!id || !token) throw new Error('No ID or token');
      const res = await fetch(`${API_URL}/service-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat detail');
      return res.json();
    },
    enabled: !!id && !!token,
  });
};

export const usePermintaanTemplates = (layananId: string | null, token: string, status: string | undefined) => {
  return useQuery<TemplateVersion[], Error>({
    queryKey: ['admin-permintaan-templates', layananId],
    queryFn: async () => {
      if (!layananId || !token) throw new Error('No ID or token');
      const res = await fetch(`${API_URL}/services/${layananId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat templates');
      const data = await res.json();
      
      const allTemplates: TemplateVersion[] = [];
      for (const doc of data.data.dokumen || []) {
        const docRes = await fetch(`${API_URL}/documents/${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          for (const template of docData.data.templates || []) {
            for (const version of template.versions || []) {
              if (version.status === 'PUBLISHED') {
                allTemplates.push({
                  ...version,
                  template: { ...template, id: String(template.id) },
                });
              }
            }
          }
        }
      }
      return allTemplates;
    },
    enabled: !!layananId && !!token && status === 'APPROVED',
  });
};

export const usePermintaanAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action, catatan, token }: { id: string; action: string; catatan?: string; token: string }) => {
      const res = await fetch(`${API_URL}/service-requests/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ catatan }),
      });
      if (!res.ok) throw new Error(`Gagal melakukan ${action}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-permintaan'] });
      queryClient.invalidateQueries({ queryKey: ['admin-permintaan-detail', variables.id] });
    },
  });
};

export const useGenerateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, token }: { payload: any; token: string }) => {
      const res = await fetch(`${API_URL}/documents/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal generate dokumen');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables.payload.permintaanId) {
        queryClient.invalidateQueries({ queryKey: ['admin-permintaan-detail', variables.payload.permintaanId] });
      }
    },
  });
};
