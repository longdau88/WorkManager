import { prisma, isPrismaConnected, readFallbackData, writeFallbackData, DEFAULT_ROLES } from '../config/db.js';

export const roleRepository = {
  async findAll() {
    if (isPrismaConnected && prisma) {
      return await prisma.role.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });
    }
    const db = readFallbackData();
    const roles = db.roles || DEFAULT_ROLES;
    return roles.map(r => ({
      ...r,
      _count: {
        users: (db.users || []).filter(u => u.roleId === r.id).length
      }
    }));
  },

  async findById(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.role.findUnique({ where: { id } });
    }
    const db = readFallbackData();
    return (db.roles || DEFAULT_ROLES).find(r => r.id === id) || null;
  },

  async findByName(name) {
    if (isPrismaConnected && prisma) {
      return await prisma.role.findUnique({ where: { name } });
    }
    const db = readFallbackData();
    return (db.roles || DEFAULT_ROLES).find(r => r.name === name) || null;
  },

  async create(data) {
    const id = data.id || `role_${Date.now()}`;
    const clean = {
      id,
      name: data.name.toLowerCase().trim(),
      displayName: data.displayName.trim(),
      description: data.description || '',
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      isSystem: Boolean(data.isSystem)
    };

    if (isPrismaConnected && prisma) {
      return await prisma.role.create({ data: clean });
    }

    const db = readFallbackData();
    if (!db.roles) db.roles = DEFAULT_ROLES;
    const newRole = { ...clean, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.roles.push(newRole);
    writeFallbackData(db);
    return newRole;
  },

  async update(id, data) {
    const clean = {
      ...(data.displayName ? { displayName: data.displayName.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.permissions ? { permissions: data.permissions } : {})
    };

    if (isPrismaConnected && prisma) {
      return await prisma.role.update({
        where: { id },
        data: clean
      });
    }

    const db = readFallbackData();
    if (!db.roles) db.roles = DEFAULT_ROLES;
    const idx = db.roles.findIndex(r => r.id === id);
    if (idx < 0) return null;
    db.roles[idx] = { ...db.roles[idx], ...clean, updatedAt: new Date().toISOString() };
    writeFallbackData(db);
    return db.roles[idx];
  },

  async delete(id) {
    if (isPrismaConnected && prisma) {
      return await prisma.role.delete({ where: { id } });
    }
    const db = readFallbackData();
    if (!db.roles) db.roles = DEFAULT_ROLES;
    db.roles = db.roles.filter(r => r.id !== id);
    writeFallbackData(db);
    return true;
  }
};
