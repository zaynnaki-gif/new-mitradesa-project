-- DropForeignKey
ALTER TABLE "kategori" DROP CONSTRAINT IF EXISTS "kategori_desaId_fkey";

-- DropForeignKey
ALTER TABLE "halaman" DROP CONSTRAINT IF EXISTS "halaman_desaId_fkey";

-- DropForeignKey
ALTER TABLE "umkm" DROP CONSTRAINT IF EXISTS "umkm_desaId_fkey";

-- DropForeignKey
ALTER TABLE "agenda" DROP CONSTRAINT IF EXISTS "agenda_desaId_fkey";

-- DropForeignKey
ALTER TABLE "banner" DROP CONSTRAINT IF EXISTS "banner_desaId_fkey";

-- AlterTable
ALTER TABLE "kategori" DROP COLUMN IF EXISTS "desaId";

-- AlterTable
ALTER TABLE "halaman" DROP COLUMN IF EXISTS "desaId";

-- AlterTable
ALTER TABLE "umkm" DROP COLUMN IF EXISTS "desaId";

-- AlterTable
ALTER TABLE "agenda" DROP COLUMN IF EXISTS "desaId";

-- AlterTable
ALTER TABLE "banner" DROP COLUMN IF EXISTS "desaId";
