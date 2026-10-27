import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

export const projectRepository = {
  async findAll({ includeDeleted = false, userId = null, isAdmin = true } = {}) {
    if (isPrismaConnected && prisma) {
      const where = {};
      if (!includeDeleted) where.deleted = false;
      if (!isAdmin && userId) {
        where.projectPermissions = {
          some: { userId }
        };
      }

      return await prisma.project.findMany({
        where,
        include: {
          projectPermissions: {
            include: {
              user: {
                select: { id: true, username: true, fullName: true, email: true }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    const data = readFallbackData();
    let list = includeDeleted ? data.projects : data.projects.filter(p => !p.deleted);
    if (!isAdmin && userId) {
      const allowedProjIds = new Set((data.projectPermissions || []).filter(pp => pp.userId === userId).map(pp => pp.projectId));
      list = list.filter(p => allowedProjIds.has(p.id));
    }
    return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
  },

  async findById(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.project.findUnique({
        where: { id },
        include: {
          projectPermissions: {
            include: {
              user: {
                select: { id: true, username: true, fullName: true, email: true }
              }
            }
          }
        }
      });
    }
    const data = readFallbackData();
    const p = data.projects.find(x => x.id === id);
    if (!p) return null;
    const permissions = (data.projectPermissions || []).filter(pp => pp.projectId === id);
    return { ...p, projectPermissions: permissions };
  },

  async upsert(record) {
    const now = new Date();
    const id = record.id || `proj_${Date.now()}`;
    const cleanRecord = {
      name: record.name,
      color: record.color || '#2563eb',
      note: record.note || '',
      dueDate: record.dueDate || null,
      info: record.info || {},
      folders: record.folders || [],
      files: record.files || [],
      deleted: Boolean(record.deleted),
      updatedBy: record.updatedBy || null,
      updatedAt: now
    };

    if (isPrismaConnected && prisma) {
      return await prisma.project.upsert({
        where: { id },
        create: { id, ...cleanRecord, createdAt: now },
        update: cleanRecord
      });
    }

    const data = readFallbackData();
    const index = data.projects.findIndex(p => p.id === id);
    let result;
    if (index >= 0) {
      result = { ...data.projects[index], ...cleanRecord, id, updatedAt: now.toISOString() };
      data.projects[index] = result;
    } else {
      result = { id, ...cleanRecord, createdAt: now.toISOString(), updatedAt: now.toISOString() };
      data.projects.push(result);
    }
    writeFallbackData(data);
    return result;
  },

  async delete(id, soft = true) {
    if (soft) {
      return await this.upsert({ id, deleted: true });
    }
    if (isPrismaConnected && prisma) {
      return await prisma.project.delete({ where: { id } });
    }
    const data = readFallbackData();
    data.projects = data.projects.filter(p => p.id !== id);
    writeFallbackData(data);
    return true;
  }
};
