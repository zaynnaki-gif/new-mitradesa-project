-- Create _prisma_migrations tracking table
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" SERIAL PRIMARY KEY,
    "checksum" VARCHAR(64),
    "finished_at" TIMESTAMP,
    "migration_name" VARCHAR(255),
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP,
    "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Mark migration as applied
INSERT INTO "_prisma_migrations" ("id", "migration_name", "finished_at", "applied_steps_count")
VALUES (1, '20260811000000_add_phase4_reference_tables', NOW(), 1)
ON CONFLICT DO NOTHING;
