import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { response } from '../../utils/response.js';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticateInternal());
router.use(authorize('account.view'));

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  roleIds: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  roleIds: z.array(z.string()).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

// ============================================
// List with pagination & filters
// ============================================

router.get('/', async (req, res) => {
  try {
    const { page, limit, search, status } = querySchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          accountRoles: {
            include: {
              role: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      }),
      prisma.account.count({ where }),
    ]);

    return response.success(res, {
      data: data.map(a => ({
        id: a.id.toString(),
        username: a.username,
        email: a.email,
        status: a.status,
        lastLoginAt: a.lastLoginAt?.toISOString(),
        createdAt: a.createdAt?.toISOString(),
        roles: a.accountRoles.map(ar => ({
          id: ar.role.id.toString(),
          name: ar.role.name,
          code: ar.role.code,
        })),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Account list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get all roles (for dropdown)
// ============================================

router.get('/roles', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, description: true },
    });

    return response.success(res, roles.map(r => ({
      ...r,
      id: r.id.toString(),
    })));
  } catch (err) {
    console.error('Role list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get One
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await prisma.account.findUnique({
      where: { id: BigInt(id) },
      include: {
        accountRoles: {
          include: {
            role: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }

    return response.success(res, {
      id: account.id.toString(),
      username: account.username,
      email: account.email,
      status: account.status,
      lastLoginAt: account.lastLoginAt?.toISOString(),
      createdAt: account.createdAt?.toISOString(),
      roles: account.accountRoles.map(ar => ({
        id: ar.role.id.toString(),
        name: ar.role.name,
        code: ar.role.code,
      })),
    });
  } catch (err) {
    console.error('Account get error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Create
// ============================================

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    // Check if username/email already exists
    const existing = await prisma.account.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.username === data.username
          ? 'Username sudah digunakan'
          : 'Email sudah digunakan',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const account = await prisma.account.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        status: 'ACTIVE',
        ...(data.roleIds?.length ? {
          accountRoles: {
            create: data.roleIds.map(rid => ({ roleId: BigInt(rid) })),
          },
        } : {}),
      },
      include: {
        accountRoles: {
          include: { role: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: account.id.toString(),
        username: account.username,
        email: account.email,
        status: account.status,
        createdAt: account.createdAt?.toISOString(),
        roles: account.accountRoles.map(ar => ({
          id: ar.role.id.toString(),
          name: ar.role.name,
          code: ar.role.code,
        })),
      },
      message: 'Akun berhasil dibuat',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Account create error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Update
// ============================================

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const existing = await prisma.account.findUnique({
      where: { id: BigInt(id) },
      include: { accountRoles: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }

    // Check username/email uniqueness
    if (data.username || data.email) {
      const conflict = await prisma.account.findFirst({
        where: {
          id: { not: BigInt(id) },
          OR: [
            ...(data.username ? [{ username: data.username }] : []),
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: conflict.username === data.username
            ? 'Username sudah digunakan'
            : 'Email sudah digunakan',
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined && data.password !== null) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.status !== undefined) updateData.status = data.status;

    // Update roles if provided
    if (data.roleIds !== undefined) {
      // Delete existing roles
      await prisma.accountRole.deleteMany({
        where: { accountId: BigInt(id) },
      });

      // Create new roles
      if (data.roleIds.length > 0) {
        await prisma.accountRole.createMany({
          data: data.roleIds.map(rid => ({
            accountId: BigInt(id),
            roleId: BigInt(rid),
          })),
        });
      }
    }

    const updated = await prisma.account.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        accountRoles: {
          include: { role: true },
        },
      },
    });

    return response.success(res, {
      id: updated.id.toString(),
      username: updated.username,
      email: updated.email,
      status: updated.status,
      lastLoginAt: updated.lastLoginAt?.toISOString(),
      createdAt: updated.createdAt?.toISOString(),
      roles: updated.accountRoles.map(ar => ({
        id: ar.role.id.toString(),
        name: ar.role.name,
        code: ar.role.code,
      })),
    }, 'Akun berhasil diperbarui');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Account update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Update Status Only
// ============================================

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    const existing = await prisma.account.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }

    const updated = await prisma.account.update({
      where: { id: BigInt(id) },
      data: { status },
    });

    return response.success(res, {
      id: updated.id.toString(),
      username: updated.username,
      email: updated.email,
      status: updated.status,
    }, `Akun berhasil ${status === 'ACTIVE' ? 'diaktifkan' : 'dinonaktifkan'}`);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Account status update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Delete
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-delete
    const currentUserId = req.user?.accountId?.toString();
    if (currentUserId === id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri' });
    }

    const existing = await prisma.account.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }

    await prisma.account.delete({ where: { id: BigInt(id) } });

    return response.success(res, null, 'Akun berhasil dihapus');
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }
    console.error('Account delete error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

export default router;
