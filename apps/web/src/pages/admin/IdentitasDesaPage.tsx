import { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Button } from '../../components/ui';
import { LoadingState, ErrorState } from '../../components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';

interface IdentitasFormData {
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

export default function IdentitasDesaPage() {
  const { data: identitas, isLoading, error, refetch, isError } = useIdentitasDesa();

  const [form, setForm] = useState<IdentitasFormData>({
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

  // Populate form when data loads
  useEffect(() => {
    if (identitas) {
      const newForm = {
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
    }
  }, [identitas]);

  // Track unsaved changes
  const hasUnsavedChanges = originalForm && JSON.stringify(form) !== JSON.stringify(originalForm);

  // Clear success message after delay
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveSuccess]);

  // Warn on unsaved changes
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

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof IdentitasFormData, string>> = {};

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

    if (!validateForm()) {
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menyimpan perubahan identitas desa?')) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/identitas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Gagal menyimpan');
      }

      setOriginalForm(form);
      setSaveSuccess(true);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof IdentitasFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleReset = () => {
    if (originalForm) {
      if (window.confirm('Apakah Anda yakin ingin membatalkan perubahan?')) {
        setForm(originalForm);
        setErrors({});
      }
    }
  };

  const renderField = (field: keyof IdentitasFormData, label: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: errors[field] ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
        }}
      />
      {errors[field] && (
        <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
          {errors[field]}
        </span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <div style={{ padding: '2rem' }}>
          <LoadingState message="Memuat identitas desa..." fullPage />
        </div>
      </Container>
    );
  }

  if (isError || error) {
    return (
      <Container maxWidth="md">
        <div style={{ padding: '2rem' }}>
          <ErrorState
            title="Gagal Memuat Data"
            message="Tidak dapat memuat identitas desa. Silakan coba lagi."
            onRetry={() => refetch()}
            fullPage
          />
        </div>
      </Container>
    );
  }

  if (!identitas) {
    return (
      <Container maxWidth="md">
        <div style={{ padding: '2rem' }}>
          <Typography variant="body1" color="secondary">
            Identitas desa belum dikonfigurasi.
          </Typography>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Typography variant="h2">Identitas Desa</Typography>
        {hasUnsavedChanges && (
          <span style={{ color: 'var(--color-warning)', fontSize: '0.875rem' }}>
            * Ada perubahan yang belum disimpan
          </span>
        )}
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-success-bg, #d4edda)',
          color: 'var(--color-success, #155724)',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-success, #155724)'
        }}>
          ✓ Identitas desa berhasil disimpan!
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-error-bg, #f8d7da)',
          color: 'var(--color-error, #721c24)',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-error, #721c24)'
        }}>
          ✗ {saveError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Logo Preview */}
        {identitas.logoDesaUrl && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--color-bg-muted, #f5f5f5)',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="secondary" style={{ marginBottom: '0.5rem' }}>
              Logo Desa
            </Typography>
            <img
              src={identitas.logoDesaUrl}
              alt="Logo Desa"
              style={{ maxHeight: '80px', maxWidth: '100%' }}
            />
          </div>
        )}

        {/* Informasi Dasar */}
        <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <Typography variant="h4" style={{ marginBottom: '1rem' }}>Informasi Dasar</Typography>
          {renderField('namaDesa', 'Nama Desa *', 'text', 'Nama desa')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {renderField('singkatanDesa', 'Singkatan Desa', 'text', 'Contoh: SRM')}
            {renderField('kodeDesa', 'Kode Desa', 'text', '10 digit kode desa')}
          </div>
        </div>

        {/* Alamat */}
        <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <Typography variant="h4" style={{ marginBottom: '1rem' }}>Alamat</Typography>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Alamat Lengkap
            </label>
            <textarea
              value={form.alamat}
              onChange={(e) => handleChange('alamat', e.target.value)}
              placeholder="Jl. Raya Desa No. 1, RT 001/RW 001"
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Kontak */}
        <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <Typography variant="h4" style={{ marginBottom: '1rem' }}>Informasi Kontak</Typography>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {renderField('telepon', 'Telepon', 'tel', '021-123456')}
            {renderField('whatsapp', 'WhatsApp', 'tel', '6281234567890')}
          </div>
          {renderField('email', 'Email', 'email', 'desa@email.id')}
          {renderField('website', 'Website', 'url', 'https://desa.desa.id')}
        </div>

        {/* Pemerintahan */}
        <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <Typography variant="h4" style={{ marginBottom: '1rem' }}>Pejabat Desa</Typography>
          {renderField('kepalaDesa', 'Nama Kepala Desa', 'text', 'Nama lengkap kepala desa')}
          {renderField('sekretarisDesa', 'Nama Sekretaris Desa', 'text', 'Nama lengkap sekretaris desa')}
          <Typography variant="body2" color="secondary" style={{ marginTop: '0.5rem' }}>
            Note: Untuk memperbarui data pejabat desa secara detail, gunakan menu Perangkat Desa.
          </Typography>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
    </Container>
  );
}
