import { useState, useEffect } from 'react';
import { Button, Input, Select, Modal, Badge } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import styles from './KeluargaPage.module.css';
import { DusunSelector } from '@/components/DusunSelector';
import { RecordSelector } from '@/components/RecordSelector';

import { useKeluargaList, useKeluargaDetail, useCreateKeluarga, useUpdateKeluarga, useDeleteKeluarga, useAddAnggota, useRemoveAnggota, Keluarga, KeluargaDetail } from '@/hooks/useKeluarga';

// Form types
interface KeluargaForm {
  noKk: string;
  kepalaId: string;
  alamat: string;
  dusun: string;
  rw: string;
  rt: string;
  gubugId: string;
  rwId: string;
  rtId: string;
}

interface AnggotaForm {
  pendudukId: string;
  hubungan: string;
}


export default function KeluargaPage() {
  const { token } = useAuthStore();

  // State - list
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Data Fetching
  const { data: keluargaResponse, isLoading: loading, error: queryError } = useKeluargaList(page, search, token || '');
  const keluarga = keluargaResponse?.data || [];
  const pagination = keluargaResponse?.meta || null;
  const error = queryError ? queryError.message : null;

  // Mutations
  const createMutation = useCreateKeluarga();
  const updateMutation = useUpdateKeluarga();
  const deleteMutation = useDeleteKeluarga();
  const addAnggotaMutation = useAddAnggota();
  const removeAnggotaMutation = useRemoveAnggota();

  // Selected keluarga for detail fetching
  const [selectedKeluargaId, setSelectedKeluargaId] = useState<string | null>(null);
  const { data: detailData, isLoading: listLoading } = useKeluargaDetail(selectedKeluargaId || '', token || '');
  
  // We sync detailData to selectedKeluarga state since the modal uses it
  useEffect(() => {
    if (detailData) setSelectedKeluarga(detailData);
  }, [detailData]);

  // List modal state
  const [showListModal, setShowListModal] = useState(false);
  const [selectedKeluarga, setSelectedKeluarga] = useState<KeluargaDetail | null>(null);

  // Form modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingKeluarga, setEditingKeluarga] = useState<Keluarga | null>(null);
  const [defaultSearchName, setDefaultSearchName] = useState('');
  const [formData, setFormData] = useState<KeluargaForm>({
    noKk: '',
    kepalaId: '',
    alamat: '',
    dusun: '',
    rw: '',
    rt: '',
    gubugId: '',
    rwId: '',
    rtId: '',
  });

  // Anggota modal
  const [showAnggotaModal, setShowAnggotaModal] = useState(false);
  const [anggotaForm, setAnggotaForm] = useState<AnggotaForm>({ pendudukId: '', hubungan: '' });

  // Open create modal
  const openCreateModal = () => {
    setEditingKeluarga(null);
    setFormData({ noKk: '', kepalaId: '', alamat: '', dusun: '', rw: '', rt: '', gubugId: '', rwId: '', rtId: '' });
    setDefaultSearchName('');
    setShowFormModal(true);
  };

  // Open edit modal
  const openEditModal = (item: Keluarga) => {
    setEditingKeluarga(item);
    setFormData({
      noKk: item.noKk,
      kepalaId: item.kepalaId,
      alamat: item.alamat || '',
      dusun: item.dusun || '',
      rw: item.rw || '',
      rt: item.rt || '',
      gubugId: item.gubugId || '',
      rwId: item.rwId || '',
      rtId: item.rtId || '',
    });
    setDefaultSearchName(item.kepalaNama || '');
    setShowFormModal(true);
  };

  // Open detail/list modal
  const openListModal = async (item: Keluarga) => {
    setSelectedKeluarga(null);
    setSelectedKeluargaId(item.id);
    setShowListModal(true);
  };

  // Submit keluarga form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingKeluarga) {
        await updateMutation.mutateAsync({ id: editingKeluarga.id, data: formData, token });
      } else {
        await createMutation.mutateAsync({ data: formData, token });
      }
      setShowFormModal(false);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    }
  };

  // Delete keluarga
  const handleDelete = async (item: Keluarga) => {
    if (!confirm(`Yakin ingin menghapus keluarga dengan No. KK ${item.noKk}?`) || !token) return;

    try {
      await deleteMutation.mutateAsync({ id: item.id, token });
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    }
  };

  // Add anggota
  const handleAddAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeluarga || !anggotaForm.pendudukId || !token) return;

    try {
      await addAnggotaMutation.mutateAsync({ keluargaId: selectedKeluarga.id, data: anggotaForm, token });
      setShowAnggotaModal(false);
      setAnggotaForm({ pendudukId: '', hubungan: '' });
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    }
  };

  // Remove anggota
  const handleRemoveAnggota = async (anggotaId: string) => {
    if (!selectedKeluarga || !confirm('Yakin ingin menghapus anggota ini?') || !token) return;

    try {
      await removeAnggotaMutation.mutateAsync({ keluargaId: selectedKeluarga.id, anggotaId, token });
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    }
  };

  const handleExport = () => {
    window.location.href = '/admin/sistem/export';
  };
  // Mask NIK
  const maskNik = (nik: string) => {
    if (nik.length === 16) {
      return `${nik.slice(0, 6)}xxxxxx${nik.slice(-4)}`;
    }
    return nik;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Data Keluarga</h1>
          <p className={styles.subtitle}>
            {pagination?.total || 0} total keluarga
          </p>
        </div>
        <div className={styles.headerActions} style={{ gap: '8px', display: 'flex', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={handleExport}>
            📥 Ke Halaman Export
          </Button>
          <Button variant="primary" onClick={openCreateModal}>
            + Tambah Keluarga
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.filters}>
        <div className={styles.searchForm}>
          <Input
            placeholder="Cari No. KK atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Memuat data keluarga..." fullPage />
      ) : error ? (
        <ErrorState title="Gagal Memuat Data" message={error} />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. KK</th>
                <th>Kepala Keluarga</th>
                <th>Alamat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {keluarga.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>Tidak ada data keluarga</td>
                </tr>
              ) : (
                keluarga.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.noKk}>{maskNik(item.noKk)}</td>
                    <td>{item.kepalaNama}</td>
                    <td>
                      {item.alamat || '-'}
                      {item.dusun && `, ${item.dusun}`}
                      {item.rw && ` RW ${item.rw}`}
                      {item.rt && ` RT ${item.rt}`}
                    </td>
                    <td className={styles.actions}>
                      <Button variant="outline" size="sm" onClick={() => openListModal(item)}>
                        Detail
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            ← Prev
          </Button>
          <span>Halaman {pagination.page} dari {pagination.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showListModal} onClose={() => setShowListModal(false)} title="Detail Keluarga">
        {listLoading ? (
          <LoadingState message="Memuat..." />
        ) : selectedKeluarga ? (
          <div className={styles.detailModal}>
            <div className={styles.detailHeader}>
              <div>
                <p className={styles.detailLabel}>No. KK</p>
                <p className={styles.detailValue}>{selectedKeluarga.noKk}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Alamat</p>
                <p className={styles.detailValue}>
                  {selectedKeluarga.alamat || '-'}
                  {selectedKeluarga.dusun && `, ${selectedKeluarga.dusun}`}
                  {selectedKeluarga.rw && ` RW ${selectedKeluarga.rw}`}
                  {selectedKeluarga.rt && ` RT ${selectedKeluarga.rt}`}
                </p>
              </div>
            </div>

            <div className={styles.anggotaSection}>
              <div className={styles.anggotaHeader}>
                <h4>Daftar Anggota Keluarga</h4>
                <Button variant="outline" size="sm" onClick={() => setShowAnggotaModal(true)}>
                  + Tambah Anggota
                </Button>
              </div>

              {selectedKeluarga.anggota.length === 0 ? (
                <p className={styles.noAnggota}>Belum ada anggota</p>
              ) : (
                <table className={styles.anggotaTable}>
                  <thead>
                    <tr>
                      <th>NIK</th>
                      <th>Nama</th>
                      <th>Hubungan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedKeluarga.anggota.map((a) => (
                      <tr key={a.id}>
                        <td>{maskNik(a.nik)}</td>
                        <td>{a.namaLengkap}</td>
                        <td><Badge color="primary">{a.hubungan}</Badge></td>
                        <td>
                          {a.hubungan !== 'KEPALA' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAnggota(a.id)}
                              style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                            >
                              Hapus
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingKeluarga ? 'Edit Keluarga' : 'Tambah Keluarga'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="No. KK *"
            value={formData.noKk}
            onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
            required
            placeholder="16 digit angka"
            maxLength={16}
          />
          <RecordSelector
            endpoint="/cms/penduduk"
            label="Kepala Keluarga *"
            value={formData.kepalaId}
            defaultName={defaultSearchName}
            onChange={(id) => setFormData({ ...formData, kepalaId: id })}
            renderItem={res => (
              <>
                <div style={{ fontWeight: 500 }}>{res.namaLengkap}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>NIK: {res.nik}</div>
              </>
            )}
            getDisplayValue={res => res.namaLengkap}
          />
          <Input
            label="Alamat"
            value={formData.alamat}
            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
          />
          <div className={styles.rowFields}>
            <DusunSelector
              selectedGubugId={formData.gubugId}
              selectedRwId={formData.rwId}
              selectedRtId={formData.rtId}
              onChange={(gubugId, rwId, rtId, names) => {
                setFormData({
                  ...formData,
                  gubugId: gubugId || '',
                  rwId: rwId || '',
                  rtId: rtId || '',
                  dusun: names?.gubug || '',
                  rw: names?.rw || '',
                  rt: names?.rt || '',
                });
              }}
            />
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Anggota Modal */}
      <Modal isOpen={showAnggotaModal} onClose={() => setShowAnggotaModal(false)} title="Tambah Anggota">
        <form onSubmit={handleAddAnggota} className={styles.form}>
          <Input
            label="NIK Anggota"
            value={anggotaForm.pendudukId}
            onChange={(e) => setAnggotaForm({ ...anggotaForm, pendudukId: e.target.value })}
            required
            placeholder="NIK 16 digit"
          />
          <Select
            label="Hubungan"
            value={anggotaForm.hubungan}
            onChange={(e) => setAnggotaForm({ ...anggotaForm, hubungan: e.target.value })}
            required
          >
            <option value="">Pilih Hubungan</option>
            <option value="ISTRI">Istri</option>
            <option value="ANAK">Anak</option>
            <option value="CUCU">Cucu</option>
            <option value="MENANTU">Menantu</option>
            <option value="ORANGTUA">Orang Tua</option>
            <option value="MERTUA">Mertua</option>
            <option value="SAUDARA">Saudara</option>
            <option value="PEMBANTU">Pembantu</option>
            <option value="LAINNYA">Lainnya</option>
          </Select>
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setShowAnggotaModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={addAnggotaMutation.isPending}>
              {addAnggotaMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

