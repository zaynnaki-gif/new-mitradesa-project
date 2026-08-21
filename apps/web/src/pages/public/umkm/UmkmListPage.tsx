import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';

import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import { useUmkmList } from '@/hooks/useUmkm';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import styles from './UmkmListPage.module.css';

export default function UmkmListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useSEO({
    title: getPageTitle('Potensi UMKM'),
    description: 'Jelajahi berbagai produk dan layanan UMKM terbaik dari desa kami.',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: umkms, loading, error, refetch } = useUmkmList({
    search: debouncedSearch || undefined,
    kategori: selectedCategory || undefined,
  });

  const categories = ['', 'MAKANAN', 'KERAJINAN', 'JASA', 'FASHION', 'AGRIBISNIS', 'LAINNYA'];
  const categoryLabels: Record<string, string> = {
    '': 'Semua',
    MAKANAN: 'Makanan',
    KERAJINAN: 'Kerajinan',
    JASA: 'Jasa',
    FASHION: 'Fashion',
    AGRIBISNIS: 'Agribisnis',
    LAINNYA: 'Lainnya',
  };

  return (
    <PublicLayout>
      <EditorialHero 
        title="Potensi UMKM Desa" 
        subtitle="Dukung perekonomian lokal dengan produk-produk unggulan karya warga desa." 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {/* Search & Category Filter */}
          <div className={styles.filterSection}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Cari nama usaha, pemilik, atau produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.categoryList}>
              {categories.map((kategori) => (
                <button
                  key={kategori || 'semua'}
                  className={`${styles.categoryBadge} ${selectedCategory === kategori ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(kategori)}
                >
                  {categoryLabels[kategori]}
                </button>
              ))}
            </div>
          </div>

          {loading && <LoadingState message="Memuat daftar UMKM..." />}

          {error && (
            <ErrorState
              title="Gagal Memuat UMKM"
              message={error}
              onRetry={refetch}
            />
          )}

          {!loading && !error && umkms.length === 0 && (
            <EmptyState
              title="UMKM Belum Tersedia"
              message={
                debouncedSearch || selectedCategory
                  ? 'Tidak ada UMKM yang cocok dengan pencarian Anda.'
                  : 'Belum ada data UMKM yang dipublikasikan oleh pemerintah desa.'
              }
              icon="search"
            />
          )}

          {!loading && !error && umkms.length > 0 && (
            <div className={styles.umkmGrid}>
              {umkms.map((umkm) => (
                <div key={umkm.id} className={styles.umkmCard}>
                  {umkm.gambarUrl && (
                    <div className={styles.cardImageWrapper}>
                      <img src={umkm.gambarUrl} alt={umkm.nama} className={styles.cardImage} />
                    </div>
                  )}

                  <div className={styles.cardContent}>
                    <span className={styles.cardCategory}>{umkm.kategori.replace(/_/g, ' ')}</span>
                    <h3 className={styles.cardTitle}>{umkm.nama}</h3>
                    <p className={styles.cardOwner}>Oleh: {umkm.pemilik}</p>

                    <p className={styles.cardExcerpt}>
                      {umkm.deskripsi
                        ? umkm.deskripsi.length > 100
                          ? `${umkm.deskripsi.substring(0, 100)}...`
                          : umkm.deskripsi
                        : 'Tidak ada deskripsi'}
                    </p>

                    <div className={styles.cardFooter}>
                      <Link to={`/umkm/${umkm.slug}`} className="btn btn-outline" style={{ width: '100%' }}>
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
