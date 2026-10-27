import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có tối thiểu 3 ký tự').regex(/^[a-zA-Z0-9_.-]+$/, 'Tên đăng nhập chỉ chứa chữ cái, số, dấu chấm hoặc gạch dưới'),
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
  fullName: z.string().optional().nullable(),
  roleId: z.string().min(1, 'Vui lòng chọn vai trò'),
  isActive: z.boolean().default(true)
});

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().nullable(),
  fullName: z.string().optional().nullable(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});
