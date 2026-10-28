import { v8Repository } from '../repositories/v8.repository.js';

export const auditService = {
    async list(filters = {}) {
        return v8Repository.findAudit(filters);
    }
};