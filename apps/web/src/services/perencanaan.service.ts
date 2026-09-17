import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';

export interface Rpjmdes {
  id: string;
  periodeMulai: number;
  periodeSelesai: number;
  visi: string;
  misi: string;
  status: 'DRAFT' | 'AKTIF' | 'SELESAI';
  bidang?: RpjmdesBidang[];
  createdAt: string;
}

export interface RpjmdesBidang {
  id: string;
  rpjmdesId: string;
  nama: string;
  deskripsi?: string;
  rkpdes?: Rkpdes[];
}

export interface Rkpdes {
  id: string;
  bidangId: string;
  tahun: number;
  namaKegiatan: string;
  lokasi?: string;
  perkiraanBiaya: number;
  sumberDana?: string;
  sasaran?: string;
  status: 'RENCANA' | 'BERJALAN' | 'SELESAI' | 'BATAL';
  apbdesItemId?: string;
}

export const perencanaanService = {
  // =====================
  // RPJMDES
  // =====================
  async getRpjmdesList(token: string) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rpjmdes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getRpjmdesDetail(token: string, id: string) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rpjmdes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async createRpjmdes(token: string, data: Partial<Rpjmdes>) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rpjmdes`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async updateRpjmdes(token: string, id: string, data: Partial<Rpjmdes>) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rpjmdes/${id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async deleteRpjmdes(token: string, id: string) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rpjmdes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // =====================
  // BIDANG
  // =====================
  async createBidang(token: string, rpjmdesId: string, data: Partial<RpjmdesBidang>) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rpjmdes/${rpjmdesId}/bidang`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async updateBidang(token: string, id: string, data: Partial<RpjmdesBidang>) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/bidang/${id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async deleteBidang(token: string, id: string) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/bidang/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // =====================
  // RKPDES
  // =====================
  async createRkpdes(token: string, bidangId: string, data: Partial<Rkpdes>) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/bidang/${bidangId}/rkpdes`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async updateRkpdes(token: string, id: string, data: Partial<Rkpdes>) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rkpdes/${id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async deleteRkpdes(token: string, id: string) {
    return safeFetchJson(`${API_URL}/cms/perencanaan/rkpdes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
};
