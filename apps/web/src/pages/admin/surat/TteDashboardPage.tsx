import { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Badge } from '../../../components/ui';
import { API_URL } from '../../../lib/constants';
import { useAuthStore } from '../../../stores/auth.store';
import { safeFetchJson } from '@/lib/fetch';

export function TteDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuthStore();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Fetch documents pending signature. Depending on backend, might be GENERATED or PENDING_SIGNATURE
      const data = await safeFetchJson(`${API_URL}/arsip-surat/keluar?status=GENERATED`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (data.success) {
        setDocuments(data.data?.data || []);
      } else {
        throw new Error(data.message || 'Gagal memuat dokumen');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleApprove = async (id: string) => {
    try {
      // Typically we would call an endpoint to approve/sign
      // For now we assume a PATCH to /api/arsip-surat/keluar/:id/sign or we just update status
      alert(`Fitur TTE untuk dokumen ${id} akan memproses Tanda Tangan Elektronik.`);
      // Mock update
      setDocuments(documents.filter(d => d.id !== id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert('Gagal menyetujui dokumen');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Typography variant="h2">Persetujuan Dokumen (TTE)</Typography>
        <Typography variant="body1" color="secondary">
          Daftar dokumen yang menunggu Tanda Tangan Elektronik dari Kepala Desa.
        </Typography>
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>
        ) : error ? (
          <div style={{ padding: '2rem', color: 'red' }}>{error}</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Typography variant="body1">Tidak ada dokumen yang menunggu persetujuan.</Typography>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Nomor Dokumen</th>
                <th>Jenis Surat</th>
                <th>Tanggal Dibuat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {documents.map((doc: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <tr key={doc.id}>
                  <td>{doc.nomorDokumen || '-'}</td>
                  <td>{doc.dokumen?.nama || 'Surat Keterangan'}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <Badge color="primary">Menunggu TTE</Badge>
                  </td>
                  <td>
                    <Button size="sm" onClick={() => handleApprove(doc.id)}>
                      Tanda Tangani
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
