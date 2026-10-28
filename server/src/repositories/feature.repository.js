import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

function fallbackList(key) {
    const data = readFallbackData();
    if (!Array.isArray(data[key])) data[key] = [];
    return { data, list: data[key] };
}

export const featureRepository = {
    async createNotification(record) {
        if (isPrismaConnected && prisma?.notification) {
            try {
                return await prisma.notification.create({ data: record });
            } catch (error) {
                if (error.code === 'P2002') return prisma.notification.findUnique({ where: { deliveryKey: record.deliveryKey } });
                throw error;
            }
        }
        const { data, list } = fallbackList('notifications');
        if (list.some(item => item.deliveryKey === record.deliveryKey)) return list.find(item => item.deliveryKey === record.deliveryKey);
        const result = { ...record, createdAt: new Date().toISOString() };
        list.unshift(result);
        writeFallbackData(data);
        return result;
    },

    async listNotifications(userId, { unreadOnly = false, limit = 100 } = {}) {
        const take = Math.min(Number(limit) || 100, 500);
        if (isPrismaConnected && prisma?.notification) {
            return prisma.notification.findMany({
                where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
                orderBy: { createdAt: 'desc' }, take
            });
        }
        const { list } = fallbackList('notifications');
        return list.filter(item => item.userId === userId && (!unreadOnly || !item.readAt)).slice(0, take);
    },

    async markNotificationsRead(userId, ids = []) {
        const readAt = new Date();
        if (isPrismaConnected && prisma?.notification) {
            return prisma.notification.updateMany({ where: { userId, id: { in: ids } }, data: { readAt } });
        }
        const { data, list } = fallbackList('notifications');
        list.forEach(item => { if (item.userId === userId && ids.includes(item.id)) item.readAt = readAt.toISOString(); });
        writeFallbackData(data);
        return { count: ids.length };
    },

    async upsertPresence(record) {
        const normalized = { ...record, projectId: record.projectId || 'all' };
        if (isPrismaConnected && prisma?.presenceSession) {
            return prisma.presenceSession.upsert({
                where: { userId_projectId: { userId: normalized.userId, projectId: normalized.projectId } },
                create: normalized,
                update: { lastSeen: normalized.lastSeen }
            });
        }
        const { data, list } = fallbackList('presenceSessions');
        const index = list.findIndex(item => item.userId === normalized.userId && (item.projectId || 'all') === normalized.projectId);
        if (index >= 0) list[index] = { ...list[index], ...normalized };
        else list.push({ ...normalized, createdAt: new Date().toISOString() });
        writeFallbackData(data);
        return list[index >= 0 ? index : list.length - 1];
    },

    async listPresence(projectId = null, maxAgeMs = 120000) {
        const since = new Date(Date.now() - maxAgeMs);
        const normalizedProjectId = projectId || null;
        if (isPrismaConnected && prisma?.presenceSession) {
            return prisma.presenceSession.findMany({ where: { lastSeen: { gte: since }, ...(normalizedProjectId ? { projectId: normalizedProjectId } : {}) } });
        }
        const { list } = fallbackList('presenceSessions');
        return list.filter(item => new Date(item.lastSeen) >= since && (!normalizedProjectId || (item.projectId || 'all') === normalizedProjectId));
    },

    async createBackupMetadata(record) {
        if (isPrismaConnected && prisma?.backupArtifact) return prisma.backupArtifact.create({ data: record });
        const { data, list } = fallbackList('backups');
        const result = { ...record, createdAt: new Date().toISOString() };
        list.unshift(result);
        writeFallbackData(data);
        return result;
    },

    async listBackups(limit = 50) {
        if (isPrismaConnected && prisma?.backupArtifact) return prisma.backupArtifact.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
        return fallbackList('backups').list.slice(0, limit);
    }
};