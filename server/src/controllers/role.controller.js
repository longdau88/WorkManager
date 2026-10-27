import { roleService } from '../services/role.service.js';

export const roleController = {
  getPermissions(req, res) {
    const data = roleService.getSystemPermissions();
    res.json({
      status: 'success',
      message: 'Lấy danh sách quyền hệ thống thành công',
      data
    });
  },

  async getAll(req, res, next) {
    try {
      const data = await roleService.getAllRoles();
      res.json({
        status: 'success',
        message: 'Lấy danh sách vai trò thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await roleService.getRoleById(req.params.id);
      res.json({
        status: 'success',
        message: 'Lấy thông tin vai trò thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const data = await roleService.createRole(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Tạo vai trò mới thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = await roleService.updateRole(req.params.id, req.body);
      res.json({
        status: 'success',
        message: 'Cập nhật vai trò thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await roleService.deleteRole(req.params.id);
      res.json({
        status: 'success',
        message: 'Xoá vai trò thành công',
        data: { id: req.params.id }
      });
    } catch (err) {
      next(err);
    }
  }
};
