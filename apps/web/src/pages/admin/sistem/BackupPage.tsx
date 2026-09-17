import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';

export const BackupPage: React.FC = () => {
  const { token } = useAuthStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      setMessage(null);
      
      const response = await fetch(`${API_URL}/sistem/backup/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal mengunduh backup');
      }

      const blob = await response.blob();

      // Extract filename from Content-Disposition header if available
      let filename = `backup-mitradesa-${new Date().toISOString().slice(0, 10)}.sql`;
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create blob link to download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup berhasil diunduh' });
    } catch (error) {
      console.error('Backup error:', error);
      setMessage({ type: 'error', text: 'Gagal mengunduh backup database' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0 }}>💾 Backup & Restore Database</h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>Amankan data sistem desa dengan melakukan pencadangan database secara rutin.</p>
      </div>

      {message && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '0.375rem', 
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Pencadangan (Backup)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
              Unduh salinan penuh dari seluruh data aplikasi (penduduk, surat, administrasi, dll). 
              Sangat disarankan untuk melakukan backup setiap minggu dan menyimpannya di tempat yang aman (seperti Flashdisk atau Cloud Storage).
            </p>
            
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Format: PostgreSQL SQL Dump</span>
              <Button 
                onClick={handleDownloadBackup} 
                disabled={isDownloading}
              >
                {isDownloading ? 'Memproses...' : '📥 Unduh Backup'}
              </Button>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Pemulihan (Restore)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.375rem', padding: '1rem', display: 'flex', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>⚠️ Informasi Pemulihan</p>
                <p>
                  Untuk alasan keamanan dan stabilitas data, proses pemulihan (restore) tidak dapat dilakukan langsung melalui antarmuka web.
                  Silakan hubungi teknisi atau administrator server desa untuk melakukan proses restore menggunakan perintah <code style={{ backgroundColor: '#fef3c7', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>psql</code>.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
