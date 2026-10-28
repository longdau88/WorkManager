import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

const TYPE_TO_MODEL = {
  diary: 'diary',
  ledger: 'ledger',
  category: 'category',
  categories: 'category',
  worker: 'worker',
  workers: 'worker',
  labor: 'labor',
  advance: 'advance',
  advances: 'advance',
  contract: 'contract',
  contracts: 'contract',
  device: 'device',
  devices: 'device',
  check: 'check',
  checks: 'check',
  issue: 'issue',
  issues: 'issue',
  receipt: 'receipt',
  receipts: 'receipt',
  guarantee: 'guarantee',
  guarantees: 'guarantee',
  group: 'projectGroup',
  groups: 'projectGroup',
  pgroup: 'projectGroup'
};

const TYPE_TO_KEY = {
  diary: 'diary',
  ledger: 'ledger',
  category: 'categories',
  categories: 'categories',
  worker: 'workers',
  workers: 'workers',
  labor: 'labor',
  advance: 'advances',
  advances: 'advances',
  contract: 'contracts',
  contracts: 'contracts',
  device: 'devices',
  devices: 'devices',
  check: 'checks',
  checks: 'checks',
  issue: 'issues',
  issues: 'issues',
  receipt: 'receipts',
  receipts: 'receipts',
  guarantee: 'guarantees',
  guarantees: 'guarantees',
  group: 'groups',
  groups: 'groups',
  pgroup: 'groups'
};

const MODEL_FIELDS = {
  projectGroup: ['name', 'sort', 'deleted', 'updatedBy'],
  category: ['name', 'kind', 'sort', 'deleted', 'updatedBy'],
  diary: ['projectId', 'date', 'weatherAM', 'weatherPM', 'folderId', 'area', 'workText', 'tasks', 'quantities', 'labor', 'machines', 'materials', 'safety', 'issues', 'proposals', 'supervisorNote', 'files', 'confirmedBy', 'confirmedAt', 'deleted', 'createdBy', 'updatedBy'],
  ledger: ['projectId', 'date', 'kind', 'categoryId', 'folderId', 'content', 'unit', 'qty', 'price', 'amount', 'person', 'note', 'files', 'status', 'approvedBy', 'approvedAt', 'rejectReason', 'deleted', 'createdBy', 'updatedBy'],
  worker: ['name', 'team', 'job', 'phone', 'payType', 'rate', 'bank', 'note', 'active', 'sort', 'deleted', 'createdBy', 'updatedBy'],
  labor: ['projectId', 'month', 'workerId', 'days', 'ot', 'rate', 'stdDays', 'allowance', 'bonus', 'deduction', 'note', 'deleted', 'createdBy', 'updatedBy'],
  advance: ['projectId', 'date', 'workerId', 'amount', 'kind', 'month', 'paidDate', 'note', 'deleted', 'createdBy', 'updatedBy'],
  contract: ['projectId', 'code', 'name', 'team', 'leader', 'phone', 'workScope', 'amount', 'startDate', 'endDate', 'status', 'items', 'terms', 'files', 'deleted', 'createdBy', 'updatedBy'],
  device: ['projectId', 'code', 'name', 'type', 'brand', 'model', 'serial', 'owner', 'operator', 'status', 'importDate', 'exportDate', 'expDate', 'files', 'deleted', 'createdBy', 'updatedBy'],
  check: ['projectId', 'code', 'name', 'date', 'folderId', 'area', 'type', 'inspector', 'contractor', 'supervisor', 'result', 'note', 'files', 'deleted', 'createdBy', 'updatedBy'],
  issue: ['projectId', 'code', 'title', 'folderId', 'area', 'checkId', 'severity', 'assignee', 'deadline', 'status', 'fixedDate', 'fixer', 'note', 'files', 'deleted', 'createdBy', 'updatedBy'],
  receipt: ['projectId', 'stage', 'date', 'amount', 'receivedAmount', 'status', 'paidDate', 'note', 'files', 'deleted', 'createdBy', 'updatedBy'],
  guarantee: ['projectId', 'type', 'bank', 'code', 'amount', 'expDate', 'status', 'note', 'files', 'deleted', 'createdBy', 'updatedBy']
};

