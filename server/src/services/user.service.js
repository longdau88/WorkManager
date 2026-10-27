import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { roleRepository } from '../repositories/role.repository.js';

export const userService = {
  async getAllUsers() {
    const users = await userRepository.findAll();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      unit: u.unit || '',
      phone: u.phone || '',
      roleId: u.roleId,
      role: u.role ? { id: u.role.id, name: u.role.name, displayName: u.role.displayName } : null,
      isActive: u.isActive,
      createdAt: u.createdAt
    }));
  },

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const err = new Error('Không tìm thấy tài khoản người dùng');
      err.statusCode = 404;
      throw err;
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      unit: user.unit || '',
      phone: user.phone || '',
      roleId: user.roleId,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      projectPermissions: user.projectPermissions || []
    };
  },

  async createUser(data) {
    const existing = await userRepository.findByUsernameOrEmail(data.username);
    if (existing) {
      const err = new Error(`Tên đăng nhập hoặc email "${data.username}" đã tồn tại`);
      err.statusCode = 400;
      throw err;
    }

    const existingEmail = await userRepository.findByUsernameOrEmail(data.email);
    if (existingEmail) {
      const err = new Error(`Email "${data.email}" đã được đăng ký`);
      err.statusCode = 400;
      throw err;
    }

    const role = await roleRepository.findById(data.roleId);
    if (!role) {
      const err = new Error('Vai trò (Role) không tồn tại');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const created = await userRepository.create({
      ...data,
      password: hashedPassword
    });

    return {
      id: created.id,
      username: created.username,
      email: created.email,
      fullName: created.fullName,
      unit: created.unit || '',
      phone: created.phone || '',
      roleId: created.roleId,
      role: created.role,
      isActive: created.isActive
    };
  },

  async updateUser(id, data, currentUserId) {
    const user = await userRepository.findById(id);
    if (!user) {
      const err = new Error('Tài khoản không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    // Do not allow deactivating the main admin user
    if (user.username === 'admin' && data.isActive === false && user.isActive !== false) {
      const err = new Error('Không thể khóa tài khoản quản trị viên mặc định (admin)');
      err.statusCode = 400;
      throw err;
    }

    const updatePayload = {};
    if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
    if (data.email !== undefined) updatePayload.email = data.email.toLowerCase();
    if (data.unit !== undefined) updatePayload.unit = data.unit;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.roleId !== undefined && data.roleId !== user.roleId) {
      // Do not allow changing role of default admin
      if (user.username === 'admin') {
        const err = new Error('Không thể đổi vai trò của tài khoản quản trị viên mặc định (admin luôn giữ vai trò Admin)');
        err.statusCode = 400;
        throw err;
      }
      updatePayload.roleId = data.roleId;
    }
    if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);
    if (data.password && data.password.trim()) {
      updatePayload.password = await bcrypt.hash(data.password.trim(), 10);
    }

    return await userRepository.update(id, updatePayload);
  },

  async deleteUser(id, currentUserId) {
    if (id === currentUserId) {
      const err = new Error('Không thể tự xóa tài khoản của chính mình');
      err.statusCode = 400;
      throw err;
    }

    const user = await userRepository.findById(id);
    if (!user) {
      const err = new Error('Tài khoản không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    if (user.username === 'admin') {
      const err = new Error('Không thể xóa tài khoản quản trị viên mặc định (admin)');
      err.statusCode = 400;
      throw err;
    }

    return await userRepository.delete(id);
  }
};
