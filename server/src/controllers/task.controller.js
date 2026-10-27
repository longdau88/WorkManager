import { taskService } from '../services/task.service.js';

export const taskController = {
  async getAll(req, res, next) {
    try {
      const data = await taskService.getTasks(req.query.projectId);
      res.json({
        status: 'success',
        message: 'Lấy danh sách công việc thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await taskService.getTaskById(req.params.id);
      res.json({
        status: 'success',
        message: 'Lấy thông tin công việc thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      const data = await taskService.saveTask(req.body, userEmail);
      res.status(201).json({
        status: 'success',
        message: 'Tạo công việc mới thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      const data = await taskService.saveTask({ ...req.body, id: req.params.id }, userEmail);
      res.json({
        status: 'success',
        message: 'Cập nhật công việc thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      await taskService.deleteTask(req.params.id, userEmail);
      res.json({
        status: 'success',
        message: 'Xoá công việc thành công',
        data: { id: req.params.id }
      });
    } catch (err) {
      next(err);
    }
  }
};
