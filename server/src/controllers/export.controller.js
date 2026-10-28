import { exportService } from '../services/export.service.js';

export const exportController = {
    async docx(req, res, next) { try { res.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document').attachment('workmanager-report.docx').send(await exportService.docx(req.user, req.query.projectId)); } catch (error) { next(error); } },
    async pdf(req, res, next) { try { res.type('application/pdf').attachment('workmanager-report.pdf').send(await exportService.pdf(req.user, req.query.projectId)); } catch (error) { next(error); } }
};