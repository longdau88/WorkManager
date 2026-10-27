import { syncService } from '../services/sync.service.js';

export const syncController = {
  async getBootstrap(req, res, next) {
    try {
      const data = await syncService.getBootstrapData(req.user);
      res.json({
        status: 'success',
        message: 'Lấy dữ liệu khởi tạo thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async syncBatch(req, res, next) {
    try {
      const ops = req.body.ops || [];
      const data = await syncService.applySyncOps(ops, req.user);
      res.json({
        status: 'success',
        message: 'Đồng bộ dữ liệu thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
