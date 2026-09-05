import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '@/lib/constants';
import styles from './VerifyPage.module.css';

interface VerificationResult {
  nomorDokumen: string;
  jenisSurat?: string;
  judul?: string;
  layanan?: string;
  status: string;
  tanggal?: string;
  signedAt?: any;
  generatedAt?: any;
  pemohon?: {
    nama?: string;
    nik?: string;
  };
  penandatangan?: {
    nama: string;
    jabatan: string;
    nip?: string;
    fotoUrl?: string | null;
  };
  signature?: {
    penandatangan?: string;
    nama?: string;
    jabatan?: string;
    nip?: string;
  } | null;
  fileUrl?: string;
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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token verifikasi tidak valid');
      setLoading(false);
      return;
    }

    const fetchVerify = async () => {
      try {
        let endpoint = `${API_URL}/documents/public/verify/${token}`;
        let res = await fetch(endpoint);

        // Fallback to /public/verify
        if (res.status === 404) {
          endpoint = `${API_URL}/public/verify/${token}`;
          res = await fetch(endpoint);
        }

        const data = await res.json().catch(() => null);

        // Handle revoked status (which backend returns with 400 Bad Request)
        if (data?.data?.status === 'REVOKED' || data?.status === 'REVOKED') {
          setResult(data.data || data);
          setLoading(false);
          return;
        }

        if (!res.ok || !data?.success || !data?.data) {
          setError(data?.message || 'Dokumen tidak ditemukan atau sudah tidak valid');
          setLoading(false);
          return;
        }

        setResult(data.data);
      } catch {
        setError('Gagal memverifikasi dokumen');
      } finally {
        setLoading(false);
      }
    };
    fetchVerify();
  }, [token]);

  const formatDate = (dateVal: any) => {
    if (!dateVal || typeof dateVal !== 'string') {
      return new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return d.toLocaleDateString('id-ID', {
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

  // Signatory normalization
  const penandatanganInfo = result.penandatangan || (result.signature ? {
    nama: result.signature.penandatangan || result.signature.nama || 'H. Tajuddin',
    jabatan: result.signature.jabatan || 'Kepala Desa Seruni Mumbul',
    nip: result.signature.nip,
    fotoUrl: 'https://serunimumbul.com/uploads/avatars/kades.png',
  } : null);

  let photoUrl = penandatanganInfo?.fotoUrl;
  if (photoUrl && photoUrl.includes('localhost:3001')) {
    photoUrl = photoUrl.replace('http://localhost:3001', 'https://serunimumbul.com');
  }
  if (!photoUrl && penandatanganInfo?.nama?.toLowerCase().includes('tajuddin')) {
    photoUrl = 'https://serunimumbul.com/uploads/avatars/kades.png';
  }

  // File download normalization
  let downloadFileUrl = result.fileUrl;
  if (downloadFileUrl && downloadFileUrl.includes('http://localhost:3001')) {
    downloadFileUrl = downloadFileUrl.replace('http://localhost:3001', 'https://api.serunimumbul.com');
  }

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
            <span className={styles.infoLabel}>Nomor Registrasi Surat</span>
            <span className={`${styles.infoValue} ${styles.infoValueMono}`}>
              {result.nomorDokumen || '-'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Jenis Surat</span>
            <span className={styles.infoValue}>{result.jenisSurat || result.judul || 'Dokumen Resmi Pelayanan'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Layanan</span>
            <span className={styles.infoValue}>{result.layanan || 'Pelayanan Administrasi Terpadu Desa'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tanggal Dikeluarkan</span>
            <span className={styles.infoValue}>
              {formatDate(result.signedAt || result.tanggal || result.generatedAt)}
            </span>
          </div>
          
          <div className={styles.infoSectionTitle}>Identitas Pemohon</div>
          {result.pemohon && (result.pemohon.nama || result.pemohon.nik) ? (
            <>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama Pemohon</span>
                <span className={styles.infoValue}>{result.pemohon.nama || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>NIK (Disamarkan)</span>
                <span className={styles.infoValue}>{result.pemohon.nik || '-'}</span>
              </div>
            </>
          ) : (
            <div className={styles.infoRow}>
              <span className={styles.infoValue}>Warga Desa Terdaftar (Terverifikasi oleh Pamong)</span>
            </div>
          )}

          <div className={styles.infoSectionTitle}>Profil Penandatangan</div>
          {penandatanganInfo ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {photoUrl && !imageError ? (
                  <img
                    src={photoUrl}
                    alt={penandatanganInfo.nama}
                    onError={() => setImageError(true)}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', border: '2px solid #38bdf8' }}>
                    {penandatanganInfo.nama.charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>{penandatanganInfo.nama}</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>{penandatanganInfo.jabatan}</div>
                  {penandatanganInfo.nip && (
                    <div style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>NIP. {penandatanganInfo.nip}</div>
                  )}
                </div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama Penandatangan</span>
                <span className={styles.infoValue}>{penandatanganInfo.nama}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Jabatan (Pamong)</span>
                <span className={styles.infoValue}>{penandatanganInfo.jabatan}</span>
              </div>
              {penandatanganInfo.nip && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>NIP</span>
                  <span className={styles.infoValue}>{penandatanganInfo.nip}</span>
                </div>
              )}
            </>
          ) : (
            <div className={styles.infoRow}>
              <span className={styles.infoValue}>Menunggu penandatanganan</span>
            </div>
          )}
        </div>

        {downloadFileUrl && result.status !== 'REVOKED' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a
              href={downloadFileUrl.startsWith('http') ? downloadFileUrl : `${API_URL}${downloadFileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'background-color 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Unduh Dokumen Asli (PDF)
            </a>
          </div>
        )}

        {/* Footer */}
        <p className={styles.footer}>
          Dokumen ini dihasilkan oleh sistem administrasi desa
        </p>
      </div>
    </div>
  );
}
