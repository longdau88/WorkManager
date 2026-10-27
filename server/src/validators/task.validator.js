import { z } from 'zod';

export const createTaskSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
  title: z.string().min(1, 'Tiêu đề công việc không được để trống'),
  note: z.string().optional().nullable(),
  status: z.enum(['todo', 'doing', 'done']).default('todo'),
  priority: z.enum(['low', 'med', 'high']).default('med'),
  progress: z.number().min(0).max(100).default(0),
  sort: z.number().default(10),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignee: z.string().optional().nullable(),
  assigner: z.string().optional().nullable(),
  files: z.array(z.any()).default([]),
  deleted: z.boolean().default(false),
  updatedBy: z.string().optional().nullable()
});

export const updateTaskSchema = createTaskSchema.partial();
