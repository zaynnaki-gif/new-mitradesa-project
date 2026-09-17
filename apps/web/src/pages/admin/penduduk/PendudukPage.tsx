import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import styles from './PendudukPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';
import { DusunSelector } from '@/components/DusunSelector';
import { useReference } from '@/hooks/useReference';

import { usePendudukList, useCreatePenduduk, useUpdatePenduduk, useDeletePenduduk, Penduduk } from '@/hooks/usePenduduk';


const KEPEMILIKAN_RUMAH_OPTIONS = ['Milik Sendiri', 'Sewa/Kontrak', 'Bebas Sewa', 'Dinas', 'Milik Orang Tua/Keluarga', 'Lainnya'];
const LUAS_RUMAH_OPTIONS = ['< 50 m2', '50 - 99 m2', '100 - 199 m2', '>= 200 m2'];
const JUMLAH_LANTAI_OPTIONS = ['1 Lantai', '2 Lantai', '3 Lantai', 'Lebih dari 3 Lantai'];
const JENIS_LANTAI_OPTIONS = ['Marmer/Granit', 'Keramik', 'Semen/Bata Merah', 'Kayu/Papan', 'Tanah', 'Bambu', 'Lainnya'];
const JENIS_DINDING_OPTIONS = ['Tembok/Beton', 'Kayu', 'Bambu', 'Lainnya'];
const JENIS_ATAP_OPTIONS = ['Genteng', 'Seng', 'Asbes', 'Beton', 'Ijuk/Rumbia', 'Bambu', 'Lainnya'];
const SUMBER_AIR_OPTIONS = ['Leding/PAM', 'Sumur Bor/Pompa', 'Sumur Gali', 'Mata Air', 'Air Sungai/Danau', 'Air Hujan', 'Lainnya'];
const BPJS_KESEHATAN_OPTIONS = ['BPJS PBI (Pemerintah)', 'BPJS Non-PBI (Mandiri)', 'Asuransi Swasta', 'Tidak Memiliki'];
const BANTUAN_SOSIAL_OPTIONS = ['PKH', 'BPNT', 'BLT Dana Desa', 'Bansos Tunai (BST)', 'Tidak Menerima', 'Lainnya'];
const KONDISI_FISIK_OPTIONS = ['Normal', 'Tunanetra', 'Tunarungu', 'Tunawicara', 'Tunadaksa', 'Tunagrahita', 'Lainnya'];




