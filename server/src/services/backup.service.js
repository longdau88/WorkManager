import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';
import { featureRepository } from '../repositories/feature.repository.js';

const models = ['user', 'role', 'project', 'projectPermission', 'task', 'member', 'field', 'projectGroup', 'category', 'diary', 'ledger', 'worker', 'labor', 'advance', 'contract', 'device', 'comment', 'auditLog', 'check', 'issue', 'receipt', 'guarantee'];

async function snapshot() {
    if (!isPrismaConnected || !prisma) return readFallbackData();
    const result = {};
    for (const model of models) if (prisma[model]) result[model] = await prisma[model].findMany();
    return result;
}

export const backupService = {
    async create(user) {
        await fs.mkdir(env.backupDir, { recursive: true });
        const payload = JSON.stringify({ version: 1, createdAt: new Date().toISOString(), data: await snapshot() }, null, 2);
        const checksum = crypto.createHash('sha256').update(payload).digest('hex');
        const filename = `workmanager-${Date.now()}-${checksum.slice(0, 12)}.json`;
        const filePath = path.join(env.backupDir, filename);
        await fs.writeFile(filePath, payload, 'utf8');
        const metadata = await featureRepository.createBackupMetadata({ id: `bak_${Date.now()}`, filename, path: filePath, checksum, size: Buffer.byteLength(payload), status: 'completed', createdBy: user?.email || '' });
        const files = (await fs.readdir(env.backupDir)).filter(file => file.startsWith('workmanager-')).sort().reverse();
        await Promise.all(files.slice(env.backupRetention).map(file => fs.rm(path.join(env.backupDir, file), { force: true })));
        return metadata;
    },
    async list() { return featureRepository.listBackups(); },
    async read(filename) {
        const safeName = path.basename(filename);
        const payload = await fs.readFile(path.join(env.backupDir, safeName), 'utf8');
        const checksum = crypto.createHash('sha256').update(payload).digest('hex');
        return { payload: JSON.parse(payload), checksum };
    },
    async restore(filename, expectedChecksum) {
        const { payload, checksum } = await this.read(filename);
        if (expectedChecksum && expectedChecksum !== checksum) throw Object.assign(new Error('Checksum backup không khớp.'), { status: 400 });
        if (!payload?.data || typeof payload.data !== 'object') throw Object.assign(new Error('Snapshot backup không hợp lệ.'), { status: 400 });
        if (isPrismaConnected && prisma) {
            const restoreOrder = ['role', 'user', 'project', 'projectPermission', 'field', 'member', 'projectGroup', 'category', 'task', 'diary', 'ledger', 'worker', 'labor', 'advance', 'contract', 'device', 'comment', 'check', 'issue', 'receipt', 'guarantee', 'auditLog'];
            await prisma.$transaction(async tx => {
                for (const model of restoreOrder) {
                    const records = payload.data[model];
                    if (!Array.isArray(records) || !tx[model]) continue;
                    for (const record of records) {
                        const clean = { ...record };
                        ['createdAt', 'updatedAt', 'at', 'readAt', 'lastSeen'].forEach(field => {
                            if (clean[field]) clean[field] = new Date(clean[field]);
                        });
                        await tx[model].upsert({ where: { id: clean.id }, create: clean, update: clean });
                    }
                }
            });
            return { filename, checksum, restoredAt: new Date().toISOString(), mode: 'mysql' };
        }
        writeFallbackData(payload.data);
        return { filename, checksum, restoredAt: new Date().toISOString(), mode: 'fallback' };
    }
};