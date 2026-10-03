import { useState } from 'react';
import { PublicLayout } from '@/layouts';
import { Button, Input } from '@/components/ui';
import { useSEO } from '@/hooks/useSeo';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from './SaranPublicPage.module.css';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';

export function SaranPublicPage() {
  const { data: identitas } = useIdentitasDesa();
  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: `Layanan Saran & Aduan - ${villageName}`,
    description: `Sampaikan saran, aduan, atau aspirasi Anda untuk kemajuan ${villageName}.`,
  });

  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    kategori: 'SARAN',
    namaPengirim: '',
    emailPengirim: '',
    teleponPengirim: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await safeFetchJson(`${API_URL}/saran-aduan/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.success) {
        setIsSuccess(true);
        setFormData({
          judul: '',
          isi: '',
          kategori: 'SARAN',
          namaPengirim: '',
          emailPengirim: '',
          teleponPengirim: '',
        });
      } else {
        setError(response.message || 'Gagal mengirim saran/aduan. Silakan coba lagi.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Layanan Saran & Aduan</h1>
          <p className={styles.subtitle}>
            Kami mendengarkan suara Anda. Sampaikan saran, aduan, atau aspirasi untuk membangun {villageName} yang lebih baik.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.formCard}>
            {isSuccess ? (
              <div className={styles.successMessage}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3>Terima Kasih!</h3>
                <p>Saran/Aduan Anda telah berhasil dikirim dan akan segera diproses oleh perangkat desa.</p>
                <Button onClick={() => setIsSuccess(false)} style={{ marginTop: '1rem' }}>
                  Kirim Pesan Lain
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Jenis Pesan <span>*</span></label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio" 
                        name="kategori" 
                        value="SARAN" 
                        checked={formData.kategori === 'SARAN'}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      />
                      Saran
                    </label>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio" 
                        name="kategori" 
                        value="ADUAN" 
                        checked={formData.kategori === 'ADUAN'}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      />
                      Aduan
                    </label>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio" 
                        name="kategori" 
                        value="ASPIRASI" 
                        checked={formData.kategori === 'ASPIRASI'}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      />
                      Aspirasi
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Judul Pesan <span>*</span></label>
                  <Input 
                    placeholder="Contoh: Perbaikan Jalan di RT 01" 
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Isi Pesan <span>*</span></label>
                  <textarea 
                    placeholder="Jelaskan secara detail saran atau aduan Anda..." 
                    value={formData.isi}
                    onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                    required
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border-color)',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ margin: '2rem 0', borderTop: '1px solid var(--border-color)' }}></div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Opsional: Tinggalkan kontak Anda jika ingin dihubungi terkait tindak lanjut dari pesan ini.
                </p>

                <div className={styles.formGroup}>
                  <label>Nama Lengkap</label>
                  <Input 
                    placeholder="Nama Anda" 
                    value={formData.namaPengirim}
                    onChange={(e) => setFormData({ ...formData, namaPengirim: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <Input 
                    type="email"
                    placeholder="email@contoh.com" 
                    value={formData.emailPengirim}
                    onChange={(e) => setFormData({ ...formData, emailPengirim: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nomor HP / WhatsApp</label>
                  <Input 
                    placeholder="08xxxxxxxxxx" 
                    value={formData.teleponPengirim}
                    onChange={(e) => setFormData({ ...formData, teleponPengirim: e.target.value })}
                  />
                </div>

                <Button 
                  type="submit" 
                  loading={isSubmitting} 
                  style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}
                >
                  Kirim Pesan
                </Button>
              </form>
            )}
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Informasi Layanan
            </h3>
            
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div className={styles.infoText}>
                  <h4>Kerahasiaan Terjamin</h4>
                  <p>Identitas Anda akan dirahasiakan dan hanya digunakan untuk keperluan tindak lanjut (jika Anda mencantumkannya).</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className={styles.infoText}>
                  <h4>Respon Cepat</h4>
                  <p>Setiap aduan yang masuk akan ditinjau oleh perangkat desa maksimal dalam 3x24 jam hari kerja.</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </div>
                <div className={styles.infoText}>
                  <h4>Sopan & Jelas</h4>
                  <p>Gunakan bahasa yang sopan dan sertakan detail lokasi atau kejadian agar kami dapat menindaklanjutinya dengan tepat.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
