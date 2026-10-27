import { projectRepository } from '../repositories/project.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { memberRepository } from '../repositories/member.repository.js';
import { fieldRepository } from '../repositories/field.repository.js';

export const syncService = {
  async getBootstrapData(user = null) {
    const isAdmin = !user || user.isAdmin || (user.permissions || []).includes('edit_all_projects');
    const userId = user ? user.id : null;

    const [projects, tasks, members, fields] = await Promise.all([
      projectRepository.findAll({ includeDeleted: false, userId, isAdmin }),
      taskRepository.findAll({ includeDeleted: false }),
      memberRepository.findAll({ includeDeleted: false }),
      fieldRepository.findAll({ includeDeleted: false })
    ]);

    // Filter tasks if not admin
    const allowedProjectIds = new Set(projects.map(p => p.id));
    const filteredTasks = isAdmin ? tasks : tasks.filter(t => !t.projectId || allowedProjectIds.has(t.projectId));

    return {
      serverTime: Date.now(),
      currentUser: user,
      projects,
      tasks: filteredTasks,
      members,
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
        case 'member':
          await memberRepository.upsert(record);
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
