import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

export const taskRepository = {
  async findAll({ projectId, includeDeleted = false } = {}) {
    if (isPrismaConnected && prisma) {
      const where = {};
      if (!includeDeleted) where.deleted = false;
      if (projectId && projectId !== 'all') where.projectId = projectId;

      return await prisma.task.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }]
      });
    }

    const data = readFallbackData();
    let list = includeDeleted ? data.tasks : data.tasks.filter(t => !t.deleted);
    if (projectId && projectId !== 'all') {
      list = list.filter(t => t.projectId === projectId);
    }
    return list.sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  },

  async findById(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.task.findUnique({ where: { id } });
    }
    const data = readFallbackData();
    return data.tasks.find(t => t.id === id) || null;
  },

  async upsert(record) {
    const now = new Date();
    const id = record.id || `task_${Date.now()}`;
    const cleanRecord = {
      projectId: record.projectId || null,
      folderId: record.folderId || null,
      title: record.title,
      note: record.note || '',
      status: record.status || 'todo',
      priority: record.priority || 'med',
      progress: typeof record.progress === 'number' ? record.progress : 0,
      sort: typeof record.sort === 'number' ? record.sort : 10,
      startDate: record.startDate || null,
      dueDate: record.dueDate || null,
      assignee: record.assignee || null,
      assigner: record.assigner || null,
      files: record.files || [],
      checklist: Array.isArray(record.checklist) ? record.checklist : (record.checklist ? [record.checklist] : []),
      color: record.color || null,
      doneAt: record.doneAt || (record.status === 'done' ? new Date().toISOString().slice(0, 10) : null),
      deleted: Boolean(record.deleted),
      updatedBy: record.updatedBy || null,
      updatedAt: now
    };

    if (isPrismaConnected && prisma) {
      return await prisma.task.upsert({
        where: { id },
        create: { id, ...cleanRecord, createdAt: now },
        update: cleanRecord
      });
    }

    const data = readFallbackData();
    const index = data.tasks.findIndex(t => t.id === id);
    let result;
    if (index >= 0) {
      result = { ...data.tasks[index], ...cleanRecord, id, updatedAt: now.toISOString() };
      data.tasks[index] = result;
    } else {
      result = { id, ...cleanRecord, createdAt: now.toISOString(), updatedAt: now.toISOString() };
      data.tasks.push(result);
    }
    writeFallbackData(data);
    return result;
  },

  async upsertMany(records) {
    const results = [];
    for (const r of records) {
      results.push(await this.upsert(r));
    }
    return results;
  },

  async delete(id, soft = true) {
    if (soft) {
      return await this.upsert({ id, deleted: true });
    }
    if (isPrismaConnected && prisma) {
      return await prisma.task.delete({ where: { id } });
    }
    const data = readFallbackData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    writeFallbackData(data);
    return true;
  }
};
