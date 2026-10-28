import { projectRepository } from '../repositories/project.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { v8Repository } from '../repositories/v8.repository.js';
import { featureRepository } from '../repositories/feature.repository.js';
import { realtimeService } from './realtime.service.js';

const dayMs = 86400000;
const day = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`) : null;

function recipients(project, users, extra = []) {
    const ids = new Set(extra.filter(Boolean));
    (project?.projectPermissions || []).forEach(permission => { if (permission.access !== 'viewer') ids.add(permission.userId); });
    return users.filter(user => ids.has(user.id));
}

function taskUsers(task, users) {
    const identifiers = new Set();
    const assignees = Array.isArray(task?.assignee) ? task.assignee : String(task?.assignee || '').split(',');
    assignees.concat(task?.assigner || []).forEach(value => identifiers.add(String(value).trim().toLowerCase()));
    return users.filter(user => identifiers.has(String(user.id).toLowerCase())
        || identifiers.has(String(user.email || '').toLowerCase())
        || identifiers.has(String(user.username || '').toLowerCase()));
}

async function createImmediateNotification({ user, type, task, title, message, operationKey }) {
    const record = await featureRepository.createNotification({
        id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: user.id,
        type,
        title,
        message,
        entityType: 'task',
        entityId: task.id,
        projectId: task.projectId || null,
        dueAt: task.dueDate || null,
        deliveryKey: `${operationKey}:${user.id}`
    });
    realtimeService.publish('notification', record, user.id);
}

export const notificationService = {
    async notifyTaskComment({ comment, task, actorId, users, operationKey }) {
        const admins = users.filter(user => user.isActive !== false
            && (user.role?.name === 'admin' || user.role?.permissions?.includes('edit_all_projects')));
        const participants = taskUsers(task, users);
        const targets = [...new Map([...participants, ...admins]
            .filter(user => user.id !== actorId)
            .map(user => [user.id, user])).values()];

        for (const user of targets) {
            await createImmediateNotification({
                user,
                type: 'task_comment',
                task,
                title: 'Có trao đổi mới trong công việc',
                message: `${task.title || 'Công việc'} có trao đổi mới${comment.text ? `: ${String(comment.text).slice(0, 160)}` : '.'}`,
                operationKey
            });
        }
    },

    async notifyTaskChange({ task, before, actorId, users, project, operationKey }) {
        const admins = users.filter(user => user.isActive !== false
            && (user.role?.name === 'admin' || user.role?.permissions?.includes('edit_all_projects')));
        const participants = taskUsers(task, users);
        const oldAssignees = new Set(taskUsers({ assignee: before?.assignee }, users).map(user => user.id));
        const newAssignees = participants.filter(user => !oldAssignees.has(user.id));
        const isProgressChanged = Boolean(before) && (
            Number(before.progress || 0) !== Number(task.progress || 0)
            || before.status !== task.status
            || JSON.stringify(before.checklist || []) !== JSON.stringify(task.checklist || [])
        );
        const targets = isProgressChanged ? [...participants, ...admins] : newAssignees;
        const uniqueTargets = [...new Map(targets.filter(user => user.id !== actorId).map(user => [user.id, user])).values()];
        const projectName = project?.name ? ` trong dự án ${project.name}` : '';
        for (const user of uniqueTargets) {
            const isAssignment = newAssignees.some(assignee => assignee.id === user.id) && !isProgressChanged;
            await createImmediateNotification({
                user,
                type: isAssignment ? 'task_assigned' : 'task_progress',
                task,
                title: isAssignment ? 'Bạn được giao một công việc mới' : 'Công việc vừa được cập nhật tiến độ',
                message: isAssignment
                    ? `${task.title || 'Công việc'}${projectName} đã được giao cho bạn.`
                    : `${task.title || 'Công việc'} đạt ${task.progress || 0}% (${task.status || 'todo'}).`,
                operationKey
            });
        }
    },
    async run() {
        const [projects, tasks, users, issues, guarantees, receipts] = await Promise.all([
            projectRepository.findAll({ includeDeleted: false }), taskRepository.findAll({ includeDeleted: false }), userRepository.findAll(),
            v8Repository.findAll('issue'), v8Repository.findAll('guarantee'), v8Repository.findAll('receipt')
        ]);
        const projectById = new Map(projects.map(project => [project.id, project]));
        const now = new Date();
        const notify = async (item, type, title, message, dueAt, extraIds = []) => {
            const project = projectById.get(item.projectId);
            let targets = recipients(project, users, extraIds);
            if (!targets.length) targets = users.filter(user => user.isActive && user.role?.name === 'admin');
            for (const user of targets) {
                const key = `${user.id}:${type}:${item.id}:${String(dueAt).slice(0, 10)}`;
                const record = await featureRepository.createNotification({ id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, userId: user.id, type, title, message, entityType: type, entityId: item.id, projectId: item.projectId || null, dueAt: String(dueAt).slice(0, 10), deliveryKey: key });
                realtimeService.publish('notification', record, user.id);
            }
        };
        const dueSoon = value => { const date = day(value); return date && date.getTime() >= now.getTime() - dayMs && date.getTime() <= now.getTime() + 3 * dayMs; };
        for (const task of tasks) if (task.status !== 'done' && dueSoon(task.dueDate)) await notify(task, 'task_deadline', 'Đầu việc sắp đến hạn', `${task.title} đến hạn ngày ${task.dueDate}.`, task.dueDate);
        for (const project of projects) if (dueSoon(project.dueDate)) await notify(project, 'project_deadline', 'Dự án sắp đến hạn', `${project.name} đến hạn ngày ${project.dueDate}.`, project.dueDate);
        for (const issue of issues) if (!issue.deleted && issue.status !== 'closed' && dueSoon(issue.dueDate)) await notify(issue, 'issue_overdue', 'Issue cần xử lý', `${issue.title} đã đến hoặc quá hạn.`, issue.dueDate);
        for (const guarantee of guarantees) if (!guarantee.deleted && dueSoon(guarantee.expiryDate)) await notify(guarantee, 'guarantee_expiry', 'Bảo lãnh sắp hết hạn', `${guarantee.number || guarantee.id} sắp hết hạn ngày ${guarantee.expiryDate}.`, guarantee.expiryDate);
        for (const receipt of receipts) if (!receipt.deleted && receipt.status !== 'paid' && dueSoon(receipt.plannedDate)) await notify(receipt, 'payment_due', 'Khoản thanh toán đến hạn', `${receipt.name} đến hạn ngày ${receipt.plannedDate}.`, receipt.plannedDate);
        return { processedAt: now.toISOString() };
    },
    list(userId, options) { return featureRepository.listNotifications(userId, options); },
    markRead(userId, ids) { return featureRepository.markNotificationsRead(userId, ids); }
};