import { projectRepository } from '../repositories/project.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { fieldRepository } from '../repositories/field.repository.js';
import { v8Repository } from '../repositories/v8.repository.js';
import { realtimeService } from './realtime.service.js';
import { featureRepository } from '../repositories/feature.repository.js';

export const syncService = {
  async getBootstrapData(user = null) {
    const isAdmin = !user || user.isAdmin || (user.permissions || []).includes('edit_all_projects');
    const userId = user ? user.id : null;

    const projects = await projectRepository.findAll({ includeDeleted: false, userId, isAdmin });
    const tasks = await taskRepository.findAll({ includeDeleted: false });
    const rawUsers = await userRepository.findAll();
    const fields = await fieldRepository.findAll({ includeDeleted: false });
    const allowedProjectIds = new Set(projects.map(p => p.id));
    const filteredTasks = isAdmin ? tasks : tasks.filter(t => !t.projectId || allowedProjectIds.has(t.projectId));
    const scopedRecords = type => isAdmin
      ? v8Repository.findAll(type)
      : v8Repository.findAll(type).then(records => records.filter(record => !record.projectId || allowedProjectIds.has(record.projectId)));

    const [diary, ledger, categories, workers, labor, advances, contracts, devices, checks, issues, receipts, guarantees, groups, comments] = await Promise.all([
      scopedRecords('diary'),
      scopedRecords('ledger'),
      v8Repository.findAll('category'),
      v8Repository.findAll('worker'),
      scopedRecords('labor'),
      scopedRecords('advance'),
      scopedRecords('contract'),
      scopedRecords('device'),
      scopedRecords('check'),
      scopedRecords('issue'),
      scopedRecords('receipt'),
      scopedRecords('guarantee'),
      v8Repository.findAll('group'),
      scopedRecords('comment')
    ]);

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
    const notifications = user ? await featureRepository.listNotifications(user.id, { limit: 100 }) : [];
    const presence = await featureRepository.listPresence();

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
      groups,
      comments,
      notifications,
      presence
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
      'receipt', 'receipts', 'guarantee', 'guarantees', 'group', 'groups', 'pgroup',
      'comment', 'comments'
    ]);
    const isAdmin = !user || user.isAdmin || (user.permissions || []).includes('edit_all_projects');
    const projects = await projectRepository.findAll({ includeDeleted: false, userId: user?.id || null, isAdmin });
    const allowedProjectIds = new Set(projects.map(project => project.id));
    const allowedTaskIds = new Set((await taskRepository.findAll({ includeDeleted: false }))
      .filter(task => isAdmin || !task.projectId || allowedProjectIds.has(task.projectId))
      .map(task => task.id));
    const projectAccess = new Map((user?.projectPermissions || []).map(permission => [permission.projectId, permission.access]));
    const projectScopedTypes = new Set([
      'diary', 'ledger', 'labor', 'advance', 'advances', 'contract', 'contracts',
      'device', 'devices', 'check', 'checks', 'issue', 'issues', 'receipt', 'receipts',
      'guarantee', 'guarantees', 'comment', 'comments'
    ]);

    for (const op of ops) {
      const { type, record } = op;
      if (!record || !record.id) continue;

      if (!isAdmin && type === 'project' && !allowedProjectIds.has(record.id)) {
        const existingProject = await projectRepository.findById(record.id);
        if (existingProject) {
          throw Object.assign(new Error('Bạn không có quyền cập nhật dự án này.'), { status: 403 });
        }
      }

      if (!isAdmin && projectScopedTypes.has(type) && record.projectId && !allowedProjectIds.has(record.projectId)) {
        throw Object.assign(new Error('Bạn không có quyền cập nhật dữ liệu của dự án này.'), { status: 403 });
      }

      if (!isAdmin && (type === 'comment' || type === 'comments')) {
        const task = await taskRepository.findById(record.taskId);
        if (!task || !allowedTaskIds.has(task.id)) {
          throw Object.assign(new Error('Bạn không có quyền bình luận trong công việc này.'), { status: 403 });
        }
        record.projectId = task.projectId || null;
      } else if (!isAdmin && projectScopedTypes.has(type) && record.projectId && projectAccess.get(record.projectId) === 'viewer') {
        throw Object.assign(new Error('Bạn chỉ có quyền xem dữ liệu của dự án này.'), { status: 403 });
      }

      record.updatedBy = userEmail;
      let before = null;
      let result = null;

      if (type === 'project') {
        before = await projectRepository.findById(record.id);
        if (!isAdmin && before && projectAccess.get(record.id) === 'viewer') {
          throw Object.assign(new Error('Bạn chỉ có quyền xem dự án này.'), { status: 403 });
        }
        if (!isAdmin && !before) {
          throw Object.assign(new Error('Chỉ quản trị viên mới được tạo dự án mới.'), { status: 403 });
        }
        result = await projectRepository.upsert(record);
      } else if (type === 'task') {
        before = await taskRepository.findById(record.id);
        if (record.id) {
          if (before && before.assignee && user) {
            const isAdmin = Boolean(user.isAdmin || user.roleName === 'admin' || (user.permissions || []).includes('edit_all_projects'));
            const assignees = String(before.assignee).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            const isAssignee = assignees.some(a => a === userEmailLower || a === userUsername || a === userId);
            const isAssigner = before.assigner && String(before.assigner).trim().toLowerCase() === userEmailLower;
            if (!isAdmin && !isAssignee && !isAssigner) {
              console.warn(`[Sync] Blocked unauthorized edit on task ${record.id} by ${user?.username}`);
              continue;
            }
          }
        }
        result = await taskRepository.upsert(record);
      } else if (type === 'field') {
        before = await fieldRepository.findById(record.id);
        result = await fieldRepository.upsert(record);
      } else if (v8Types.has(type)) {
        before = await v8Repository.findById(type, record.id);
        result = await v8Repository.upsert(type, record);
      } else {
        console.warn(`Unknown sync operation type: ${type}`);
      }

      if (result) {
        const auditType = type === 'comments' ? 'comment' : type === 'categories' ? 'category' : type.replace(/s$/, '');
        await v8Repository.appendAudit({
          user: userEmail,
          type: auditType,
          recId: record.id,
          projectId: result.projectId || record.projectId || null,
          action: before ? (record.deleted ? 'delete' : 'update') : 'create',
          title: result.title || result.name || result.content || result.text || record.id,
          before: before ? JSON.stringify(before) : '',
          after: JSON.stringify(result)
        });
        if (auditType === 'comment' && !record.deleted) realtimeService.publish('comment', result);
      }
    }

    // Return the latest synchronized state for this user
    return await this.getBootstrapData(user);
  }
};

