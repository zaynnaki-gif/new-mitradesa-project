import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './VerifyPage.module.css';

interface VerificationResult {
  nomorDokumen: string;
  judul: string;
  status: string;
  generatedAt: string;
  signedAt?: string;
  tujuan?: string;
  fileUrl?: string;
  signature?: { penandatangan: string; jabatan: string };
}

type StatusColor = 'green' | 'yellow' | 'gray' | 'red';

const statusConfig: Record<string, { color: StatusColor; icon: string; label: string; description: string }> = {
  GENERATED: { color: 'yellow', icon: '⏳', label: 'Belum Ditandatangani', description: 'Dokumen ini belum ditandatangani' },
  PENDING_SIGNATURE: { color: 'yellow', icon: '⏳', label: 'Menunggu Tanda Tangan', description: 'Dokumen sedang menunggu penandatanganan' },
  SIGNED: { color: 'green', icon: '✓', label: 'Ditandatangani', description: 'Dokumen ini telah ditandatangani secara resmi' },
  VERIFIED: { color: 'green', icon: '✓', label: 'Terverifikasi', description: 'Dokumen ini terverifikasi' },
  ARCHIVED: { color: 'gray', icon: '📁', label: 'Diarsipkan', description: 'Dokumen ini telah diarsipkan' },
  REVOKED: { color: 'red', icon: '❌', label: 'Dicabut (Revoked)', description: 'Dokumen ini telah dicabut atau tidak berlaku lagi' },
};

const colorClassMap: Record<StatusColor, string> = {
  green: styles.verificationCardGreen,
  yellow: styles.verificationCardYellow,
  gray: styles.verificationCardGray,
  red: styles.verificationCardRed,
};

export default function VerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token verifikasi tidak valid');
      setLoading(false);
      return;
    }

    const fetchVerify = async () => {
      try {
        const res = await fetch(`/api/public/verify/${token}`);
        if (!res.ok) {
          setError('Dokumen tidak ditemukan atau sudah tidak valid');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setResult(data.data);
      } catch {
        setError('Gagal memverifikasi dokumen');
      } finally {
        setLoading(false);
      }
    };
    fetchVerify();
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingIcon}>⏳</div>
          <p className={styles.loadingText}>Memverifikasi dokumen...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>❌</div>
          <h1 className={styles.errorTitle}>Dokumen Tidak Ditemukan</h1>
          <p className={styles.errorMessage}>
            {error || 'Token verifikasi tidak valid atau sudah kadaluarsa'}
          </p>
          <Link to="/" className={styles.backLink}>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[result.status] || {
    color: 'gray' as StatusColor,
    icon: '❓',
    label: result.status,
    description: 'Status tidak dikenal',
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.logo}>Sistem Desa</h1>
          <p className={styles.tagline}>Sistem Informasi Desa</p>
        </div>

        {/* Verification Card */}
        <div className={`${styles.verificationCard} ${colorClassMap[config.color]}`}>
          <div className={styles.statusIcon}>{config.icon}</div>
          <h2 className={styles.statusTitle}>Dokumen {config.label}</h2>
          <p className={styles.statusDescription}>{config.description}</p>
        </div>

        {/* Document Info */}
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Nomor Dokumen</span>
            <span className={`${styles.infoValue} ${styles.infoValueMono}`}>
              {result.nomorDokumen}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Judul Dokumen</span>
            <span className={styles.infoValue}>{result.judul}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tanggal Pembuatan</span>
            <span className={styles.infoValue}>{formatDate(result.generatedAt)}</span>
          </div>
          {result.tujuan && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tujuan</span>
              <span className={styles.infoValue}>{result.tujuan}</span>
            </div>
          )}
          {result.signature && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Ditandatangani Oleh</span>
              <span className={styles.infoValue}>
                {result.signature.penandatangan}
                {result.signature.jabatan && ` - ${result.signature.jabatan}`}
              </span>
            </div>
          )}
          {result.signedAt && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Waktu TTD</span>
              <span className={styles.infoValue}>{formatDate(result.signedAt)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className={styles.footer}>
          Dokumen ini dihasilkan oleh sistem administrasi desa
        </p>
      </div>
    </div>
  );
}
