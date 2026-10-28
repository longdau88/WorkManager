import { z } from 'zod';

export const syncOpSchema = z.object({
  type: z.enum([
    'project', 'task', 'member', 'user', 'field',
    'diary', 'ledger', 'category', 'worker', 'labor',
    'advance', 'advances', 'contract', 'contracts', 'device', 'devices',
    'check', 'checks', 'issue', 'issues', 'receipt', 'receipts',
    'guarantee', 'guarantees', 'group', 'groups', 'pgroup',
    'comment', 'comments', 'categories'
  ]),
  record: z.object({
    id: z.string().min(1, 'ID bản ghi là bắt buộc'),
    updatedAt: z.union([z.number(), z.string()]).optional(),
    updatedBy: z.string().optional()
  }).passthrough()
});

export const syncBatchSchema = z.object({
  ops: z.array(syncOpSchema).default([])
});
