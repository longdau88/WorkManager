import { notificationService } from '../services/notification.service.js';

export const notificationController = {
    async list(req, res, next) { try { res.json({ status: 'success', data: await notificationService.list(req.user.id, { unreadOnly: req.query.unreadOnly === 'true', limit: req.query.limit }) }); } catch (error) { next(error); } },
    async read(req, res, next) { try { res.json({ status: 'success', data: await notificationService.markRead(req.user.id, req.body.ids || []) }); } catch (error) { next(error); } },
    async run(req, res, next) { try { res.json({ status: 'success', data: await notificationService.run() }); } catch (error) { next(error); } }
};