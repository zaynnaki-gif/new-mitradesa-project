import { Card, Table, Typography, Button, Badge } from '../../../components/ui';
import { useAuthStore } from '../../../stores/auth.store';
import { useSuratKeluarList, useSignTte } from '@/hooks/useArsipSurat';

export function TteDashboardPage() {
  const { token } = useAuthStore();
  const { data: response, isLoading: loading, error: queryError } = useSuratKeluarList('', token || '', true, 'GENERATED');
  
  const documents = response?.data?.data || [];
  const error = queryError?.message || '';

  const signTte = useSignTte();

  const handleApprove = async (id: string) => {
    try {
      await signTte.mutateAsync({ id, token: token || '' });
      alert(`Dokumen ${id} berhasil ditandatangani (TTE).`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyetujui dokumen');
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
