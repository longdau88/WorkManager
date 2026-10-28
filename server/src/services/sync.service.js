import { projectRepository } from '../repositories/project.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { fieldRepository } from '../repositories/field.repository.js';
import { v8Repository } from '../repositories/v8.repository.js';

export const syncService = {
  async getBootstrapData(user = null) {
    const isAdmin = !user || user.isAdmin || (user.permissions || []).includes('edit_all_projects');
    const userId = user ? user.id : null;

    const projects = await projectRepository.findAll({ includeDeleted: false, userId, isAdmin });
    const tasks = await taskRepository.findAll({ includeDeleted: false });
    const rawUsers = await userRepository.findAll();
    const fields = await fieldRepository.findAll({ includeDeleted: false });
    const diary = await v8Repository.findAll('diary');
    const ledger = await v8Repository.findAll('ledger');
    const categories = await v8Repository.findAll('category');
    const workers = await v8Repository.findAll('worker');
    const labor = await v8Repository.findAll('labor');
    const advances = await v8Repository.findAll('advance');
    const contracts = await v8Repository.findAll('contract');
    const devices = await v8Repository.findAll('device');
    const checks = await v8Repository.findAll('check');
    const issues = await v8Repository.findAll('issue');
    const receipts = await v8Repository.findAll('receipt');
    const guarantees = await v8Repository.findAll('guarantee');
    const groups = await v8Repository.findAll('group');

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
      fields,
      diary,
      ledger,
      categories,
      workers,
      labor,
      advances,
      contracts,
      devices,
      checks,
      issues,
      receipts,
      guarantees,
      groups
    };
  },

  async applySyncOps(ops = [], user = null) {
    const userEmail = user?.email || 'admin@workmanager.local';
    const userEmailLower = String(userEmail).trim().toLowerCase();
    const userUsername = user?.username ? String(user.username).trim().toLowerCase() : '';
    const userId = user?.id ? String(user.id).trim().toLowerCase() : '';

    const v8Types = new Set([
      'diary', 'ledger', 'category', 'categories', 'worker', 'workers',
      'labor', 'advance', 'advances', 'contract', 'contracts',
      'device', 'devices', 'check', 'checks', 'issue', 'issues',
      'receipt', 'receipts', 'guarantee', 'guarantees', 'group', 'groups', 'pgroup'
    ]);

    for (const op of ops) {
      const { type, record } = op;
      if (!record || !record.id) continue;

      record.updatedBy = userEmail;

      if (type === 'project') {
        await projectRepository.upsert(record);
      } else if (type === 'task') {
        if (record.id) {
          const existing = await taskRepository.findById(record.id);
          if (existing && existing.assignee && user) {
            const isAdmin = Boolean(user.isAdmin || user.roleName === 'admin' || (user.permissions || []).includes('edit_all_projects'));
            const assignees = String(existing.assignee).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            const isAssignee = assignees.some(a => a === userEmailLower || a === userUsername || a === userId);
            const isAssigner = existing.assigner && String(existing.assigner).trim().toLowerCase() === userEmailLower;
            if (!isAdmin && !isAssignee && !isAssigner) {
              console.warn(`[Sync] Blocked unauthorized edit on task ${record.id} by ${user?.username}`);
              continue;
            }
          }
        }
        await taskRepository.upsert(record);
      } else if (type === 'field') {
        await fieldRepository.upsert(record);
      } else if (v8Types.has(type)) {
        await v8Repository.upsert(type, record);
      } else {
        console.warn(`Unknown sync operation type: ${type}`);
      }
    }

    // Return the latest synchronized state for this user
    return await this.getBootstrapData(user);
  }
};

