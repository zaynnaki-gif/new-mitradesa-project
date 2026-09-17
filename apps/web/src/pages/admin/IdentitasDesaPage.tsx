/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { useIdentitasDesa, useUpdateIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { WilayahSelector } from '@/components/WilayahSelector';
import { Provinsi, Kabupaten, Kecamatan, Desa } from '@/types';
import styles from './IdentitasDesaPage.module.css';

interface IdentitasFormData {
  namaDesa: string;
  kodeDesa: string;
  alamat: string;
  telepon: string;
  whatsapp: string;
  email: string;
  website: string;
  kodepos: string;
  kepalaDesa: string;
  sekretarisDesa: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  logoDesaUrl: string;
}


export default function IdentitasDesaPage() {
  const { token } = useAuthStore();

  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<IdentitasFormData>({
    namaDesa: '',
    kodeDesa: '',
    alamat: '',
    kodepos: '',
    telepon: '',
    whatsapp: '',
    email: '',
    website: '',
    kepalaDesa: '',
    sekretarisDesa: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    logoDesaUrl: '',
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

  const { data: identitas, isLoading: loading, error: queryError, refetch } = useIdentitasDesa();
  const updateMutation = useUpdateIdentitasDesa();

  // Handle manual errors
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || 'Terjadi kesalahan');
    } else {
      setError(null);
    }
  }, [queryError]);

  // Populate form when data loads
  useEffect(() => {
    if (identitas) {
      const newForm: IdentitasFormData = {
        namaDesa: identitas.namaDesa || '',
        kodeDesa: identitas.kodeDesa || '',
        alamat: identitas.alamat || '',
        kodepos: identitas.kodepos || '',
        telepon: identitas.telepon || '',
        whatsapp: identitas.whatsapp || '',
        email: identitas.email || '',
        website: identitas.website || '',
        kepalaDesa: identitas.kepalaDesa || '',
        sekretarisDesa: identitas.sekretarisDesa || '',
        facebook: identitas.facebook || '',
        instagram: identitas.instagram || '',
        twitter: identitas.twitter || '',
        youtube: identitas.youtube || '',
        logoDesaUrl: identitas.logoDesaUrl || '',
      };
      setForm(newForm);
      setOriginalForm(newForm);
      
      // Set initial values for wilayah cascade (No longer populated from identitas)
      setWilayahInitialValues({});
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

    if (!form.namaDesa.trim()) {
      newErrors.namaDesa = 'Nama desa wajib diisi';
    } else if (form.namaDesa.length > 100) {
      newErrors.namaDesa = 'Nama desa maksimal 100 karakter';
    }



    if (form.kodeDesa && form.kodeDesa !== '') {
      const cleanKode = form.kodeDesa.replace(/\./g, '').trim();
      if (!/^\d+$/.test(cleanKode)) {
        newErrors.kodeDesa = 'Kode desa harus berupa angka atau kode bertitik (contoh: 5203082001 atau 52.03.08.2014)';
      }
    }

    if (form.email && form.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (form.website && form.website !== '' && !/^https?:\/\/.+/.test(form.website)) {
      newErrors.website = 'Website harus dimulai dengan http:// atau https://';
    }

    if (form.telepon && form.telepon !== '' && !/^[\d\s\-()+]+$/.test(form.telepon)) {
      newErrors.telepon = 'Format telepon tidak valid';
    }

    if (form.whatsapp && form.whatsapp !== '' && !/^[\d\s\-()+]+$/.test(form.whatsapp)) {
      newErrors.whatsapp = 'Format WhatsApp tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!confirm('Apakah Anda yakin ingin menyimpan perubahan identitas desa?')) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    updateMutation.mutate({
      data: {
        ...form,
        kepalaDesa: undefined,
        sekretarisDesa: undefined,
      },
      token: token!
    }, {
      onSuccess: () => {
        setOriginalForm(form);
        setSaveSuccess(true);
        setSaving(false);
      },
      onError: (err: Error) => {
        setSaveError(err.message || 'Gagal menyimpan');
        setSaving(false);
      }
    });
  };

  const handleChange = (field: keyof IdentitasFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kategori', 'LOGO');

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, logoDesaUrl: data.data.fileUrl }));
      } else {
        throw new Error(data.error?.message || 'Gagal mengupload logo');
      }
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle wilayah selection change
  const handleWilayahChange = (_: number, fullData?: {
    provinsi: Provinsi;
    kabupaten: Kabupaten;
    kecamatan: Kecamatan;
    desa: Desa;
  }) => {
    setWilayahError(undefined);

    // Auto-fill namaDesa and kodeDesa from API unconditionally
    if (fullData?.desa) {
      setForm(prev => ({ 
        ...prev, 
        namaDesa: fullData.desa.nama,
        kodeDesa: fullData.desa.kode || ''
      }));
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
        <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => refetch()} />
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

          {/* Logo Preview & Upload */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Logo Desa</h2>
            <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              {form.logoDesaUrl ? (
                <div className={styles.logoPreview}>
                  <img src={form.logoDesaUrl} alt="Logo Desa" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }} />
                </div>
              ) : (
                <div className={styles.logoPreview} style={{ width: '150px', height: '150px', backgroundColor: 'var(--surface-color-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="secondary">Belum ada logo</Typography>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()} disabled={saving}>
                  {saving ? 'Mengupload...' : 'Pilih Logo Baru'}
                </Button>
                <Typography variant="body2" color="secondary" style={{ fontSize: '0.75rem' }}>
                  Format: JPG, PNG, WEBP. Maks 2MB.
                </Typography>
              </div>
            </div>
          </div>

          {/* Section: Informasi Dasar */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informasi Dasar</h2>

            {/* Wilayah Selector - Cascading Dropdown */}
            <div className={styles.formGroup}>
              <WilayahSelector
                onChange={handleWilayahChange}
                error={wilayahError}
                initialValues={wilayahInitialValues}
              />
            </div>

            <div className={styles.sectionGrid}>
              <Input
                label="Nama Desa *"
                value={form.namaDesa}
                disabled
                onChange={e => handleChange('namaDesa', e.target.value)}
                error={errors.namaDesa}
                required
                readOnly
                placeholder="Otomatis dari pilihan wilayah"
                style={{ backgroundColor: 'var(--surface-color-dim)' }}
              />

              <Input
                label="Kode Desa"
                value={form.kodeDesa}
                disabled
                onChange={e => handleChange('kodeDesa', e.target.value)}
                readOnly
                placeholder="Otomatis dari pilihan wilayah"
                style={{ backgroundColor: 'var(--surface-color-dim)' }}
              />
            </div>
          </div>

          {/* Section: Alamat */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Lokasi & Koordinat</h2>
            <div className={styles.formGroup}>
              <Input
                label="Alamat Lengkap"
                value={form.alamat}
                onChange={e => handleChange('alamat', e.target.value)}
                placeholder="Jl. Raya Desa No. 1, RT 001/RW 001"
              />
            </div>
            <div className={styles.sectionGrid}>
              <Input
                label="Kode Pos"
                value={form.kodepos}
                onChange={e => handleChange('kodepos', e.target.value)}
                placeholder="Contoh: 12345"
              />
            </div>
          </div>

          {/* Section: Kontak */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informasi Kontak & Media Sosial</h2>
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
                label="Website URL"
                type="url"
                value={form.website}
                onChange={e => handleChange('website', e.target.value)}
                placeholder="https://desa.desa.id"
              />
            </div>
            
            <h3 className={styles.sectionTitle} style={{ marginTop: '2rem', fontSize: '1rem' }}>Media Sosial</h3>
            <div className={styles.sectionGrid}>
              <Input
                label="Facebook (URL)"
                type="url"
                value={form.facebook}
                onChange={e => handleChange('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
              />
              <Input
                label="Instagram (URL)"
                type="url"
                value={form.instagram}
                onChange={e => handleChange('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
              />
              <Input
                label="Twitter / X (URL)"
                type="url"
                value={form.twitter}
                onChange={e => handleChange('twitter', e.target.value)}
                placeholder="https://x.com/..."
              />
              <Input
                label="YouTube Channel (URL)"
                type="url"
                value={form.youtube}
                onChange={e => handleChange('youtube', e.target.value)}
                placeholder="https://youtube.com/..."
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
                placeholder="Otomatis dari data Perangkat Desa"
                disabled
                readOnly
                style={{ backgroundColor: 'var(--surface-color-dim)' }}
              />
              <Input
                label="Nama Sekretaris Desa"
                value={form.sekretarisDesa}
                onChange={e => handleChange('sekretarisDesa', e.target.value)}
                placeholder="Otomatis dari data Perangkat Desa"
                disabled
                readOnly
                style={{ backgroundColor: 'var(--surface-color-dim)' }}
              />
            </div>
            <Typography variant="body2" color="secondary" style={{ marginTop: '0.5rem' }}>
              Note: Nama Kepala Desa dan Sekretaris Desa akan ditarik secara otomatis dari menu{' '}
              <strong>Pemerintahan {'>'} Perangkat Desa</strong>.
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

