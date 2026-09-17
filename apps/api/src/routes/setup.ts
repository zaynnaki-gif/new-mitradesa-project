import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { runSystemSeed } from '../services/seeder.service';

const router = Router();
const prisma = new PrismaClient();

// Schemas for validation
const SetupSchema = z.object({
  admin: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
  }),
  wilayah: z.object({
    provinsiId: z.string().min(1),
    provinsiNama: z.string().min(1),
    kabupatenId: z.string().min(1),
    kabupatenNama: z.string().min(1),
    kecamatanId: z.string().min(1),
    kecamatanNama: z.string().min(1),
    desaId: z.string().min(1),
    desaNama: z.string().min(1),
  }),
});

/**
 * Check if the application is already configured.
 * It is configured if an IdentitasDesa exists OR an Admin account exists.
 */
async function isConfigured(): Promise<boolean> {
  const desaCount = await prisma.identitasDesa.count();
  if (desaCount > 0) return true;

  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (adminRole) {
    const adminCount = await prisma.accountRole.count({
      where: { roleId: adminRole.id }
    });
    if (adminCount > 0) return true;
  }

  return false;
}

// Check status
router.get('/status', async (req, res) => {
  try {
    const configured = await isConfigured();
    res.json({ configured });
    return;
  } catch (error) {
    console.error('Failed to check setup status', error);
    res.status(500).json({ error: 'Failed to check setup status' });
    return;
  }
});

// Initialize system
router.post('/initialize', async (req, res) => {
  try {
    const configured = await isConfigured();
    if (configured) {
      return res.status(403).json({ error: 'System is already configured' });
    }

    const { admin, wilayah } = SetupSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      // 1. Create DesaConfig and IdentitasDesa
      let provinsi = await tx.provinsi.findUnique({ where: { kode: wilayah.provinsiId } });
      if (!provinsi) {
        provinsi = await tx.provinsi.create({
          data: { kode: wilayah.provinsiId, nama: wilayah.provinsiNama }
        });
      }

      let kabupaten = await tx.kabupaten.findUnique({
        where: { provinsiId_kode: { provinsiId: provinsi.id, kode: wilayah.kabupatenId } }
      });
      if (!kabupaten) {
        kabupaten = await tx.kabupaten.create({
          data: { provinsiId: provinsi.id, kode: wilayah.kabupatenId, nama: wilayah.kabupatenNama }
        });
      }

      let kecamatan = await tx.kecamatan.findUnique({
        where: { kabupatenId_kode: { kabupatenId: kabupaten.id, kode: wilayah.kecamatanId } }
      });
      if (!kecamatan) {
        kecamatan = await tx.kecamatan.create({
          data: { kabupatenId: kabupaten.id, kode: wilayah.kecamatanId, nama: wilayah.kecamatanNama }
        });
      }

      await tx.identitasDesa.create({
        data: {
          namaDesa: wilayah.desaNama,
          kodeDesa: wilayah.desaId,
          // Defaults
          kepalaDesa: admin.name,
          alamat: '-',
          email: '-',
          telepon: '-'
        }
      });

      // 2. Ensure Admin Role exists
      let adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } });
      if (!adminRole) {
        adminRole = await tx.role.create({
          data: { code: 'ADMIN', name: 'Administrator', description: 'System Administrator', isSystem: true }
        });
      }

      // 3. Create Admin Account
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(admin.password, salt);

      const account = await tx.account.create({
        data: {
          username: admin.username,
          email: admin.email,
          passwordHash: hashedPassword,
          status: 'ACTIVE'
        }
      });

      // 4. Assign Role
      await tx.accountRole.create({
        data: {
          accountId: account.id,
          roleId: adminRole.id
        }
      });

      // 5. Run System Seed for Reference Data, Configurations, and other Roles/Permissions
      await runSystemSeed(tx);
    });

    res.json({ success: true, message: 'System successfully initialized' });
    return;
  } catch (error) {
    console.error('Setup initialization failed', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    } else {
      res.status(500).json({ error: 'Failed to initialize system' });
      return;
    }
  }
});

export default router;
