import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { safeFetchJson } from '@/lib/fetch';
import { Button, Select } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './ExportPage.module.css';

// ============================================
// Types
// ============================================

interface ExportOption {
  id: string;
  label: string;
  endpoint: string;
  filename: string;
  fields: { key: string; label: string }[];
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'penduduk',
    label: 'Data Penduduk',
    endpoint: '/penduduk',
    filename: 'penduduk',
    fields: [
      { key: 'nik', label: 'NIK' },
      { key: 'namaLengkap', label: 'Nama Lengkap' },
      { key: 'tempatLahir', label: 'Tempat Lahir' },
      { key: 'tanggalLahir', label: 'Tanggal Lahir' },
      { key: 'jenisKelamin', label: 'Jenis Kelamin' },
      { key: 'alamat', label: 'Alamat' },
      { key: 'rt', label: 'RT' },
      { key: 'rw', label: 'RW' },
      { key: 'dusun', label: 'Dusun' },
      { key: 'telepon', label: 'Telepon' },
      { key: 'statusPerkawinan', label: 'Status Kawin' },
      { key: 'agama', label: 'Agama' },
    ],
  },
  {
    id: 'keluarga',
    label: 'Data Keluarga',
    endpoint: '/keluarga',
    filename: 'keluarga',
    fields: [
      { key: 'noKk', label: 'No. KK' },
      { key: 'alamat', label: 'Alamat' },
      { key: 'rt', label: 'RT' },
      { key: 'rw', label: 'RW' },
      { key: 'dusun', label: 'Dusun' },
      { key: 'kodePos', label: 'Kode Pos' },
    ],
  },
  {
    id: 'mutasi',
    label: 'Mutasi Penduduk',
    endpoint: '/mutasi-penduduk',
    filename: 'mutasi_penduduk',
    fields: [
      { key: 'jenisMutasi', label: 'Jenis Mutasi' },
      { key: 'tanggalMutasi', label: 'Tanggal' },
      { key: 'nik', label: 'NIK' },
      { key: 'namaLengkap', label: 'Nama Lengkap' },
      { key: 'jenisKelamin', label: 'Jenis Kelamin' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
  },
  {
    id: 'bansos',
    label: 'Bantuan Sosial',
    endpoint: '/bansos',
    filename: 'bansos',
    fields: [
      { key: 'nama', label: 'Nama Program' },
      { key: 'jenis', label: 'Jenis' },
      { key: 'tahun', label: 'Tahun' },
      { key: 'periode', label: 'Periode' },
      { key: 'jumlahPenerima', label: 'Jumlah Penerima' },
      { key: 'jumlahDana', label: 'Jumlah Dana' },
    ],
  },
  {
    id: 'lembaga',
    label: 'Organisasi & Lembaga',
    endpoint: '/lembaga',
    filename: 'lembaga',
    fields: [
      { key: 'jenis', label: 'Jenis' },
      { key: 'nama', label: 'Nama' },
      { key: 'deskripsi', label: 'Deskripsi' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    id: 'berita',
    label: 'Berita',
    endpoint: '/berita',
    filename: 'berita',
    fields: [
      { key: 'judul', label: 'Judul' },
      { key: 'kategori', label: 'Kategori' },
      { key: 'status', label: 'Status' },
      { key: 'penulis', label: 'Penulis' },
      { key: 'createdAt', label: 'Tanggal Buat' },
    ],
  },
  {
    id: 'agenda',
    label: 'Agenda',
    endpoint: '/agenda',
    filename: 'agenda',
    fields: [
      { key: 'judul', label: 'Judul' },
      { key: 'lokasi', label: 'Lokasi' },
      { key: 'tanggalMulai', label: 'Mulai' },
      { key: 'tanggalSelesai', label: 'Selesai' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    id: 'umkm',
    label: 'UMKM',
    endpoint: '/umkm',
    filename: 'umkm',
    fields: [
      { key: 'nama', label: 'Nama' },
      { key: 'jenis', label: 'Jenis' },
      { key: 'pemilik', label: 'Pemilik' },
      { key: 'alamat', label: 'Alamat' },
      { key: 'telepon', label: 'Telepon' },
      { key: 'status', label: 'Status' },
    ],
  },
];

export default function ExportPage() {
  const { token } = useAuthStore();

  // ============================================
  // State
  // ============================================
  const [selectedExport, setSelectedExport] = useState<string>('penduduk');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  // ============================================
  // Export Handler
  // ============================================
  const handleExport = async (format: 'csv' | 'json') => {
    const option = EXPORT_OPTIONS.find(o => o.id === selectedExport);
    if (!option) return;

    setLoading(true);
    setProgress('Mengambil data...');

    try {
      // Fetch all data (paginate through)
      const allData: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        setProgress(`Mengambil data halaman ${page}...`);
        const data = await safeFetchJson(`${API_URL}${option.endpoint}?page=${page}&per_page=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!data.success) throw new Error(data.message || 'Gagal mengambil data');
        
        if (data.data && data.data.length > 0) {
          allData.push(...data.data);
          page++;
        } else {
          hasMore = false;
        }
      }

      if (allData.length === 0) {
        alert('Tidak ada data untuk diexport');
        setLoading(false);
        return;
      }

      setProgress(`Memproses ${allData.length} data...`);

      if (format === 'csv') {
        exportToCSV(allData, option);
      } else {
        exportToJSON(allData, option);
      }

      setProgress('Export selesai!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(''), 3000);
    }
  };

  const exportToCSV = (data: any[], option: ExportOption) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Get all keys from the first item
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });

    // Use only defined fields if available, otherwise use all keys
    const headers = option.fields.length > 0
      ? option.fields.map(f => f.label)
      : Array.from(allKeys);

    const rows = data.map(item => {
      return headers.map((_, idx) => {
        const key = option.fields.length > 0 ? option.fields[idx]?.key : Array.from(allKeys)[idx];
        let value = item[key];

        if (key.includes('tanggal') && value) {
          try {
            value = new Date(value as string | number | Date).toLocaleDateString('id-ID');
          } catch (e) {
            console.warn('Invalid date format in export', e);
          }
        }

        // Format nested objects
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }

        return value ?? '';
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${option.filename}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToJSON = (data: any[], option: ExportOption) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadBlob(blob, `${option.filename}_${new Date().toISOString().split('T')[0]}.json`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedOption = EXPORT_OPTIONS.find(o => o.id === selectedExport);

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Export Data</h1>
            <p className={styles.subtitle}>
              Export data ke CSV atau JSON
            </p>
          </div>
        </div>

        {/* Export Options */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pilih Data</h2>

          <div className={styles.selectGroup}>
            <Select
              value={selectedExport}
              onChange={e => setSelectedExport(e.target.value)}
              style={{ width: 300 }}
            >
              {EXPORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </Select>
          </div>

          {selectedOption && (
            <div className={styles.fieldInfo}>
              <h4>Kolom yang akan di-export:</h4>
              <div className={styles.fieldList}>
                {selectedOption.fields.map(f => (
                  <span key={f.key} className={styles.fieldChip}>{f.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Format Export</h2>

          <div className={styles.exportButtons}>
            <Button
              variant="primary"
              onClick={() => handleExport('csv')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Export CSV'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Export JSON'}
            </Button>
          </div>

          {progress && (
            <div className={styles.progress}>
              <span className={styles.spinner}></span>
              {progress}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <h3>Informasi</h3>
          <ul>
            <li>Data akan diambil dari server dan diproses secara lokal</li>
            <li>Export CSV menggunakan format UTF-8 dengan BOM untuk kompatibilitas Excel</li>
            <li>Untuk dataset besar, proses mungkin memerlukan waktu lebih lama</li>
            <li>Export JSON mengembalikan data lengkap dalam format JSON</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
