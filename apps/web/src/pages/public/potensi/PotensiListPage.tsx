import { PublicLayout } from '@/layouts';
import { LoadingState, ErrorState, EmptyState } from '@/components/states';
import { usePotensiList } from '@/hooks/usePotensi';
import { EditorialHero, EditorialSection, EditorialCard } from '@/components/editorial';
import { useSEO, getPageTitle } from '@/hooks/useSeo';

export function PotensiListPage() {
  const { data: potensi, loading, error, refetch } = usePotensiList();

  useSEO({
    title: getPageTitle('Potensi Desa'),
    description: 'Jelajahi berbagai potensi unggulan yang ada di desa kami, mulai dari pertanian, pariwisata, hingga kerajinan lokal.',
  });

  return (
    <PublicLayout>
      <EditorialHero 
        title="Potensi Desa" 
        subtitle="Jelajahi berbagai potensi unggulan yang ada di desa kami, mulai dari pertanian, pariwisata, hingga kerajinan lokal." 
      />

      <EditorialSection alternate>
        {loading && !potensi.length && <LoadingState message="Memuat potensi desa..." />}
        {error && <ErrorState message={error.message} onRetry={refetch} />}

        {!loading && !error && potensi.length === 0 && (
          <EmptyState
            title="Belum ada data potensi desa"
            message="Data potensi belum ditambahkan."
            icon="document"
          />
        )}

        {!loading && !error && potensi.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 'var(--space-8)' 
          }}>
            {potensi.map((item) => (
              <EditorialCard
                key={item.id}
                title={item.nama}
                description={item.deskripsi ? (item.deskripsi.length > 100 ? `${item.deskripsi.substring(0, 100)}...` : item.deskripsi) : undefined}
                imageUrl={item.gambarUrl || undefined}
                meta={item.kategori}
                href={`/potensi/${item.slug}`}
              />
            ))}
          </div>
        )}
      </EditorialSection>
    </PublicLayout>
  );
}
