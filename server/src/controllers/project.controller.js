import { projectService } from '../services/project.service.js';

export const projectController = {
  async getAll(req, res, next) {
    try {
      const data = await projectService.getAllProjects(req.user);
      res.json({
        status: 'success',
        message: 'Lấy danh sách dự án thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await projectService.getProjectById(req.params.id);
      res.json({
        status: 'success',
        message: 'Lấy thông tin dự án thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const data = await projectService.saveProject(req.body, req.user);
      res.status(201).json({
        status: 'success',
        message: 'Tạo dự án mới thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = await projectService.saveProject({ ...req.body, id: req.params.id }, req.user);
      res.json({
        status: 'success',
        message: 'Cập nhật dự án thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id, req.user);
      res.json({
        status: 'success',
        message: 'Xoá dự án thành công',
        data: { id: req.params.id }
      });
    } catch (err) {
      next(err);
    }
  }
};
