import { projectRepository } from '../repositories/project.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { fieldRepository } from '../repositories/field.repository.js';

export const syncService = {
  async getBootstrapData(user = null) {
    const isAdmin = !user || user.isAdmin || (user.permissions || []).includes('edit_all_projects');
    const userId = user ? user.id : null;

    const [projects, tasks, rawUsers, fields] = await Promise.all([
      projectRepository.findAll({ includeDeleted: false, userId, isAdmin }),
      taskRepository.findAll({ includeDeleted: false }),
      userRepository.findAll(),
      fieldRepository.findAll({ includeDeleted: false })
    ]);

    // Filter tasks if not admin
    const allowedProjectIds = new Set(projects.map(p => p.id));
    const filteredTasks = isAdmin ? tasks : tasks.filter(t => !t.projectId || allowedProjectIds.has(t.projectId));

    const safeUsers = (rawUsers || []).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName || '',
      unit: u.unit || '',
      phone: u.phone || '',
      roleId: u.roleId,
      role: u.role,
      isActive: u.isActive
    }));

    return {
      serverTime: Date.now(),
      currentUser: user,
      projects,
      tasks: filteredTasks,
      users: safeUsers,
      members: safeUsers.map(u => ({
        id: u.id,
        name: u.fullName || u.username,
        fullName: u.fullName || u.username,
        email: u.email,
        unit: u.unit || '',
        phone: u.phone || '',
        deleted: false
      })),
      fields
    };
  },

  async applySyncOps(ops = [], user = null) {
    const userEmail = user?.email || 'admin@workmanager.local';
    for (const op of ops) {
      const { type, record } = op;
      if (!record || !record.id) continue;

      record.updatedBy = userEmail;

      switch (type) {
        case 'project':
          await projectRepository.upsert(record);
          break;
        case 'task':
          await taskRepository.upsert(record);
          break;
        case 'field':
          await fieldRepository.upsert(record);
          break;
        default:
          console.warn(`Unknown sync operation type: ${type}`);
      }
    }

    // Return the latest synchronized state for this user
    return await this.getBootstrapData(user);
  }
};

