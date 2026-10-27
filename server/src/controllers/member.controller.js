import { memberService } from '../services/member.service.js';

export const memberController = {
  async getAll(req, res, next) {
    try {
      const data = await memberService.getAllMembers();
      res.json({
        status: 'success',
        message: 'Lấy danh sách thành viên thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await memberService.getMemberById(req.params.id);
      res.json({
        status: 'success',
        message: 'Lấy thông tin thành viên thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      const data = await memberService.saveMember(req.body, userEmail);
      res.status(201).json({
        status: 'success',
        message: 'Thêm thành viên mới thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      const data = await memberService.saveMember({ ...req.body, id: req.params.id }, userEmail);
      res.json({
        status: 'success',
        message: 'Cập nhật thành viên thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      await memberService.deleteMember(req.params.id, userEmail);
      res.json({
        status: 'success',
        message: 'Xoá thành viên thành công',
        data: { id: req.params.id }
      });
    } catch (err) {
      next(err);
    }
  }
};
