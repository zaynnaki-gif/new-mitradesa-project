import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useBansosDetail, useBansosPenerima, useAddBansosPenerima, useUpdateBansosPenerima, useDeleteBansosPenerima, BansosPenerima } from '@/hooks/useBansos';
import { useConfirm } from '@/hooks/useConfirm';
import { RecordSelector } from '@/components/RecordSelector';
import styles from './BansosPenerimaPage.module.css';

export default function BansosPenerimaPage() {
  const { id } = useParams();
  const bansosId = id || '';

  const { data: bansos, isLoading: loadingBansos, error: errorBansos } = useBansosDetail(bansosId);
  const { data: items, isLoading: loadingPenerima, error: errorPenerima } = useBansosPenerima(bansosId);
  
  const addMutation = useAddBansosPenerima();
  const updateMutation = useUpdateBansosPenerima();
  const deleteMutation = useDeleteBansosPenerima();
  
  const { confirm, ConfirmElement } = useConfirm();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BansosPenerima | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    pendudukId: '',
    keluargaId: '',
    status: 'TERDAFTAR',
    keterangan: '',
    tanggalDiterima: '',
    defaultSearchName: ''
  });

  const isKeluargaTarget = bansos?.targetPenerima === 'KELUARGA';

  const openCreate = () => {
    setEditing(null);
    setFormData({
      pendudukId: '',
      keluargaId: '',
      status: 'TERDAFTAR',
      keterangan: '',
      tanggalDiterima: '',
      defaultSearchName: ''
    });
    setShowModal(true);
  };

  const openEdit = (item: BansosPenerima) => {
    setEditing(item);
    setFormData({
      pendudukId: item.pendudukId || '',
      keluargaId: item.keluargaId || '',
      status: item.status,
      keterangan: item.keterangan || '',
      tanggalDiterima: item.tanggalDiterima ? item.tanggalDiterima.split('T')[0] : '',
      defaultSearchName: (isKeluargaTarget ? item.keluarga?.kepalaKeluarga?.namaLengkap : item.penduduk?.namaLengkap) || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      pendudukId: formData.pendudukId || undefined,
      keluargaId: formData.keluargaId || undefined,
      status: formData.status,
      keterangan: formData.keterangan || undefined,
      tanggalDiterima: formData.tanggalDiterima ? new Date(formData.tanggalDiterima).toISOString() : undefined
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, bansosId, data: payload }, {
        onSuccess: () => setShowModal(false),
        onError: (err) => alert(err.message || 'Gagal menyimpan')
      });
    } else {
      addMutation.mutate({ bansosId, data: payload }, {
        onSuccess: () => setShowModal(false),
        onError: (err) => alert(err.message || 'Gagal menyimpan')
      });
    }
  };

  const handleDelete = async (item: BansosPenerima) => {
    const nama = isKeluargaTarget 
      ? item.keluarga?.kepalaKeluarga?.namaLengkap 
      : item.penduduk?.namaLengkap;
      
    const ok = await confirm({
      title: 'Hapus Penerima',
      message: `Hapus penerima "${nama}" dari program bansos ini?`,
    });

    if (ok) {
      deleteMutation.mutate({ id: item.id, bansosId }, {
        onError: (err) => alert(err.message || 'Gagal menghapus')
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DITERIMA': return 'success';
      case 'TERDAFTAR': return 'primary';
      case 'DITOLAK': return 'error';
      case 'DIBATALKAN': return 'muted';
      default: return 'primary';
    }
  };

  if (loadingBansos || loadingPenerima) return <AdminLayout><LoadingState message="Memuat data..." fullPage /></AdminLayout>;
  if (errorBansos || errorPenerima) return <AdminLayout><ErrorState title="Error" message="Gagal memuat data" /></AdminLayout>;
  if (!bansos) return <AdminLayout>Data tidak ditemukan</AdminLayout>;

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Link to="/admin/kesejahteraan/bansos" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                &larr; Kembali
              </Link>
            </div>
            <h1 className={styles.title}>Daftar Penerima: {bansos.nama}</h1>
            <p className={styles.subtitle}>{bansos.penyelenggara} • Target: {bansos.targetPenerima}</p>
            <div className={styles.badge}>
              Total: {bansos.totalPenerima} {bansos.kuota ? `/ ${bansos.kuota}` : ''}
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="primary" onClick={openCreate}>+ Tambah Penerima</Button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Penerima</th>
                <th>Alamat</th>
                <th>Status</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!items || items.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>Belum ada penerima terdaftar.</td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const namaLengkap = isKeluargaTarget 
                    ? item.keluarga?.kepalaKeluarga?.namaLengkap 
                    : item.penduduk?.namaLengkap;
                  const identifier = isKeluargaTarget 
                    ? `KK: ${item.keluarga?.noKk}` 
                    : `NIK: ${item.penduduk?.nik}`;
                  const alamat = isKeluargaTarget 
                    ? item.keluarga?.kepalaKeluarga?.alamatLengkap 
                    : item.penduduk?.alamatLengkap;

                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{namaLengkap || 'Tanpa Nama'}</strong>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          {identifier}
                        </div>
                      </td>
                      <td>{alamat || '—'}</td>
                      <td>
                        <Badge color={getStatusBadgeColor(item.status)}>{item.status}</Badge>
                        {item.tanggalDiterima && (
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {new Date(item.tanggalDiterima).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td>{item.keterangan || '—'}</td>
                      <td className={styles.actions}>
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                          onClick={() => handleDelete(item)}
                        >
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editing ? 'Edit Penerima' : 'Tambah Penerima'}</h2>
                <button onClick={() => setShowModal(false)} aria-label="Tutup">&times;</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {!editing && (
                  <div className={styles.formSection}>
                    <RecordSelector
                      endpoint={isKeluargaTarget ? '/cms/keluarga' : '/cms/penduduk'}
                      label={isKeluargaTarget ? "Cari Kepala Keluarga (Nama/KK)" : "Cari Penduduk (Nama/NIK)"}
                      value={isKeluargaTarget ? formData.keluargaId : formData.pendudukId}
                      defaultName={formData.defaultSearchName}
                      onChange={(id) => {
                        if (isKeluargaTarget) {
                          setFormData(f => ({ ...f, keluargaId: id }));
                        } else {
                          setFormData(f => ({ ...f, pendudukId: id }));
                        }
                      }}
                      renderItem={res => (
                        <>
                          <div style={{ fontWeight: 500 }}>
                            {isKeluargaTarget ? res.kepalaKeluarga?.namaLengkap : res.namaLengkap}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {isKeluargaTarget ? `KK: ${res.noKk}` : `NIK: ${res.nik}`}
                          </div>
                        </>
                      )}
                      getDisplayValue={res => isKeluargaTarget ? res.kepalaKeluarga?.namaLengkap : res.namaLengkap}
                    />
                  </div>
                )}

                <div className={styles.formGrid}>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                    required
                  >
                    <option value="TERDAFTAR">Terdaftar</option>
                    <option value="DITERIMA">Diterima</option>
                    <option value="DITOLAK">Ditolak</option>
                    <option value="DIBATALKAN">Dibatalkan</option>
                  </Select>

                  {formData.status === 'DITERIMA' && (
                    <Input
                      label="Tanggal Diterima"
                      type="date"
                      value={formData.tanggalDiterima}
                      onChange={e => setFormData(f => ({ ...f, tanggalDiterima: e.target.value }))}
                    />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>Keterangan</label>
                    <textarea
                      value={formData.keterangan}
                      onChange={e => setFormData(f => ({ ...f, keterangan: e.target.value }))}
                      placeholder="Catatan tambahan (opsional)"
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '80px' }}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button 
                    type="submit" 
                    disabled={(!editing && !formData.pendudukId && !formData.keluargaId) || addMutation.isPending || updateMutation.isPending}
                  >
                    {addMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
