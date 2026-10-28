import { realtimeService } from '../services/realtime.service.js';
import { featureRepository } from '../repositories/feature.repository.js';

export const realtimeController = {
    stream(req, res) {
        res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        res.flushHeaders?.();
        res.write(`event: ready\ndata: ${JSON.stringify({ userId: req.user.id })}\n\n`);
        realtimeService.addClient(res, req.user.id);
    },
    async heartbeat(req, res, next) { try { const record = await featureRepository.upsertPresence({ id: `presence_${req.user.id}_${req.body.projectId || 'all'}`, userId: req.user.id, projectId: req.body.projectId || null, lastSeen: new Date() }); realtimeService.publish('presence', record); res.json({ status: 'success', data: record }); } catch (error) { next(error); } },
    async presence(req, res, next) { try { res.json({ status: 'success', data: await featureRepository.listPresence(req.query.projectId || null) }); } catch (error) { next(error); } }
};