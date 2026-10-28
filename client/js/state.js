import { CONFIG } from './config.js';
import { api } from './api.js';

export class StateManager {
  constructor() {
    this.data = {
      projects: [], tasks: [], users: [], fields: [],
      diary: [], ledger: [], categories: [], workers: [],
      labor: [], advances: [], contracts: [], devices: [],
      checks: [], issues: [], receipts: [], guarantees: [], groups: [], comments: [], notifications: [], presence: []
    };
    this.queue = [];
    this.syncing = false;
    this.syncErr = '';
    this.lastSync = 0;
    this.flushTimer = null;
    this.syncWatchdog = null;

    this.curProject = 'all';
    this.curFilter = 'all';
    this.curPtab = 'tasks'; // 'tasks' | 'diary' | 'ledger' | 'labor' | 'contract' | 'device' | 'qa' | 'finance'
    this.searchQuery = '';
    this.assigneeFilter = '';
    this.sortMode = 'manual';
    this.view = 'tasks'; // 'tasks' | 'stats'
    this.theme = localStorage.getItem('wm.theme') || 'system';

    this.collapsed = {};
    this.CODE = {};
    this.ORD = {};

    this.listeners = new Set();
    this.init();
  }

  init() {
    // Load cached state
    try {
      const cached = localStorage.getItem('wm.data');
      if (cached) this.data = JSON.parse(cached);
      const q = localStorage.getItem('wm.queue');
      if (q) this.queue = JSON.parse(q);
      const col = localStorage.getItem('wm.collapsed');
      if (col) this.collapsed = JSON.parse(col);
    } catch (e) {
      console.warn('Could not read cached state:', e);
    }
    this.normalize();
    this.computeCodes();
  }

  normalize() {
    [
      'projects', 'tasks', 'users', 'fields',
      'diary', 'ledger', 'categories', 'workers',
      'labor', 'advances', 'contracts', 'devices',
      'checks', 'issues', 'receipts', 'guarantees', 'groups', 'comments', 'notifications', 'presence'
    ].forEach(k => {
      if (!Array.isArray(this.data[k])) this.data[k] = [];
    });
    this.data.projects.forEach(p => {
      if (!p.info || typeof p.info !== 'object') p.info = {};
      if (!Array.isArray(p.folders)) p.folders = [];
      if (!Array.isArray(p.files)) p.files = [];
      if (!p.budget || typeof p.budget !== 'object') p.budget = {};
    });
    this.data.tasks.forEach(t => {
      if (!Array.isArray(t.files)) t.files = [];
      if (!Array.isArray(t.checklist)) t.checklist = [];
    });
  }

