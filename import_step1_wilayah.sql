-- ============================================================
-- STEP 1: Buat Wilayah Lombok Timur, Pringgabaya, Seruni Mumbul
-- ============================================================

-- 1.1 Buat Provinsi Nusa Tenggara Barat (52)
INSERT INTO public.provinsi (kode, nama)
VALUES ('52', 'NUSA TENGGARA BARAT')
ON CONFLICT DO NOTHING;

-- 1.2 Buat Kabupaten Lombok Timur (5203)
INSERT INTO public.kabupaten (provinsi_id, kode, nama)
SELECT p.id, '52.03', 'KABUPATEN LOMBOK TIMUR'
FROM public.provinsi p WHERE p.kode = '52'
ON CONFLICT DO NOTHING;

-- 1.3 Buat Kecamatan Pringgabaya (520303)
INSERT INTO public.kecamatan (kabupaten_id, kode, nama)
SELECT kb.id, '52.03.03', 'PRINGGABAYA'
FROM public.kabupaten kb WHERE kb.kode = '52.03'
ON CONFLICT DO NOTHING;

-- 1.4 Buat Desa Seruni Mumbul (kode berdasarkan NO_KK prefix 520308)
INSERT INTO public.desa (kecamatan_id, kode, nama)
SELECT k.id, '5203082001', 'SERUNI MUMBUL'
FROM public.kecamatan k WHERE k.kode = '52.03.03'
ON CONFLICT DO NOTHING;

-- Verifikasi
SELECT 'Provinsi' as level, nama FROM public.provinsi WHERE kode = '52'
UNION ALL
SELECT 'Kabupaten', nama FROM public.kabupaten WHERE kode = '52.03'
UNION ALL
SELECT 'Kecamatan', nama FROM public.kecamatan WHERE kode = '52.03.03'
UNION ALL
SELECT 'Desa', nama FROM public.desa WHERE kode = '5203082001';
