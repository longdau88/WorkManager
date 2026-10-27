import { prisma, isPrismaConnected, readFallbackData, writeFallbackData, DEFAULT_FIELDS } from '../config/db.js';

export const fieldRepository = {
  async findAll({ includeDeleted = false } = {}) {
    if (isPrismaConnected && prisma) {
      return await prisma.field.findMany({
        where: includeDeleted ? {} : { deleted: false },
        orderBy: [{ sort: 'asc' }, { label: 'asc' }]
      });
    }
    const data = readFallbackData();
    const list = includeDeleted ? data.fields : data.fields.filter(f => !f.deleted);
    return list.sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  },

  async findById(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.field.findUnique({ where: { id } });
    }
    const data = readFallbackData();
    return data.fields.find(f => f.id === id) || null;
  },

  async upsert(record) {
    const now = new Date();
    const id = record.id || `f_${Date.now()}`;
    const cleanRecord = {
      label: record.label,
      type: record.type || 'text',
      unit: record.unit || '',
      group: record.group || 'Thông tin chung',
      options: record.options || '',
      sort: typeof record.sort === 'number' ? record.sort : 10,
      deleted: Boolean(record.deleted),
      updatedBy: record.updatedBy || null,
      updatedAt: now
    };

    if (isPrismaConnected && prisma) {
      return await prisma.field.upsert({
        where: { id },
        create: { id, ...cleanRecord, createdAt: now },
        update: cleanRecord
      });
    }

    const data = readFallbackData();
    const index = data.fields.findIndex(f => f.id === id);
    let result;
    if (index >= 0) {
      result = { ...data.fields[index], ...cleanRecord, id, updatedAt: now.toISOString() };
      data.fields[index] = result;
    } else {
      result = { id, ...cleanRecord, createdAt: now.toISOString(), updatedAt: now.toISOString() };
      data.fields.push(result);
    }
    writeFallbackData(data);
    return result;
  },

  async delete(id, soft = true) {
    if (soft) {
      return await this.upsert({ id, deleted: true });
    }
    if (isPrismaConnected && prisma) {
      return await prisma.field.delete({ where: { id } });
    }
    const data = readFallbackData();
    data.fields = data.fields.filter(f => f.id !== id);
    writeFallbackData(data);
    return true;
  }
};
