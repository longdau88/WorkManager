import { roleRepository } from '../repositories/role.repository.js';
import { SYSTEM_PERMISSIONS } from '../config/db.js';

export const roleService = {
  getSystemPermissions() {
    return SYSTEM_PERMISSIONS;
  },

  async getAllRoles() {
    return await roleRepository.findAll();
  },

  async getRoleById(id) {
    const role = await roleRepository.findById(id);
    if (!role) {
      const err = new Error('Không tìm thấy vai trò');
      err.statusCode = 404;
      throw err;
    }
    return role;
  },

  async createRole(data) {
    const existing = await roleRepository.findByName(data.name);
    if (existing) {
      const err = new Error(`Mã vai trò "${data.name}" đã tồn tại`);
      err.statusCode = 400;
      throw err;
    }

    return await roleRepository.create({
      ...data,
      isSystem: false
    });
  },

  async updateRole(id, data) {
    const role = await roleRepository.findById(id);
    if (!role) {
      const err = new Error('Vai trò không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    return await roleRepository.update(id, data);
  },

  async deleteRole(id) {
    const role = await roleRepository.findById(id);
    if (!role) {
      const err = new Error('Vai trò không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    if (role.isSystem || role.name === 'admin') {
      const err = new Error('Không thể xóa vai trò hệ thống mặc định');
      err.statusCode = 400;
      throw err;
    }

    return await roleRepository.delete(id);
  }
};
