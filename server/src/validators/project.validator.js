import { z } from 'zod';

export const createProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Tên dự án không được để trống'),
  color: z.string().default('#2563eb'),
  note: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  info: z.record(z.any()).default({}),
  folders: z.array(z.object({
    id: z.string(),
    name: z.string()
  })).default([]),
  files: z.array(z.any()).default([]),
  deleted: z.boolean().default(false),
  updatedBy: z.string().optional().nullable()
});

export const updateProjectSchema = createProjectSchema.partial();
