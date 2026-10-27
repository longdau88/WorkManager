import { projectPermissionRepository } from '../repositories/projectPermission.repository.js';
import { projectRepository } from '../repositories/project.repository.js';
import { userRepository } from '../repositories/user.repository.js';

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

    await projectPermissionRepository.syncProjectPermissions(projectId, permissionsList);
    return await this.getProjectPermissions(projectId);
  }
};
