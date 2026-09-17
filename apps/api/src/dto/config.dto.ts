import { z } from 'zod';

export const createSchema = z.object({
  groupName: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  value: z.string().optional(),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
  description: z.string().max(500).optional(),
  isSystem: z.boolean().default(false),
});

export const updateSchema = z.object({
  value: z.string().optional(),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).optional(),
  description: z.string().max(500).optional(),
});

export const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  groupName: z.string().optional(),
  groupname: z.string().optional(),
}).transform((val) => ({
  ...val,
  groupName: val.groupName || val.groupname,
}));
