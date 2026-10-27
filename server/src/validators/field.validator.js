import { z } from 'zod';

export const createFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Tên trường không được để trống'),
  type: z.enum(['text', 'number', 'date', 'select']).default('text'),
  unit: z.string().optional().nullable(),
  group: z.string().default('Thông tin chung'),
  options: z.string().optional().nullable(),
  sort: z.number().default(10),
  deleted: z.boolean().default(false),
  updatedBy: z.string().optional().nullable()
});

export const updateFieldSchema = createFieldSchema.partial();
