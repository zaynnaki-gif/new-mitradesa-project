import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';

export interface UsulanOnline {
  id: string;
  pendudukId: string;
  judul: string;
  deskripsi: string;
  lokasi?: string;
  status: 'DIAJUKAN' | 'DITINJAU' | 'DITERIMA' | 'DITOLAK';
  dukungan: number;
  rkpdesId?: string;
  createdAt: string;
  penduduk?: {
    nik: string;
    nama: string;
  };
  rkpdes?: {
    namaKegiatan: string;
  };
  alasanDitolak?: string;
  rpjmdesBidangId?: string;
}

export const usulanService = {
  // =====================
  // ADMIN CMS ENDPOINTS
  // =====================
  async getAdminUsulanList(token: string) {
    return safeFetchJson(`${API_URL}/cms/usulan`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getAdminUsulanDetail(token: string, id: string) {
    return safeFetchJson(`${API_URL}/cms/usulan/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateUsulanStatus(token: string, id: string, payload: Partial<UsulanOnline>) {
    return safeFetchJson(`${API_URL}/cms/usulan/${id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
    });
  },

  // =====================
  // PUBLIC ENDPOINTS
  // =====================
  async getPublicUsulanList() {
    // Implementasi API publik untuk citizen portal
    return safeFetchJson(`${API_URL}/public/usulan`);
  },

  async submitPublicUsulan(data: any) {
    // Implementasi API submit publik
    return safeFetchJson(`${API_URL}/public/usulan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async addDukungan(id: string, nik: string) {
    // Implementasi API tambah dukungan
    return safeFetchJson(`${API_URL}/public/usulan/${id}/dukung`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nik }),
    });
  }
};
