import { userService } from '../services/user.service.js';

export const userController = {
  async getAll(req, res, next) {
    try {
      const data = await userService.getAllUsers();
      res.json({
        status: 'success',
        message: 'Lấy danh sách người dùng thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await userService.getUserById(req.params.id);
      res.json({
        status: 'success',
        message: 'Lấy thông tin người dùng thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const data = await userService.createUser(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Tạo tài khoản mới thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = await userService.updateUser(req.params.id, req.body, req.user.id);
      res.json({
        status: 'success',
        message: 'Cập nhật tài khoản thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user.id);
      res.json({
        status: 'success',
        message: 'Xoá tài khoản thành công',
        data: { id: req.params.id }
      });
    } catch (err) {
      next(err);
    }
  }
};
