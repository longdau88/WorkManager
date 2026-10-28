import { taskRepository } from '../repositories/task.repository.js';
import { projectRepository } from '../repositories/project.repository.js';

function isUserTaskAssignee(task, user) {
  if (!task || !task.assignee) return true; // Công việc chưa giao cho ai -> cho phép giao việc
  if (!user) return false;

  const targetAssignee = String(task.assignee).trim().toLowerCase();
  const userEmail = (typeof user === 'string' ? user : user.email || '').trim().toLowerCase();
  const userUsername = (typeof user === 'object' && user.username ? String(user.username) : '').trim().toLowerCase();
  const userId = (typeof user === 'object' && user.id ? String(user.id) : '').trim().toLowerCase();

  return targetAssignee === userEmail || targetAssignee === userUsername || targetAssignee === userId;
}

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

  async saveTask(data, user = null) {
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

    // Kiểm tra quyền: không thể can thiệp vào task của người khác
    if (data.id) {
      const existing = await taskRepository.findById(data.id);
      if (existing && existing.assignee && !isUserTaskAssignee(existing, user)) {
        const err = new Error(`Bạn không thể can thiệp hoặc chỉnh sửa công việc của người khác (được giao cho ${existing.assignee}).`);
        err.statusCode = 403;
        throw err;
      }
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

    const userEmail = (user && typeof user === 'object' ? user.email : (typeof user === 'string' ? user : 'system'));
    const record = {
      ...data,
      title: data.title.trim(),
      status,
      progress,
      updatedBy: userEmail
    };

    return await taskRepository.upsert(record);
  },

  async updateTaskBatch(records, user = null) {
    const userEmail = (user && typeof user === 'object' ? user.email : (typeof user === 'string' ? user : 'system'));
    const prepared = [];

    for (const r of records) {
      if (r.id) {
        const existing = await taskRepository.findById(r.id);
        if (existing && existing.assignee && !isUserTaskAssignee(existing, user)) {
          // Bỏ qua không cập nhật task của người khác
          continue;
        }
      }
      prepared.push({
        ...r,
        updatedBy: userEmail
      });
    }

    return await taskRepository.upsertMany(prepared);
  },

  async deleteTask(id, user = null) {
    const existing = await taskRepository.findById(id);
    if (!existing) {
      const err = new Error('Công việc không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra quyền: không thể can thiệp hoặc xóa task của người khác
    if (existing.assignee && !isUserTaskAssignee(existing, user)) {
      const err = new Error('Bạn không thể can thiệp hoặc xóa công việc của người khác.');
      err.statusCode = 403;
      throw err;
    }

    return await taskRepository.delete(id, true);
  }
};
