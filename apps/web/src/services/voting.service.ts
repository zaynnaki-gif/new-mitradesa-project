import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';

export interface VotingKandidat {
  id: string;
  votingId: string;
  nomorUrut: number;
  nama: string;
  visiMisi?: string;
  fotoUrl?: string;
  rkpdesId?: string;
  rkpdes?: {
    id: string;
    apbdesItemId: string | null;
  } | null;
  _count?: {
    suara: number;
  };
}

export interface Voting {
  id: string;
  judul: string;
  deskripsi?: string;
  waktuMulai: string;
  waktuSelesai: string;
  status: 'MENDATANG' | 'BERLANGSUNG' | 'SELESAI';
  createdAt: string;
  kandidat?: VotingKandidat[];
  _count?: {
    suara: number;
  };
}

export const votingService = {
  // =====================
  // ADMIN CMS ENDPOINTS
  // =====================
  async getAdminVotingList(token: string) {
    return safeFetchJson(`${API_URL}/cms/voting`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getAdminVotingDetail(token: string, id: string) {
    return safeFetchJson(`${API_URL}/cms/voting/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async createVoting(token: string, data: Partial<Voting>) {
    return safeFetchJson(`${API_URL}/cms/voting`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async updateVoting(token: string, id: string, data: Partial<Voting>) {
    return safeFetchJson(`${API_URL}/cms/voting/${id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async deleteVoting(token: string, id: string) {
    return safeFetchJson(`${API_URL}/cms/voting/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // KANDIDAT
  async addKandidat(token: string, votingId: string, data: Partial<VotingKandidat>) {
    return safeFetchJson(`${API_URL}/cms/voting/${votingId}/kandidat`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async updateKandidat(token: string, kandidatId: string, data: Partial<VotingKandidat>) {
    return safeFetchJson(`${API_URL}/cms/voting/kandidat/${kandidatId}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
  },

  async deleteKandidat(token: string, votingId: string, kandidatId: string) {
    return safeFetchJson(`${API_URL}/cms/voting/${votingId}/kandidat/${kandidatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async jadikanApbdes(token: string, votingId: string, kandidatId: string) {
    return safeFetchJson(`${API_URL}/cms/voting/${votingId}/kandidat/${kandidatId}/apbdes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // =====================
  // PUBLIC ENDPOINTS
  // =====================
  async getPublicVotingList() {
    return safeFetchJson(`${API_URL}/public/voting`);
  },

  async getPublicVotingDetail(id: string) {
    return safeFetchJson(`${API_URL}/public/voting/${id}`);
  },

  async castVote(votingId: string, kandidatId: string, nik: string) {
    return safeFetchJson(`${API_URL}/public/voting/${votingId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kandidatId, nik }),
    });
  }
};
