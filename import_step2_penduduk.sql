-- ============================================================
-- STEP 2: Import Penduduk dan Keluarga
-- ============================================================
-- CSV Columns:
-- PROVINSI,KABUPATEN,KECAMATAN,DESA,DUSUN,RT,NAMA,JENIS_KELAMIN,
-- STATUS_DALAM_KK,NO_KK,NIK,STATUS_PERKAWINAN,TEMPAT_LAHIR,
-- TANGGAL_LAHIR,PENDIDIKAN,PEKERJAAN,PENDAPATAN_BULAN,KEWARGANEGARAAN,
-- AGAMA,SUKU,KEPEMILIKAN_RUMAH,LUAS_RUMAH,JUMLAH_LANTAI,JENIS_LANTAI,
-- JENIS_DINDING,JENIS_ATAP,KEPEMILIKAN_TANAH,LUAS_TANAH,PENERANGAN,
-- SUMBER_ENERGI_MASAK,MCK,SUMBER_AIR,BANTUAN_SOSIAL,BANTUAN_EXTRA,
-- BPJS_KESEHATAN,BPJS_KETENAGAKERJAAN,KEPEMILIKAN_ASET,KONDISI_FISIK,
-- NAMA_IBU,NAMA_BAPAK,GOLONGAN_DARAH

DO $$
DECLARE
    v_desa_id BIGINT;
    v_penduduk_id BIGINT;
    v_keluarga_id BIGINT;
    v_kepala_penduduk_id BIGINT;

    -- Mapping status perkawinan
    v_status_kawin VARCHAR;

    -- Mapping hubungan keluarga
    v_hubungan VARCHAR;

    -- Cursor untuk membaca CSV
    v_rec RECORD;

    -- Counter
    v_count INTEGER := 0;
    v_start_time TIMESTAMP := clock_timestamp();
