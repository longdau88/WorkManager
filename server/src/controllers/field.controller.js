import { fieldService } from '../services/field.service.js';

export const fieldController = {
  async getAll(req, res, next) {
    try {
      const data = await fieldService.getAllFields();
      res.json({
        status: 'success',
        message: 'Lấy danh sách trường thông tin thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await fieldService.getFieldById(req.params.id);
      res.json({
        status: 'success',
        message: 'Lấy thông tin trường thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      const data = await fieldService.saveField(req.body, userEmail);
      res.status(201).json({
        status: 'success',
        message: 'Thêm trường thông tin mới thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      const data = await fieldService.saveField({ ...req.body, id: req.params.id }, userEmail);
      res.json({
        status: 'success',
        message: 'Cập nhật trường thông tin thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      await fieldService.deleteField(req.params.id, userEmail);
      res.json({
        status: 'success',
        message: 'Xoá trường thông tin thành công',
        data: { id: req.params.id }
      });
    } catch (err) {
      next(err);
    }
  }
};
