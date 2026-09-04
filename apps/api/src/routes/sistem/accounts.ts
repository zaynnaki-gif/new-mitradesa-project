import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { authenticateInternal, authorize, authorizeAny } from '../../middleware/index.js';
import { response, asyncHandler, ApiError } from '../../utils/response.js';
import bcrypt from 'bcrypt';

const router = Router();
router.use(authenticateInternal());
router.use(authorizeAny('account.view', 'account.view_all'));

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

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status } = querySchema.parse(req.query);

  const skip = (page - 1) * limit;
  const where: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

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
}));

// ============================================
// Get all roles (for dropdown)
// ============================================

router.get('/roles', asyncHandler(async (req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, description: true },
  });

  return response.success(res, roles.map(r => ({
    ...r,
    id: r.id.toString(),
  })));
}));

// ============================================
// Get One
// ============================================

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
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
    throw ApiError.notFound('Akun tidak ditemukan');
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
}));

// ============================================
// Create
// ============================================

router.post('/', authorize('account.create'), asyncHandler(async (req: Request, res: Response) => {
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
    const msg = existing.username === data.username
      ? 'Username sudah digunakan'
      : 'Email sudah digunakan';
    throw ApiError.badRequest(msg);
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

  return response.created(res, {
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
  }, 'Akun berhasil dibuat');
}));

// ============================================
// Update
// ============================================

router.patch('/:id', authorize('account.update'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.account.findUnique({
    where: { id: BigInt(id) },
    include: { accountRoles: true },
  });

  if (!existing) {
    throw ApiError.notFound('Akun tidak ditemukan');
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
      const msg = conflict.username === data.username
        ? 'Username sudah digunakan'
        : 'Email sudah digunakan';
      throw ApiError.badRequest(msg);
    }
  }

  // Prepare update data
  const updateData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (data.username !== undefined) updateData.username = data.username;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.password !== undefined && data.password !== null) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }
  if (data.status !== undefined) updateData.status = data.status;

  // Transaction array
  const transactions = [];

  // Update roles if provided
  if (data.roleIds !== undefined) {
    // Delete existing roles
    transactions.push(
      prisma.accountRole.deleteMany({
        where: { accountId: BigInt(id) },
      })
    );

    // Create new roles
    if (data.roleIds.length > 0) {
      transactions.push(
        prisma.accountRole.createMany({
          data: data.roleIds.map(rid => ({
            accountId: BigInt(id),
            roleId: BigInt(rid),
          })),
        })
      );
    }
  }

  transactions.push(
    prisma.account.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        accountRoles: {
          include: { role: true },
        },
      },
    })
  );

  const results = await prisma.$transaction(transactions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = results[results.length - 1] as any;

  return response.success(res, {
    id: updated.id.toString(),
    username: updated.username,
    email: updated.email,
    status: updated.status,
    lastLoginAt: updated.lastLoginAt?.toISOString(),
    createdAt: updated.createdAt?.toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roles: updated.accountRoles.map((ar: any) => ({
      id: ar.role.id.toString(),
      name: ar.role.name,
      code: ar.role.code,
    })),
  }, 'Akun berhasil diperbarui');
}));

// ============================================
// Update Status Only
// ============================================

router.patch('/:id/status', authorize('account.update'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = updateStatusSchema.parse(req.body);

  const existing = await prisma.account.findUnique({ where: { id: BigInt(id) } });
  if (!existing) {
    throw ApiError.notFound('Akun tidak ditemukan');
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
}));

// ============================================
// Delete
// ============================================

router.delete('/:id', authorize('account.delete'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-delete
    const currentUserId = req.user?.accountId?.toString();
    if (currentUserId === id) {
      throw ApiError.badRequest('Tidak dapat menghapus akun sendiri');
    }

    const existing = await prisma.account.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      throw ApiError.notFound('Akun tidak ditemukan');
    }

    await prisma.account.delete({ where: { id: BigInt(id) } });

    return response.success(res, null, 'Akun berhasil dihapus');
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (err?.code === 'P2025') {
      throw ApiError.notFound('Akun tidak ditemukan');
    }
    throw err;
  }
}));

export default router;
