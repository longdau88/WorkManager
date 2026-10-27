import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';

export const authService = {
  async login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      const err = new Error('Vui lòng nhập tên đăng nhập và mật khẩu');
      err.statusCode = 400;
      throw err;
    }

    const user = await userRepository.findByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      const err = new Error('Tài khoản hoặc mật khẩu không chính xác');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Tài khoản hoặc mật khẩu không chính xác');
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username,
        roleId: user.roleId,
        roleName: user.role?.name || 'viewer',
        roleDisplayName: user.role?.displayName || 'Người xem',
        permissions: Array.isArray(user.role?.permissions) ? user.role.permissions : [],
        isAdmin: user.role?.name === 'admin' || (user.role?.permissions || []).includes('edit_all_projects')
      }
    };
  },

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      const err = new Error('Tài khoản không tồn tại hoặc đã bị khóa');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      roleId: user.roleId,
      roleName: user.role?.name || 'viewer',
      roleDisplayName: user.role?.displayName || 'Người xem',
      permissions: Array.isArray(user.role?.permissions) ? user.role.permissions : [],
      isAdmin: user.role?.name === 'admin' || (user.role?.permissions || []).includes('edit_all_projects'),
      projectPermissions: user.projectPermissions || []
    };
  },

  async changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('Tài khoản không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      const err = new Error('Mật khẩu cũ không chính xác');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.update(userId, { password: hashedPassword });
    return true;
  }
};
