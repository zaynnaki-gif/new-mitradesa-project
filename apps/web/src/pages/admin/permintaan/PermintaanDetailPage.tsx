import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './PermintaanDetailPage.module.css';

interface TemplateVersion {
  id: string;
  version: number;
  status: string;
  template?: {
    id: string;
    nama: string;
  };
}

interface GeneratedDocument {
  id: string;
  nomorDokumen: string;
  status: string;
  fileUrl?: string;
  verificationToken?: string;
}

interface RequestDetail {
  id: string;
  layananId: string;
  layanan?: {
    nama: string;
    kode: string;
  };
  pendudukId?: string;
  penduduk?: {
    namaLengkap?: string;
    nik?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    alamat?: string;
    rt?: string;
    rw?: string;
    dusun?: string;
  };
  nomorPermintaan: string;
  status: string;
  dataJson?: Record<string, unknown>;
  catatan?: string;
  createdAt: string;
  submittedAt?: string;
  processedAt?: string;
  completedAt?: string;
  updatedAt: string;
  creator?: { username: string };
  processor?: { username: string };
  approver?: { username: string };
  dokumen?: GeneratedDocument[];
}

export default function PermintaanDetailPage() {
  const { token } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [templates, setTemplates] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/service-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat detail');
      const data = await res.json();
      setRequest(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchTemplates = async () => {
    if (!request?.layananId) return;
    try {
      const res = await fetch(`${API_URL}/services/${request.layananId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allTemplates: TemplateVersion[] = [];
        for (const doc of data.data.dokumen || []) {
          const docRes = await fetch(`${API_URL}/documents/${doc.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (docRes.ok) {
            const docData = await docRes.json();
            for (const template of docData.data.templates || []) {
              for (const version of template.versions || []) {
                if (version.status === 'PUBLISHED') {
                  allTemplates.push({
                    ...version,
                    template: { ...template, id: String(template.id) },
                  });
                }
              }
            }
          }
        }
        setTemplates(allTemplates);
      }
    } catch (e) {
      console.error('Failed to fetch templates:', e);
    }
  };

  useEffect(() => {
    if (request?.layananId && request.status === 'APPROVED') {
      fetchTemplates();
    }
  }, [request?.layananId, request?.status]);

  const handleAction = async (action: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/service-requests/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ catatan }),
      });
      if (!res.ok) throw new Error(`Gagal melakukan ${action}`);
      setCatatan('');
      await fetchDetail();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Terjadi kesalahan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!id || !selectedTemplate) return;
    setGenerateLoading(true);
    try {
      const res = await fetch(`${API_URL}/documents/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateVersionId: selectedTemplate,
          context: {
            request: {
              nomor: request?.nomorPermintaan,
              tanggal: request?.createdAt,
              status: request?.status,
            },
            penduduk: request?.penduduk || {},
            formData: request?.dataJson || {},
          },
          judul: `${request?.layanan?.nama} - ${request?.nomorPermintaan}`,
          permintaanId: id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal generate dokumen');
      }

      setShowGenerateModal(false);
      setSelectedTemplate('');
      await fetchDetail();
      showToast('Dokumen berhasil dibuat!');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Terjadi kesalahan', 'error');
    } finally {
      setGenerateLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: styles.statusDraft,
      SUBMITTED: styles.statusSubmitted,
      PROCESSING: styles.statusProcessing,
      APPROVED: styles.statusApproved,
      REJECTED: styles.statusRejected,
      COMPLETED: styles.statusCompleted,
      CANCELLED: styles.statusCancelled,
    };
    return statusMap[status] || styles.statusDraft;
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      VERIFICATION: 'Verifikasi',
      PROCESSING: 'Diproses',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    };
    return labelMap[status] || status;
  };

  const allowedActions: Record<string, { action: string; label: string; buttonClass: string }[]> = {
    DRAFT: [{ action: 'submit', label: 'Ajukan', buttonClass: styles.buttonBlue }],
    SUBMITTED: [
      { action: 'verify', label: 'Verifikasi', buttonClass: styles.buttonBlue },
      { action: 'reject', label: 'Tolak', buttonClass: styles.buttonRed },
    ],
    VERIFICATION: [
      { action: 'process', label: 'Proses', buttonClass: styles.buttonYellow },
      { action: 'reject', label: 'Tolak', buttonClass: styles.buttonRed },
    ],
    PROCESSING: [
      { action: 'approve', label: 'Setujui', buttonClass: styles.buttonGreen },
      { action: 'reject', label: 'Tolak', buttonClass: styles.buttonRed },
    ],
    APPROVED: [
      { action: 'complete', label: 'Selesaikan', buttonClass: styles.buttonGreen },
    ],
  };

  // Mask NIK: tampilkan hanya 4 digit terakhir
  const maskNik = (nik?: string) => {
    if (!nik) return '-';
    return `${'*'.repeat(nik.length - 4)}${nik.slice(-4)}`;
  };

  if (loading) return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.loadingState}>Memuat...</div>
      </div>
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.errorState}>{error}</div>
      </div>
    </AdminLayout>
  );

  if (!request) return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.emptyState}>Data tidak ditemukan</div>
      </div>
    </AdminLayout>
  );

  const timeline = [
    { status: 'Dibuat', time: request.createdAt, user: request.creator?.username },
    ...(request.submittedAt ? [{ status: 'Diajukan', time: request.submittedAt }] : []),
    ...(request.processedAt ? [{ status: 'Diproses', time: request.processedAt, user: request.processor?.username }] : []),
    ...(request.approver ? [{ status: 'Disetujui', time: request.processedAt, user: request.approver.username }] : []),
    ...(request.completedAt ? [{ status: 'Selesai', time: request.completedAt }] : []),
    ...(request.status === 'REJECTED' ? [{ status: 'Ditolak', time: request.updatedAt, note: request.catatan }] : []),
  ];

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID');
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Link to="/admin/permintaan" className={styles.backLink}>
          ← Kembali ke Daftar
        </Link>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}
          >
            {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
          </div>
        )}

        {/* Main Info Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h1 className={styles.cardTitle}>Detail Permintaan</h1>
              <p className={styles.cardSubtitle}>{request.nomorPermintaan}</p>
            </div>
            <span className={`${styles.statusBadge} ${getStatusClass(request.status)}`}>
              {getStatusLabel(request.status)}
            </span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Layanan</span>
              <span className={styles.infoValue}>{request.layanan?.nama || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Kode Layanan</span>
              <span className={`${styles.infoValue} ${styles.infoValueMono}`}>{request.layanan?.kode || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Pemohon</span>
              <span className={styles.infoValue}>{request.penduduk?.namaLengkap || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>NIK</span>
              <span className={`${styles.infoValue} ${styles.infoValueMono}`}>
                {maskNik(request.penduduk?.nik)}
              </span>
            </div>
            {request.penduduk?.tempatLahir && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tempat/Tgl Lahir</span>
                <span className={styles.infoValue}>
                  {request.penduduk.tempatLahir}, {request.penduduk.tanggalLahir ? new Date(request.penduduk.tanggalLahir).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            )}
            {request.penduduk?.alamat && (
              <div className={`${styles.infoItem} ${styles.infoValueFull}`}>
                <span className={styles.infoLabel}>Alamat</span>
                <span className={styles.infoValue}>
                  {[
                    request.penduduk.alamat,
                    request.penduduk.rt ? `RT ${request.penduduk.rt}` : null,
                    request.penduduk.rw ? `RW ${request.penduduk.rw}` : null,
                    request.penduduk.dusun,
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Dibuat</span>
              <span className={styles.infoValue}>{formatDate(request.createdAt)}</span>
            </div>
            {request.submittedAt && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Diajukan</span>
                <span className={styles.infoValue}>{formatDate(request.submittedAt)}</span>
              </div>
            )}
          </div>

          {/* Form Data */}
          {request.dataJson && Object.keys(request.dataJson).length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Data Permohonan</h3>
              <div className={styles.formDataGrid}>
                {Object.entries(request.dataJson).map(([key, value]) => (
                  <div key={key} className={styles.formDataItem}>
                    <span className={styles.formDataLabel}>{key.replace(/_/g, ' ')}</span>
                    <span className={styles.formDataValue}>
                      {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Documents */}
          {request.dokumen && request.dokumen.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Dokumen yang Dibuat</h3>
              <div className={styles.documentList}>
                {request.dokumen.map((doc) => (
                  <div key={doc.id} className={styles.documentItem}>
                    <div className={styles.documentInfo}>
                      <span className={styles.documentNumber}>{doc.nomorDokumen}</span>
                      <span className={`${styles.documentStatus} ${doc.status === 'SIGNED' ? styles.buttonGreen : ''}`}>
                        {doc.status === 'SIGNED' ? 'Ditandatangani' : 'Dibuat'}
                      </span>
                    </div>
                  <div className={styles.documentActions}>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className={`${styles.documentLink} ${styles.documentLinkGreen}`}>
                          Download
                        </a>
                      )}
                      {doc.verificationToken && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/verifikasi/${doc.verificationToken}`);
                            showToast('Link verifikasi disalin ke clipboard');
                          }}
                          className={`${styles.documentLink} ${styles.documentLinkPurple}`}
                        >
                          Copy Link
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catatan */}
          {request.catatan && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Catatan</h3>
              <p className={styles.catatanBox}>{request.catatan}</p>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <div className={styles.actionsNote}>
              {request.status !== 'REJECTED' && request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan (opsional kecuali penolakan)..."
                  className={styles.noteTextarea}
                  rows={2}
                />
              )}
            </div>

            <div className={styles.actionButtons}>
              {allowedActions[request.status]?.map(({ action, label, buttonClass }) => (
                <button
                  key={action}
                  disabled={actionLoading}
                  onClick={() => action === 'reject' ? setShowRejectModal(true) : handleAction(action)}
                  className={`${styles.actionButton} ${buttonClass}`}
                >
                  {actionLoading ? 'Memproses...' : label}
                </button>
              ))}

              {request.status === 'APPROVED' && (
                <button
                  onClick={() => {
                    fetchTemplates();
                    setShowGenerateModal(true);
                  }}
                  className={`${styles.actionButton} ${styles.buttonPurple}`}
                >
                  Generate Dokumen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Timeline</h3>
          <div className={styles.timeline}>
            {timeline.map((item, i) => (
              <div key={i} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <p className={styles.timelineStatus}>{item.status}</p>
                  <p className={styles.timelineTime}>
                    {formatDate(item.time)}
                    {item.user && <span className={styles.timelineUser}> oleh {item.user}</span>}
                  </p>
                  {item.note && (
                    <div className={styles.timelineNote}>
                      <strong>Alasan:</strong> {item.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Document Modal */}
        {showGenerateModal && (
          <div className={styles.modal} onClick={() => setShowGenerateModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Generate Dokumen</h2>
              </div>
              <div className={styles.modalBody}>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className={styles.modalSelect}
                >
                  <option value="">Pilih Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.template?.nama || 'Template'} - v{t.version}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className={styles.modalWarning}>
                    Tidak ada template yang dipublikasikan untuk layanan ini.
                  </p>
                )}
                <p className={styles.modalNote}>
                  Dokumen akan dibuat menggunakan data dari permintaan ini dan template yang dipilih.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedTemplate('');
                  }}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Batal
                </button>
                <button
                  onClick={handleGenerateDocument}
                  disabled={!selectedTemplate || generateLoading}
                  className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                >
                  {generateLoading ? 'Membuat...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Reject Modal */}
        {showRejectModal && (
          <div className={styles.modal} onClick={() => setShowRejectModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Tolak Permintaan</h2>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.modalNote}>
                  Silakan masukkan alasan penolakan permintaan layanan ini. Alasan ini akan dapat dilihat oleh pemohon.
                </p>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Alasan penolakan (wajib)..."
                  className={styles.noteTextarea}
                  style={{ marginTop: '1rem', width: '100%' }}
                  rows={4}
                  required
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                  }}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!catatan.trim()) {
                      showToast('Alasan penolakan wajib diisi', 'error');
                      return;
                    }
                    setShowRejectModal(false);
                    handleAction('reject');
                  }}
                  disabled={!catatan.trim() || actionLoading}
                  className={`${styles.modalButton} ${styles.buttonRed}`}
                >
                  {actionLoading ? 'Memproses...' : 'Tolak Permintaan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
