import { projectRepository } from '../repositories/project.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { projectPermissionRepository } from '../repositories/projectPermission.repository.js';

export const projectService = {
  async getAllProjects(user = null) {
    const isAdmin = !user || user.isAdmin || (user.permissions || []).includes('edit_all_projects');
    const userId = user ? user.id : null;
    return await projectRepository.findAll({ userId, isAdmin });
  },

  async getProjectById(id) {
    const project = await projectRepository.findById(id);
    if (!project || project.deleted) {
      const err = new Error('Không tìm thấy dự án');
      err.statusCode = 404;
      throw err;
    }
    return project;
  },

  async saveProject(data, user = null) {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Tên dự án không được để trống');
      err.statusCode = 400;
      throw err;
    }

    const userEmail = user?.email || 'admin@workmanager.local';
    const isNew = !data.id;

    const record = {
      ...data,
      name: data.name.trim(),
      updatedBy: userEmail
    };

    const saved = await projectRepository.upsert(record);

    // If new project created by user, grant owner access to creator
    if (isNew && user?.id) {
      await projectPermissionRepository.upsert(saved.id, user.id, 'owner');
    }

    return saved;
  },

  async deleteProject(id, user = null) {
    const existing = await projectRepository.findById(id);
    if (!existing) {
      const err = new Error('Dự án không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const userEmail = user?.email || 'admin@workmanager.local';

    // Soft delete all tasks under this project
    const tasks = await taskRepository.findAll({ projectId: id });
    for (const task of tasks) {
      await taskRepository.upsert({ ...task, deleted: true, updatedBy: userEmail });
    }

    return await projectRepository.delete(id, true);
  }
};
