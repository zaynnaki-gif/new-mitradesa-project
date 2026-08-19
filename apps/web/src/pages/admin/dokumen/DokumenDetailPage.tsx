import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import s from '../layanan/LayananListPage.module.css';

interface DocumentInstance {
  id: string;
  dokumenId: string;
  permintaanId?: string;
  templateVersionId: string;
  nomorDokumen: string;
  judul: string;
  dataSnapshot?: Record<string, unknown>;
  contentSnapshot?: Record<string, unknown>;
  status: string;
  fileUrl?: string;
  verificationToken?: string;
  qrCode?: string;
  generatedAt: string;
  signedAt?: string;
  dokumen?: {
    id: string;
    kode: string;
    nama: string;
    slug: string;
  };
  templateVersion?: {
    id: string;
    version: number;
    template?: {
      id: string;
      nama: string;
    };
  };
  permintaan?: {
    id: string;
    nomorPermintaan: string;
    status: string;
    penduduk?: {
      namaLengkap: string;
      nik: string;
    };
  };
  signature?: {
    id: string;
    penandatangan?: {
      nama: string;
      jabatan: string;
      nip?: string;
    };
    signedAt: string;
  };
  verifikasi?: {
    verifyCount: number;
    lastVerifyAt: string;
    status: string;
  };
}

interface PenandaTangan {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  GENERATED: { bg: '#f3f4f6', text: '#374151' },
  PENDING_SIGNATURE: { bg: '#fef3c7', text: '#92400e' },
  SIGNED: { bg: '#dbeafe', text: '#1e40af' },
  VERIFIED: { bg: '#d1fae5', text: '#065f46' },
  ARCHIVED: { bg: '#fee2e2', text: '#991b1b' },
};

const STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Dibuat',
  PENDING_SIGNATURE: 'Menunggu TTD',
  SIGNED: 'Ditandatangani',
  VERIFIED: 'Terverifikasi',
  ARCHIVED: 'Diarsipkan',
};

