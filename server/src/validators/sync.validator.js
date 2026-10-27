import { z } from 'zod';

export const syncOpSchema = z.object({
  type: z.enum(['project', 'task', 'member', 'field']),
  record: z.object({
    id: z.string().min(1, 'ID bản ghi là bắt buộc'),
    updatedAt: z.union([z.number(), z.string()]).optional(),
    updatedBy: z.string().optional()
  }).passthrough()
});

export const syncBatchSchema = z.object({
  ops: z.array(syncOpSchema).default([])
});
