import { useState, useEffect } from 'react';
import { PublicLayout } from '@/layouts';

import { LoadingState, ErrorState, EmptyState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { API_URL } from '@/lib/constants';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import styles from './GaleriPage.module.css';

interface MediaItem {
  id: string;
  nama: string;
  slug: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  alt: string | null;
}

export default function GaleriPage() {
  const { data: identitas } = useIdentitasDesa();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: getPageTitle(`Galeri ${villageName}`),
    description: `Galeri foto dan video ${villageName}.`,
  });

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/public/galeri?limit=20&page=1`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          // Filter only images for gallery
          const images = (result.data || []).filter(
            (item: MediaItem) => item.fileType === 'IMAGE' && item.fileUrl
          );
          setMedia(images);
        }
      } else {
        throw new Error('Gagal memuat galeri dari server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat galeri');
    } finally {
      setLoading(false);
    }
  };

  // Fetch media on mount
  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <PublicLayout>
      <EditorialHero 
        title="Galeri" 
        subtitle={`Kumpulan foto dan video kegiatan ${villageName}`} 
      />

      {/* Gallery Grid */}
      <EditorialSection alternate>
        <div className={styles.container}>
          {loading && (
            <LoadingState message="Memuat galeri..." />
          )}

          {error && (
            <ErrorState
              title="Gagal Memuat Galeri"
              message={error}
              onRetry={fetchMedia}
            />
          )}

          {!loading && !error && media.length === 0 && (
            <EmptyState
              title="Belum Ada Galeri"
              message="Belum ada foto atau video yang diunggah. Tambahkan media melalui halaman CMS."
              icon="folder"
            />
          )}

          {!loading && !error && media.length > 0 && (
            <div className={styles.galleryGrid}>
              {media.map((item) => (
                <button
                  key={item.id}
                  className={styles.galleryItem}
                  onClick={() => setSelectedItem(item)}
                  aria-label={`Lihat foto ${item.nama}`}
                >
                  <img
                    src={item.fileUrl}
                    alt={item.alt || item.nama}
                    className={styles.galleryImage}
                    loading="lazy"
                  />
                  <div className={styles.galleryOverlay}>
                    <span className={styles.galleryName}>{item.nama}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </EditorialSection>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className={styles.lightbox}
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${selectedItem.nama}`}
        >
          <button
            className={styles.lightboxClose}
            onClick={() => setSelectedItem(null)}
            aria-label="Tutup"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={selectedItem.fileUrl}
            alt={selectedItem.alt || selectedItem.nama}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
          {selectedItem.nama && (
            <p className={styles.lightboxCaption}>{selectedItem.nama}</p>
          )}
        </div>
      )}
    </PublicLayout>
  );
}
