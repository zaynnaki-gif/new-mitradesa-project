import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { WilayahSelector } from '@/components/WilayahSelector';
import { Provinsi, Kabupaten, Kecamatan, Desa } from '@/types';
import styles from './IdentitasDesaPage.module.css';

interface IdentitasFormData {
  desaId: number;
  namaDesa: string;
  singkatanDesa: string;
  kodeDesa: string;
  alamat: string;
  telepon: string;
  whatsapp: string;
  email: string;
  website: string;
  kepalaDesa: string;
  sekretarisDesa: string;
}

interface IdentitasDesa {
  id: number;
  desaId?: number;
  namaDesa: string;
  singkatanDesa?: string;
  kodeDesa?: string;
  alamat?: string;
  telepon?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logoDesaUrl?: string;
  kepalaDesa?: string;
  sekretarisDesa?: string;
  desa?: {
    id: number;
    kode: string;
    nama: string;
    kecamatan?: {
      id: number;
      nama: string;
      kode: string;
      kabupaten?: {
        id: number;
        nama: string;
        kode: string;
        provinsi?: {
          id: number;
          nama: string;
          kode: string;
        };
      };
    };
  };
}

export default function IdentitasDesaPage() {
  const { token } = useAuthStore();

  const [identitas, setIdentitas] = useState<IdentitasDesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<IdentitasFormData>({
    desaId: 0,
    namaDesa: '',
    singkatanDesa: '',
    kodeDesa: '',
    alamat: '',
    telepon: '',
    whatsapp: '',
    email: '',
    website: '',
    kepalaDesa: '',
    sekretarisDesa: '',
  });

  const [originalForm, setOriginalForm] = useState<IdentitasFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof IdentitasFormData, string>>>({});

  // Wilayah cascade selection state
  const [wilayahError, setWilayahError] = useState<string | undefined>();
  const [wilayahInitialValues, setWilayahInitialValues] = useState<{
    provinsiId?: number;
    kabupatenId?: number;
    kecamatanId?: number;
    desaId?: number;
  }>({});

  const fetchIdentitas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/identitas-desa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIdentitas(data.data);
      } else {
        throw new Error(data.error?.message || 'Gagal memuat data');
      }
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchIdentitas(); }, [fetchIdentitas]);

  // Populate form when data loads
  useEffect(() => {
    if (identitas) {
      // Extract wilayah hierarchy from identitas data
      const desa = identitas.desa;
      const kecamatan = desa?.kecamatan;
      const kabupaten = kecamatan?.kabupaten;
      const provinsi = kabupaten?.provinsi;

      const newForm: IdentitasFormData = {
        desaId: identitas.desaId || identitas.desa?.id || 0,
        namaDesa: identitas.namaDesa || '',
        singkatanDesa: identitas.singkatanDesa || '',
        kodeDesa: identitas.kodeDesa || '',
        alamat: identitas.alamat || '',
        telepon: identitas.telepon || '',
        whatsapp: identitas.whatsapp || '',
        email: identitas.email || '',
        website: identitas.website || '',
        kepalaDesa: identitas.kepalaDesa || '',
        sekretarisDesa: identitas.sekretarisDesa || '',
      };
      setForm(newForm);
      setOriginalForm(newForm);

      // Set initial values for wilayah cascade
      if (provinsi && kabupaten && kecamatan && desa) {
        setWilayahInitialValues({
          provinsiId: provinsi.id,
          kabupatenId: kabupaten.id,
          kecamatanId: kecamatan.id,
          desaId: desa.id,
        });
      }
    }
  }, [identitas]);

  const hasUnsavedChanges = originalForm && JSON.stringify(form) !== JSON.stringify(originalForm);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveSuccess]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof IdentitasFormData, string>> = {};

    if (!form.desaId) {
      newErrors.desaId = 'Wilayah desa wajib dipilih';
    }

    if (!form.namaDesa.trim()) {
      newErrors.namaDesa = 'Nama desa wajib diisi';
    } else if (form.namaDesa.length > 100) {
      newErrors.namaDesa = 'Nama desa maksimal 100 karakter';
    }

    if (form.singkatanDesa && form.singkatanDesa.length > 20) {
      newErrors.singkatanDesa = 'Singkatan maksimal 20 karakter';
    }

    if (form.kodeDesa && !/^\d+$/.test(form.kodeDesa)) {
      newErrors.kodeDesa = 'Kode desa harus berupa angka';
    } else if (form.kodeDesa && form.kodeDesa.length !== 10) {
      newErrors.kodeDesa = 'Kode desa harus 10 digit';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      newErrors.website = 'Website harus dimulai dengan http:// atau https://';
    }

    if (form.telepon && !/^[\d\s\-()+]+$/.test(form.telepon)) {
      newErrors.telepon = 'Format telepon tidak valid';
    }

    if (form.whatsapp && !/^[\d\s\-()+]+$/.test(form.whatsapp)) {
      newErrors.whatsapp = 'Format WhatsApp tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!confirm('Apakah Anda yakin ingin menyimpan perubahan identitas desa?')) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`${API_URL}/identitas-desa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setOriginalForm(form);
        setSaveSuccess(true);
        fetchIdentitas();
      } else {
        throw new Error(data.error?.message || 'Gagal menyimpan');
      }
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof IdentitasFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle wilayah selection change
  const handleWilayahChange = (desaId: number, fullData?: {
    provinsi: Provinsi;
    kabupaten: Kabupaten;
    kecamatan: Kecamatan;
    desa: Desa;
  }) => {
    setForm(prev => ({ ...prev, desaId }));
    setWilayahError(undefined);
    if (errors.desaId) {
      setErrors(prev => ({ ...prev, desaId: undefined }));
    }

    // Auto-fill namaDesa from API if empty and coming from API
    if (fullData?.desa && !form.namaDesa) {
      setForm(prev => ({ ...prev, namaDesa: fullData.desa.nama }));
    }
  };

  const handleReset = () => {
    if (originalForm && confirm('Apakah Anda yakin ingin membatalkan perubahan?')) {
      setForm(originalForm);
      setErrors({});
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingState message="Memuat identitas desa..." fullPage />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <ErrorState title="Gagal Memuat Data" message={error} onRetry={fetchIdentitas} />
      </AdminLayout>
    );
  }

  if (!identitas) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <Typography variant="body1" color="secondary">
            Identitas desa belum dikonfigurasi.
          </Typography>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Identitas Desa</h1>
            <p className={styles.subtitle}>Pengaturan informasi dasar desa</p>
          </div>
          {hasUnsavedChanges && (
            <span className={styles.unsavedBadge}>
              * Ada perubahan yang belum disimpan
            </span>
          )}
        </div>

        {/* Success */}
        {saveSuccess && (
          <div className={styles.successAlert}>
            ✓ Identitas desa berhasil disimpan!
          </div>
        )}

        {/* Error */}
        {saveError && (
          <div className={styles.errorAlert}>
            ✗ {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Logo Preview */}
          {identitas.logoDesaUrl && (
            <div className={styles.logoPreview}>
              <Typography variant="body2" color="secondary" style={{ marginBottom: '0.5rem' }}>
                Logo Desa
              </Typography>
              <img src={identitas.logoDesaUrl} alt="Logo Desa" />
            </div>
          )}

          {/* Section: Informasi Dasar */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informasi Dasar</h2>

            {/* Wilayah Selector - Cascading Dropdown */}
            <div className={styles.formGroup}>
              <WilayahSelector
                selectedDesaId={form.desaId || undefined}
                onChange={handleWilayahChange}
                error={errors.desaId || wilayahError}
                required
                initialValues={wilayahInitialValues}
              />
            </div>

            <div className={styles.sectionGrid}>
              <Input
                label="Nama Desa *"
                value={form.namaDesa}
                onChange={e => handleChange('namaDesa', e.target.value)}
                error={errors.namaDesa}
                required
                placeholder="Nama lengkap desa"
              />
              <Input
                label="Singkatan Desa"
                value={form.singkatanDesa}
                onChange={e => handleChange('singkatanDesa', e.target.value)}
                
                placeholder="Contoh: SRG"
              />
              <Input
                label="Kode Desa"
                value={form.kodeDesa}
                onChange={e => handleChange('kodeDesa', e.target.value)}
                
                placeholder="10 digit kode desa"
              />
            </div>
          </div>

          {/* Section: Alamat */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Alamat</h2>
            <div className={styles.formGroup}>
              <Input
                label="Alamat Lengkap"
                value={form.alamat}
                onChange={e => handleChange('alamat', e.target.value)}
                placeholder="Jl. Raya Desa No. 1, RT 001/RW 001"
              />
            </div>
          </div>

          {/* Section: Kontak */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informasi Kontak</h2>
            <div className={styles.sectionGrid3}>
              <Input
                label="Telepon"
                type="tel"
                value={form.telepon}
                onChange={e => handleChange('telepon', e.target.value)}
                
                placeholder="021-123456"
              />
              <Input
                label="WhatsApp"
                type="tel"
                value={form.whatsapp}
                onChange={e => handleChange('whatsapp', e.target.value)}
                
                placeholder="6281234567890"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                
                placeholder="desa@email.id"
              />
            </div>
            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
              <Input
                label="Website"
                type="url"
                value={form.website}
                onChange={e => handleChange('website', e.target.value)}
                
                placeholder="https://desa.desa.id"
              />
            </div>
          </div>

          {/* Section: Pejabat Desa */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pejabat Desa</h2>
            <div className={styles.sectionGrid}>
              <Input
                label="Nama Kepala Desa"
                value={form.kepalaDesa}
                onChange={e => handleChange('kepalaDesa', e.target.value)}
                placeholder="Nama lengkap kepala desa"
              />
              <Input
                label="Nama Sekretaris Desa"
                value={form.sekretarisDesa}
                onChange={e => handleChange('sekretarisDesa', e.target.value)}
                placeholder="Nama lengkap sekretaris desa"
              />
            </div>
            <Typography variant="body2" color="secondary" style={{ marginTop: '0.5rem' }}>
              Note: Untuk memperbarui data pejabat desa secara detail, gunakan menu{' '}
              <strong>Perangkat Desa</strong>.
            </Typography>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            {hasUnsavedChanges && (
              <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
                Batal
              </Button>
            )}
            <Button type="submit" disabled={saving || !hasUnsavedChanges}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
