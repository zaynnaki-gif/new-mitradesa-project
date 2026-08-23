import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './ExecutiveDashboard.module.css';

interface DashboardStats {
  requests: {
    new: number;
    processing: number;
    pendingApproval: number;
    completed: number;
  };
  documents: {
    total: number;
    signed: number;
  };
  content: {
    beritaPublished: number;
    beritaDraft: number;
    halamanPublished: number;
    mediaTotal: number;
    umkmTotal: number;
    agendaTotal: number;
  };
  sla: {
    averageSlaHours: number;
    totalSampled: number;
  };
}

interface ExecutiveStats {
  totalPenduduk: number;
  suratMenungguTTD: number;
  suratMasukPending: number;
  apbdes: {
    tahun: number;
    totalAnggaran: number;
    realisasi: number;
    persentaseRealisasi: number;
  };
}

interface RecentActivity {
  id: string;
  status: string;
  updatedAt: string;
  layanan: { nama: string; kode: string };
  creator: { username: string } | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: value >= 1_000_000_000 ? 'compact' : 'standard',
  }).format(value);
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'Baru Masuk', color: '#3b82f6' },
  VERIFICATION: { label: 'Verifikasi', color: '#f59e0b' },
  PROCESSING: { label: 'Diproses', color: '#8b5cf6' },
  COMPLETED: { label: 'Selesai', color: '#10b981' },
  REJECTED: { label: 'Ditolak', color: '#ef4444' },
};

function StatCard({
  icon,
  label,
  value,
  desc,
  variant = 'default',
  to,
}: {
  icon: string;
  label: string;
  value: string | number;
  desc?: string;
  variant?: 'default' | 'alert' | 'warning' | 'success';
  to?: string;
}) {
  const card = (
    <div className={`${styles.statCard} ${styles[variant + 'Card'] || ''}`}>
      <div className={styles.statIconWrapper}>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {desc && <span className={styles.statDesc}>{desc}</span>}
      </div>
      {to && <span className={styles.statArrow}>→</span>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={styles.statCardLink}>
        {card}
      </Link>
    );
  }
  return card;
}

