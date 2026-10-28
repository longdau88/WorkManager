import { netlabService } from '../services/netlab.service.js';

export const netlabController = {
  async get(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = await netlabService.getNetlabByProject(projectId, req.user);
      res.json({
        status: 'success',
        message: 'Lấy dữ liệu sơ đồ mạng NetLab thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async save(req, res, next) {
    try {
      const { projectId } = req.params;
      // Body can be { data: { ... } } or the netlab object directly
      const netlabData = req.body.data !== undefined ? req.body.data : req.body;
      const result = await netlabService.saveNetlabByProject(projectId, netlabData, req.user);
      res.json({
        status: 'success',
        message: 'Lưu sơ đồ mạng NetLab vào cơ sở dữ liệu thành công',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

