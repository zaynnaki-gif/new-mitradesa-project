import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './AppDashboard.module.css';

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
  sla?: {
    averageSlaHours: number;
    totalSampled: number;
  };
}

interface PendingItem {
  type: 'request' | 'document' | 'berita';
  label: string;
  count: number;
  href: string;
}

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  time: string;
  type: 'request' | 'document' | 'berita' | 'template';
}

export default function AppDashboard() {
  const { token, user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('AppDashboard: Starting fetchDashboardData');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('AppDashboard: Fetching from API_URL', API_URL);

      // Fetch all data in parallel
      const [statsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }),
        fetch(`${API_URL}/service-requests?limit=5&sort=createdAt&order=desc`, { headers }),
      ]);

      console.log('AppDashboard: Fetch complete', statsRes.status, requestsRes.status);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        if (requestsData.success) {
          // Build pending items from requests
          const requests = requestsData.data || [];
          const pending: PendingItem[] = [];

          // Filter pending requests
          const newRequests = requests.filter((r: { status: string }) => r.status === 'SUBMITTED');
          const processingRequests = requests.filter((r: { status: string }) => r.status === 'PROCESSING');

          if (newRequests.length > 0) {
            pending.push({
              type: 'request',
              label: 'Permintaan baru',
              count: newRequests.length,
              href: '/admin/permintaan?status=SUBMITTED',
            });
          }

          if (processingRequests.length > 0) {
            pending.push({
              type: 'request',
              label: 'Sedang diproses',
              count: processingRequests.length,
              href: '/admin/permintaan?status=PROCESSING',
            });
          }

          setPendingItems(pending);

          // Build recent activity from requests
          const activities: ActivityItem[] = requests.slice(0, 5).map((r: {
            id: string;
            nomorPermintaan: string;
            status: string;
            layananNama?: string;
            updatedAt: string;
          }) => ({
            id: r.id,
            action: r.status,
            target: r.layananNama || r.nomorPermintaan,
            time: r.updatedAt,
            type: 'request',
          }));
          setRecentActivity(activities);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const formatRole = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'User';
    const roleMap: Record<string, string> = {
      'ADMIN': 'Administrator',
      'DEVELOPER': 'Developer',
      'OPERATOR': 'Operator',
      'SUPERADMIN': 'Super Admin',
    };
    return roleMap[roles[0]] || roles[0];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Memuat dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--color-error)', marginBottom: '0.5rem' }}>Gagal Memuat Dashboard</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{error}</p>
              <Button onClick={() => fetchDashboardData()}>Coba Lagi</Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.greeting}>
              <h1 className={styles.title}>{getGreeting()}, {user?.username || 'Admin'}</h1>
              <p className={styles.subtitle}>
                Berikut ringkasan aktivitas dan layanan {formatRole(user?.roles || [])}
              </p>
            </div>
            <div className={styles.headerActions}>
              <Button variant="outline" onClick={logout}>
                Keluar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe' }}>📥</div>
            <div className={styles.statValue}>{stats?.requests?.new || 0}</div>
            <div className={styles.statLabel}>Permintaan Baru</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7' }}>⚙️</div>
            <div className={styles.statValue}>{stats?.requests?.processing || 0}</div>
            <div className={styles.statLabel}>Sedang Diproses</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fef08a' }}>✍️</div>
            <div className={styles.statValue}>{stats?.requests?.pendingApproval || 0}</div>
            <div className={styles.statLabel}>Menunggu TTE</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7' }}>✅</div>
            <div className={styles.statValue}>{stats?.requests?.completed || 0}</div>
            <div className={styles.statLabel}>Selesai</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#e0e7ff' }}>⏱️</div>
            <div className={styles.statValue}>{stats?.sla?.averageSlaHours || 0} Jam</div>
            <div className={styles.statLabel}>Rata-rata Waktu Selesai (SLA)</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#f5f3ff' }}>📄</div>
            <div className={styles.statValue}>{stats?.documents?.total || 0}</div>
            <div className={styles.statLabel}>Dokumen</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#f3e8ff' }}>📰</div>
            <div className={styles.statValue}>{stats?.content.beritaPublished || 0}</div>
            <div className={styles.statLabel}>Berita Published</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7' }}>🏪</div>
            <div className={styles.statValue}>{stats?.content.umkmTotal || 0}</div>
            <div className={styles.statLabel}>UMKM Aktif</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fef9c3' }}>📅</div>
            <div className={styles.statValue}>{stats?.content.agendaTotal || 0}</div>
            <div className={styles.statLabel}>Agenda Aktif</div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className={styles.dashboardGrid}>
          {/* Left Column */}
          <div>
            {/* Action Center - Perlu Tindakan */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  ⚡ Perlu Tindakan
                </h2>
                <Link to="/admin/permintaan" className={styles.viewAll}>
                  Lihat Semua →
                </Link>
              </div>
              <div className={styles.cardBody}>
                {pendingItems.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>✅</div>
                    <p className={styles.emptyText}>Tidak ada yang perlu ditindaklanjuti</p>
                  </div>
                ) : (
                  pendingItems.map((item, index) => (
                    <div key={index} className={styles.actionItem}>
                      <div className={styles.actionInfo}>
                        <div className={styles.actionIcon}>
                          {item.type === 'request' && '📥'}
                        </div>
                        <div className={styles.actionText}>
                          <span className={styles.actionCount}>
                            {item.count} {item.label}
                          </span>
                          <span className={styles.actionLabel}>
                           Perlu diproses
                          </span>
                        </div>
                      </div>
                      <Link to={item.href}>
                        <Button variant="outline" size="sm">
                          Periksa
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.card} style={{ marginTop: 'var(--space-6)' }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  📋 Aktivitas Terbaru
                </h2>
              </div>
              <div className={styles.cardBody}>
                {recentActivity.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📭</div>
                    <p className={styles.emptyText}>Belum ada aktivitas</p>
                  </div>
                ) : (
                  <div className={styles.activityList}>
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className={styles.activityItem}>
                        <div className={styles.activityDot} />
                        <div className={styles.activityContent}>
                          <p className={styles.activityText}>
                            <strong>{activity.target}</strong> - {activity.action}
                          </p>
                          <p className={styles.activityTime}>
                            {formatTime(activity.time)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  🚀 Aksi Cepat
                </h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.quickActions}>
                  <Link to="/admin/permintaan" className={styles.quickAction}>
                    <span className={styles.quickActionIcon}>📥</span>
                    <span className={styles.quickActionLabel}>Permintaan</span>
                  </Link>
                  <Link to="/admin/konten/berita" className={styles.quickAction}>
                    <span className={styles.quickActionIcon}>📰</span>
                    <span className={styles.quickActionLabel}>Berita</span>
                  </Link>
                  <Link to="/admin/konten/halaman" className={styles.quickAction}>
                    <span className={styles.quickActionIcon}>📃</span>
                    <span className={styles.quickActionLabel}>Halaman</span>
                  </Link>
                  <Link to="/admin/konten/media" className={styles.quickAction}>
                    <span className={styles.quickActionIcon}>🖼️</span>
                    <span className={styles.quickActionLabel}>Media</span>
                  </Link>
                  <Link to="/admin/layanan" className={styles.quickAction}>
                    <span className={styles.quickActionIcon}>📋</span>
                    <span className={styles.quickActionLabel}>Layanan</span>
                  </Link>
                  <Link to="/admin/surat/templates" className={styles.quickAction}>
                    <span className={styles.quickActionIcon}>📝</span>
                    <span className={styles.quickActionLabel}>Template</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className={styles.footerNote}>
          Admin Dashboard Desa
        </p>
      </div>
    </AdminLayout>
  );
}
