import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập hoặc email không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống')
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu cũ không được để trống'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự')
});