export default function PendudukPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('');
  const [isAktif, setIsAktif] = useState('');
  
  const { data: agamaRefs } = useReference('agama', token || '');
  const { data: golDarahRefs } = useReference('gol-darah', token || '');
  const { data: statusKawinRefs } = useReference('status-kawin', token || '');
  const { data: pendidikanRefs } = useReference('pendidikan', token || '');
  const { data: pekerjaanRefs } = useReference('pekerjaan', token || '');
  const { data: hubunganKeluargaRefs } = useReference('hubungan-keluarga', token || '');

  const { data: pendudukResponse, isLoading: loading, error: queryError } = usePendudukList(
    page,
    search,
    jenisKelamin,
    isAktif,
    token || ''
  );
  
  const penduduk = pendudukResponse?.data || [];
  const pagination = pendudukResponse?.meta || null;
  const error = queryError ? queryError.message : null;

  const createMutation = useCreatePenduduk();
  const updateMutation = useUpdatePenduduk();
  const deleteMutation = useDeletePenduduk();



  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPenduduk, setEditingPenduduk] = useState<Penduduk | null>(null);
  const [formLoading, setFormLoading] = useState(false);


  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nik: '',
    namaLengkap: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L' as 'L' | 'P',
    golDarah: '',
    agama: '',
    statusPerkawinan: '',
    hubunganKeluarga: '',
    dusun: '',
    rt: '',
    rw: '',
    gubugId: '',
    rwId: '',
    rtId: '',
    telepon: '',
    pendidikan: '',
    pekerjaan: '',
    suku: '',
    wargaNegara: 'Indonesia',
    nikAyah: '',
    nikIbu: '',
    namaAyahLengkap: '',
    namaIbuLengkap: '',
    pendapatan: '',
    kepemilikanRumah: '',
    luasRumah: '',
    jumlahLantai: '',
    jenisLantai: '',
    jenisDinding: '',
    jenisAtap: '',
    kepemilikanTanah: '',
    luasTanah: '',
    penerangan: '',
    sumberEnergiMasak: '',
    mck: '',
    sumberAir: '',
    bantuanSosial: '',
    bantuanExtra: '',
    bpjsKesehatan: '',
    bpjsKetenagakerjaan: '',
    kepemilikanAset: '',
    kondisiFisik: '',
  });



  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingPenduduk(null);
    setCurrentStep(1);
    setFormData({
      nik: '',
      namaLengkap: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: 'L',
      golDarah: '',
      agama: '',
      statusPerkawinan: '',
      hubunganKeluarga: '',
      dusun: '',
      rt: '',
      rw: '',
      gubugId: '',
      rwId: '',
      rtId: '',
      telepon: '',
      pendidikan: '',
      pekerjaan: '',
      suku: '',
      wargaNegara: 'Indonesia',
      nikAyah: '',
      nikIbu: '',
      namaAyahLengkap: '',
      namaIbuLengkap: '',
      pendapatan: '',
      kepemilikanRumah: '',
      luasRumah: '',
      jumlahLantai: '',
      jenisLantai: '',
      jenisDinding: '',
      jenisAtap: '',
      kepemilikanTanah: '',
      luasTanah: '',
      penerangan: '',
      sumberEnergiMasak: '',
      mck: '',
      sumberAir: '',
      bantuanSosial: '',
      bantuanExtra: '',
      bpjsKesehatan: '',
      bpjsKetenagakerjaan: '',
      kepemilikanAset: '',
      kondisiFisik: '',
    });
    setShowModal(true);
  };

  const openEditModal = (item: Penduduk) => {
    setEditingPenduduk(item);
    setCurrentStep(1);
    setFormData({
      nik: item.nik,
      namaLengkap: item.namaLengkap,
      tempatLahir: item.tempatLahir,
      tanggalLahir: item.tanggalLahir.split('T')[0],
      jenisKelamin: item.jenisKelamin,
      golDarah: item.golDarah || '',
      agama: item.agama || '',
      statusPerkawinan: item.statusPerkawinan,
      hubunganKeluarga: item.hubunganKeluarga || '',
      dusun: item.dusun || '',
      rt: item.rt || '',
      rw: item.rw || '',
      gubugId: item.gubugId || '',
      rwId: item.rwId || '',
      rtId: item.rtId || '',
      telepon: item.telepon || '',
      pendidikan: item.pendidikan || '',
      pekerjaan: item.pekerjaan || '',
      suku: item.suku || '',
      wargaNegara: item.wargaNegara || 'Indonesia',
      nikAyah: item.nikAyah || '',
      nikIbu: item.nikIbu || '',
      namaAyahLengkap: item.namaAyahLengkap || '',
      namaIbuLengkap: item.namaIbuLengkap || '',
      pendapatan: item.pendapatan || '',
      kepemilikanRumah: item.kepemilikanRumah || '',
      luasRumah: item.luasRumah || '',
      jumlahLantai: item.jumlahLantai || '',
      jenisLantai: item.jenisLantai || '',
      jenisDinding: item.jenisDinding || '',
      jenisAtap: item.jenisAtap || '',
      kepemilikanTanah: item.kepemilikanTanah || '',
      luasTanah: item.luasTanah || '',
      penerangan: item.penerangan || '',
      sumberEnergiMasak: item.sumberEnergiMasak || '',
      mck: item.mck || '',
      sumberAir: item.sumberAir || '',
      bantuanSosial: item.bantuanSosial || '',
      bantuanExtra: item.bantuanExtra || '',
      bpjsKesehatan: item.bpjsKesehatan || '',
      bpjsKetenagakerjaan: item.bpjsKetenagakerjaan || '',
      kepemilikanAset: item.kepemilikanAset || '',
      kondisiFisik: item.kondisiFisik || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);

    try {
      if (editingPenduduk) {
        await updateMutation.mutateAsync({ id: editingPenduduk.id, data: formData, token });
      } else {
        await createMutation.mutateAsync({ data: formData, token });
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
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const maskNik = (nik: string) => {
    if (nik.length === 16) {
      return `${nik.slice(0, 6)}xxxxxx${nik.slice(-4)}`;
    }
    return nik;
  };

  // ============================================
  // EXPORT DATA
  // ============================================
  const handleExport = async () => {
    window.location.href = '/admin/sistem/export';
  };

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Data Penduduk</h1>
            <p className={styles.subtitle}>
              {pagination?.total || 0} total penduduk
            </p>
          </div>
          <div className={styles.headerActions} style={{ gap: '8px', display: 'flex', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={handleExport}>
              📥 Ke Halaman Export
            </Button>
            <Button variant="primary" onClick={openCreateModal}>
              + Tambah Penduduk
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Cari NIK atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={jenisKelamin}
              onChange={(e) => setJenisKelamin(e.target.value)}
              style={{ width: 150 }}
            >
              <option value="">Semua Jenis Kelamin</option>
              <option value="L">Laki-Laki</option>
              <option value="P">Perempuan</option>
            </Select>
            <Select
              value={isAktif}
              onChange={(e) => setIsAktif(e.target.value)}
              style={{ width: 150 }}
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
            <Button type="submit">Cari</Button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data penduduk..." fullPage />
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
                    <th>NIK</th>
                    <th>Nama Lengkap</th>
                    <th>JK</th>
                    <th>Tempat, Tgl Lahir</th>
                    <th>Status Kawin</th>
                    <th>Alamat (Dusun/RT)</th>
                    <th>Keaktifan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {penduduk.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.empty}>
                        Tidak ada data penduduk
                      </td>
                    </tr>
                  ) : (
                    penduduk.map((item) => (
                      <tr key={item.id}>
                        <td className={styles.nik}>{maskNik(item.nik)}</td>
                        <td className={styles.nama}>{item.namaLengkap}</td>
                        <td>{item.jenisKelamin === 'L' ? 'L' : 'P'}</td>
                        <td>{item.tempatLahir}, {formatDate(item.tanggalLahir)}</td>
                        <td>{item.statusPerkawinan}</td>
                        <td>{item.dusun || '-'} RT {item.rt || '-'}</td>
                        <td>
                          <Badge color={item.isAktif ? 'success' : 'error'}>
                            {item.isAktif ? 'Aktif' : 'Nonaktif'}
                          </Badge>
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
                totalPages={pagination?.totalPages || 1}
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
                <h2>{editingPenduduk ? 'Edit Penduduk' : 'Tambah Penduduk'}</h2>
                <button onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.wizardSteps}>
                  <div className={`${styles.stepIndicator} ${currentStep >= 1 ? styles.active : ''}`}>1. Identitas</div>
                  <div className={`${styles.stepIndicator} ${currentStep >= 2 ? styles.active : ''}`}>2. Keluarga & Alamat</div>
                  <div className={`${styles.stepIndicator} ${currentStep >= 3 ? styles.active : ''}`}>3. Sosial Ekonomi</div>
                  <div className={`${styles.stepIndicator} ${currentStep >= 4 ? styles.active : ''}`}>4. Tambahan</div>
                </div>

                <div className={styles.wizardContent}>
                  {currentStep === 1 && (
                    <div className={styles.formGrid}>
                      <Input
                        label="NIK *"
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        required maxLength={16} disabled={!!editingPenduduk}
                      />
                      <Input
                        label="Nama Lengkap *"
                        value={formData.namaLengkap}
                        onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                        required
                      />
                      <Input
                        label="Tempat Lahir *"
                        value={formData.tempatLahir}
                        onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                        required
                      />
                      <Input
                        label="Tanggal Lahir *"
                        type="date"
                        value={formData.tanggalLahir}
                        onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                        required
                      />
                      <Select
                        label="Jenis Kelamin *"
                        value={formData.jenisKelamin}
                        onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                        required
                      >
                        <option value="L">Laki-Laki</option>
                        <option value="P">Perempuan</option>
                      </Select>
                      <Select
                        label="Golongan Darah"
                        value={formData.golDarah}
                        onChange={(e) => setFormData({ ...formData, golDarah: e.target.value })}
                      >
                        <option value="">Pilih</option>
                        {golDarahRefs?.map((item) => (
                          <option key={item.kode} value={item.nama}>{item.nama}</option>
                        ))}
                      </Select>
                      <Select
                        label="Agama"
                        value={formData.agama}
                        onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                      >
                        <option value="">Pilih</option>
                        {agamaRefs?.map((item) => (
                          <option key={item.kode} value={item.nama}>{item.nama}</option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className={styles.formGrid}>
                      <Select
                        label="Status Perkawinan *"
                        value={formData.statusPerkawinan}
                        onChange={(e) => setFormData({ ...formData, statusPerkawinan: e.target.value })}
                        required
                      >
                        <option value="">Pilih Status</option>
                        {statusKawinRefs?.map((item) => (
                          <option key={item.kode} value={item.nama}>{item.nama}</option>
                        ))}
                      </Select>
                      <Select
                        label="Hubungan Keluarga"
                        value={formData.hubunganKeluarga}
                        onChange={(e) => setFormData({ ...formData, hubunganKeluarga: e.target.value })}
                      >
                        <option value="">Pilih</option>
                        {hubunganKeluargaRefs?.map((item) => (
                          <option key={item.kode} value={item.nama}>{item.nama}</option>
                        ))}
                      </Select>
                      <Input
                        label="NIK Ayah"
                        value={formData.nikAyah}
                        onChange={(e) => setFormData({ ...formData, nikAyah: e.target.value })}
                        maxLength={16}
                      />
                      <Input
                        label="Nama Ayah Lengkap"
                        value={formData.namaAyahLengkap}
                        onChange={(e) => setFormData({ ...formData, namaAyahLengkap: e.target.value })}
                      />
                      <Input
                        label="NIK Ibu"
                        value={formData.nikIbu}
                        onChange={(e) => setFormData({ ...formData, nikIbu: e.target.value })}
                        maxLength={16}
                      />
                      <Input
                        label="Nama Ibu Lengkap"
                        value={formData.namaIbuLengkap}
                        onChange={(e) => setFormData({ ...formData, namaIbuLengkap: e.target.value })}
                      />
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
                      <Input
                        label="Telepon"
                        value={formData.telepon}
                        onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      />
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className={styles.formGrid}>
                      <Select
                        label="Pendidikan"
                        value={formData.pendidikan}
                        onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                      >
                        <option value="">Pilih Pendidikan</option>
                        {pendidikanRefs?.map((item) => (
                          <option key={item.kode} value={item.nama}>{item.nama}</option>
                        ))}
                      </Select>
                      <Select
                        label="Pekerjaan"
                        value={formData.pekerjaan}
                        onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                      >
                        <option value="">Pilih Pekerjaan</option>
                        {pekerjaanRefs?.map((item) => (
                          <option key={item.kode} value={item.nama}>{item.nama}</option>
                        ))}
                      </Select>
                      <Select
                        label="Suku"
                        value={formData.suku}
                        onChange={(e) => setFormData({ ...formData, suku: e.target.value })}
                      >
                        <option value="">Pilih Suku</option>
                        <option value="Jawa">Jawa</option>
                        <option value="Sunda">Sunda</option>
                        <option value="Madura">Madura</option>
                        <option value="Batak">Batak</option>
                        <option value="Minangkabau">Minangkabau</option>
                        <option value="Bugis">Bugis</option>
                        <option value="Betawi">Betawi</option>
                        <option value="Banten">Banten</option>
                        <option value="Banjar">Banjar</option>
                        <option value="Bali">Bali</option>
                        <option value="Sasak">Sasak</option>
                        <option value="Dayak">Dayak</option>
                        <option value="Melayu">Melayu</option>
                        <option value="Lainnya">Lainnya</option>
                      </Select>
                      <Input
                        label="Warga Negara"
                        value={formData.wargaNegara}
                        onChange={(e) => setFormData({ ...formData, wargaNegara: e.target.value })}
                      />
                      <Input
                        label="Pendapatan"
                        value={formData.pendapatan}
                        onChange={(e) => setFormData({ ...formData, pendapatan: e.target.value })}
                      />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className={styles.formGrid}>
                      <Select
                        label="Kepemilikan Rumah"
                        options={[{value: '', label: '-- Pilih Kepemilikan Rumah --'}, ...KEPEMILIKAN_RUMAH_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.kepemilikanRumah || ''}
                        onChange={(e) => setFormData({ ...formData, kepemilikanRumah: e.target.value })}
                      />
                      <Select
                        label="Luas Rumah"
                        options={[{value: '', label: '-- Pilih Luas Rumah --'}, ...LUAS_RUMAH_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.luasRumah || ''}
                        onChange={(e) => setFormData({ ...formData, luasRumah: e.target.value })}
                      />
                      <Select
                        label="Jumlah Lantai"
                        options={[{value: '', label: '-- Pilih Jumlah Lantai --'}, ...JUMLAH_LANTAI_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.jumlahLantai || ''}
                        onChange={(e) => setFormData({ ...formData, jumlahLantai: e.target.value })}
                      />
                      <Select
                        label="Jenis Lantai"
                        options={[{value: '', label: '-- Pilih Jenis Lantai --'}, ...JENIS_LANTAI_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.jenisLantai || ''}
                        onChange={(e) => setFormData({ ...formData, jenisLantai: e.target.value })}
                      />
                      <Select
                        label="Jenis Dinding"
                        options={[{value: '', label: '-- Pilih Jenis Dinding --'}, ...JENIS_DINDING_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.jenisDinding || ''}
                        onChange={(e) => setFormData({ ...formData, jenisDinding: e.target.value })}
                      />
                      <Select
                        label="Jenis Atap"
                        options={[{value: '', label: '-- Pilih Jenis Atap --'}, ...JENIS_ATAP_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.jenisAtap || ''}
                        onChange={(e) => setFormData({ ...formData, jenisAtap: e.target.value })}
                      />
                      <Select
                        label="Sumber Air"
                        options={[{value: '', label: '-- Pilih Sumber Air --'}, ...SUMBER_AIR_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.sumberAir || ''}
                        onChange={(e) => setFormData({ ...formData, sumberAir: e.target.value })}
                      />
                      <Select
                        label="BPJS Kesehatan"
                        options={[{value: '', label: '-- Pilih BPJS Kesehatan --'}, ...BPJS_KESEHATAN_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.bpjsKesehatan || ''}
                        onChange={(e) => setFormData({ ...formData, bpjsKesehatan: e.target.value })}
                      />
                      <Select
                        label="Bantuan Sosial"
                        options={[{value: '', label: '-- Pilih Bantuan Sosial --'}, ...BANTUAN_SOSIAL_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.bantuanSosial || ''}
                        onChange={(e) => setFormData({ ...formData, bantuanSosial: e.target.value })}
                      />
                      <Select
                        label="Kondisi Fisik"
                        options={[{value: '', label: '-- Pilih Kondisi Fisik --'}, ...KONDISI_FISIK_OPTIONS.map(o => ({ value: o, label: o }))]}
                        value={formData.kondisiFisik || ''}
                        onChange={(e) => setFormData({ ...formData, kondisiFisik: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.formActions}>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {currentStep > 1 && (
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                        Sebelumnya
                      </Button>
                    )}
                    {currentStep < 4 && (
                      <Button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentStep(prev => prev + 1);
                        }}
                      >
                        Selanjutnya
                      </Button>
                    )}
                    {currentStep === 4 && (
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
