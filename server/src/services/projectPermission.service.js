import { projectPermissionRepository } from '../repositories/projectPermission.repository.js';
import { projectRepository } from '../repositories/project.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { featureRepository } from '../repositories/feature.repository.js';
import { realtimeService } from './realtime.service.js';

export const projectPermissionService = {
  async getProjectPermissions(projectId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const err = new Error('Dự án không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const [permissions, allUsers] = await Promise.all([
      projectPermissionRepository.findByProject(projectId),
      userRepository.findAll()
    ]);

    // Build complete user access map
    const userAccessList = allUsers.map(u => {
      const perm = permissions.find(p => p.userId === u.id);
      return {
        userId: u.id,
        username: u.username,
        fullName: u.fullName || u.username,
        email: u.email,
        roleName: u.role?.displayName || u.role?.name || 'Thành viên',
        access: perm ? perm.access : 'none'
      };
    });

    return {
      projectId,
      projectName: project.name,
      users: userAccessList
    };
  },

  async updateProjectPermissions(projectId, permissionsList = []) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const err = new Error('Dự án không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const previousPermissions = await projectPermissionRepository.findByProject(projectId);
    await projectPermissionRepository.syncProjectPermissions(projectId, permissionsList);
    const previousUserIds = new Set(previousPermissions.filter(permission => permission.access !== 'none').map(permission => permission.userId));
    const newlyAdded = permissionsList.filter(permission => permission.userId && permission.access !== 'none' && !previousUserIds.has(permission.userId));
    if (newlyAdded.length) {
      const users = await userRepository.findAll();
      for (const item of newlyAdded) {
        const user = users.find(candidate => candidate.id === item.userId);
        if (!user) continue;
        const notification = await featureRepository.createNotification({
          id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          userId: user.id,
          type: 'project_added',
          title: 'Bạn được thêm vào một dự án',
          message: `${project.name} đã cấp quyền ${item.access} cho bạn.`,
          entityType: 'project',
          entityId: project.id,
          projectId: project.id,
          dueAt: null,
          deliveryKey: `project_added:${project.id}:${user.id}:${item.access}`
        });
        realtimeService.publish('notification', notification, user.id);
      }
    }
    return await this.getProjectPermissions(projectId);
  }
};
