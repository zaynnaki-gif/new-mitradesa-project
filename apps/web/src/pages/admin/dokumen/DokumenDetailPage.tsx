import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui';
import { LoadingState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import styles from './DokumenDetailPage.module.css';
import { useDokumenInstance, useSignatories, useSignDokumen, useRevokeDokumen } from '@/hooks/useDokumen';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  GENERATED: { bg: '#f3f4f6', text: '#374151' },
  PENDING_SIGNATURE: { bg: '#fef3c7', text: '#92400e' },
  SIGNED: { bg: '#d1fae5', text: '#065f46' },
  VERIFIED: { bg: '#dbeafe', text: '#1e40af' },
  ARCHIVED: { bg: '#fee2e2', text: '#991b1b' },
  REVOKED: { bg: '#fee2e2', text: '#991b1b' },
};

const STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Dibuat',
  PENDING_SIGNATURE: 'Menunggu TTD',
  SIGNED: 'Ditandatangani',
  VERIFIED: 'Terverifikasi',
  ARCHIVED: 'Diarsipkan',
  REVOKED: 'Dicabut (Revoked)',
};

export default function DokumenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const { data: documentData, isLoading: loading, error } = useDokumenInstance(id || null, token || '');
  const document = documentData?.data;

  const { data: signatoriesData } = useSignatories(token || '');
  const penandaTangan = signatoriesData?.data || [];

  const signDokumen = useSignDokumen();
  const revokeDokumen = useRevokeDokumen();

  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedPenandatangan, setSelectedPenandatangan] = useState('');
  const [pin, setPin] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const handleSign = async () => {
    if (!id || !selectedPenandatangan) return;
    try {
      await signDokumen.mutateAsync({ id, penandatanganId: selectedPenandatangan, token: token || '' });
      setShowSignModal(false);
      setPin('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRevoke = async () => {
    if (!id || !revokeReason.trim()) return;
    try {
      await revokeDokumen.mutateAsync({ id, token: token || '' });
      setShowRevokeModal(false);
      setRevokeReason('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDownload = () => {
    if (document?.fileUrl) window.open(document.fileUrl, '_blank');
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
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return (
    <AdminLayout><LoadingState message="Memuat dokumen..." fullPage /></AdminLayout>
  );
  if (error) return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.errorState}>{error.message || 'Error loading document'}</div>
      </div>
    </AdminLayout>
  );
  if (!document) return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.errorState}>Dokumen tidak ditemukan</div>
      </div>
    </AdminLayout>
  );

  const statusColor = STATUS_COLORS[document.status] || { bg: '#f3f4f6', text: '#374151' };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Back + Header */}
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/admin/dokumen')}>
            ← Kembali ke Daftar
          </button>
          <div className={styles.headerMain}>
            <div>
              <h1 className={styles.title}>{document.judul}</h1>
              <p className={styles.nomor}>{document.nomorDokumen}</p>
            </div>
            <span className={styles.statusBadge} style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
              {STATUS_LABELS[document.status] || document.status}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Informasi Dokumen</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Jenis Dokumen</span>
              <span className={styles.infoValue}>{document.dokumen?.nama || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Template</span>
              <span className={styles.infoValue}>
                {document.templateVersion?.template?.nama || '-'}
                {document.templateVersion && (
                  <span className={styles.version}> v{document.templateVersion.version}</span>
                )}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Dibuat</span>
              <span className={styles.infoValue}>{formatDate(document.generatedAt)}</span>
            </div>
            {document.signedAt && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ditandatangani</span>
                <span className={styles.infoValue}>{formatDate(document.signedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Permintaan Info */}
        {document.permintaan && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Informasi Permintaan</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nomor Permintaan</span>
                <span className={`${styles.infoValue} ${styles.mono}`}>{document.permintaan.nomorPermintaan}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Pemohon</span>
                <span className={styles.infoValue}>{document.permintaan.penduduk?.namaLengkap || '-'}</span>
              </div>
              {document.permintaan.penduduk?.nik && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>NIK</span>
                  <span className={`${styles.infoValue} ${styles.mono}`}>{document.permintaan.penduduk.nik}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Info */}
        {document.signature && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Informasi Tanda Tangan</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Penanda Tangan</span>
                <span className={styles.infoValue}>{document.signature.penandatangan?.nama || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Jabatan</span>
                <span className={styles.infoValue}>{document.signature.penandatangan?.jabatan || '-'}</span>
              </div>
              {document.signature.penandatangan?.nip && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>NIP</span>
                  <span className={`${styles.infoValue} ${styles.mono}`}>{document.signature.penandatangan.nip}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Info */}
        {/* @ts-expect-error ignore */}
        {document.verifikasi && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Informasi Verifikasi</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Jumlah Verifikasi</span>
                {/* @ts-expect-error ignore */}
                <span className={styles.infoValue}>{document.verifikasi.verifyCount} kali</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Verifikasi Terakhir</span>
                {/* @ts-expect-error ignore */}
                <span className={styles.infoValue}>{formatDate(document.verifikasi.lastVerifyAt)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Data Snapshot */}
        {/* @ts-expect-error ignore */}
        {document.dataSnapshot && Object.keys(document.dataSnapshot).length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Data Permintaan</h2>
            <pre className={styles.jsonPre}>
              {/* @ts-expect-error ignore */}
              {JSON.stringify(document.dataSnapshot, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Aksi</h2>
          <div className={styles.actions}>
            {document.fileUrl && (
              <Button onClick={handleDownload} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none' }}>
                Download PDF
              </Button>
            )}
            {document.verificationToken && (
              <Button onClick={copyVerificationLink} variant="outline">
                Salin Link Verifikasi
              </Button>
            )}
            {document.verificationToken && (
              <a
                href={`/verifikasi/${document.verificationToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkButton}
              >
                Buka Verifikasi
              </a>
            )}
            {document.status === 'GENERATED' && !document.signature && (
              <Button onClick={() => setShowSignModal(true)}>
                Tandatangani
              </Button>
            )}
            {document.status !== 'REVOKED' && (
              <Button onClick={() => setShowRevokeModal(true)} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}>
                Cabut Dokumen
              </Button>
            )}
          </div>
        </div>

        {/* Revoke Modal */}
        {showRevokeModal && (
          <div className={styles.modalOverlay} onClick={() => setShowRevokeModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader} style={{ borderBottom: '1px solid #fecaca' }}>
                <h2 style={{ color: '#dc2626' }}>Cabut Dokumen Resmi</h2>
                <button onClick={() => setShowRevokeModal(false)}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '0.375rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>
                  <strong>PERINGATAN:</strong> Dokumen yang dicabut akan dinyatakan tidak sah/tidak berlaku lagi. QR code dan link verifikasi akan menampilkan status dicabut secara publik.
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Alasan Pencabutan (Wajib) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Terjadi kekeliruan data pemohon pada surat ini..."
                    value={revokeReason}
                    onChange={e => setRevokeReason(e.target.value)}
                    className={styles.select}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="outline" onClick={() => setShowRevokeModal(false)}>Batal</Button>
                <Button
                  onClick={handleRevoke}
                  disabled={!revokeReason.trim() || revokeDokumen.isPending}
                  style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}
                >
                  {revokeDokumen.isPending ? 'Mencabut...' : 'Konfirmasi Cabut Dokumen'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sign Modal */}
        {showSignModal && (
          <div className={styles.modalOverlay} onClick={() => setShowSignModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Tandatangani Dokumen</h2>
                <button onClick={() => setShowSignModal(false)}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Penanda Tangan *
                  </label>
                  <select
                    value={selectedPenandatangan}
                    onChange={e => setSelectedPenandatangan(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Pilih Penanda Tangan</option>
                    {penandaTangan.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.nama} - {pt.jabatan}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className={styles.label}>
                    PIN Pribadi Penandatangan *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan PIN (cth: 1234)"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className={styles.select}
                    style={{ letterSpacing: '0.2em' }}
                  />
                </div>
                <p className={styles.disclaimer}>
                  Dengan menandatangani, Anda menyatakan bahwa dokumen ini telah disetujui dan ditandatangani secara resmi menggunakan TTE internal yang sah.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="outline" onClick={() => setShowSignModal(false)}>Batal</Button>
                <Button onClick={handleSign} disabled={!selectedPenandatangan || signDokumen.isPending}>
                  {signDokumen.isPending ? 'Menandatangani...' : 'Tandatangani'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