export default function DokumenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showSignModal, setShowSignModal] = useState(false);
  const [penandaTangan, setPenandaTangan] = useState<PenandaTangan[]>([]);
  const [selectedPenandatangan, setSelectedPenandatangan] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDocument();
    fetchPenandaTangan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDocument = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/instances/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Gagal memuat dokumen');
      const json = await res.json();
      setDocument(json.data || json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPenandaTangan = async () => {
    try {
      const res = await fetch('/api/signatories?isActive=true', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPenandaTangan(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch penanda tangan:', e);
    }
  };

  const handleSign = async () => {
    if (!id || !selectedPenandatangan) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ penandatanganId: selectedPenandatangan }),
      });
      if (!res.ok) throw new Error('Gagal menandatangani');
      setShowSignModal(false);
      fetchDocument();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  const copyVerificationLink = () => {
    if (document?.verificationToken) {
      const url = `${window.location.origin}/verifikasi/${document.verificationToken}`;
      navigator.clipboard.writeText(url);
      alert('Link verifikasi berhasil disalin!');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div style={{ padding: '1.5rem' }}>Memuat...</div>;
  if (error) return <div style={{ padding: '1.5rem', color: 'var(--color-error)' }}>{error}</div>;
  if (!document) return <div style={{ padding: '1.5rem' }}>Dokumen tidak ditemukan</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/admin/dokumen')}
          style={{
            background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer',
            fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            marginBottom: '0.5rem', padding: 0,
          }}
        >
          ← Kembali ke Daftar
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {document.judul}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace', marginTop: '0.25rem' }}>
              {document.nomorDokumen}
            </p>
          </div>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: STATUS_COLORS[document.status]?.bg || 'var(--color-bg-muted)',
            color: STATUS_COLORS[document.status]?.text || 'var(--color-text-primary)',
          }}>
            {STATUS_LABELS[document.status] || document.status}
          </span>
        </div>
      </div>

      {/* Document Info */}
      <div style={{ background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Informasi Dokumen</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Jenis Dokumen</label>
            <div style={{ fontWeight: 500 }}>{document.dokumen?.nama || '-'}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Template</label>
            <div style={{ fontWeight: 500 }}>
              {document.templateVersion?.template?.nama || '-'}
              {document.templateVersion && (
                <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.25rem' }}>
                  v{document.templateVersion.version}
                </span>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Dibuat</label>
            <div style={{ fontWeight: 500 }}>{formatDate(document.generatedAt)}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Status</label>
            <div style={{ fontWeight: 500 }}>{STATUS_LABELS[document.status] || document.status}</div>
          </div>
        </div>
      </div>

      {/* Permintaan Info */}
      {document.permintaan && (
        <div style={{ background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Informasi Permintaan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Nomor Permintaan</label>
              <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{document.permintaan.nomorPermintaan}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Pemohon</label>
              <div style={{ fontWeight: 500 }}>{document.permintaan.penduduk?.namaLengkap || '-'}</div>
            </div>
            {document.permintaan.penduduk?.nik && (
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>NIK</label>
                <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{document.permintaan.penduduk.nik}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signature Info */}
      {document.signature && (
        <div style={{ background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Informasi Tanda Tangan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Penanda Tangan</label>
              <div style={{ fontWeight: 500 }}>{document.signature.penandatangan?.nama || '-'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Jabatan</label>
              <div style={{ fontWeight: 500 }}>{document.signature.penandatangan?.jabatan || '-'}</div>
            </div>
            {document.signature.penandatangan?.nip && (
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>NIP</label>
                <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{document.signature.penandatangan.nip}</div>
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Ditandatangani</label>
              <div style={{ fontWeight: 500 }}>{formatDate(document.signature.signedAt)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Info */}
      {document.verifikasi && (
        <div style={{ background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Informasi Verifikasi</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Jumlah Verifikasi</label>
              <div style={{ fontWeight: 500 }}>{document.verifikasi.verifyCount} kali</div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Verifikasi Terakhir</label>
              <div style={{ fontWeight: 500 }}>{formatDate(document.verifikasi.lastVerifyAt)}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Status</label>
              <div style={{ fontWeight: 500 }}>{document.verifikasi.status}</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Snapshot */}
      {document.dataSnapshot && Object.keys(document.dataSnapshot).length > 0 && (
        <div style={{ background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Data Permintaan</h2>
          <pre style={{ background: 'var(--color-bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', overflow: 'auto', margin: 0 }}>
            {JSON.stringify(document.dataSnapshot, null, 2)}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div style={{ background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Aksi</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {document.fileUrl && (
            <button
              onClick={handleDownload}
              style={{
                background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500
              }}
            >
              Download PDF
            </button>
          )}

          {document.verificationToken && (
            <button
              onClick={copyVerificationLink}
              style={{
                background: '#9333ea', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500
              }}
            >
              Salin Link Verifikasi
            </button>
          )}

          {document.verificationToken && (
            <a
              href={`/verifikasi/${document.verificationToken}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#4b5563', color: '#fff', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', display: 'inline-block', fontWeight: 500
              }}
            >
              Buka Verifikasi
            </a>
          )}

          {document.status === 'GENERATED' && !document.signature && (
            <button
              onClick={() => setShowSignModal(true)}
              style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500
              }}
            >
              Tandatangani
            </button>
          )}
        </div>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className={s.modalOverlay}>
          <div className={s.modalBox}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Tandatangani Dokumen</h2>
            </div>
            <div className={s.modalForm}>
              <div className={s.fieldGroup}>
                <label className={s.label}>
                  Penanda Tangan <span className={s.required}>*</span>
                </label>
                <select
                  value={selectedPenandatangan}
                  onChange={(e) => setSelectedPenandatangan(e.target.value)}
                  className={s.input}
                >
                  <option value="">Pilih Penanda Tangan</option>
                  {penandaTangan.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.nama} - {pt.jabatan}
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '1rem', marginBottom: 0 }}>
                Dengan menandatangani, Anda menyatakan bahwa dokumen ini telah disetujui dan
                ditandatangani secara resmi.
              </p>
            </div>
            <div className={s.formActions}>
              <button
                onClick={() => setShowSignModal(false)}
                className={s.btnCancel}
              >
                Batal
              </button>
              <button
                onClick={handleSign}
                disabled={!selectedPenandatangan || actionLoading}
                className={s.btnSubmit}
              >
                {actionLoading ? 'Menandatangani...' : 'Tandatangani'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
