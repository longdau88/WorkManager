import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

export const memberRepository = {
  async findAll({ includeDeleted = false } = {}) {
    if (isPrismaConnected && prisma) {
      return await prisma.member.findMany({
        where: includeDeleted ? {} : { deleted: false },
        orderBy: { name: 'asc' }
      });
    }
    const data = readFallbackData();
    const list = includeDeleted ? data.members : data.members.filter(m => !m.deleted);
    return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
  },

  async findById(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.member.findUnique({ where: { id } });
    }
    const data = readFallbackData();
    return data.members.find(m => m.id === id) || null;
  },

  async findByEmail(email) {
    if (!email) return null;
    const lower = String(email).toLowerCase();
    if (isPrismaConnected && prisma) {
      return await prisma.member.findFirst({
        where: { email: { equals: lower, mode: 'insensitive' } }
      });
    }
    const data = readFallbackData();
    return data.members.find(m => String(m.email || '').toLowerCase() === lower) || null;
  },

  async upsert(record) {
    const now = new Date();
    const id = record.id || `mem_${Date.now()}`;
    const cleanRecord = {
      name: record.name,
      fullName: record.fullName || '',
      email: String(record.email).toLowerCase(),
      unit: record.unit || '',
      phone: record.phone || '',
      deleted: Boolean(record.deleted),
      updatedBy: record.updatedBy || null,
      updatedAt: now
    };

    if (isPrismaConnected && prisma) {
      return await prisma.member.upsert({
        where: { id },
        create: { id, ...cleanRecord, createdAt: now },
        update: cleanRecord
      });
    }

    const data = readFallbackData();
    const index = data.members.findIndex(m => m.id === id);
    let result;
    if (index >= 0) {
      result = { ...data.members[index], ...cleanRecord, id, updatedAt: now.toISOString() };
      data.members[index] = result;
    } else {
      result = { id, ...cleanRecord, createdAt: now.toISOString(), updatedAt: now.toISOString() };
      data.members.push(result);
    }
    writeFallbackData(data);
    return result;
  },

  async delete(id, soft = true) {
    if (soft) {
      return await this.upsert({ id, deleted: true });
    }
    if (isPrismaConnected && prisma) {
      return await prisma.member.delete({ where: { id } });
    }
    const data = readFallbackData();
    data.members = data.members.filter(m => m.id !== id);
    writeFallbackData(data);
    return true;
  }
};
