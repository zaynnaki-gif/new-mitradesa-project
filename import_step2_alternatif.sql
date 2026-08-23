-- ============================================================
-- ALTERNATIF: Generate INSERT statements dari CSV
-- ============================================================
-- Karena pg_read_csv tidak tersedia, gunakan script Python untuk
-- generate INSERT statements, atau import langsung via Supabase Dashboard

-- ============================================================
-- METODE 1: Via Supabase Dashboard
-- ============================================================
-- 1. Buka https://supabase.com/dashboard
-- 2. Pilih project -> Table Editor -> penduduk
-- 3. Klik "Import data from CSV"
-- 4. Upload file penduduk_transformed.csv

-- ============================================================
-- METODE 2: Via psql command line
-- ============================================================
-- psql "postgresql://postgres:[PASSWORD]@db.psxppjmldyhwrqqyqegg.supabase.co:5432/postgres" \
--   -c "\COPY penduduk(nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, gol_darah, agama, status_perkawinan, hubungan_keluarga, rt, rw, dusun, warga_negara, is_aktif, desa_id, created_at, updated_at) FROM 'D:\mitradesa\penduduk_transformed.csv' WITH (FORMAT csv, HEADER true, NULL '')"

-- ============================================================
-- METODE 3: Via API (batch insert)
-- ============================================================
-- Gunakan script Python di bawah untuk insert via Supabase API

-- ============================================================
-- Template INSERT untuk testing (contoh 5 data pertama)
-- ============================================================
-- Jalankan via Supabase SQL Editor:

INSERT INTO public.penduduk (
    nik, nama_lengkap, tempat_lahir, tanggal_lahir,
    jenis_kelamin, gol_darah, agama, status_perkawinan,
    hubungan_keluarga, rt, rw, dusun,
    warga_negara, is_aktif, desa_id, created_at, updated_at
) VALUES
-- Contoh data (ganti dengan data actual dari CSV)
('5203035003120001', 'Wiwik Ariani Sapura', 'Praubanyar', '2012-03-10', 'Perempuan', 'A', 'Islam', 'BK', 'ANAK', '002', NULL, 'Dames', 'Indonesia', true, 2, NOW(), NOW()),
('5203030408100004', 'Muhamad Taupan Saputra', 'Terara', '2010-08-04', 'Laki-Laki', 'O', 'Islam', 'BK', 'ANAK', '002', NULL, 'Dames', 'Indonesia', true, 2, NOW(), NOW()),
('5203034107740482', 'Kartini', 'Sukadana', '1974-07-01', 'Perempuan', 'O', 'Islam', 'CM', 'FAMILI', '002', NULL, 'Dames', 'Indonesia', true, 2, NOW(), NOW()),
('5203082003170003', 'Edgar Atala Nando', 'Pringgabaya', '2017-03-20', 'Laki-Laki', 'B', 'Islam', 'BK', 'ANAK', '005', NULL, 'Mandar', 'Indonesia', true, 2, NOW(), NOW()),
('5203085405140001', 'Elfariza Haura Ataya', 'Mataram', '2014-05-14', 'Perempuan', 'A', 'Islam', 'BK', 'ANAK', '005', NULL, 'Mandar', 'Indonesia', true, 2, NOW(), NOW())
ON CONFLICT (nik) DO UPDATE SET
    nama_lengkap = EXCLUDED.nama_lengkap,
    updated_at = NOW();
