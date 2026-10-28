import { auditService } from '../services/audit.service.js';

export const auditController = {
    async list(req, res, next) {
        try {
            const data = await auditService.list({
                type: req.query.type || '',
                recId: req.query.recId || '',
                projectId: req.query.projectId || '',
                action: req.query.action || '',
                limit: req.query.limit || 400
            });
            res.json({
                status: 'success',
                message: 'Lấy lịch sử thay đổi thành công',
                data
            });
        } catch (err) {
            next(err);
        }
    }
};