export default function ExecutiveDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [executive, setExecutive] = useState<ExecutiveStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, execRes, activityRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }),
        fetch(`${API_URL}/dashboard/executive`, { headers }),
        fetch(`${API_URL}/dashboard/recent-activity?limit=8`, { headers }),
      ]);

      if (!statsRes.ok || !execRes.ok) {
        throw new Error('Gagal memuat data dashboard');
      }

      const [statsData, execData, activityData] = await Promise.all([
        statsRes.json(),
        execRes.json(),
        activityRes.ok ? activityRes.json() : { data: [] },
      ]);

      setStats(statsData.data);
      setExecutive(execData.data);
      setRecentActivity(activityData.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Memuat Ringkasan Desa...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.errorContainer}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchAll} className={styles.retryButton}>
            Coba Lagi
          </button>
        </div>
      </AdminLayout>
    );
  }

  const apbdesPercent = Math.min(executive?.apbdes.persentaseRealisasi || 0, 100);
  const totalLayanan =
    (stats?.requests.new || 0) +
    (stats?.requests.processing || 0) +
    (stats?.requests.pendingApproval || 0) +
    (stats?.requests.completed || 0);

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard Eksekutif</h1>
            <p className={styles.subtitle}>{today}</p>
          </div>
          <button onClick={fetchAll} className={styles.refreshButton} title="Refresh data">
            🔄 Refresh
          </button>
        </header>

        {/* === SECTION 1: KEPENDUDUKAN === */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📋 Kependudukan</h2>
          <div className={styles.statsGrid4}>
            <StatCard
              icon="👥"
              label="Total Penduduk"
              value={(executive?.totalPenduduk || 0).toLocaleString('id-ID')}
              desc="Warga terdaftar"
            />
            <StatCard
              icon="🏠"
              label="Surat Masuk Aktif"
              value={executive?.suratMasukPending || 0}
              desc="Belum didisposisi"
              variant={(executive?.suratMasukPending || 0) > 0 ? 'warning' : 'default'}
              to="/admin/arsip-surat"
            />
            <StatCard
              icon="✍️"
              label="Menunggu TTD"
              value={executive?.suratMenungguTTD || 0}
              desc="Surat belum ditandatangani"
              variant={(executive?.suratMenungguTTD || 0) > 0 ? 'alert' : 'default'}
            />
            <StatCard
              icon="📄"
              label="Total Dokumen"
              value={(stats?.documents.total || 0).toLocaleString('id-ID')}
              desc={`${stats?.documents.signed || 0} sudah ditandatangani`}
            />
          </div>
        </section>

        {/* === SECTION 2: LAYANAN PUBLIK HARI INI === */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🏛️ Layanan Publik</h2>
          <div className={styles.statsGrid4}>
            <StatCard
              icon="📥"
              label="Baru Masuk"
              value={stats?.requests.new || 0}
              desc="Perlu segera diproses"
              variant={(stats?.requests.new || 0) > 0 ? 'alert' : 'default'}
              to="/admin/permintaan"
            />
            <StatCard
              icon="🔍"
              label="Verifikasi"
              value={stats?.requests.pendingApproval || 0}
              desc="Menunggu verifikasi admin"
              variant={(stats?.requests.pendingApproval || 0) > 0 ? 'warning' : 'default'}
              to="/admin/permintaan"
            />
            <StatCard
              icon="⚙️"
              label="Diproses"
              value={stats?.requests.processing || 0}
              desc="Sedang dalam penanganan"
              to="/admin/permintaan"
            />
            <StatCard
              icon="✅"
              label="Selesai"
              value={stats?.requests.completed || 0}
              desc={totalLayanan > 0 ? `${Math.round(((stats?.requests.completed || 0) / totalLayanan) * 100)}% completion rate` : '-'}
              variant="success"
            />
          </div>

          {/* SLA Info */}
          {(stats?.sla.totalSampled || 0) > 0 && (
            <div className={styles.slaBar}>
              <span className={styles.slaLabel}>⏱️ Rata-rata penyelesaian layanan</span>
              <span className={styles.slaValue}>
                {stats!.sla.averageSlaHours < 24
                  ? `${stats!.sla.averageSlaHours} jam`
                  : `${(stats!.sla.averageSlaHours / 24).toFixed(1)} hari`}
              </span>
              <span className={styles.slaSample}>dari {stats!.sla.totalSampled} permintaan terakhir</span>
            </div>
          )}
        </section>

        {/* === SECTION 3: APBDES REALISASI === */}
        <section className={styles.section}>
          <div className={styles.apbdesCard}>
            <div className={styles.apbdesHeader}>
              <div>
                <h2 className={styles.apbdesTitle}>💰 Realisasi APBDes {executive?.apbdes.tahun}</h2>
                <p className={styles.apbdesSubtitle}>Anggaran Pendapatan dan Belanja Desa</p>
              </div>
              <span
                className={`${styles.apbdesBadge} ${
                  apbdesPercent >= 80
                    ? styles.apbdesBadgeGood
                    : apbdesPercent >= 50
                    ? styles.apbdesBadgeOk
                    : styles.apbdesBadgeLow
                }`}
              >
                {apbdesPercent.toFixed(1)}%
              </span>
            </div>

            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${apbdesPercent}%`,
                  backgroundColor:
                    apbdesPercent >= 80 ? '#10b981' : apbdesPercent >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>

            <div className={styles.apbdesDetails}>
              <div className={styles.apbdesItem}>
                <span className={styles.apbdesLabel}>Total Anggaran Belanja</span>
                <span className={styles.apbdesValue}>
                  {formatCurrency(executive?.apbdes.totalAnggaran || 0)}
                </span>
              </div>
              <div className={styles.apbdesItem}>
                <span className={styles.apbdesLabel}>Total Realisasi</span>
                <span className={styles.apbdesValueSuccess}>
                  {formatCurrency(executive?.apbdes.realisasi || 0)}
                </span>
              </div>
              <div className={styles.apbdesItem}>
                <span className={styles.apbdesLabel}>Sisa Anggaran</span>
                <span className={styles.apbdesValue}>
                  {formatCurrency(
                    Math.max(
                      0,
                      (executive?.apbdes.totalAnggaran || 0) - (executive?.apbdes.realisasi || 0)
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* === SECTION 4: KONTEN & AKTIVITAS === */}
        <div className={styles.bottomGrid}>
          {/* Konten Stats */}
          <section className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>📢 Konten Publik</h2>
            <div className={styles.contentList}>
              <div className={styles.contentItem}>
                <span className={styles.contentIcon}>📰</span>
                <div className={styles.contentInfo}>
                  <span className={styles.contentLabel}>Berita Publik</span>
                  <span className={styles.contentSub}>{stats?.content.beritaDraft || 0} draft</span>
                </div>
                <span className={styles.contentCount}>{stats?.content.beritaPublished || 0}</span>
              </div>
              <div className={styles.contentItem}>
                <span className={styles.contentIcon}>📅</span>
                <div className={styles.contentInfo}>
                  <span className={styles.contentLabel}>Agenda Aktif</span>
                  <span className={styles.contentSub}>Mendatang / Berlangsung</span>
                </div>
                <span className={styles.contentCount}>{stats?.content.agendaTotal || 0}</span>
              </div>
              <div className={styles.contentItem}>
                <span className={styles.contentIcon}>🏪</span>
                <div className={styles.contentInfo}>
                  <span className={styles.contentLabel}>UMKM Aktif</span>
                  <span className={styles.contentSub}>Usaha terdaftar</span>
                </div>
                <span className={styles.contentCount}>{stats?.content.umkmTotal || 0}</span>
              </div>
              <div className={styles.contentItem}>
                <span className={styles.contentIcon}>📁</span>
                <div className={styles.contentInfo}>
                  <span className={styles.contentLabel}>Halaman CMS</span>
                  <span className={styles.contentSub}>Terpublikasi</span>
                </div>
                <span className={styles.contentCount}>{stats?.content.halamanPublished || 0}</span>
              </div>
              <div className={styles.contentItem}>
                <span className={styles.contentIcon}>🖼️</span>
                <div className={styles.contentInfo}>
                  <span className={styles.contentLabel}>File Media</span>
                  <span className={styles.contentSub}>Galeri & dokumen</span>
                </div>
                <span className={styles.contentCount}>{stats?.content.mediaTotal || 0}</span>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <h2 className={styles.sectionTitle}>🕐 Aktivitas Terbaru</h2>
              <Link to="/admin/permintaan" className={styles.viewAllLink}>
                Lihat semua →
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <div className={styles.activityEmpty}>
                <span>Belum ada aktivitas</span>
              </div>
            ) : (
              <div className={styles.activityList}>
                {recentActivity.map((item) => {
                  const statusInfo = STATUS_LABEL[item.status] || {
                    label: item.status,
                    color: '#6b7280',
                  };
                  return (
                    <div key={item.id} className={styles.activityItem}>
                      <div
                        className={styles.activityDot}
                        style={{ backgroundColor: statusInfo.color }}
                      />
                      <div className={styles.activityContent}>
                        <span className={styles.activityTitle}>{item.layanan?.nama || 'Layanan'}</span>
                        <span className={styles.activityMeta}>
                          {item.creator?.username || 'Warga'} ·{' '}
                          <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                        </span>
                      </div>
                      <span className={styles.activityTime}>{formatTimeAgo(item.updatedAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
