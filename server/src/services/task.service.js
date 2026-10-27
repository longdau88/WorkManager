import { taskRepository } from '../repositories/task.repository.js';
import { projectRepository } from '../repositories/project.repository.js';

export const taskService = {
  async getTasks(projectId) {
    return await taskRepository.findAll({ projectId });
  },

  async getTaskById(id) {
    const task = await taskRepository.findById(id);
    if (!task || task.deleted) {
      const err = new Error('Không tìm thấy công việc');
      err.statusCode = 404;
      throw err;
    }
    return task;
  },

  async saveTask(data, userEmail = 'system') {
    if (!data.title || !data.title.trim()) {
      const err = new Error('Tiêu đề công việc không được để trống');
      err.statusCode = 400;
      throw err;
    }

    if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
      const err = new Error('Hạn chót phải sau hoặc bằng ngày bắt đầu');
      err.statusCode = 400;
      throw err;
    }

    // Auto-calculate status from progress or progress from status if conflicting
    let status = data.status || 'todo';
    let progress = typeof data.progress === 'number' ? data.progress : 0;
    if (status === 'done' && progress < 100) {
      progress = 100;
    } else if (progress === 100) {
      status = 'done';
    } else if (progress > 0 && status === 'todo') {
      status = 'doing';
    }

    const record = {
      ...data,
      title: data.title.trim(),
      status,
      progress,
      updatedBy: userEmail
    };

    return await taskRepository.upsert(record);
  },

  async updateTaskBatch(records, userEmail = 'system') {
    const prepared = records.map(r => ({
      ...r,
      updatedBy: userEmail
    }));
    return await taskRepository.upsertMany(prepared);
  },

  async deleteTask(id, userEmail = 'system') {
    const existing = await taskRepository.findById(id);
    if (!existing) {
      const err = new Error('Công việc không tồn tại');
      err.statusCode = 404;
      throw err;
    }
    return await taskRepository.delete(id, true);
  }
};
