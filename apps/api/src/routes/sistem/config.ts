import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { response } from '../../utils/response.js';

const router = Router();
router.use(authenticateInternal());
router.use(authorize('config.view'));

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  groupName: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  value: z.string().optional(),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
  description: z.string().max(500).optional(),
  isSystem: z.boolean().default(false),
});

const updateSchema = z.object({
  value: z.string().optional(),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).optional(),
  description: z.string().max(500).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  groupName: z.string().optional(),
});

// ============================================
// List configurations with grouping
// ============================================

router.get('/', async (req, res) => {
  try {
    const { page, limit, search, groupName } = querySchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (groupName) where.groupName = groupName;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.configuration.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ groupName: 'asc' }, { key: 'asc' }],
      }),
      prisma.configuration.count({ where }),
    ]);

    // Group configurations
    const grouped: Record<string, any[]> = {};
    data.forEach((item) => {
      const group = item.groupName;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push({
        id: item.id.toString(),
        key: item.key,
        value: item.value,
        valueType: item.value_type,
        description: item.description,
        isSystem: item.isSystem,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
      });
    });

    return response.success(res, {
      data,
      grouped,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Configuration list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get configuration groups
// ============================================

router.get('/groups', async (req, res) => {
  try {
    const groups = await prisma.configuration.groupBy({
      by: ['groupName'],
      _count: true,
      orderBy: { groupName: 'asc' },
    });

    return response.success(res, groups.map(g => ({
      name: g.groupName,
      count: g._count,
    })));
  } catch (err) {
    console.error('Configuration groups error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get one configuration
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.configuration.findUnique({
      where: { id: BigInt(id) },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Konfigurasi tidak ditemukan' });
    }

    return response.success(res, {
      id: item.id.toString(),
      groupName: item.groupName,
      key: item.key,
      value: item.value,
      valueType: item.value_type,
      description: item.description,
      isSystem: item.isSystem,
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
    });
  } catch (err) {
    console.error('Configuration get error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Create
// ============================================

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    // Check if exists
    const existing = await prisma.configuration.findUnique({
      where: {
        groupName_key: {
          groupName: data.groupName,
          key: data.key,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Konfigurasi "${data.groupName}.${data.key}" sudah ada`,
      });
    }

    const created = await prisma.configuration.create({
      data: {
        groupName: data.groupName,
        key: data.key,
        value: data.value || '',
        value_type: data.valueType,
        description: data.description,
        isSystem: data.isSystem,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: created.id.toString(),
        groupName: created.groupName,
        key: created.key,
        value: created.value,
        valueType: created.value_type,
        description: created.description,
        isSystem: created.isSystem,
        createdAt: created.createdAt?.toISOString(),
        updatedAt: created.updatedAt?.toISOString(),
      },
      message: 'Konfigurasi berhasil dibuat',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Configuration create error:', err);
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

    const existing = await prisma.configuration.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Konfigurasi tidak ditemukan' });
    }

    if (existing.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Konfigurasi sistem tidak dapat diubah',
      });
    }

    const updated = await prisma.configuration.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.value !== undefined && { value: data.value }),
        ...(data.valueType !== undefined && { value_type: data.valueType }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return response.success(res, {
      id: updated.id.toString(),
      groupName: updated.groupName,
      key: updated.key,
      value: updated.value,
      valueType: updated.value_type,
      description: updated.description,
      isSystem: updated.isSystem,
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    }, 'Konfigurasi berhasil diperbarui');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Configuration update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Delete
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.configuration.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Konfigurasi tidak ditemukan' });
    }

    if (existing.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Konfigurasi sistem tidak dapat dihapus',
      });
    }

    await prisma.configuration.delete({ where: { id: BigInt(id) } });

    return response.success(res, null, 'Konfigurasi berhasil dihapus');
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Konfigurasi tidak ditemukan' });
    }
    console.error('Configuration delete error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

export default router;
