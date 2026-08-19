-- ============================================================
-- MITRADESA: BASELINE MIGRATION RECONCILIATION
-- Created: 2026-08-13
--
-- PURPOSE:
-- This script reconciles the existing database with the new baseline migration.
-- Since the database already has ALL tables created via other mechanisms,
-- we mark the baseline as "already applied" to prevent duplicate creation.
--
-- DO NOT RUN THIS ON A FRESH DATABASE - Only for existing databases!
-- ============================================================

-- Step 1: Check if _prisma_migrations table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = '_prisma_migrations') THEN
        -- Create the migration tracking table if it doesn't exist
        CREATE TABLE "_prisma_migrations" (
            "id" SERIAL PRIMARY KEY,
            "checksum" VARCHAR(64),
            "finished_at" TIMESTAMP,
            "migration_name" VARCHAR(255),
            "logs" TEXT,
            "rolled_back_at" TIMESTAMP,
            "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
        RAISE NOTICE '_prisma_migrations table created';
    ELSE
        RAISE NOTICE '_prisma_migrations table already exists';
    END IF;
END $$;

-- Step 2: Clear any existing migration records that might conflict
DELETE FROM "_prisma_migrations"
WHERE migration_name IN (
    '20260812000000_add_cms_models',
    '20260812010000_add_perangkat_desa',
    '20260811000000_add_phase4_reference_tables'
);

-- Step 3: Mark the new baseline migration as already applied
INSERT INTO "_prisma_migrations" ("checksum", "finished_at", "migration_name", "logs", "applied_steps_count")
VALUES (
    'baseline-migration-reconciliation',
    CURRENT_TIMESTAMP,
    '20260813000000_baseline_initial_schema',
    'Marked as applied - database already contains all schema objects',
    1
)
ON CONFLICT DO NOTHING;

-- Step 4: Report current state
DO $$
DECLARE
    migration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migration_count FROM "_prisma_migrations";
    RAISE NOTICE 'Migration reconciliation complete. Total migrations tracked: %', migration_count;
END $$;

-- Step 5: Verify all expected tables exist
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'provinsi', 'kabupaten', 'kecamatan', 'desa', 'identitas_desa',
        'account', 'role', 'permission', 'account_role', 'role_permission',
        'audit_log', 'configuration',
        'penduduk', 'keluarga', 'anggota_keluarga',
        'citizen_verification', 'otp_challenge', 'citizen_session', 'internal_session',
        'perangkat_desa',
        'ref_agama', 'ref_gol_darah', 'ref_status_perkawinan', 'ref_hubungan_keluarga',
        'ref_status_kependudukan', 'ref_pendidikan', 'ref_pekerjaan', 'ref_jabatan_perangkat', 'ref_status_perangkat',
        'kategori', 'berita', 'halaman', 'media'
    ];
    expected_enums TEXT[] := ARRAY[
        'AccountStatus', 'VerificationStatus', 'OtpStatus', 'AuditAction',
        'ActorType', 'ConfigType', 'BeritaStatus', 'HalamanStatus'
    ];
    missing_table TEXT;
    missing_enum TEXT;
BEGIN
    -- Check tables
    FOREACH missing_table IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = missing_table) THEN
            RAISE WARNING 'MISSING TABLE: %', missing_table;
        END IF;
    END LOOP;

    -- Check enums
    FOREACH missing_enum IN ARRAY expected_enums
    LOOP
        IF NOT EXISTS (SELECT FROM pg_type WHERE typname = missing_enum) THEN
            RAISE WARNING 'MISSING ENUM: %', missing_enum;
        END IF;
    END LOOP;

    RAISE NOTICE 'Database verification complete. Check warnings above for missing objects.';
END $$;

-- ============================================================
-- END OF RECONCILIATION SCRIPT
-- ============================================================
