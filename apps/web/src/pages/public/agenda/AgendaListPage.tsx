import { useAgendaList } from '@/hooks/useAgenda';
import { PublicLayout } from '@/layouts';

import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import styles from './AgendaListPage.module.css';

export default function AgendaListPage() {
  const { data: identitas } = useIdentitasDesa();
  const { data: agenda, loading, error, refetch } = useAgendaList();

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: getPageTitle(`Agenda ${villageName}`),
    description: `Jadwal dan kegiatan yang akan dan telah dilaksanakan di ${villageName}.`,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('id-ID', { day: '2-digit' }),
      month: date.toLocaleDateString('id-ID', { month: 'short' }),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <PublicLayout>
      <EditorialHero 
        title="Agenda Desa" 
        subtitle={`Jadwal kegiatan dan acara di ${villageName}`} 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {loading && <LoadingState message="Memuat jadwal agenda..." />}

          {error && (
            <ErrorState
              title="Gagal Memuat Agenda"
              message={error}
              onRetry={refetch}
            />
          )}

          {!loading && !error && agenda.length === 0 && (
            <EmptyState
              title="Belum Ada Agenda"
              message="Saat ini belum ada jadwal kegiatan yang dipublikasikan."
              icon="document"
            />
          )}

          {!loading && !error && agenda.length > 0 && (
            <div className={styles.agendaGrid}>
              {agenda.map((item) => {
                const dateInfo = formatDate(item.tanggalMulai);
                return (
                  <div key={item.id} className={styles.agendaCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.dateBlock}>
                        <div className={styles.dateIcon}>
                          <span className={styles.dateDay}>{dateInfo.day}</span>
                          <span className={styles.dateMonth}>{dateInfo.month}</span>
                        </div>
                        <div className={styles.timeInfo}>
                          <span className={`${styles.badge} ${styles[item.status.toLowerCase()]}`}>
                            {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                          </span>
                          <span className={styles.metaItem}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>schedule</span>
                            {dateInfo.time} - {formatDate(item.tanggalSelesai).time} WIB
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.agendaTitle}>{item.judul}</h3>
                      <p className={styles.agendaDesc}>{item.deskripsi}</p>
                      
                      <div className={styles.metaList}>
                        <div className={styles.metaItem}>
                          <span className="material-icons" style={{ fontSize: '16px' }}>place</span>
                          {item.lokasi}
                        </div>
                        <div className={styles.metaItem}>
                          <span className="material-icons" style={{ fontSize: '16px' }}>groups</span>
                          {item.penyelenggara}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
