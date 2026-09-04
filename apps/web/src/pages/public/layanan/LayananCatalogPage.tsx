import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { API_URL } from '@/lib/constants';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import styles from './LayananPage.module.css';

interface ServiceItem {
  id: string;
  kode: string;
  nama: string;
  slug: string;
  kategori?: string;
  deskripsi?: string;
  isActive: boolean;
  _count?: {
    permintaan: number;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function LayananPage() {
  const { data: identitas } = useIdentitasDesa();
  const villageName = identitas?.namaDesa || 'Desa';
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filter, setFilter] = useState({ kategori: '', search: '' });

  useSEO({
    title: getPageTitle(`Layanan ${villageName}`),
    description: `Layanan administrasi ${villageName}. Informasi persyaratan, alur, dan pengajuan layanan desa.`,
  });

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (filter.kategori) params.append('kategori', filter.kategori);
      if (filter.search) params.append('search', filter.search);

      const res = await fetch(`${API_URL}/public/layanan?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat layanan');
      const json = await res.json();
      setServices(json.data || []);
      setPagination(json.meta || pagination);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filter]);

  const getKategoriIcon = (kategori?: string) => {
    switch (kategori) {
      case 'SURAT':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
      case 'PENGANTAR':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        );
      case 'IZIN':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        );
    }
  };

  const getKategoriLabel = (kategori?: string) => {
    switch (kategori) {
      case 'SURAT':
        return 'Surat Keterangan';
      case 'PENGANTAR':
        return 'Surat Pengantar';
      case 'IZIN':
        return 'Izin';
      case 'LAINNYA':
        return 'Lainnya';
      default:
        return kategori || 'Layanan';
    }
  };

  return (
    <PublicLayout>
      {/* Page Header */}
      <EditorialHero 
        title="Layanan Desa" 
        subtitle={`Informasi layanan administrasi ${villageName}`} 
      />

      {/* Content */}
      <EditorialSection alternate>
        <div className={styles.container}>
          {/* Filters */}
          {services.length > 0 && (
            <div className={styles.filters}>
              <div className={styles.searchBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari layanan..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className={styles.searchInput}
                />
              </div>
              <select
                value={filter.kategori}
                onChange={(e) => setFilter({ ...filter, kategori: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="">Semua Kategori</option>
                <option value="SURAT">Surat Keterangan</option>
                <option value="PENGANTAR">Surat Pengantar</option>
                <option value="IZIN">Izin</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
          )}

          {/* Service Grid */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <Typography variant="body1" color="secondary">
                Memuat layanan...
              </Typography>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <Typography variant="body1" color="error">
                {error}
              </Typography>
              <button onClick={fetchServices} className={styles.retryButton}>
                Coba Lagi
              </button>
            </div>
          ) : services.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <Typography variant="h3" className={styles.emptyTitle}>
                Belum Ada Layanan Tersedia
              </Typography>
              <Typography variant="body2" color="secondary">
                Saat ini belum ada layanan yang tersedia. Silakan hubungi kantor desa untuk informasi lebih lanjut.
              </Typography>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {services.map((service) => (
                  <Link
                    key={service.id}
                    to={`/layanan/${service.slug}`}
                    className={styles.card}
                  >
                    <div className={styles.cardIcon}>
                      {getKategoriIcon(service.kategori)}
                    </div>
                    <Typography variant="h3" className={styles.cardTitle}>
                      {service.nama}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="secondary"
                      className={styles.cardDesc}
                    >
                      {service.deskripsi || `Layanan ${getKategoriLabel(service.kategori)}`}
                    </Typography>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardBadge}>
                        {getKategoriLabel(service.kategori)}
                      </span>
                      {service._count?.permintaan ? (
                        <span className={styles.cardCount}>
                          {service._count.permintaan} pengajuan
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.cardAction}>
                      <span>Lihat Detail →</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    className={styles.pageButton}
                  >
                    ←
                  </button>
                  <span className={styles.pageInfo}>
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    className={styles.pageButton}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Contact Info */}
          <div className={styles.contactSection}>
            <Typography variant="h3" className={styles.sectionTitle}>
              Butuh Bantuan?
            </Typography>
            <Typography variant="body1" color="secondary" className={styles.contactDesc}>
              Untuk informasi lebih lanjut tentang layanan administrasi, silakan hubungi kantor desa:
            </Typography>
            <div className={styles.contactGrid}>
              {identitas?.alamat && (
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <Typography variant="body2" color="secondary">Alamat</Typography>
                    <Typography variant="body1">{identitas.alamat}</Typography>
                  </div>
                </div>
              )}
              {identitas?.telepon && (
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <Typography variant="body2" color="secondary">Telepon</Typography>
                    <Typography variant="body1">{identitas.telepon}</Typography>
                  </div>
                </div>
              )}
              {identitas?.whatsapp && (
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <div>
                    <Typography variant="body2" color="secondary">WhatsApp</Typography>
                    <Typography variant="body1">{identitas.whatsapp}</Typography>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
