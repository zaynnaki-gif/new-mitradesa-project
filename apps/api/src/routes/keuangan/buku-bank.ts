import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../services/prisma.js";
import { authenticateInternal, authorize } from "../../middleware/index.js";
import { response, asyncHandler, ApiError } from "../../utils/response.js";
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticateInternal());

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  bank: z.string().min(1, "Bank wajib diisi").max(100),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  uraian: z.string().min(1, "Uraian wajib diisi").max(500),
  kodeBukti: z.string().max(50).optional(),
  debit: z.number().nonnegative().default(0),
  kredit: z.number().nonnegative().default(0),
  rekonsiliasi: z.boolean().default(false),
});

const updateSchema = createSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  tanggalMulai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  tanggalSelesai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// ============================================
// List with pagination & filters
// ============================================

router.get(
  "/",
  authorize("keuangan.view"),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, tanggalMulai, tanggalSelesai } =
      querySchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: Prisma.BukuBankWhereInput = {};

    if (tanggalMulai || tanggalSelesai) {
      where.tanggal = {};
      if (tanggalMulai) where.tanggal.gte = new Date(tanggalMulai);
      if (tanggalSelesai) where.tanggal.lte = new Date(tanggalSelesai);
    }

    if (search) {
      where.OR = [
        { uraian: { contains: search, mode: "insensitive" } },
        { kodeBukti: { contains: search, mode: "insensitive" } },
        { bank: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.bukuBank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal: "desc" },
      }),
      prisma.bukuBank.count({ where }),
    ]);

    return response.success(res, {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),
);

// ============================================
// Create
// ============================================

router.post(
  "/",
  authorize("keuangan.manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);

    // Hitung saldo: get last record up to this date to carry over balance
    const lastRecord = await prisma.bukuBank.findFirst({
      where: { tanggal: { lte: new Date(data.tanggal) } },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    });

    const previousSaldo = lastRecord ? lastRecord.saldo : 0;
    const saldo = previousSaldo + data.debit - data.kredit;

    const created = await prisma.bukuBank.create({
      data: {
        bank: data.bank,
        tanggal: new Date(data.tanggal),
        uraian: data.uraian,
        kodeBukti: data.kodeBukti,
        debit: data.debit,
        kredit: data.kredit,
        saldo: saldo,
        rekonsiliasi: data.rekonsiliasi,
      },
    });

    return response.created(res, created, "Data buku bank berhasil disimpan");
  }),
);

// ============================================
// Update
// ============================================

router.patch(
  "/:id",
  authorize("keuangan.manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const existing = await prisma.bukuBank.findFirst({
      where: { id },
    });
    if (!existing) {
      throw ApiError.notFound("Data tidak ditemukan");
    }

    const updated = await prisma.bukuBank.update({
      where: { id },
      data: {
        ...(data.bank !== undefined && { bank: data.bank }),
        ...(data.tanggal !== undefined && { tanggal: new Date(data.tanggal) }),
        ...(data.uraian !== undefined && { uraian: data.uraian }),
        ...(data.kodeBukti !== undefined && { kodeBukti: data.kodeBukti }),
        ...(data.debit !== undefined && { debit: data.debit }),
        ...(data.kredit !== undefined && { kredit: data.kredit }),
        ...(data.rekonsiliasi !== undefined && {
          rekonsiliasi: data.rekonsiliasi,
        }),
      },
    });

    return response.success(res, updated, "Data berhasil diperbarui");
  }),
);

// ============================================
// Delete
// ============================================

router.delete(
  "/:id",
  authorize("keuangan.manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.bukuBank.findFirst({
      where: { id },
    });
    if (!existing) {
      throw ApiError.notFound("Data tidak ditemukan");
    }

    await prisma.bukuBank.delete({ where: { id } });
    return response.success(res, null, "Data berhasil dihapus");
  }),
);

export default router;
