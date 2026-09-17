import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';

import { usePerangkatDesaList, useSavePerangkatDesa, useDeletePerangkatDesa, PerangkatDesaAdmin as PerangkatDesa } from '@/hooks/usePerangkatDesa';
import { RecordSelector } from '@/components/RecordSelector';
import styles from './PerangkatDesaPage.module.css';



const JABATAN_OPTIONS = [
  { value: 'KEPALA_DESA', label: 'Kepala Desa' },
  { value: 'SEKRETARIS', label: 'Sekretaris Desa' },
  { value: 'KAUR', label: 'Kaur (Kepala Urusan)' },
  { value: 'KASI', label: 'Kasi (Kepala Seksi)' },
  { value: 'RT', label: 'RT' },
  { value: 'RW', label: 'RW' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const STATUS_OPTIONS = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'NONAKTIF', label: 'Nonaktif' },
];

export default function PerangkatDesaPage() {
  const { token } = useAuthStore();

  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data: response, isLoading: loading, error, refetch: fetchItems } = usePerangkatDesaList(
    { page, limit: 20, search, status },
    token || ''
  );
  
  const items = response?.data || [];
  const meta = response?.meta || null;

  const saveMutation = useSavePerangkatDesa();
  const deleteMutation = useDeletePerangkatDesa();

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PerangkatDesa | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ jabatan: '', status: 'AKTIF' });

  // Penduduk search state
  const [selectedPendudukId, setSelectedPendudukId] = useState<string>('');
  const [defaultSearchName, setDefaultSearchName] = useState<string>('');

  const openCreate = () => {
    setEditing(null);
    setFormData({ jabatan: '', status: 'AKTIF' });
    setSelectedPendudukId('');
    setDefaultSearchName('');
    setShowModal(true);
  };

  const openEdit = (item: PerangkatDesa) => {
    setEditing(item);
    setFormData({ jabatan: item.jabatan, status: item.status });
    setSelectedPendudukId(item.pendudukId);
    setDefaultSearchName(item.pendudukNama || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendudukId && !editing) {
      alert('Pilih penduduk terlebih dahulu');
      return;
    }
    setFormLoading(true);

    const payload = {
      pendudukId: selectedPendudukId || editing?.pendudukId,
      jabatan: formData.jabatan,
      status: formData.status,
    };

    try {
      await saveMutation.mutateAsync({
        id: editing?.id,
        payload,
        token: token || '',
      });
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus perangkat desa ini?')) return;
    
    try {
      await deleteMutation.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus perangkat desa');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Perangkat Desa</h1>
            <p className={styles.subtitle}>{meta?.total || 0} total perangkat desa</p>
          </div>
          <Button onClick={openCreate}>+ Tambah Perangkat</Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.search}>
            <input
              type="text"
              placeholder="Cari nama atau jabatan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[{ value: '', label: 'Semua Status' }, ...STATUS_OPTIONS]}
            className={styles.filterSelect}
          />
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data..." fullPage />
        ) : error ? (
          <ErrorState
            title="Gagal Memuat Data"
            message={error.message || 'Terjadi kesalahan saat memuat data perangkat desa'}
            onRetry={() => fetchItems()}
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>Jabatan</th>
                    <th>Status</th>
                    <th>Daftar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        Belum ada data.{' '}
                        <Button size="sm" variant="outline" onClick={openCreate}>+ Tambah</Button>
                      </td>
                    </tr>
                  ) : items.map(item => (
                    <tr key={item.id}>
                      <td className={styles.nik}>{item.pendudukNik}</td>
                      <td>{item.pendudukNama}</td>
                      <td><Badge color="primary">{item.jabatan}</Badge></td>
                      <td>
                        <Badge color={item.status === 'AKTIF' ? 'success' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td className={styles.actions}>
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                        >Hapus</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={meta.totalPages}
                onPageChange={(p) => setPage(p)}
                disabled={loading}
              />
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editing ? 'Edit Perangkat Desa' : 'Tambah Perangkat Desa'}</h2>
                <button onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                {!editing && (
                  <div className={styles.formGrid}>
                    <div>
                      <RecordSelector
                        endpoint="/cms/penduduk"
                        label="Penduduk *"
                        value={selectedPendudukId}
                        defaultName={defaultSearchName}
                        onChange={(id) => setSelectedPendudukId(id)}
                        renderItem={res => (
                          <>
                            <div style={{ fontWeight: 500 }}>{res.namaLengkap}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>NIK: {res.nik}</div>
                          </>
                        )}
                        getDisplayValue={res => res.namaLengkap}
                      />
                    </div>
                  </div>
                )}

                <div className={styles.formGrid}>
                  <Select
                    label="Jabatan *"
                    value={formData.jabatan}
                    onChange={e => setFormData(f => ({ ...f, jabatan: e.target.value }))}
                    required
                  >
                    <option value="">Pilih Jabatan</option>
                    {JABATAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <Select
                    label="Status *"
                    value={formData.status}
                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                    required
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>

                <div className={styles.formActions}>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Menyimpan...' : 'Simpan'}
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
