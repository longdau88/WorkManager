import { projectPermissionService } from '../services/projectPermission.service.js';

export const projectPermissionController = {
  async getPermissions(req, res, next) {
    try {
      const data = await projectPermissionService.getProjectPermissions(req.params.projectId);
      res.json({
        status: 'success',
        message: 'Lấy danh sách phân quyền dự án thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async updatePermissions(req, res, next) {
    try {
      const permissionsList = req.body.permissions || [];
      const data = await projectPermissionService.updateProjectPermissions(req.params.projectId, permissionsList);
      res.json({
        status: 'success',
        message: 'Cập nhật phân quyền dự án thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
