import { z } from 'zod';

export const createSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  roleIds: z.array(z.string()).optional(),
});

export const updateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  roleIds: z.array(z.string()).optional(),
});

export const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
