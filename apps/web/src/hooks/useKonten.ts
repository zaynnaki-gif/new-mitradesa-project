import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Berita {
  id: string;
  judul: string;
  slug: string;
  excerpt: string | null;
  gambarUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  kategori: { id: string; nama: string; slug: string; warna: string | null; } | null;
  penulis: { id: string; username: string; } | null;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDeskripsi: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agenda {
  id: string;
  judul: string;
  slug: string;
  deskripsi: string;
  lokasi: string;
  penyelenggara: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
  isAktif: boolean;
  createdAt: string;
}

export interface Potensi {
  id: string;
  nama: string;
  slug: string;
  kategori: string;
  deskripsi: string;
  lokasi: string;
  penanggungJawab: string | null;
  kontak: string | null;
  gambarUrl: string | null;
  isAktif: boolean;
  createdAt: string;
}

export interface Kategori {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string | null;
  ikon: string | null;
  warna: string | null;
  urutan: number;
  isAktif: boolean;
  jumlahBerita: number;
  createdAt: string;
  updatedAt: string;
}

export interface Halaman {
  id: string;
  judul: string;
  slug: string;
  excerpt: string | null;
  konten: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isMenu: boolean;
  urutan: number;
  createdBy: { id: string; username: string } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  kategori: string | null;
  uploadedBy: { id: string; username: string } | null;
  createdAt: string;
  updatedAt: string;
}

// === BERITA ===
export function useBeritaList(page: number, search: string, status: string, token: string) {
  return useQuery({
    queryKey: ['berita', { page, search, status }],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await safeFetchJson(`${API_URL}/berita?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal memuat berita');
      return res as { data: Berita[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function usePublishBerita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/berita/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal mempublikasikan');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['berita'] }),
  });
}

export function useArchiveBerita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/berita/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal mengarsipkan');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['berita'] }),
  });
}

export function useDeleteBerita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/berita/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['berita'] }),
  });
}

// === AGENDA ===
export function useAgendaList(page: number, search: string, token: string) {
  return useQuery({
    queryKey: ['agenda', { page, search }],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await safeFetchJson(`${API_URL}/api/agenda?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal memuat agenda');
      return res as { data: Agenda[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function useDeleteAgenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/api/agenda/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus agenda');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda'] }),
  });
}

// === POTENSI ===
export function usePotensiList(page: number, search: string, token: string) {
  return useQuery({
    queryKey: ['potensi', { page, search }],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await safeFetchJson(`${API_URL}/api/potensi-desa?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal memuat potensi');
      return res as { data: Potensi[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function useDeletePotensi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/api/potensi-desa/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus potensi');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['potensi'] }),
  });
}

// === KATEGORI ===
export function useKategoriList(page: number, search: string, token: string) {
  return useQuery({
    queryKey: ['kategori', { page, search }],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await safeFetchJson(`${API_URL}/berita/kategori/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal memuat kategori');
      return res as { data: Kategori[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function useDeleteKategori() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/berita/kategori/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus kategori');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kategori'] }),
  });
}

// === HALAMAN ===
export function useHalamanList(page: number, search: string, status: string, token: string) {
  return useQuery({
    queryKey: ['halaman', { page, search, status }],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await safeFetchJson(`${API_URL}/halaman-statis?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal memuat halaman');
      return res as { data: Halaman[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function useDeleteHalaman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/halaman-statis/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus halaman');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['halaman'] }),
  });
}

export function usePublishHalaman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/api/halaman/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal mempublikasikan halaman');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['halaman'] }),
  });
}

// === MEDIA ===
export function useMediaList(page: number, search: string, fileType: string, token: string) {
  return useQuery({
    queryKey: ['media', { page, search, fileType }],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (fileType) params.set('fileType', fileType);
      const res = await safeFetchJson(`${API_URL}/upload/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal memuat media');
      return res as { data: Media[]; meta: PaginationMeta };
    },
    enabled: !!token,
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const res = await safeFetchJson(`${API_URL}/upload/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus media');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useMediaStats(token: string) {
  return useQuery({
    queryKey: ['mediaStats'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const res = await safeFetchJson(`${API_URL}/media/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.success) throw new Error(res.error?.message || 'Gagal memuat statistik media');
      return res.data;
    },
    enabled: !!token,
  });
}
