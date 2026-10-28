import { backupService } from '../services/backup.service.js';

export const backupController = {
    async list(req, res, next) { try { res.json({ status: 'success', data: await backupService.list() }); } catch (error) { next(error); } },
    async create(req, res, next) { try { res.status(201).json({ status: 'success', data: await backupService.create(req.user) }); } catch (error) { next(error); } },
    async download(req, res, next) { try { const file = await backupService.read(req.params.filename); res.type('application/json').send(JSON.stringify(file.payload)); } catch (error) { next(error); } }
    , async restore(req, res, next) { try { res.json({ status: 'success', data: await backupService.restore(req.params.filename, req.body.checksum) }); } catch (error) { next(error); } }
};