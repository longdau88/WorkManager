import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

export const projectPermissionRepository = {
  async findByProject(projectId) {
    if (isPrismaConnected && prisma) {
      return await prisma.projectPermission.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, username: true, email: true, fullName: true, role: true }
          }
        }
      });
    }
    const db = readFallbackData();
    const list = (db.projectPermissions || []).filter(p => p.projectId === projectId);
    return list.map(p => {
      const u = (db.users || []).find(x => x.id === p.userId);
      return {
        ...p,
        user: u ? { id: u.id, username: u.username, email: u.email, fullName: u.fullName } : null
      };
    });
  },

  async findByUser(userId) {
    if (isPrismaConnected && prisma) {
      return await prisma.projectPermission.findMany({
        where: { userId },
        include: { project: true }
      });
    }
    const db = readFallbackData();
    return (db.projectPermissions || []).filter(p => p.userId === userId);
  },

  async upsert(projectId, userId, access) {
    const validAccess = ['owner', 'editor', 'viewer'].includes(access) ? access : 'viewer';
    const now = new Date();

    if (isPrismaConnected && prisma) {
      return await prisma.projectPermission.upsert({
        where: {
          projectId_userId: { projectId, userId }
        },
        create: {
          projectId,
          userId,
          access: validAccess
        },
        update: {
          access: validAccess,
          updatedAt: now
        }
      });
    }

    const db = readFallbackData();
    if (!db.projectPermissions) db.projectPermissions = [];
    const idx = db.projectPermissions.findIndex(p => p.projectId === projectId && p.userId === userId);
    let result;
    if (idx >= 0) {
      result = { ...db.projectPermissions[idx], access: validAccess, updatedAt: now.toISOString() };
      db.projectPermissions[idx] = result;
    } else {
      result = {
        id: `pp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        userId,
        access: validAccess,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      db.projectPermissions.push(result);
    }
    writeFallbackData(db);
    return result;
  },

  async remove(projectId, userId) {
    if (isPrismaConnected && prisma) {
      return await prisma.projectPermission.deleteMany({
        where: { projectId, userId }
      });
    }
    const db = readFallbackData();
    if (!db.projectPermissions) db.projectPermissions = [];
    db.projectPermissions = db.projectPermissions.filter(p => !(p.projectId === projectId && p.userId === userId));
    writeFallbackData(db);
    return true;
  },

  async syncProjectPermissions(projectId, permissionsList = []) {
    // permissionsList: [{ userId, access: 'owner'|'editor'|'viewer'|'none' }]
    for (const item of permissionsList) {
      if (!item.userId) continue;
      if (item.access === 'none') {
        await this.remove(projectId, item.userId);
      } else {
        await this.upsert(projectId, item.userId, item.access);
      }
    }
    return await this.findByProject(projectId);
  }
};