BEGIN
    -- Ambil desa_id untuk Seruni Mumbul
    SELECT id INTO v_desa_id FROM public.desa WHERE kode = '5203082001';
    IF v_desa_id IS NULL THEN
        RAISE EXCEPTION 'Desa Seruni Mumbul tidak ditemukan. Jalankan Step 1 terlebih dahulu!';
    END IF;

    RAISE NOTICE 'Desa ID: %', v_desa_id;

    -- ============================================================
    -- PHASE A: Import KELUARGA (ambil dulu semua no_kk unique)
    -- ============================================================
    RAISE NOTICE 'PHASE A: Membuat keluarga...';

    -- Buat temporary table untuk tracking keluarga
    CREATE TEMP TABLE IF NOT EXISTS temp_keluarga_map (
        no_kk VARCHAR(20) PRIMARY KEY,
        kepala_id BIGINT
    );

    -- Buat keluarga dari unique NO_KK
    INSERT INTO public.keluarga (no_kk, kepala_id, alamat, rt, rw, dusun, desa_id, created_at, updated_at)
    SELECT DISTINCT
        NO_KK,
        NULL::BIGINT as kepala_id,  -- Akan diupdate nanti
        NULL::TEXT,
        RT,
        NULL::VARCHAR as rw,  -- RW tidak ada di CSV
        DUSUN,
        v_desa_id,
        NOW(),
        NOW()
    FROM pg_read_csv('D:\mitradesa\penduduk.csv')
    WHERE NO_KK IS NOT NULL AND NO_KK != ''
    ON CONFLICT (no_kk) DO NOTHING
    RETURNING id, no_kk;

    -- ============================================================
    -- PHASE B: Import PENDUDUK
    -- ============================================================
    RAISE NOTICE 'PHASE B: Mengimpor penduduk...';

    -- Buat mapping sementara untuk resolve NIK
    CREATE TEMP TABLE IF NOT EXISTS temp_nik_map (
        nama_lengkap VARCHAR,
        nik VARCHAR(16),
        penduduk_id BIGINT
    );

    -- Import penduduk
    FOR v_rec IN
        SELECT * FROM pg_read_csv('D:\mitradesa\penduduk.csv')
        WHERE NIK IS NOT NULL AND NIK != ''
    LOOP
        -- Mapping status perkawinan
        v_status_kawin := CASE TRIM(v_rec.STATUS_PERKAWINAN)
            WHEN 'Belum Kawin' THEN 'BK'
            WHEN 'Kawin' THEN 'K'
            WHEN 'Cerai Hidup' THEN 'CH'
            WHEN 'Cerai Mati' THEN 'CM'
            ELSE 'BK'
        END;

        -- Mapping hubungan keluarga
        v_hubungan := CASE TRIM(v_rec.STATUS_DALAM_KK)
            WHEN 'Anak' THEN 'ANAK'
            WHEN 'Istri' THEN 'ISTRI'
            WHEN 'Suami' THEN 'SUAMI'
            WHEN 'Famili Lain' THEN 'FAMILI'
            WHEN 'Kepala Keluarga' THEN 'KEPALA_KELUARGA'
            WHEN 'Orang Tua' THEN 'ORANG_TUA'
            WHEN 'Mertua' THEN 'MERTUA'
            WHEN 'Cucu' THEN 'CUCU'
            WHEN 'Menantu' THEN 'MENANTU'
            ELSE 'LAINNYA'
        END;

        BEGIN
            -- Insert penduduk
            INSERT INTO public.penduduk (
                nik, nama_lengkap, tempat_lahir, tanggal_lahir,
                jenis_kelamin, gol_darah, agama, status_perkawinan,
                hubungan_keluarga, rt, rw, dusun,
                warga_negara, is_aktif, desa_id,
                created_at, updated_at
            ) VALUES (
                TRIM(v_rec.NIK),
                TRIM(v_rec.NAMA),
                TRIM(v_rec.TEMPAT_LAHIR),
                TO_DATE(TRIM(v_rec.TANGGAL_LAHIR), 'DD/MM/YYYY'),
                TRIM(v_rec.JENIS_KELAMIN),
                NULLIF(TRIM(v_rec.GOLONGAN_DARAH), ''),
                NULLIF(TRIM(v_rec.AGAMA), ''),
                v_status_kawin,
                v_hubungan,
                NULLIF(TRIM(v_rec.RT), ''),
                NULL,  -- RW tidak ada di CSV
                NULLIF(TRIM(v_rec.DUSUN), ''),
                'Indonesia',
                TRUE,
                v_desa_id,
                NOW(),
                NOW()
            )
            ON CONFLICT (nik) DO UPDATE SET
                nama_lengkap = EXCLUDED.nama_lengkap,
                updated_at = NOW()
            RETURNING id INTO v_penduduk_id;

            -- Simpan ke temp table untuk resolve NIK ayah/ibu
            INSERT INTO temp_nik_map (nama_lengkap, nik, penduduk_id)
            VALUES (TRIM(v_rec.NAMA), TRIM(v_rec.NIK), v_penduduk_id);

            v_count := v_count + 1;

            -- Progress log setiap 1000 record
            IF v_count % 1000 = 0 THEN
                RAISE NOTICE 'Sudah导入 % records...', v_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error pada NIK %: %', v_rec.NIK, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Berhasil import % penduduk!', v_count;

    -- ============================================================
    -- PHASE C: Update kepala_id di keluarga
    -- ============================================================
    RAISE NOTICE 'PHASE C: Update kepala_id di keluarga...';

    UPDATE public.keluarga k
    SET kepala_id = p.id
    FROM public.penduduk p
    JOIN pg_read_csv('D:\mitradesa\penduduk.csv') csv
        ON p.nik = TRIM(csv.NIK)
    WHERE k.no_kk = TRIM(csv.NO_KK)
      AND TRIM(csv.STATUS_DALAM_KK) = 'Kepala Keluarga'
      AND k.no_kk IS NOT NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Updated % kepala keluarga!', v_count;

    -- ============================================================
    -- PHASE D: Insert ke anggota_keluarga
    -- ============================================================
    RAISE NOTICE 'PHASE D: Membuat anggota keluarga...';

    INSERT INTO public.anggota_keluarga (keluarga_id, penduduk_id, hubungan, is_aktif, created_at, updated_at)
    SELECT DISTINCT
        kl.id,
        p.id,
        CASE TRIM(csv.STATUS_DALAM_KK)
            WHEN 'Anak' THEN 'ANAK'
            WHEN 'Istri' THEN 'ISTRI'
            WHEN 'Suami' THEN 'SUAMI'
            WHEN 'Famili Lain' THEN 'FAMILI'
            WHEN 'Kepala Keluarga' THEN 'KEPALA_KELUARGA'
            WHEN 'Orang Tua' THEN 'ORANG_TUA'
            WHEN 'Mertua' THEN 'MERTUA'
            WHEN 'Cucu' THEN 'CUCU'
            WHEN 'Menantu' THEN 'MENANTU'
            ELSE 'LAINNYA'
        END,
        TRUE,
        NOW(),
        NOW()
    FROM public.keluarga kl
    JOIN public.penduduk p ON TRUE  -- cross join, filter di WHERE
    JOIN pg_read_csv('D:\mitradesa\penduduk.csv') csv ON p.nik = TRIM(csv.NIK) AND kl.no_kk = TRIM(csv.NO_KK)
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Berhasil membuat % anggota keluarga!', v_count;

    -- Cleanup
    DROP TABLE IF EXISTS temp_nik_map;
    DROP TABLE IF EXISTS temp_keluarga_map;

    RAISE NOTICE 'Import selesai dalam % detik!',
        EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time));

END $$;

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT
    (SELECT COUNT(*) FROM public.penduduk) as total_penduduk,
    (SELECT COUNT(*) FROM public.keluarga) as total_keluarga,
    (SELECT COUNT(*) FROM public.anggota_keluarga) as total_anggota_keluarga,
    (SELECT COUNT(*) FROM public.desa WHERE kode = '5203082001') as desa_id;
