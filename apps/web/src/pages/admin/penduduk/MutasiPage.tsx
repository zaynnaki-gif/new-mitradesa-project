import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import styles from './MutasiPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';

import { useMutasiList, useMutasiStats, useCreateMutasi, useUpdateMutasi, useDeleteMutasi, MutasiPenduduk } from '@/hooks/useMutasiPenduduk';

const JENIS_MUTASI_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'LAHIR', label: 'Lahir' },
  { value: 'MATI', label: 'Mati' },
  { value: 'PINDAH_DATANG', label: 'Pindah Datang' },
  { value: 'PINDAH_PERGI', label: 'Pindah Pergi' },
];

type BadgeColor = 'primary' | 'secondary' | 'success' | 'error' | 'muted';

const JENIS_MUTASI_LABEL: Record<string, { label: string; color: BadgeColor }> = {
  LAHIR: { label: 'Lahir', color: 'success' },
  MATI: { label: 'Mati', color: 'error' },
  PINDAH_DATANG: { label: 'Pindah Datang', color: 'primary' },
  PINDAH_PERGI: { label: 'Pindah Pergi', color: 'secondary' },
};




export default function MutasiPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [jenisMutasi, setJenisMutasi] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());

  const { data: listResponse, isLoading: loading, error: queryError } = useMutasiList(page, search, jenisMutasi, tahun, token || '');
  const items = listResponse?.data || [];
  const pagination = listResponse?.meta || null;
  const error = queryError ? queryError.message : null;

  const { data: stats } = useMutasiStats(tahun, token || '');

  const createMutation = useCreateMutasi();
  const updateMutation = useUpdateMutasi();
  const deleteMutation = useDeleteMutasi();



  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MutasiPenduduk | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    jenisMutasi: 'LAHIR' as MutasiPenduduk['jenisMutasi'],
    tanggalMutasi: new Date().toISOString().split('T')[0],
    nik: '',
    namaLengkap: '',
    jenisKelamin: '' as 'L' | 'P' | '',
    tanggalLahir: '',
    tempatLahir: '',
    nikAyah: '',
    nikIbu: '',
    penyebabMati: '',
    alamatAsal: '',
    desaAsal: '',
    kecamatanAsal: '',
    kabupatenAsal: '',
    alamatTujuan: '',
    desaTujuan: '',
    kecamatanTujuan: '',
    kabupatenTujuan: '',
    keterangan: '',
  });



  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // ============================================
  // Modal Handlers
  // ============================================
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      jenisMutasi: 'LAHIR',
      tanggalMutasi: new Date().toISOString().split('T')[0],
      nik: '',
      namaLengkap: '',
      jenisKelamin: '',
      tanggalLahir: '',
      tempatLahir: '',
      nikAyah: '',
      nikIbu: '',
      penyebabMati: '',
      alamatAsal: '',
      desaAsal: '',
      kecamatanAsal: '',
      kabupatenAsal: '',
      alamatTujuan: '',
      desaTujuan: '',
      kecamatanTujuan: '',
      kabupatenTujuan: '',
      keterangan: '',
    });
    setShowModal(true);
  };

  const openEditModal = (item: MutasiPenduduk) => {
    setEditingItem(item);
    setFormData({
      jenisMutasi: item.jenisMutasi,
      tanggalMutasi: item.tanggalMutasi.split('T')[0],
      nik: item.nik,
      namaLengkap: item.namaLengkap,
      jenisKelamin: (item.jenisKelamin as 'L' | 'P') || '',
      tanggalLahir: item.tanggalLahir?.split('T')[0] || '',
      tempatLahir: item.tempatLahir || '',
      nikAyah: item.nikAyah || '',
      nikIbu: item.nikIbu || '',
      penyebabMati: item.penyebabMati || '',
      alamatAsal: item.alamatAsal || '',
      desaAsal: item.desaAsal || '',
      kecamatanAsal: item.kecamatanAsal || '',
      kabupatenAsal: item.kabupatenAsal || '',
      alamatTujuan: item.alamatTujuan || '',
      desaTujuan: item.desaTujuan || '',
      kecamatanTujuan: item.kecamatanTujuan || '',
      kabupatenTujuan: item.kabupatenTujuan || '',
      keterangan: item.keterangan || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);

    try {
      // Prepare payload - only include relevant fields based on jenis mutasi
      const payload: Record<string, unknown> = {
        jenisMutasi: formData.jenisMutasi,
        tanggalMutasi: formData.tanggalMutasi,
        nik: formData.nik,
        namaLengkap: formData.namaLengkap,
        keterangan: formData.keterangan || undefined,
      };

      // Add optional fields if they have values
      if (formData.jenisKelamin) payload.jenisKelamin = formData.jenisKelamin;
      if (formData.tanggalLahir) payload.tanggalLahir = formData.tanggalLahir;
      if (formData.tempatLahir) payload.tempatLahir = formData.tempatLahir;

      // Type-specific fields
      if (formData.jenisMutasi === 'LAHIR') {
        if (formData.nikAyah) payload.nikAyah = formData.nikAyah;
        if (formData.nikIbu) payload.nikIbu = formData.nikIbu;
      } else if (formData.jenisMutasi === 'MATI') {
        if (formData.penyebabMati) payload.penyebabMati = formData.penyebabMati;
      } else if (formData.jenisMutasi === 'PINDAH_DATANG') {
        if (formData.alamatAsal) payload.alamatAsal = formData.alamatAsal;
        if (formData.desaAsal) payload.desaAsal = formData.desaAsal;
        if (formData.kecamatanAsal) payload.kecamatanAsal = formData.kecamatanAsal;
        if (formData.kabupatenAsal) payload.kabupatenAsal = formData.kabupatenAsal;
      } else if (formData.jenisMutasi === 'PINDAH_PERGI') {
        if (formData.alamatTujuan) payload.alamatTujuan = formData.alamatTujuan;
        if (formData.desaTujuan) payload.desaTujuan = formData.desaTujuan;
        if (formData.kecamatanTujuan) payload.kecamatanTujuan = formData.kecamatanTujuan;
        if (formData.kabupatenTujuan) payload.kabupatenTujuan = formData.kabupatenTujuan;
      }

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: payload, token });
      } else {
        await createMutation.mutateAsync({ data: payload, token });
      }
      setShowModal(false);
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const _ok = await confirm({ message: 'Yakin ingin menghapus data ini?', title: 'Konfirmasi' }); if (!_ok) return;
    if (!token) return;

    try {
      await deleteMutation.mutateAsync({ id, token });
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan');
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Mutasi Penduduk</h1>
            <p className={styles.subtitle}>
              {pagination?.total || 0} total data | Tahun {tahun}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="primary" onClick={openCreateModal}>
              + Tambah Mutasi
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Lahir</span>
              <span className={`${styles.statValue} ${styles.success}`}>{stats.lahir}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Mati</span>
              <span className={`${styles.statValue} ${styles.error}`}>{stats.mati}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pindah Datang</span>
              <span className={`${styles.statValue} ${styles.info}`}>{stats.pindahDatang}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pindah Pergi</span>
              <span className={`${styles.statValue} ${styles.warning}`}>{stats.pindahPergi}</span>
            </div>
            <div className={`${styles.statCard} ${styles.nettoCard}`}>
              <span className={styles.statLabel}>Netto</span>
              <span className={`${styles.statValue} ${stats.netto >= 0 ? styles.success : styles.error}`}>
                {stats.netto >= 0 ? '+' : ''}{stats.netto}
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Cari NIK atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={jenisMutasi}
              onChange={(e) => setJenisMutasi(e.target.value)}
              style={{ width: 180 }}
            >
              {JENIS_MUTASI_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="Tahun"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              style={{ width: 120 }}
            />
            <Button type="submit">Cari</Button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data mutasi..." fullPage />
        ) : error ? (
          <ErrorState
            title="Gagal Memuat Data"
            message={error}
            onRetry={() => window.location.reload()}
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jenis</th>
                    <th>NIK</th>
                    <th>Nama Lengkap</th>
                    <th>Info Tambahan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        Tidak ada data mutasi penduduk
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>{formatDate(item.tanggalMutasi)}</td>
                        <td>
                          <Badge color={JENIS_MUTASI_LABEL[item.jenisMutasi]?.color || 'muted'}>
                            {JENIS_MUTASI_LABEL[item.jenisMutasi]?.label}
                          </Badge>
                        </td>
                        <td className={styles.nik}>{item.nik}</td>
                        <td className={styles.nama}>{item.namaLengkap}</td>
                        <td className={styles.info}>
                          {item.jenisMutasi === 'LAHIR' && item.nikAyah && <span>NIK Ayah: {item.nikAyah}</span>}
                          {item.jenisMutasi === 'MATI' && item.penyebabMati && <span>{item.penyebabMati}</span>}
                          {item.jenisMutasi === 'PINDAH_DATANG' && item.desaAsal && <span>Dari: {item.desaAsal}</span>}
                          {item.jenisMutasi === 'PINDAH_PERGI' && item.desaTujuan && <span>Ke: {item.desaTujuan}</span>}
                          {item.keterangan && <span>{item.keterangan}</span>}
                        </td>
                        <td className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
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

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                disabled={loading}
              />
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editingItem ? 'Edit Mutasi' : 'Tambah Mutasi Penduduk'}</h2>
                <button onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <Select
                    label="Jenis Mutasi *"
                    value={formData.jenisMutasi}
                    onChange={(e) => setFormData({ ...formData, jenisMutasi: e.target.value as MutasiPenduduk['jenisMutasi'] })}
                    required
                  >
                    <option value="LAHIR">Lahir</option>
                    <option value="MATI">Mati</option>
                    <option value="PINDAH_DATANG">Pindah Datang</option>
                    <option value="PINDAH_PERGI">Pindah Pergi</option>
                  </Select>
                  <Input
                    label="Tanggal Mutasi *"
                    type="date"
                    value={formData.tanggalMutasi}
                    onChange={(e) => setFormData({ ...formData, tanggalMutasi: e.target.value })}
                    required
                  />
                  <Input
                    label="NIK *"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    required
                    maxLength={16}
                  />
                  <Input
                    label="Nama Lengkap *"
                    value={formData.namaLengkap}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    required
                  />
                  <Select
                    label="Jenis Kelamin"
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                  >
                    <option value="">Pilih</option>
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </Select>
                  <Input
                    label="Tanggal Lahir"
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                  />
                  <Input
                    label="Tempat Lahir"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                  />
                </div>

                {/* Fields khusus Lahir */}
                {formData.jenisMutasi === 'LAHIR' && (
                  <div className={styles.formSection}>
                    <h4>Data Orang Tua</h4>
                    <div className={styles.formGrid}>
                      <Input
                        label="NIK Ayah"
                        value={formData.nikAyah}
                        onChange={(e) => setFormData({ ...formData, nikAyah: e.target.value })}
                        maxLength={16}
                      />
                      <Input
                        label="NIK Ibu"
                        value={formData.nikIbu}
                        onChange={(e) => setFormData({ ...formData, nikIbu: e.target.value })}
                        maxLength={16}
                      />
                    </div>
                  </div>
                )}

                {/* Fields khusus Mati */}
                {formData.jenisMutasi === 'MATI' && (
                  <div className={styles.formSection}>
                    <h4>Penyebab Kematian</h4>
                    <div className={styles.formGrid}>
                      <Input
                        label="Penyebab Mati"
                        value={formData.penyebabMati}
                        onChange={(e) => setFormData({ ...formData, penyebabMati: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Fields khusus Pindah Datang */}
                {formData.jenisMutasi === 'PINDAH_DATANG' && (
                  <div className={styles.formSection}>
                    <h4>Alamat Asal</h4>
                    <div className={styles.formGrid}>
                      <Input
                        label="Alamat Asal"
                        value={formData.alamatAsal}
                        onChange={(e) => setFormData({ ...formData, alamatAsal: e.target.value })}
                      />
                      <Input
                        label="Desa/Kelurahan Asal"
                        value={formData.desaAsal}
                        onChange={(e) => setFormData({ ...formData, desaAsal: e.target.value })}
                      />
                      <Input
                        label="Kecamatan Asal"
                        value={formData.kecamatanAsal}
                        onChange={(e) => setFormData({ ...formData, kecamatanAsal: e.target.value })}
                      />
                      <Input
                        label="Kabupaten Asal"
                        value={formData.kabupatenAsal}
                        onChange={(e) => setFormData({ ...formData, kabupatenAsal: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Fields khusus Pindah Pergi */}
                {formData.jenisMutasi === 'PINDAH_PERGI' && (
                  <div className={styles.formSection}>
                    <h4>Alamat Tujuan</h4>
                    <div className={styles.formGrid}>
                      <Input
                        label="Alamat Tujuan"
                        value={formData.alamatTujuan}
                        onChange={(e) => setFormData({ ...formData, alamatTujuan: e.target.value })}
                      />
                      <Input
                        label="Desa/Kelurahan Tujuan"
                        value={formData.desaTujuan}
                        onChange={(e) => setFormData({ ...formData, desaTujuan: e.target.value })}
                      />
                      <Input
                        label="Kecamatan Tujuan"
                        value={formData.kecamatanTujuan}
                        onChange={(e) => setFormData({ ...formData, kecamatanTujuan: e.target.value })}
                      />
                      <Input
                        label="Kabupaten Tujuan"
                        value={formData.kabupatenTujuan}
                        onChange={(e) => setFormData({ ...formData, kabupatenTujuan: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Keterangan umum */}
                <div className={styles.formSection}>
                  <div className={styles.formGrid}>
                    <Input
                      label="Keterangan"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    />
                  </div>
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
