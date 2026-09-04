import fs from 'fs';
import path from 'path';

const fullSql = fs.readFileSync('apps/api/full_schema_utf8.sql', 'utf8');

const missingEnums = ['ApbdesKategori', 'AgendaStatus', 'SuratMasukStatus', 'DisposisiStatus'];
const missingTables = [
  'umkm',               'blanko',
  'kode_isian_master',  'apbdes',
  'apbdes_item',        'agenda',
  'surat_masuk',        'disposisi',
  'potensi_desa',       'banner',
  'posyandu_kunjungan', 'bumil',
  'kas_umum',           'buku_bank',
  'bansos',             'saran_aduan',
  'mutasi_penduduk'
];

let migrationSql = `-- Migration: 20260904000000_add_desa_modules_and_financial_kode_rekening
-- Consolidated official migration for all secondary village modules, financial kode_rekening, and single-tenant desa_id links.

`;

// 1. Extract Enums
for (const enumName of missingEnums) {
  const regex = new RegExp(`-- CreateEnum\\r?\\nCREATE TYPE "${enumName}" AS ENUM \\([^;]+\\);`, 'g');
  const match = fullSql.match(regex);
  if (match) {
    migrationSql += match[0] + '\n\n';
  }
}

// 2. Extract Tables
for (const table of missingTables) {
  const regex = new RegExp(`-- CreateTable\\r?\\nCREATE TABLE "${table}" \\([\\s\\S]+?\\);`, 'g');
  const match = fullSql.match(regex);
  if (match) {
    migrationSql += match[0] + '\n\n';
  }
}

// 3. Extract Indices for these tables
for (const table of missingTables) {
  const regex = new RegExp(`-- CreateIndex\\r?\\nCREATE (?:UNIQUE )?INDEX "[^"]+" ON "${table}"\\([^;]+\\);`, 'g');
  const matches = fullSql.match(regex);
  if (matches) {
    migrationSql += matches.join('\n\n') + '\n\n';
  }
}

// 4. Extract Foreign Keys where source or target is one of the missing tables, or penanda_tangan
const allAffectedTables = [...missingTables, 'penanda_tangan'];
for (const table of allAffectedTables) {
  const regex = new RegExp(`-- AddForeignKey\\r?\\nALTER TABLE "${table}" ADD CONSTRAINT "[^"]+" FOREIGN KEY \\([^\\)]+\\) REFERENCES [^;]+;`, 'g');
  const matches = fullSql.match(regex);
  if (matches) {
    migrationSql += matches.join('\n\n') + '\n\n';
  }
}

// 5. Add AlterTable for penanda_tangan (pin_hash)
migrationSql += `
-- AlterTable
ALTER TABLE "penanda_tangan" ADD COLUMN IF NOT EXISTS "pin_hash" VARCHAR(255);
`;

const targetDir = 'apps/api/prisma/migrations/20260904000000_add_desa_modules_and_financial_kode_rekening';
fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(path.join(targetDir, 'migration.sql'), migrationSql, 'utf8');

console.log('Migration generated successfully! Length:', migrationSql.length);
