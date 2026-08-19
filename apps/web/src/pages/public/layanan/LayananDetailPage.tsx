import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { DynamicForm } from '@/components/forms/DynamicForm';
import type { FieldDefinition } from '@/components/forms/DynamicForm';
import { API_URL } from '@/lib/constants';
import styles from './LayananPage.module.css';

interface ServiceDetail {
  id: string;
  kode: string;
  nama: string;
  slug: string;
  kategori?: string;
  deskripsi?: string;
  fields: FieldDefinition[];
}

type FormStep = 'nik-validation' | 'form' | 'review' | 'submitting' | 'success' | 'error';

export default function LayananDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: identitas } = useIdentitasDesa();
  const villageName = identitas?.namaDesa || 'Desa';

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<FormStep>('nik-validation');
  
  // NIK Validation state
  const [nikInput, setNikInput] = useState('');
  const [validatingNik, setValidatingNik] = useState(false);
  const [nikError, setNikError] = useState('');
  const [pendudukInfo, setPendudukInfo] = useState<{ nik: string; nama: string; desa: string } | null>(null);

  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [nomorPermintaan, setNomorPermintaan] = useState('');
  const [submitError, setSubmitError] = useState('');

  useSEO({
    title: getPageTitle(service ? `Ajukan ${service.nama}` : 'Layanan'),
    description: service?.deskripsi || `Ajukan layanan ${villageName}`,
  });

  useEffect(() => {
    if (slug) {
      fetchService(slug);
    }
  }, [slug]);

  const fetchService = async (slug: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/public/layanan/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Layanan tidak ditemukan');
        }
        throw new Error('Gagal memuat layanan');
      }
      const json = await res.json();
      setService(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateNik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nikInput.length !== 16 || !/^\d+$/.test(nikInput)) {
      setNikError('NIK harus terdiri dari 16 digit angka');
      return;
    }

    setValidatingNik(true);
    setNikError('');

    try {
      const res = await fetch(`${API_URL}/citizen/validate-nik`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: nikInput }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Validasi NIK gagal');
      }

      const data = await res.json();
      setPendudukInfo({
        nik: nikInput,
        nama: data.data.nama,
        desa: data.data.desa,
      });
      
      // Auto-fill NIK into form if field exists
      if (service?.fields.find(f => f.type === 'NIK')) {
        const nikField = service.fields.find(f => f.type === 'NIK');
        if (nikField) {
          setFormValues(prev => ({ ...prev, [nikField.key]: nikInput }));
        }
      }
      
      setStep('form');
    } catch (e: unknown) {
      setNikError(e instanceof Error ? e.message : 'Terjadi kesalahan saat validasi NIK');
    } finally {
      setValidatingNik(false);
    }
  };

  const getKategoriLabel = (kategori?: string) => {
    switch (kategori) {
      case 'SURAT': return 'Surat Keterangan';
      case 'PENGANTAR': return 'Surat Pengantar';
      case 'IZIN': return 'Izin';
      default: return kategori || 'Layanan';
    }
  };

  const handleSubmitForm = async () => {
    if (!service) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API_URL}/citizen/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layananId: service.id,
          fields: formValues,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal mengajukan permintaan');
      }

      const data = await res.json();
      setNomorPermintaan(data.data.nomorPermintaan);
      setStep('success');
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Terjadi kesalahan');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <section className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <Typography variant="h1" className={styles.pageTitle}>Memuat...</Typography>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (error || !service) {
    return (
      <PublicLayout>
        <section className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <Typography variant="h1" className={styles.pageTitle}>Layanan Tidak Ditemukan</Typography>
            <Typography variant="body1" className={styles.pageSubtitle}>{error}</Typography>
            <Link to="/layanan" className={styles.backLink}>← Kembali ke Daftar Layanan</Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <PublicLayout>
        <section className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <Typography variant="h1" className={styles.pageTitle}>✓ Permintaan Berhasil Diajukan</Typography>
            <Typography variant="body1" className={styles.pageSubtitle}>
              Permintaan layanan {service.nama} Anda telah diajukan.
            </Typography>
          </div>
        </section>
        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.successCard}>
              <div className={styles.successIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.5-9.28" />
                  <polyline points="22 4 12 11.08 15 15.08" />
                </svg>
              </div>

              <div className={styles.trackingBox}>
                <Typography variant="body2" color="secondary">Nomor Permintaan Anda</Typography>
                <Typography variant="h2" className={styles.trackingNumber}>{nomorPermintaan}</Typography>
              </div>

              <Typography variant="body1" color="secondary" className={styles.successText}>
                Simpan nomor permintaan ini untuk melacak status pengajuan Anda.
              </Typography>

              <div className={styles.successActions}>
                <Link to={`/permintaan/${encodeURIComponent(nomorPermintaan)}`} className={styles.primaryButton}>
                  Lacak Permintaan →
                </Link>
                <Link to="/layanan" className={styles.secondaryButton}>Kembali ke Daftar Layanan</Link>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Review step
  if (step === 'review') {
    return (
      <PublicLayout>
        <section className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <Typography variant="h1" className={styles.pageTitle}>Review Permintaan</Typography>
            <Typography variant="body1" className={styles.pageSubtitle}>Pastikan data yang Anda isi sudah benar</Typography>
          </div>
        </section>
        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.reviewCard}>
              <div className={styles.serviceInfo}>
                <Typography variant="h3">{service.nama}</Typography>
                <Typography variant="body2" color="secondary">{getKategoriLabel(service.kategori)}</Typography>
              </div>

              <div className={styles.reviewData}>
                {service.fields
                  .filter(f => formValues[f.key] !== undefined && formValues[f.key] !== '')
                  .map(field => (
                    <div key={field.key} className={styles.reviewItem}>
                      <Typography variant="body2" color="secondary">{field.label}</Typography>
                      <Typography variant="body1">
                        {Array.isArray(formValues[field.key])
                          ? (formValues[field.key] as string[]).join(', ')
                          : String(formValues[field.key] || '-')}
                      </Typography>
                    </div>
                  ))}
              </div>

              <div className={styles.reviewActions}>
                <button onClick={() => setStep('form')} className={styles.secondaryButton}>← Kembali</button>
                <button onClick={handleSubmitForm} disabled={submitting} className={styles.primaryButton}>
                  {submitting ? 'Mengirim...' : 'Ajukan Permintaan'}
                </button>
              </div>

              {submitError && (
                <div className={styles.errorMessage}>
                  <Typography variant="body2" color="error">{submitError}</Typography>
                </div>
              )}
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // NIK Validation Step
  if (step === 'nik-validation') {
    return (
      <PublicLayout>
        <section className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <Link to="/layanan" className={styles.backLink}>← Kembali ke Daftar Layanan</Link>
            <Typography variant="h1" className={styles.pageTitle}>{service.nama}</Typography>
            <Typography variant="body1" className={styles.pageSubtitle}>{service.deskripsi || getKategoriLabel(service.kategori)}</Typography>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.formCard}>
              <Typography variant="h3" style={{ marginBottom: '1rem' }}>Verifikasi Identitas</Typography>
              <Typography variant="body1" color="secondary" style={{ marginBottom: '2rem' }}>
                Silakan masukkan Nomor Induk Kependudukan (NIK) Anda yang terdaftar di sistem desa.
              </Typography>
              
              <form onSubmit={handleValidateNik} className={styles.nikForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="nik" className={styles.label}>Nomor Induk Kependudukan (NIK)</label>
                  <input
                    id="nik"
                    type="text"
                    value={nikInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setNikInput(val);
                      if (nikError) setNikError('');
                    }}
                    placeholder="Masukkan 16 digit NIK"
                    className={styles.input}
                    disabled={validatingNik}
                    required
                  />
                  {nikError && <Typography variant="caption" color="error" className={styles.errorText}>{nikError}</Typography>}
                </div>
                
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={validatingNik || nikInput.length !== 16}
                  >
                    {validatingNik ? 'Memverifikasi...' : 'Verifikasi NIK →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Form step
  return (
    <PublicLayout>
      <section className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <Link to="/layanan" className={styles.backLink}>← Kembali ke Daftar Layanan</Link>
          <Typography variant="h1" className={styles.pageTitle}>{service.nama}</Typography>
          <Typography variant="body1" className={styles.pageSubtitle}>{service.deskripsi || getKategoriLabel(service.kategori)}</Typography>
          <span className={styles.kategoriBadge}>{getKategoriLabel(service.kategori)}</span>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            {pendudukInfo && (
              <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-bg-muted)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                <Typography variant="body2" color="secondary" style={{ marginBottom: '0.5rem' }}>✓ Identitas Terverifikasi</Typography>
                <Typography variant="body1" style={{ fontWeight: 500 }}>{pendudukInfo.nama}</Typography>
                <Typography variant="body2" color="secondary">Desa {pendudukInfo.desa}</Typography>
              </div>
            )}
            
            {service.fields.length === 0 ? (
              <div className={styles.noFields}>
                <div className={styles.emptyIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ opacity: 0.5 }}>
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
                <Typography variant="h3" className={styles.emptyTitle}>Pengajuan Online Belum Tersedia</Typography>
                <Typography variant="body1" color="secondary">
                  Informasi layanan tersedia. Namun saat ini pengajuan online untuk layanan ini belum tersedia. Silakan hubungi kantor desa secara langsung.
                </Typography>
              </div>
            ) : (
              <>
                <DynamicForm
                  fields={service.fields}
                  initialValues={formValues}
                  onChange={values => setFormValues(values)}
                />
                <div className={styles.formActions}>
                  <button
                    onClick={() => setStep('review')}
                    className={styles.primaryButton}
                  >
                    Lanjut ke Review →
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.infoBox}>
            <Typography variant="h4" className={styles.infoTitle}>Informasi Penting</Typography>
            <ul className={styles.infoList}>
              <li>Isi formulir dengan data yang benar dan lengkap</li>
              <li>Setelah diajukan, permintaan tidak dapat dibatalkan</li>
              <li>Simpan nomor permintaan untuk melacak status</li>
              <li>Status akan diupdate setelah diverifikasi oleh operator</li>
            </ul>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
