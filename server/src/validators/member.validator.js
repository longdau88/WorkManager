import { z } from 'zod';

export const createMemberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Tên ngắn không được để trống'),
  fullName: z.string().optional().nullable(),
  email: z.string().email('Email không đúng định dạng'),
  unit: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  deleted: z.boolean().default(false),
  updatedBy: z.string().optional().nullable()
});

export const updateMemberSchema = createMemberSchema.partial();
