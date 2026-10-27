import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

export const userRepository = {
  async findAll() {
    if (isPrismaConnected && prisma) {
      return await prisma.user.findMany({
        include: {
          role: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    const data = readFallbackData();
    return (data.users || []).map(u => ({
      ...u,
      role: (data.roles || []).find(r => r.id === u.roleId) || null
    }));
  },

  async findById(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          role: true,
          projectPermissions: {
            include: { project: true }
          }
        }
      });
    }
    const data = readFallbackData();
    const u = (data.users || []).find(x => x.id === id);
    if (!u) return null;
    return {
      ...u,
      role: (data.roles || []).find(r => r.id === u.roleId) || null,
      projectPermissions: (data.projectPermissions || []).filter(p => p.userId === u.id)
    };
  },

  async findByUsernameOrEmail(identifier) {
    const val = String(identifier).trim().toLowerCase();
    if (isPrismaConnected && prisma) {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { username: val },
            { email: val }
          ]
        },
        include: {
          role: true,
          projectPermissions: true
        }
      });
    }
    const data = readFallbackData();
    const u = (data.users || []).find(x => x.username.toLowerCase() === val || x.email.toLowerCase() === val);
    if (!u) return null;
    return {
      ...u,
      role: (data.roles || []).find(r => r.id === u.roleId) || null,
      projectPermissions: (data.projectPermissions || []).filter(p => p.userId === u.id)
    };
  },

  async create(data) {
    const id = data.id || `usr_${Date.now()}`;
    const clean = {
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      password: data.password,
      fullName: data.fullName || '',
      unit: data.unit || '',
      phone: data.phone || '',
      roleId: data.roleId,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    };

    if (isPrismaConnected && prisma) {
      return await prisma.user.create({
        data: { id, ...clean },
        include: { role: true }
      });
    }

    const db = readFallbackData();
    const newUser = { id, ...clean, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!db.users) db.users = [];
    db.users.push(newUser);
    writeFallbackData(db);
    return { ...newUser, role: (db.roles || []).find(r => r.id === clean.roleId) || null };
  },

  async update(id, data) {
    if (isPrismaConnected && prisma) {
      return await prisma.user.update({
        where: { id },
        data,
        include: { role: true }
      });
    }

    const db = readFallbackData();
    const idx = (db.users || []).findIndex(u => u.id === id);
    if (idx < 0) return null;
    db.users[idx] = { ...db.users[idx], ...data, updatedAt: new Date().toISOString() };
    writeFallbackData(db);
    return { ...db.users[idx], role: (db.roles || []).find(r => r.id === db.users[idx].roleId) || null };
  },

  async delete(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.user.delete({ where: { id } });
    }
    const db = readFallbackData();
    db.users = (db.users || []).filter(u => u.id !== id);
    db.projectPermissions = (db.projectPermissions || []).filter(p => p.userId !== id);
    writeFallbackData(db);
    return true;
  }
};