  persist() {
    try {
      localStorage.setItem('wm.data', JSON.stringify(this.data));
      localStorage.setItem('wm.queue', JSON.stringify(this.queue));
      localStorage.setItem('wm.collapsed', JSON.stringify(this.collapsed));
    } catch (e) {
      console.warn('LocalStorage quota or storage error:', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.computeCodes();
    this.listeners.forEach(fn => fn(this));
  }

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  fmtNum(n) {
    const x = Number(n);
    return isNaN(x) ? '' : x.toLocaleString('vi-VN');
  }

  // Timezone-safe date formatting and calculations
  parseDateParts(s) {
    if (!s) return null;
    const p = String(s).split('-');
    return p.length === 3 ? { y: +p[0], m: +p[1] - 1, d: +p[2] } : null;
  }

  todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  daysLeft(due) {
    if (!due) return null;
    const dp = this.parseDateParts(due);
    if (!dp) return null;
    const now = new Date();
    const utcDue = Date.UTC(dp.y, dp.m, dp.d);
    const utcToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((utcDue - utcToday) / 86400000);
  }

  fmtDate(s) {
    if (!s) return '';
    const parts = String(s).split('-');
    if (parts.length !== 3) return s;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  fmtShort(s) {
    if (!s) return '';
    const [y, m, d] = String(s).split('-');
    return d + '/' + m + (y != new Date().getFullYear() ? '/' + String(y).slice(2) : '');
  }

  money(n) {
    const x = Math.round(Number(n) || 0);
    return isNaN(x) ? '0 đ' : x.toLocaleString('vi-VN');
  }

  dowOf(s) {
    if (!s) return '';
    const d = new Date(s + 'T00:00:00');
    const dows = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return dows[d.getDay()] || '';
  }

  curMonth() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  monthLabel(m) {
    if (!m) return '';
    const [y, mm] = String(m).split('-');
    return `Tháng ${mm}/${y}`;
  }

  monthDays(m) {
    if (!m) return 30;
    const [y, mm] = String(m).split('-').map(Number);
    return new Date(y, mm, 0).getDate();
  }

  catById(id) {
    return (this.data.categories || []).find(c => c.id === id);
  }

  sortedCats(kind) {
    const list = this.data.categories || [];
    const filtered = kind ? list.filter(c => c.kind === kind) : list;
    return [...filtered].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0) || String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
  }

  groupById(id) {
    return (this.data.groups || []).find(g => g.id === id);
  }

  workerById(id) {
    return (this.data.workers || []).find(w => w.id === id);
  }

  workerName(id) {
    const w = this.workerById(id);
    return w ? (w.name || id) : id;
  }

  lsum(list, kind, status) {
    return (list || [])
      .filter(l => (!kind || l.kind === kind) && (!status || l.status === status))
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }

  diaryTotals(list) {
    return (list || []).reduce((a, d) => {
      const L = d.labor || {};
      a.lab += (+L.tech || 0) + (+L.perm || 0) + (+L.contract || 0);
      a.ot += (+L.otPeople || 0) * (+L.otHours || 0);
      a.ms += (d.machines || []).reduce((s, m) => s + (+m.shifts || 0), 0);
      return a;
    }, { lab: 0, ot: 0, ms: 0 });
  }

  projCosts(p) {
    const pid = typeof p === 'string' ? p : p?.id;
    const ledgers = (this.data.ledger || []).filter(l => l.projectId === pid && l.status === 'approved' && l.kind === 'chi');
    const byCat = {};
    ledgers.forEach(l => {
      const catId = l.categoryId || '__none';
      byCat[catId] = (byCat[catId] || 0) + (Number(l.amount) || 0);
    });
    const totalLedger = ledgers.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    return { total: totalLedger, byCat };
  }

  projRevenue(p) {
    const pid = typeof p === 'string' ? p : p?.id;
    const rcpts = (this.data.receipts || []).filter(r => r.projectId === pid);
    const planned = rcpts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const got = rcpts.filter(r => r.status === 'received').reduce((sum, r) => sum + (Number(r.receivedAmount) || Number(r.amount) || 0), 0);
    return { planned, got, rec: rcpts };
  }

  prog(t) {
    return t.status === 'done' ? 100 : (Number(t.progress) || 0);
  }

  dueState(t) {
    if (t.status === 'done' || !t.dueDate) return '';
    const d = this.daysLeft(t.dueDate);
    return d < 0 ? 'overdue' : d <= CONFIG.WARN_DAYS ? 'soon' : '';
  }

  dueLabel(t) {
    if (!t.dueDate) return '';
    const d = this.daysLeft(t.dueDate);
    const s = this.fmtShort(t.dueDate);
    if (t.status === 'done') return `<span class="small">${s}</span>`;
    if (d < 0) return `<span class="badge b-red" title="Hạn ${this.fmtDate(t.dueDate)}">Quá ${-d} ngày</span>`;
    if (d === 0) return `<span class="badge b-orange">Hôm nay</span>`;
    if (d <= CONFIG.WARN_DAYS) return `<span class="badge b-orange" title="Hạn ${this.fmtDate(t.dueDate)}">Còn ${d} ngày</span>`;
    return `<span class="small" title="Hạn ${this.fmtDate(t.dueDate)}">📅 ${s}</span>`;
  }

  avgPct(tasks) {
    return tasks.length ? Math.round(tasks.reduce((a, t) => a + this.prog(t), 0) / tasks.length) : 0;
  }

  projById(id) {
    return this.data.projects.find(p => p.id === id);
  }

  taskById(id) {
    return this.data.tasks.find(t => t.id === id);
  }

  memberBy(email) {
    if (!email) return null;
    const lower = String(email).trim().toLowerCase();
    const u = (this.data.users || []).find(x =>
      String(x.email || '').toLowerCase() === lower ||
      String(x.username || '').toLowerCase() === lower
    );
    if (u) {
      return {
        id: u.id,
        name: u.fullName || u.username,
        fullName: u.fullName || u.username,
        email: u.email,
        unit: u.unit || '',
        phone: u.phone || ''
      };
    }
    return null;
  }

  shortName(email) {
    if (!email) return '';
    const m = this.memberBy(email);
    return m ? (m.name || m.fullName || email) : String(email).split('@')[0];
  }

  fullName(email) {
    if (!email) return '';
    const m = this.memberBy(email);
    return m ? (m.fullName || m.name) + ' <' + email + '>' : email;
  }

  projStats(pid) {
    const ts = this.data.tasks.filter(t => t.projectId === pid);
    return {
      n: ts.length,
      done: ts.filter(t => t.status === 'done').length,
      overdue: ts.filter(t => this.dueState(t) === 'overdue').length,
      soon: ts.filter(t => this.dueState(t) === 'soon').length,
      pct: this.avgPct(ts)
    };
  }

  computeCodes() {
    this.CODE = {};
    this.ORD = {};
    let n = 0;
    const rawManual = (a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0) || (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);

    const projs = [...this.data.projects].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    projs.forEach(p => {
      const fs = p.folders || [];
      const fids = new Set(fs.map(f => f.id));
      const ts = this.data.tasks.filter(t => t.projectId === p.id);
      const groups = fs.map(f => ts.filter(t => t.folderId === f.id));
      groups.push(ts.filter(t => !fids.has(t.folderId)));
      groups.forEach((g, gi) => g.sort(rawManual).forEach((t, ti) => {
        this.CODE[t.id] = fs.length ? `${gi + 1}.${ti + 1}` : `${ti + 1}`;
        this.ORD[t.id] = n++;
      }));
    });

    this.data.tasks.filter(t => !(t.id in this.ORD)).sort(rawManual).forEach((t, i) => {
      this.CODE[t.id] = String(i + 1);
      this.ORD[t.id] = n++;
    });
  }

  getAssignees(t) {
    if (!t) return [];
    const val = typeof t === 'string' ? t : t.assignee;
    if (!val) return [];
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    return String(val).split(',').map(s => s.trim()).filter(Boolean);
  }

  formatAssignees(assigneeStr) {
    const list = this.getAssignees(assigneeStr);
    if (!list.length) return '';
    if (list.length === 1) return this.shortName(list[0]);
    return list.map(e => this.shortName(e)).join(', ');
  }

  isTaskAssignee(t, u = api.currentUser) {
    if (!t || !u) return false;
    const assignees = this.getAssignees(t).map(s => s.toLowerCase());
    if (!assignees.length) return false;

    const myEmail = String(u.email || '').trim().toLowerCase();
    const myUsername = String(u.username || '').trim().toLowerCase();
    const myId = String(u.id || '').trim().toLowerCase();

    return assignees.some(a => a === myEmail || a === myUsername || a === myId);
  }

  // Quyền hoàn thành task: Người được giao việc HOẶC Admin
  // Quyền hoàn thành và cập nhật tiến độ (thanh kéo %, tick checklist, trạng thái, ghi chú, ảnh, tệp):
  // Admin HOẶC Thành viên được giao trong task đó!
  canCompleteTask(t, u = api.currentUser) {
    if (!t) return true;
    if (!u) return false;
    if (this.canEditTask(t, u)) return true;
    return this.isTaskAssignee(t, u);
  }

  // Trong task: CHỈ ADMIN mới có quyền edit task (tiêu đề, hạn, mức ưu tiên, hạng mục, dự án, phân công người nhận)
  canEditTask(t, u = api.currentUser) {
    if (!u) return false;
    return Boolean(u.isAdmin || u.roleName === 'admin' || (u.permissions || []).includes('edit_all_projects'));
  }

  // Quyền xóa task: CHỈ ADMIN
  canDeleteTask(t, u = api.currentUser) {
    if (!u) return false;
    return Boolean(u.isAdmin || u.roleName === 'admin' || (u.permissions || []).includes('edit_all_projects'));
  }

  // Quyền cập nhật tiến độ, nội dung, ghi chú, ảnh, tệp đính kèm: Thành viên được giao việc HOẶC Admin
  canUpdateProgress(t, u = api.currentUser) {
    return this.canCompleteTask(t, u);
  }

  // Quyền quản lý/sửa dự án: Admin, role có quyền edit_all_projects hoặc owner/editor dự án
  canManageProject(p, u = api.currentUser) {
    if (!u) return false;
    if (u.isAdmin || u.roleName === 'admin' || (u.permissions || []).includes('edit_all_projects')) return true;
    if (!p) return false;
    const perm = (u.projectPermissions || []).find(x => x.projectId === p.id);
    return Boolean(perm && (perm.access === 'owner' || perm.access === 'editor'));
  }

  // Quyền can thiệp bất kỳ vào task
  canModifyTask(t) {
    return this.canEditTask(t) || this.canUpdateProgress(t);
  }

  // Optimistic UI & Sync Queue
  upsertLocal(type, rec) {
    const TYPE_KEY = {
      project: 'projects', task: 'tasks', user: 'users', field: 'fields',
      diary: 'diary', ledger: 'ledger', category: 'categories', pgroup: 'groups', group: 'groups',
      worker: 'workers', labor: 'labor', advance: 'advances', contract: 'contracts',
      device: 'devices', receipt: 'receipts', guarantee: 'guarantees',
      check: 'checks', issue: 'issues', comment: 'comments'
    };
    const typeKey = TYPE_KEY[type] || (type.endsWith('s') ? type : type + 's');
    const arr = this.data[typeKey];
    if (!arr) return;
    const i = arr.findIndex(x => x.id === rec.id);
    if (rec.deleted) {
      if (i >= 0) arr.splice(i, 1);
      return;
    }
    if (i >= 0) {
      arr[i] = Object.assign({}, arr[i], rec);
    } else {
      arr.push(Object.assign({}, rec));
    }
  }

  commit(type, rec) {
    return this.commitMany(type, [rec]);
  }

  commitMany(type, recs) {
    // Không cho phép can thiệp hoặc thay đổi task của người khác
    if (type === 'task') {
      recs = recs.filter(r => {
        if (!r.id) return true;
        const existing = this.taskById(r.id);
        if (existing && existing.assignee && !this.canModifyTask(existing)) {
          console.warn(`[State] Chặn can thiệp vào công việc "${existing.title}" được giao cho ${existing.assignee}`);
          return false;
        }
        return true;
      });
      if (!recs.length) return false;
    }

    const now = Date.now();
    const userIdentifier = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';
    recs.forEach(r => {
      r.updatedAt = now;
      r.updatedBy = userIdentifier;
      this.upsertLocal(type, r);
      this.queue.push({ type, record: r });
    });
    this.normalize();
    this.persist();
    this.notify();
    this.scheduleFlush();
    return true;
  }

  scheduleFlush() {
    clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => this.flush(), 600);
  }

  async flush() {
    if (!api.token) {
      if (window.app && typeof window.app.showLoginModal === 'function') {
        window.app.showLoginModal();
      }
      return;
    }

    if (this.syncing) return;
    if (!navigator.onLine) {
      this.updateSyncUI();
      return;
    }

    this.syncing = true;
    this.updateSyncUI();

    // Sync Watchdog: release lock if network drops without callback
    clearTimeout(this.syncWatchdog);
    this.syncWatchdog = setTimeout(() => {
      if (this.syncing) {
        console.warn('Sync watchdog: request timed out.');
        this.syncing = false;
        this.syncErr = 'Quá thời gian chờ máy chủ';
        this.updateSyncUI();
      }
    }, 25000);

    const batch = this.queue.slice();

    try {
      let res;
      if (batch.length) {
        res = await api.syncBatch(batch);
        this.queue = this.queue.slice(batch.length);
      } else {
        res = await api.getBootstrap();
      }

      clearTimeout(this.syncWatchdog);
      if (res) {
        if (res.currentUser) {
          api.currentUser = res.currentUser;
          localStorage.setItem('wm.user', JSON.stringify(res.currentUser));
        }
        this.data = {
          projects: res.projects || [],
          tasks: res.tasks || [],
          users: res.users || [],
          fields: res.fields || [],
          diary: res.diary || [],
          ledger: res.ledger || [],
          categories: res.categories || [],
          workers: res.workers || [],
          labor: res.labor || [],
          advances: res.advances || [],
          contracts: res.contracts || [],
          devices: res.devices || [],
          checks: res.checks || [],
          issues: res.issues || [],
          receipts: res.receipts || [],
          guarantees: res.guarantees || [],
          groups: res.groups || [],
          comments: res.comments || [],
          notifications: res.notifications || [],
          presence: res.presence || []
        };
        // Re-apply remaining queue if any were added during sync
        this.queue.forEach(o => this.upsertLocal(o.type, o.record));
        this.normalize();
        this.lastSync = Date.now();
        this.syncErr = '';
        this.persist();
        this.notify();
      }
    } catch (err) {
      clearTimeout(this.syncWatchdog);
      this.syncErr = err.message || 'Lỗi đồng bộ';
      if (err.status === 401 && window.app && typeof window.app.showLoginModal === 'function') {
        window.app.showLoginModal();
      }
    } finally {
      this.syncing = false;
      this.updateSyncUI();
      if (this.queue.length) this.scheduleFlush();
    }
  }

  updateSyncUI() {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const n = this.queue.length;
    let cls = 'sync-indicator', txt = '';

    if (this.syncing) {
      cls += ' spin';
      txt = '⟳ Đang đồng bộ…';
    } else if (!navigator.onLine) {
      cls += ' off';
      txt = '● Ngoại tuyến' + (n ? ` (${n} chờ)` : '');
    } else if (this.syncErr) {
      cls += ' err';
      txt = '● Lỗi đồng bộ' + (n ? ` (${n} chờ)` : '');
    } else if (n) {
      cls += ' off';
      txt = `● ${n} thay đổi chờ gửi`;
    } else {
      cls += ' ok';
      txt = '● Đã đồng bộ' + (this.lastSync ? ' ' + new Date(this.lastSync).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '');
    }

    el.className = cls;
    el.textContent = txt;
    el.title = this.syncErr || 'Trạng thái kết nối máy chủ';
  }
}

export const state = new StateManager();
