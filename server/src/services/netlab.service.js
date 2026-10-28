import { netlabRepository } from '../repositories/netlab.repository.js';
import { projectRepository } from '../repositories/project.repository.js';

export const netlabService = {
  async getNetlabByProject(projectId, user = null) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const err = new Error('Dự án không tồn tại');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const record = await netlabRepository.findByProjectId(projectId);
    if (!record) {
      return {
        exists: false,
        projectId,
        projectName: project.name,
        data: null
      };
    }

    return {
      exists: true,
      projectId,
      projectName: project.name,
      data: record.data,
      updatedBy: record.updatedBy,
      updatedAt: record.updatedAt
    };
  },

  async saveNetlabByProject(projectId, netlabData, user = null) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const err = new Error('Dự án không tồn tại');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    if (!netlabData || typeof netlabData !== 'object') {
      const err = new Error('Dữ liệu sơ đồ mạng NetLab không hợp lệ');
      err.statusCode = 400;
      err.status = 400;
      throw err;
    }

    const updatedBy = user?.email || user?.username || 'admin@workmanager.local';
    const result = await netlabRepository.upsertByProjectId(projectId, {
      data: netlabData,
      updatedBy
    });

    return {
      success: true,
      projectId,
      projectName: project.name,
      updatedAt: result.updatedAt,
      data: result.data
    };
  }
};

