import { z } from 'zod';

export const createRoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Mã vai trò phải có tối thiểu 2 ký tự').regex(/^[a-zA-Z0-9_-]+$/, 'Mã vai trò chỉ chứa chữ cái, số, gạch dưới'),
  displayName: z.string().min(2, 'Tên hiển thị không được để trống'),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).default([])
});

export const updateRoleSchema = z.object({
  displayName: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional()
});
