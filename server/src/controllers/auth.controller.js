import { authService } from '../services/auth.service.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const data = await authService.login(username, password);
      res.json({
        status: 'success',
        message: 'Đăng nhập thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const data = await authService.getMe(req.user.id);
      res.json({
        status: 'success',
        message: 'Lấy thông tin tài khoản thành công',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, oldPassword, newPassword);
      res.json({
        status: 'success',
        message: 'Đổi mật khẩu thành công',
        data: null
      });
    } catch (err) {
      next(err);
    }
  }
};
