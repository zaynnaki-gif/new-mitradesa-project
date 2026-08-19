import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { API_URL } from '@/lib/constants';
import styles from './TrackingPage.module.css';

interface RequestData {
  nomorPermintaan: string;
  status: string;
  layanan: {
    nama: string;
    kode: string;
  };
  createdAt: string;
  submittedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;
  catatan: string | null;
  dokumen?: Array<{
    id: string;
    nomorDokumen: string;
    status: string;
    verificationToken: string | null;
  }>;
}

const STATUS_STEPS = [
  { key: 'SUBMITTED', label: 'Diajukan', icon: '📤' },
  { key: 'VERIFICATION', label: 'Verifikasi', icon: '🔍' },
  { key: 'PROCESSING', label: 'Diproses', icon: '⚙️' },
  { key: 'APPROVED', label: 'Disetujui', icon: '✅' },
  { key: 'COMPLETED', label: 'Selesai', icon: '📄' },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  VERIFICATION: 'Verifikasi',
  PROCESSING: 'Diproses',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nomor = searchParams.get('nomor');
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(!!nomor);
  const [error, setError] = useState('');

  useSEO({
    title: getPageTitle(nomor ? `Lacak Permintaan ${nomor}` : 'Lacak Permintaan'),
    description: nomor ? `Lacak status permintaan layanan ${nomor}` : 'Lacak status permintaan layanan Anda',
  });

  useEffect(() => {
    if (nomor) {
      fetchTracking(nomor);
    } else {
      setRequest(null);
      setLoading(false);
      setError('');
    }
  }, [nomor]);

  const fetchTracking = async (nomor: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/citizen/request/${encodeURIComponent(nomor)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Permintaan tidak ditemukan');
        }
        throw new Error('Gagal memuat data');
      }
      const json = await res.json();
      setRequest(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrentStepIndex = (status: string) => {
    if (status === 'REJECTED' || status === 'CANCELLED') {
      return -1;
    }
    const index = STATUS_STEPS.findIndex((s) => s.key === status);
    return index >= 0 ? index : 0;
  };

  if (loading) {
    return (
      <PublicLayout>
        <section className={styles.header}>
          <div className={styles.headerContent}>
            <Typography variant="h1" className={styles.title}>
              Memuat...
            </Typography>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (!nomor || error || !request) {
    return (
      <PublicLayout>
        <section className={styles.header}>
          <div className={styles.headerContent}>
            <Typography variant="h1" className={styles.title}>
              Lacak Permintaan
            </Typography>
            {error && (
              <Typography variant="body1" color="secondary" className={styles.subtitle}>
                {error}
              </Typography>
            )}
          </div>
        </section>

        {/* Quick Search */}
        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.searchCard}>
              <Typography variant="h3" className={styles.searchTitle}>
                Masukkan Nomor Permintaan
              </Typography>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem('nomor') as HTMLInputElement;
                  if (input.value.trim()) {
                    navigate(`/layanan/tracking?nomor=${encodeURIComponent(input.value.trim())}`);
                  }
                }}
                className={styles.searchForm}
              >
                <input
                  type="text"
                  name="nomor"
                  placeholder="Masukkan nomor permintaan..."
                  className={styles.searchInput}
                  defaultValue={nomor || ''}
                />
                <button type="submit" className={styles.searchButton}>
                  Lacak
                </button>
              </form>
            </div>
            
            {error && (
              <div className={styles.actions} style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link to="/layanan" className={styles.primaryButton}>
                  Kembali ke Daftar Layanan
                </Link>
              </div>
            )}
          </div>
        </section>
      </PublicLayout>
    );
  }

  const currentStepIndex = getCurrentStepIndex(request.status);
  const isRejected = request.status === 'REJECTED' || request.status === 'CANCELLED';

  return (
    <PublicLayout>
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <Typography variant="h1" className={styles.title}>
            Lacak Permintaan
          </Typography>
          <Typography variant="body1" color="secondary" className={styles.subtitle}>
            Pantau status permintaan layanan Anda
          </Typography>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          {/* Status Card */}
          <div className={styles.statusCard}>
            <div className={styles.requestNumber}>
              <Typography variant="body2" color="secondary">
                Nomor Permintaan
              </Typography>
              <Typography variant="h2" className={styles.number}>
                {request.nomorPermintaan}
              </Typography>
            </div>

            <div className={styles.serviceInfo}>
              <Typography variant="h3">{request.layanan.nama}</Typography>
              <span className={styles.statusBadge}>
                {STATUS_LABELS[request.status] || request.status}
              </span>
            </div>

            {/* Timeline */}
            <div className={styles.timeline}>
              {isRejected ? (
                <div className={styles.rejected}>
                  <div className={styles.rejectedIcon}>✕</div>
                  <Typography variant="body1" className={styles.rejectedText}>
                    {request.status === 'REJECTED'
                      ? 'Permintaan ditolak'
                      : 'Permintaan dibatalkan'}
                  </Typography>
                  {request.catatan && (
                    <Typography variant="body2" color="secondary">
                      Alasan: {request.catatan}
                    </Typography>
                  )}
                </div>
              ) : (
                <div className={styles.steps}>
                  {STATUS_STEPS.map((step, index) => (
                    <div
                      key={step.key}
                      className={`${styles.step} ${
                        index <= currentStepIndex ? styles.stepActive : ''
                      } ${index < currentStepIndex ? styles.stepCompleted : ''}`}
                    >
                      <div className={styles.stepIcon}>{step.icon}</div>
                      <div className={styles.stepLabel}>{step.label}</div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div
                          className={`${styles.stepLine} ${
                            index < currentStepIndex ? styles.stepLineActive : ''
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className={styles.dates}>
              <div className={styles.dateItem}>
                <Typography variant="body2" color="secondary">
                  Tanggal Pengajuan
                </Typography>
                <Typography variant="body1">
                  {formatDate(request.submittedAt || request.createdAt)}
                </Typography>
              </div>
              {request.processedAt && (
                <div className={styles.dateItem}>
                  <Typography variant="body2" color="secondary">
                    Tanggal Proses
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(request.processedAt)}
                  </Typography>
                </div>
              )}
              {request.completedAt && (
                <div className={styles.dateItem}>
                  <Typography variant="body2" color="secondary">
                    Tanggal Selesai
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(request.completedAt)}
                  </Typography>
                </div>
              )}
            </div>

            {/* Documents */}
            {request.dokumen && request.dokumen.length > 0 && (
              <div className={styles.documents}>
                <Typography variant="h4" className={styles.documentsTitle}>
                  Dokumen
                </Typography>
                {request.dokumen.map((doc) => (
                  <div key={doc.id} className={styles.documentItem}>
                    <div className={styles.documentInfo}>
                      <Typography variant="body1" className={styles.documentNumber}>
                        {doc.nomorDokumen}
                      </Typography>
                      <Typography variant="body2" color="secondary">
                        {doc.status === 'SIGNED' ? 'Ditandatangani' : 'Sedang diproses'}
                      </Typography>
                    </div>
                    <div className={styles.documentActions}>
                      {doc.verificationToken && (
                        <a
                          href={`/verifikasi/${doc.verificationToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.verifyLink}
                        >
                          Verifikasi →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Link to="/layanan" className={styles.secondaryButton}>
              Ajukan Layanan Lain →
            </Link>
          </div>

          {/* Help */}
          <div className={styles.helpCard}>
            <Typography variant="h4" className={styles.helpTitle}>
              Butuh Bantuan?
            </Typography>
            <Typography variant="body2" color="secondary">
              Jika Anda memiliki pertanyaan tentang status permintaan ini, silakan hubungi kantor desa.
            </Typography>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
