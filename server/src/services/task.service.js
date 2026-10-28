import { taskRepository } from '../repositories/task.repository.js';
import { projectRepository } from '../repositories/project.repository.js';

function getTaskAssignees(task) {
  if (!task || !task.assignee) return [];
  if (Array.isArray(task.assignee)) return task.assignee.map(s => String(s).trim().toLowerCase()).filter(Boolean);
  return String(task.assignee).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function isUserAdmin(user) {
  if (!user) return false;
  return Boolean(user.isAdmin || user.roleName === 'admin' || (user.permissions || []).includes('edit_all_projects'));
}

function isUserTaskAssignee(task, user) {
  if (!task || !task.assignee) return true; // Công việc chưa giao cho ai
  if (!user) return false;
  const assignees = getTaskAssignees(task);
  if (!assignees.length) return true;

  const userEmail = (typeof user === 'string' ? user : user.email || '').trim().toLowerCase();
  const userUsername = (typeof user === 'object' && user.username ? String(user.username) : '').trim().toLowerCase();
  const userId = (typeof user === 'object' && user.id ? String(user.id) : '').trim().toLowerCase();

  return assignees.some(a => a === userEmail || a === userUsername || a === userId);
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

    // Kiểm tra quyền chỉnh sửa / hoàn thành task
    if (data.id) {
      const existing = await taskRepository.findById(data.id);
      if (existing) {
        const isAdmin = isUserAdmin(user);
        const isAssignee = isUserTaskAssignee(existing, user);

        // Trong task: CHỈ ADMIN mới có quyền edit task (cấu hình, phân công, hạn chót, tên việc...).
        // Thành viên được giao việc (Assignees) chỉ có quyền cập nhật tiến độ, ghi chú, checklist, ảnh, tệp đính kèm.
        if (!isAdmin && !isAssignee) {
          const err = new Error('Bạn không có quyền chỉnh sửa công việc này (chỉ người được giao việc mới có quyền cập nhật tiến độ, hoặc Quản trị viên mới có quyền sửa).');
          err.statusCode = 403;
          throw err;
        }

        // Nếu KHÔNG PHẢI ADMIN (là thành viên được giao làm task), khóa cứng các trường cấu hình của Admin:
        if (!isAdmin) {
          data.title = existing.title;
          data.projectId = existing.projectId;
          data.folderId = existing.folderId;
          data.assigner = existing.assigner;
          data.assignee = existing.assignee;
          data.startDate = existing.startDate;
          data.dueDate = existing.dueDate;
          data.priority = existing.priority;
        }
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
      checklist: Array.isArray(data.checklist) ? data.checklist : [],
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
        if (existing && existing.assignee) {
          const isAdmin = isUserAdmin(user);
          const isAssignee = isUserTaskAssignee(existing, user);
          const isAssigner = existing.assigner && String(existing.assigner).trim().toLowerCase() === String(userEmail).toLowerCase();
          if (!isAdmin && !isAssignee && !isAssigner) {
            continue;
          }
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

    // Quyền xóa task: CHỈ ADMIN
    const isAdmin = isUserAdmin(user);
    if (!isAdmin) {
      const err = new Error('Bạn không có quyền xóa công việc này (chỉ Quản trị viên mới có quyền xóa).');
      err.statusCode = 403;
      throw err;
    }

    return await taskRepository.delete(id, true);
  }
};
