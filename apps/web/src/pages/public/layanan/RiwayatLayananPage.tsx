import { useEffect, useState } from 'react';
import { Container, Typography, Card } from '../../../components/ui';
import { API_URL } from '../../../lib/constants';

interface LayananHistory {
  nomorPermintaan: string;
  status: string;
  layanan: { nama: string; kode: string };
  catatan?: string | null;
  createdAt: string;
}

export function RiwayatLayananPage() {
  const [history, setHistory] = useState<LayananHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('citizen_token');
      if (!token) {
        window.location.href = '/verifikasi';
        return;
      }

      try {
        const response = await fetch(`${API_URL}/citizen/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gagal memuat riwayat');

        setHistory(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    let bgColor = '#f3f4f6';
    let color = '#374151';
    let text = status;

    if (status === 'COMPLETED') {
      bgColor = '#dcfce7'; color = '#166534'; text = 'Selesai';
    } else if (status === 'APPROVED') {
      bgColor = '#dbeafe'; color = '#1e40af'; text = 'Disetujui';
    } else if (status === 'REJECTED') {
      bgColor = '#fee2e2'; color = '#991b1b'; text = 'Ditolak';
    } else if (status === 'PROCESSING') {
      bgColor = '#fef9c3'; color = '#854d0e'; text = 'Diproses';
    } else if (status === 'SUBMITTED') {
      bgColor = '#e0e7ff'; color = '#3730a3'; text = 'Diajukan';
    }

    return (
      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', backgroundColor: bgColor, color, fontSize: '0.75rem', fontWeight: 600 }}>
        {text}
      </span>
    );
  };

  return (
    <Container maxWidth="md">
      <div style={{ padding: '2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Typography variant="h2">Riwayat Layanan</Typography>
          <button 
            onClick={() => {
              localStorage.removeItem('citizen_token');
              window.location.href = '/';
            }}
            style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
          >
            Keluar
          </button>
        </div>

        {loading ? (
          <div>Memuat...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
            <Typography variant="body1">Belum ada riwayat pengajuan surat.</Typography>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((item, idx) => (
              <Card key={idx} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Typography variant="h4" style={{ marginBottom: '0.25rem' }}>{item.layanan.nama}</Typography>
                    <Typography variant="body2" color="secondary">Nomor: {item.nomorPermintaan}</Typography>
                    <Typography variant="body2" color="secondary">Tanggal: {new Date(item.createdAt).toLocaleDateString('id-ID')}</Typography>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    {getStatusBadge(item.status)}
                    {item.status === 'COMPLETED' && (
                      <a 
                        href={`/layanan/tracking?nomor=${item.nomorPermintaan}`}
                        style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'underline' }}
                      >
                        Lihat Dokumen
                      </a>
                    )}
                  </div>
                </div>

                {item.status === 'REJECTED' && item.catatan && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#991b1b', fontSize: '0.875rem' }}>
                    <strong>Alasan Penolakan:</strong> {item.catatan}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