function sanitizeForPrisma(type, r) {
  const model = TYPE_TO_MODEL[type];
  const allowed = MODEL_FIELDS[model] || [];
  const out = {};

  allowed.forEach(f => {
    if (f in r && r[f] !== undefined) {
      out[f] = r[f];
    }
  });

  // Number fields conversion
  if ('qty' in out) out.qty = out.qty !== null && out.qty !== '' ? Number(out.qty) || 0 : null;
  if ('price' in out) out.price = out.price !== null && out.price !== '' ? Number(out.price) || 0 : null;
  if ('amount' in out) out.amount = Number(out.amount) || 0;
  if ('rate' in out) out.rate = out.rate !== null && out.rate !== '' ? Number(out.rate) || 0 : 0;
  if ('stdDays' in out) out.stdDays = out.stdDays !== null && out.stdDays !== '' ? Number(out.stdDays) || 26 : 26;
  if ('allowance' in out) out.allowance = Number(out.allowance) || 0;
  if ('bonus' in out) out.bonus = Number(out.bonus) || 0;
  if ('deduction' in out) out.deduction = Number(out.deduction) || 0;
  if ('receivedAmount' in out) out.receivedAmount = out.receivedAmount !== null && out.receivedAmount !== '' ? Number(out.receivedAmount) || 0 : null;
  if ('sort' in out) out.sort = Number(out.sort) || 10;
  if ('deleted' in out) out.deleted = Boolean(out.deleted);

  // JSON fields handling
  const jsonFields = ['tasks', 'quantities', 'labor', 'machines', 'materials', 'files', 'days', 'ot', 'items'];
  jsonFields.forEach(f => {
    if (f in out && out[f] !== null && typeof out[f] === 'string') {
      try { out[f] = JSON.parse(out[f]); } catch (_) {}
    }
  });

  // Date fields conversion
  const now = new Date();
  if (r.updatedAt) {
    const d = new Date(r.updatedAt);
    out.updatedAt = isNaN(d.getTime()) ? now : d;
  } else {
    out.updatedAt = now;
  }

  if (r.createdAt) {
    const d = new Date(r.createdAt);
    out.createdAt = isNaN(d.getTime()) ? now : d;
  } else {
    out.createdAt = now;
  }

  return out;
}

export const v8Repository = {
  async findAll(type, { includeDeleted = false, projectId = null } = {}) {
    const model = TYPE_TO_MODEL[type];
    const key = TYPE_TO_KEY[type];
    if (!model || !key) return [];

    if (isPrismaConnected && prisma && prisma[model]) {
      const where = {};
      if (!includeDeleted) where.deleted = false;
      if (projectId && !['worker', 'category', 'group'].includes(type)) {
        where.projectId = projectId;
      }
      return await prisma[model].findMany({ where });
    }

    const data = readFallbackData();
    if (!Array.isArray(data[key])) data[key] = [];
    let list = includeDeleted ? data[key] : data[key].filter(x => !x.deleted);
    if (projectId && !['worker', 'category', 'group'].includes(type)) {
      list = list.filter(x => x.projectId === projectId);
    }
    return list;
  },

  async upsert(type, record) {
    const model = TYPE_TO_MODEL[type];
    const key = TYPE_TO_KEY[type];
    if (!model || !key || !record || !record.id) return null;

    if (isPrismaConnected && prisma && prisma[model]) {
      const data = sanitizeForPrisma(type, record);
      const { createdAt, ...updateData } = data;
      return await prisma[model].upsert({
        where: { id: record.id },
        create: { id: record.id, ...data },
        update: updateData
      });
    }

    const data = readFallbackData();
    if (!Array.isArray(data[key])) data[key] = [];
    const idx = data[key].findIndex(x => x.id === record.id);
    if (idx >= 0) {
      data[key][idx] = { ...data[key][idx], ...record, updatedAt: new Date().toISOString() };
    } else {
      data[key].push({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    writeFallbackData(data);
    return record;
  }
};
