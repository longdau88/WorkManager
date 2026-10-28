/**
 * TODO APP v9.1 – Quản lý công việc theo dự án: đăng nhập, phân quyền, nhật ký, thu chi
 *
 * TRIỂN KHAI: Ứng dụng web – Thực thi với tư cách: TÔI – Người có quyền truy cập: BẤT KỲ AI
 * Người dùng đăng nhập bằng mã 6 số gửi qua email. Chỉ email có trong danh sách Thành viên
 * (và chủ sở hữu script) mới nhận được mã. Không cần chia sẻ Google Sheet / Drive cho ai.
 *
 * Chạy thủ công 1 lần: setup()
 */

const APP_NAME = 'Quản lý công việc';
const REMIND_DAYS = 2;
const MAX_UPLOAD_MB = 20;
const SESSION_DAYS = 30;
const KEEP_BACKUPS = 30;       /* số bản sao lưu giữ lại */
const AUDIT_MAX = 50000;       /* số dòng nhật ký thay đổi tối đa */
const GUAR_DAYS = 30;          /* nhắc bảo lãnh trước khi hết hạn (ngày) */

/* Cột mới luôn thêm ở CUỐI để tương thích dữ liệu cũ */
const SHEETS = {
  projects: {
    name: 'Projects',
    cols: ['id', 'name', 'color', 'note', 'dueDate', 'createdAt', 'updatedAt', 'deleted', 'updatedBy',
           'info', 'folders', 'files',
           'srvAt', 'visibility', 'openRole', 'acl', 'createdBy',
           'stage', 'groupId', 'sort', 'ledgerMode', 'ledgerAcl', 'laborAcl',
           'contractValue', 'retentionPct', 'budget'],
    json: { info: {}, folders: [], files: [], acl: [], ledgerAcl: [], laborAcl: [], budget: {} }
  },
  tasks: {
    name: 'Tasks',
    cols: ['id', 'projectId', 'title', 'note', 'status', 'priority', 'progress', 'startDate', 'dueDate',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy',
           'folderId', 'sort', 'assignee', 'assigner', 'files',
           'srvAt', 'assignees', 'visibility', 'viewers', 'createdBy', 'doneAt', 'color'],
    json: { files: [], assignees: [], viewers: [] }
  },
  members: {
    name: 'Members',
    cols: ['id', 'name', 'fullName', 'email', 'unit', 'phone', 'createdAt', 'updatedAt', 'deleted', 'updatedBy',
           'srvAt', 'role', 'active', 'startDate', 'dob', 'bhxh', 'cccd', 'cccdDate', 'cccdPlace', 'idFiles', 'address'],
    json: { idFiles: [] }
  },
  fields: {
    name: 'Fields',
    cols: ['id', 'label', 'type', 'unit', 'group', 'options', 'sort', 'createdAt', 'updatedAt', 'deleted', 'updatedBy',
           'srvAt'],
    json: {}
  },
  diary: {
    name: 'Diary',
    cols: ['id', 'projectId', 'date', 'weatherAM', 'weatherPM', 'folderId', 'area', 'workText', 'tasks', 'quantities',
           'labor', 'machines', 'materials', 'safety', 'issues', 'proposals', 'supervisorNote', 'files',
           'confirmedBy', 'confirmedAt', 'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { tasks: [], quantities: [], labor: {}, machines: [], materials: [], files: [] }
  },
  ledger: {
    name: 'Ledger',
    cols: ['id', 'projectId', 'date', 'kind', 'categoryId', 'folderId', 'content', 'unit', 'qty', 'price', 'amount',
           'person', 'note', 'files', 'status', 'approvedBy', 'approvedAt', 'rejectReason',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { files: [] }
  },
  workers: {
    name: 'Workers',
    cols: ['id', 'name', 'team', 'job', 'phone', 'payType', 'rate', 'bank', 'note', 'active', 'sort',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: {}
  },
  labor: {
    name: 'Labor',
    cols: ['id', 'projectId', 'month', 'workerId', 'days', 'ot', 'note', 'rate', 'payType', 'stdDays',
           'allowance', 'bonus', 'deduction', 'payNote', 'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { days: {}, ot: {} }
  },
  advances: {
    name: 'Advances',
    cols: ['id', 'projectId', 'kind', 'refId', 'month', 'date', 'amount', 'method', 'payer', 'note', 'files',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { files: [] }
  },
  contracts: {
    name: 'Contracts',
    cols: ['id', 'projectId', 'team', 'leader', 'phone', 'items', 'note', 'files', 'sort',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { items: [], files: [] }
  },
  devices: {
    name: 'Devices',
    cols: ['id', 'projectId', 'folderId', 'category', 'brand', 'model', 'serial', 'mac', 'ip', 'location', 'installDate', 'installer',
           'status', 'acceptDate', 'warrantyEnd', 'note', 'files', 'sort', 'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy',
           'pole', 'polePort', 'odfPort', 'converter', 'switchName', 'switchPort', 'mask', 'gateway', 'vlan', 'statusLog', 'hostname'],
    json: { files: [], statusLog: [] }
  },
  receipts: {
    name: 'Receipts',
    cols: ['id', 'projectId', 'name', 'plannedDate', 'amount', 'status', 'receivedDate', 'receivedAmount', 'note', 'files',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { files: [] }
  },
  guarantees: {
    name: 'Guarantees',
    cols: ['id', 'projectId', 'gtype', 'bank', 'number', 'amount', 'issueDate', 'expiryDate', 'status', 'note', 'files',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { files: [] }
  },
  checks: {
    name: 'Checks',
    cols: ['id', 'projectId', 'folderId', 'name', 'date', 'participants', 'items', 'conclusion', 'note', 'files',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { items: [], files: [] }
  },
  issues: {
    name: 'Issues',
    cols: ['id', 'projectId', 'folderId', 'title', 'location', 'severity', 'assignee', 'dueDate', 'status', 'note', 'files',
           'fixedAt', 'closedBy', 'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { files: [] }
  },
  comments: {
    name: 'Comments',
    cols: ['id', 'taskId', 'projectId', 'text', 'files', 'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt', 'createdBy'],
    json: { files: [] }
  },
  audit: {
    name: 'AuditLog',
    cols: ['id', 'at', 'user', 'type', 'recId', 'projectId', 'action', 'title', 'before', 'after'],
    json: {}
  },
  groups: {
    name: 'ProjectGroups',
    cols: ['id', 'name', 'sort', 'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt'],
    json: {}
  },
  categories: {
    name: 'Categories',
    cols: ['id', 'name', 'kind', 'sort', 'createdAt', 'updatedAt', 'deleted', 'updatedBy', 'srvAt'],
    json: {}
  },
  sessions: {
    name: 'Sessions',
    cols: ['id', 'email', 'device', 'createdAt', 'expiresAt', 'lastSeen'],
    json: {}
  }
};
const TYPE_KEY = { project: 'projects', task: 'tasks', member: 'members', field: 'fields',
                   diary: 'diary', ledger: 'ledger', category: 'categories', pgroup: 'groups',
                   worker: 'workers', labor: 'labor', advance: 'advances', contract: 'contracts',
                   device: 'devices', receipt: 'receipts', guarantee: 'guarantees',
                   check: 'checks', issue: 'issues', comment: 'comments' };
const NUM_COLS = ['progress', 'sort', 'createdAt', 'updatedAt', 'srvAt', 'expiresAt', 'lastSeen',
                  'qty', 'price', 'amount', 'confirmedAt', 'approvedAt', 'rate', 'stdDays', 'allowance', 'bonus', 'deduction',
                  'receivedAmount', 'contractValue', 'doneAt', 'fixedAt'];   /* retentionPct để trống = mặc định 5% */
/* Các trường tiền lương: ẩn với người chỉ có quyền chấm công */
const LABOR_MONEY = ['rate', 'payType', 'stdDays', 'allowance', 'bonus', 'deduction', 'payNote'];

const DEFAULT_FIELDS = [
  ['f_cdt',      'Chủ đầu tư',            'text',   '',    'Thông tin chung', ''],
  ['f_sohd',     'Số hợp đồng',           'text',   '',    'Thông tin chung', ''],
  ['f_giatri',   'Giá trị hợp đồng',      'number', 'VNĐ', 'Thông tin chung', ''],
  ['f_diadiem',  'Địa điểm',              'text',   '',    'Thông tin chung', ''],
  ['f_map',      'Bản đồ vị trí (My Maps)','map',   '',    'Thông tin chung', ''],
  ['f_trangthai','Trạng thái dự án',      'select', '',    'Thông tin chung', 'Chuẩn bị, Đang triển khai, Nghiệm thu, Bảo hành, Tạm dừng'],
  ['f_cam_ptz',  'Camera tầm cao (PTZ)',  'number', 'cái', 'Thiết bị', ''],
  ['f_cam_fix',  'Camera cố định (fix)',  'number', 'cái', 'Thiết bị', ''],
  ['f_nvr',      'Đầu ghi (NVR)',         'number', 'bộ',  'Thiết bị', ''],
  ['f_switch',   'Switch mạng',           'number', 'cái', 'Thiết bị', ''],
  ['f_cap',      'Cáp quang / cáp mạng',  'number', 'm',   'Thiết bị', '']
];

/* Danh mục thu chi mặc định: [id, tên, loại] – loại: chi | nhan | ca2 */
const DEFAULT_CATEGORIES = [
  ['c_vattu', 'Vật tư', 'chi'], ['c_nhancong', 'Nhân công', 'chi'], ['c_thuemay', 'Thuê máy, thiết bị', 'chi'],
  ['c_vanchuyen', 'Vận chuyển', 'chi'], ['c_dilai', 'Đi lại, xăng xe', 'chi'], ['c_luutru', 'Lưu trú', 'chi'],
  ['c_anuong', 'Ăn uống', 'chi'], ['c_tiepkhach', 'Tiếp khách', 'chi'], ['c_vpp', 'Văn phòng phẩm, in ấn', 'chi'],
  ['c_khac', 'Khác', 'ca2'], ['c_tamung', 'Nhận tạm ứng', 'nhan'], ['c_hoanung', 'Hoàn ứng / thanh toán bù', 'nhan']
];

const lc = s => String(s == null ? '' : s).trim().toLowerCase();

/* ================= WEB APP & MENU ================= */

function doGet() {
  try { /* tự ghi nhớ link /exec lần đầu có người mở ứng dụng */
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('APP_URL')) { const u = ScriptApp.getService().getUrl() || ''; if (/\/exec$/.test(u)) props.setProperty('APP_URL', u); }
  } catch (e) {}
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📋 Todo App')
    .addItem('Mở ứng dụng', 'showAppLink')
    .addItem('Cài email nhắc deadline 7h sáng', 'installReminder')
    .addItem('Sao lưu dữ liệu ngay', 'backupMenu')
    .addItem('Đăng xuất tất cả thiết bị', 'logoutAll')
    .addToUi();
}

function showAppLink() {
  const url = appUrl_();
  SpreadsheetApp.getUi().alert(url ? 'Link ứng dụng:\n' + url : 'Chưa có link /exec. Vào Triển khai → Quản lý triển khai, sao chép link Ứng dụng web (đuôi /exec) rồi dán vào Cài đặt → Tài khoản trong ứng dụng.');
}

function setup() {
  Object.keys(SHEETS).forEach(getSheet_);
  ensureOwnerMember_();
  // bổ sung trường bản đồ cho dữ liệu cũ
  const fields = readRows_('fields');
  if (!fields.some(f => f.id === 'f_map')) {
    const now = Date.now();
    fields.push({ id: 'f_map', label: 'Bản đồ vị trí (My Maps)', type: 'map', unit: '', group: 'Thông tin chung',
                  options: '', sort: 5, createdAt: now, updatedAt: now, deleted: false, updatedBy: '', srvAt: now });
    writeTable_('fields', fields);
  }
  const folder = getUploadRoot_();
  ensureTriggers_();
  Logger.log('Dữ liệu: ' + getSS_().getUrl());
  Logger.log('Thư mục đính kèm: ' + folder.getUrl());
  Logger.log('Chủ hệ thống (quản trị): ' + ownerEmail_());
}

/* ================= ĐĂNG NHẬP BẰNG MÃ EMAIL ================= */

function ownerEmail_() { return lc(Session.getEffectiveUser().getEmail()); }

function hash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}

function isActive_(m) { return !!m && !m.deleted && String(m.active).toLowerCase() !== 'false'; }
function findMember_(email, members) {
  return (members || readRows_('members')).find(m => !m.deleted && lc(m.email) === email);
}

function ensureOwnerMember_() {
  const owner = ownerEmail_();
  const ms = readRows_('members');
  const m = ms.find(x => !x.deleted && lc(x.email) === owner);
  const now = Date.now();
  if (!m) {
    ms.push({ id: 'owner', name: owner.split('@')[0], fullName: '', email: owner, unit: '', phone: '',
              createdAt: now, updatedAt: now, deleted: false, updatedBy: owner, srvAt: now, role: 'admin', active: 'true' });
    writeTable_('members', ms);
  } else if (m.role !== 'admin' || String(m.active) === 'false') {
    m.role = 'admin'; m.active = 'true'; m.srvAt = now; m.updatedAt = now;
    writeTable_('members', ms);
  }
}

function requestCode(email) {
  email = lc(email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email không hợp lệ.');
  const owner = ownerEmail_();
  if (email !== owner && !isActive_(findMember_(email))) {
    throw new Error('Email này chưa được cấp quyền. Hãy nhờ quản trị viên thêm bạn vào danh sách Thành viên.');
  }
  const cache = CacheService.getScriptCache();
  const rk = 'otpcount_' + email, cnt = Number(cache.get(rk) || 0);
  if (cnt >= 5) throw new Error('Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 1 giờ.');
  cache.put(rk, String(cnt + 1), 3600);

  const code = String(100000 + parseInt(hash_(Utilities.getUuid()).slice(0, 8), 16) % 900000);
  cache.put('otp_' + email, JSON.stringify({ h: hash_(code + '|' + email), tries: 0 }), 600);
  MailApp.sendEmail({
    to: email, name: APP_NAME,
    subject: 'Mã đăng nhập ' + APP_NAME + ': ' + code,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px">Mã đăng nhập của bạn:' +
      '<div style="font-size:30px;font-weight:bold;letter-spacing:6px;margin:12px 0">' + code + '</div>' +
      'Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</div>'
  });
  return true;
}

function verifyCode(email, code, device) {
  email = lc(email);
  code = String(code || '').replace(/\D/g, '');
  const cache = CacheService.getScriptCache();
  const raw = cache.get('otp_' + email);
  if (!raw) throw new Error('Mã đã hết hạn. Hãy bấm "Gửi lại mã".');
  const o = JSON.parse(raw);
  if (o.tries >= 5) { cache.remove('otp_' + email); throw new Error('Nhập sai quá nhiều lần. Hãy gửi lại mã mới.'); }
  if (hash_(code + '|' + email) !== o.h) {
    o.tries++; cache.put('otp_' + email, JSON.stringify(o), 600);
    throw new Error('Mã không đúng (còn ' + (5 - o.tries) + ' lần thử).');
  }
  cache.remove('otp_' + email);
  if (email === ownerEmail_()) ensureOwnerMember_();

  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const now = Date.now();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const rows = readRows_('sessions').filter(s => Number(s.expiresAt) > now); // dọn phiên hết hạn
    rows.push({ id: hash_(token), email: email, device: String(device || '').slice(0, 120),
                createdAt: now, expiresAt: now + SESSION_DAYS * 86400000, lastSeen: now });
    rewriteTable_('sessions', rows);
  } finally { lock.releaseLock(); }
  return { token: token, email: email };
}

function logout(token) {
  if (!token) return true;
  const h = hash_(token);
  CacheService.getScriptCache().remove(sessKey_(h));
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { rewriteTable_('sessions', readRows_('sessions').filter(s => s.id !== h)); }
  finally { lock.releaseLock(); }
  return true;
}

function logoutAll() {
  rewriteTable_('sessions', []);
  PropertiesService.getScriptProperties().setProperty('SESS_EPOCH', String(Date.now()));
  try { SpreadsheetApp.getUi().alert('Đã đăng xuất tất cả thiết bị.'); } catch (e) {}
}

function sessKey_(h) {
  return 'sess_' + (PropertiesService.getScriptProperties().getProperty('SESS_EPOCH') || '0') + '_' + h;
}

/** Xác thực token → {email, name, admin, owner}. Lỗi bắt đầu bằng "AUTH:" để client đăng nhập lại. */
function auth_(token, members) {
  if (!token) throw new Error('AUTH: Chưa đăng nhập');
  const h = hash_(token), cache = CacheService.getScriptCache(), key = sessKey_(h);
  let email = cache.get(key);
  if (!email) {
    const s = readRows_('sessions').find(r => r.id === h);
    if (!s || Number(s.expiresAt) < Date.now()) throw new Error('AUTH: Phiên đăng nhập đã hết hạn');
    email = lc(s.email);
    cache.put(key, email, 21600);
  }
  const owner = ownerEmail_();
  const m = findMember_(email, members);
  if (email !== owner && !isActive_(m)) { cache.remove(key); throw new Error('AUTH: Tài khoản đã bị khoá'); }
  return { email: email, name: m ? (m.name || email) : email, admin: email === owner || (!!m && m.role === 'admin'), owner: email === owner };
}

/* ================= PHÂN QUYỀN ================= */

/** Vai trò của người dùng trong dự án: 'manager' | 'edit' | 'view' | null (không thấy) */
function projRole_(u, p) {
  if (u.admin) return 'manager';
  const a = (Array.isArray(p.acl) ? p.acl : []).find(x => lc(x.email) === u.email);
  if (a) return a.role || 'view';
  if (lc(p.createdBy) === u.email) return 'manager';
  if (p.visibility !== 'restricted') return p.openRole === 'view' ? 'view' : 'edit';
  return null;
}

/** Quyền thu chi trong dự án: 'approve' (xem tất cả + duyệt) | 'view' (xem tất cả) | 'self' (phiếu của mình) | null */
function ledgerRole_(u, p) {
  const r = projRole_(u, p);
  if (!r) return null;
  if (r === 'manager') return 'approve';
  const a = (Array.isArray(p.ledgerAcl) ? p.ledgerAcl : []).find(x => lc(x.email) === u.email);
  if (a) return a.role || 'self';
  return p.ledgerMode === 'list' ? null : 'self';
}

/** Quyền nhân công/lương/giao khoán: 'edit' | 'view' | 'attend' (chỉ chấm công, không thấy tiền) | null */
function laborRole_(u, p) {
  const r = projRole_(u, p);
  if (!r) return null;
  if (r === 'manager') return 'edit';
  const a = (Array.isArray(p.laborAcl) ? p.laborAcl : []).find(x => lc(x.email) === u.email);
  return a ? (a.role || 'attend') : null;
}
function laborRolesAll_(u, projects) {
  const set = {};
  projects.filter(p => !p.deleted).forEach(p => { const r = laborRole_(u, p); if (r) set[r] = true; });
  if (u.admin) set.edit = true;
  return set;
}

/** Quyền tài chính dự án (giá trị HĐ, dự toán, thanh toán CĐT, bảo lãnh): 'edit' | 'view' | null */
function finRole_(u, p) {
  const r = projRole_(u, p);
  if (!r) return null;
  if (r === 'manager') return 'edit';
  const lr = ledgerRole_(u, p);
  return lr === 'approve' || lr === 'view' ? 'view' : null;
}
const FIN_FIELDS = ['contractValue', 'retentionPct', 'budget'];
/* Thông tin cá nhân của thành viên: chỉ quản trị viên và chính người đó thấy */
const MEMBER_PRIVATE = ['dob', 'bhxh', 'cccd', 'cccdDate', 'cccdPlace', 'idFiles', 'address'];

function assigneesOf_(t) {
  const a = (Array.isArray(t.assignees) ? t.assignees : []).map(lc).filter(Boolean);
  const lead = lc(t.assignee);
  if (lead && a.indexOf(lead) < 0) a.unshift(lead);
  return a;
}

function taskVisible_(u, t, p) {
  const r = p ? projRole_(u, p) : 'edit';
  if (!r) return false;
  if (t.visibility !== 'restricted') return true;
  if (r === 'manager') return true;
  const e = u.email;
  return lc(t.assigner) === e || lc(t.createdBy) === e || assigneesOf_(t).indexOf(e) >= 0 ||
         (Array.isArray(t.viewers) ? t.viewers : []).map(lc).indexOf(e) >= 0;
}

function taskEditable_(u, t, p) {
  if (!taskVisible_(u, t, p)) return false;
  const r = p ? projRole_(u, p) : 'edit';
  return r === 'manager' || r === 'edit' || assigneesOf_(t).indexOf(u.email) >= 0;
}

function same_(a, b) {
  if ((a && typeof a === 'object') || (b && typeof b === 'object')) return JSON.stringify(a || null) === JSON.stringify(b || null);
  return String(a == null ? '' : a) === String(b == null ? '' : b);
}

function onlyChanged_(cur, rec, allowed) {
  const skip = ['id', 'updatedAt', 'updatedBy', 'srvAt'].concat(allowed);
  return Object.keys(rec).every(k => skip.indexOf(k) >= 0 || same_(rec[k], cur[k]));
}

/** Trả về '' nếu được phép, ngược lại là lý do từ chối */
function checkOp_(u, type, cur, rec, db, idx) {
  const pOf = id => { const i = idx.projects[id]; return i === undefined ? null : db.projects[i]; };
  if (type === 'comment') {
    const tid = cur ? cur.taskId : rec.taskId;
    if (cur && rec.taskId !== undefined && rec.taskId !== cur.taskId) return 'Không được chuyển tin nhắn sang đầu việc khác.';
    const ti = idx.tasks[tid], t = ti === undefined ? null : db.tasks[ti];
    if (!t || t.deleted === true || String(t.deleted) === 'true') return 'Đầu việc không tồn tại.';
    const p = t.projectId ? pOf(t.projectId) : null;
    if (!taskVisible_(u, t, p)) return 'Bạn không xem được đầu việc này.';
    if (String(rec.text || (cur && cur.text) || '').length > 4000) return 'Tin nhắn quá dài.';
    if (cur && lc(cur.createdBy) !== u.email && (p ? projRole_(u, p) : '') !== 'manager' && !u.admin) return 'Chỉ người gửi được sửa / xoá tin nhắn.';
    return '';
  }
  if (type === 'check' || type === 'issue') {
    const pid = rec.projectId !== undefined ? rec.projectId : (cur ? cur.projectId : '');
    const p = pid ? pOf(pid) : null;
    if (!p || p.deleted) return 'Dự án không tồn tại.';
    if (cur && cur.projectId !== pid) return 'Không được chuyển sang dự án khác.';
    const r = projRole_(u, p), editor = r === 'manager' || r === 'edit';
    if (type === 'check') return editor ? '' : 'Bạn chỉ có quyền xem biên bản nghiệm thu.';
    if (editor) return '';
    if (cur && lc(cur.assignee) === u.email && rec.status !== 'closed' && !rec.deleted && onlyChanged_(cur, rec, ['status', 'note', 'files', 'fixedAt'])) return '';
    return 'Bạn chỉ được cập nhật lỗi được giao cho mình (trạng thái, ghi chú, ảnh).';
  }
  if (type === 'device' || type === 'receipt' || type === 'guarantee') {
    const pid = rec.projectId !== undefined ? rec.projectId : (cur ? cur.projectId : '');
    const p = pid ? pOf(pid) : null;
    if (!p || p.deleted) return 'Dự án không tồn tại.';
    if (cur && cur.projectId !== pid && type !== 'device') return 'Không được chuyển sang dự án khác.';
    if (type === 'device') {
      const r = projRole_(u, p), r0 = cur && cur.projectId !== pid ? projRole_(u, pOf(cur.projectId) || {}) : r;
      return (r === 'manager' || r === 'edit') && (r0 === 'manager' || r0 === 'edit') ? '' : 'Bạn chỉ có quyền xem thiết bị của dự án này.';
    }
    return finRole_(u, p) === 'edit' ? '' : 'Chỉ quản lý dự án được sửa phần tài chính.';
  }
  if (type === 'worker') return laborRolesAll_(u, db.projects).edit ? '' : 'Bạn không có quyền sửa danh sách nhân công.';
  if (type === 'labor' || type === 'advance' || type === 'contract') {
    const pid = rec.projectId !== undefined ? rec.projectId : (cur ? cur.projectId : '');
    const p = pid ? pOf(pid) : null;
    if (!p || p.deleted) return 'Dự án không tồn tại.';
    if (cur && cur.projectId !== pid) return 'Không được chuyển sang dự án khác.';
    const lr = laborRole_(u, p);
    if (!lr) return 'Bạn không có quyền nhân công / giao khoán trong dự án này.';
    if (lr === 'edit') return '';
    if (type === 'labor' && lr === 'attend') return '';
    return 'Bạn chỉ có quyền xem phần này.';
  }
  if (type === 'member' || type === 'field' || type === 'category' || type === 'pgroup') return u.admin ? '' : 'Chỉ quản trị viên được sửa danh mục này.';
  if (type === 'diary' || type === 'ledger') {
    const pid = rec.projectId !== undefined ? rec.projectId : (cur ? cur.projectId : '');
    const p = pid ? pOf(pid) : null;
    if (!p || p.deleted) return 'Dự án không tồn tại.';
    const r = projRole_(u, p);
    if (!r) return 'Bạn không có quyền với dự án này.';
    if (cur && cur.projectId !== pid) { const cp = pOf(cur.projectId); if (!cp || projRole_(u, cp) !== 'manager') return 'Không được chuyển sang dự án khác.'; }
    if (r === 'manager') return '';
    const mine = !cur || lc(cur.createdBy) === u.email || (type === 'ledger' && lc(cur.person) === u.email);
    if (type === 'diary') {
      if (!cur) return r === 'edit' ? '' : 'Bạn chỉ có quyền xem dự án này.';
      if (!mine) return 'Chỉ người lập hoặc quản lý dự án được sửa nhật ký này.';
      if (cur.confirmedBy) return 'Nhật ký đã được xác nhận, chỉ quản lý dự án được sửa.';
      return '';
    }
    const lr = ledgerRole_(u, p);
    if (!lr) return 'Bạn không có quyền thu chi trong dự án này.';
    if (lr === 'approve') return '';
    if (rec.person && lc(rec.person) !== u.email && (!cur || lc(rec.person) !== lc(cur.person))) return 'Bạn chỉ được ghi thu chi của chính mình.';
    if (!cur) return '';
    if (!mine) return 'Đây không phải phiếu thu chi của bạn.';
    if (cur.status === 'approved') return 'Phiếu đã được duyệt, không thể sửa. Liên hệ quản lý dự án.';
    return '';
  }
  if (type === 'project') {
    if (!cur) return '';
    const r = projRole_(u, cur);
    if (r === 'manager') return '';
    if (r === 'edit' && onlyChanged_(cur, rec, ['folders', 'sort'])) return '';
    return 'Bạn không có quyền sửa thông tin dự án này.';
  }
  if (type === 'task') {
    if (cur) {
      const p = cur.projectId ? pOf(cur.projectId) : null;
      if (!taskEditable_(u, cur, p)) return 'Bạn không có quyền sửa đầu việc này.';
    }
    const newPid = rec.projectId !== undefined ? rec.projectId : (cur ? cur.projectId : '');
    if (!cur || newPid !== cur.projectId) {
      const np = newPid ? pOf(newPid) : null;
      if (newPid && !np) return 'Dự án không tồn tại.';
      const r = np ? projRole_(u, np) : 'edit';
      if (r !== 'manager' && r !== 'edit') return 'Bạn chỉ có quyền xem dự án này.';
    }
    return '';
  }
  return 'Loại dữ liệu không hợp lệ.';
}

function visibleData_(u, db) {
  const pmap = {};
  db.projects.forEach(p => pmap[p.id] = p);
  const o = {
    projects: db.projects.filter(p => !p.deleted && projRole_(u, p)).map(p => {
      if (finRole_(u, p)) return p;
      const o = Object.assign({}, p); FIN_FIELDS.forEach(k => delete o[k]); return o;
    }),
    checks: (db.checks || []).filter(x => !x.deleted && pmap[x.projectId] && !pmap[x.projectId].deleted && projRole_(u, pmap[x.projectId])),
    issues: (db.issues || []).filter(x => !x.deleted && pmap[x.projectId] && !pmap[x.projectId].deleted && projRole_(u, pmap[x.projectId])),
    devices: (db.devices || []).filter(d => !d.deleted && pmap[d.projectId] && !pmap[d.projectId].deleted && projRole_(u, pmap[d.projectId])),
    receipts: (db.receipts || []).filter(x => !x.deleted && pmap[x.projectId] && !pmap[x.projectId].deleted && finRole_(u, pmap[x.projectId])),
    guarantees: (db.guarantees || []).filter(x => !x.deleted && pmap[x.projectId] && !pmap[x.projectId].deleted && finRole_(u, pmap[x.projectId])),
    tasks: db.tasks.filter(t => {
      if (t.deleted) return false;
      const p = t.projectId ? pmap[t.projectId] : null;
      if (t.projectId && (!p || p.deleted)) return false;
      return taskVisible_(u, t, p);
    }),
    members: db.members.filter(m => !m.deleted).map(m => {
      if (u.admin || lc(m.email) === u.email) return m;
      const o = Object.assign({}, m); MEMBER_PRIVATE.forEach(k => delete o[k]); return o;
    }),
    fields: db.fields.filter(f => !f.deleted),
    diary: (db.diary || []).filter(d => !d.deleted && pmap[d.projectId] && !pmap[d.projectId].deleted && projRole_(u, pmap[d.projectId])),
    ledger: (db.ledger || []).filter(l => {
      const p = pmap[l.projectId];
      if (l.deleted || !p || p.deleted) return false;
      const lr = ledgerRole_(u, p);
      return lr === 'approve' || lr === 'view' || (lr === 'self' && (lc(l.person) === u.email || lc(l.createdBy) === u.email));
    }),
    groups: (db.groups || []).filter(g => !g.deleted),
    labor: (db.labor || []).filter(l => !l.deleted && pmap[l.projectId] && !pmap[l.projectId].deleted && laborRole_(u, pmap[l.projectId]))
      .map(l => { if (laborRole_(u, pmap[l.projectId]) !== 'attend') return l; const o = Object.assign({}, l); LABOR_MONEY.forEach(k => delete o[k]); return o; }),
    advances: (db.advances || []).filter(a => !a.deleted && pmap[a.projectId] && !pmap[a.projectId].deleted && ['edit', 'view'].indexOf(laborRole_(u, pmap[a.projectId])) >= 0),
    contracts: (db.contracts || []).filter(c => !c.deleted && pmap[c.projectId] && !pmap[c.projectId].deleted && ['edit', 'view'].indexOf(laborRole_(u, pmap[c.projectId])) >= 0),
    workers: (() => {
      const roles = laborRolesAll_(u, db.projects);
      const ws = (db.workers || []).filter(w => !w.deleted);
      if (roles.edit || roles.view) return ws;
      if (roles.attend) return ws.map(w => { const o = Object.assign({}, w); delete o.rate; delete o.bank; return o; });
      return [];
    })(),
    categories: (db.categories || []).filter(c => !c.deleted)
  };
  const tset = {};
  o.tasks.forEach(t => tset[t.id] = 1);
  o.comments = (db.comments || []).filter(c => !c.deleted && tset[c.taskId]);
  return o;
}

/* ================= NGƯỜI ĐANG ONLINE ================= */
const ONLINE_KEEP_MS = 10 * 60 * 1000;
/** Ghi nhận user vừa hoạt động, trả về {email: thời điểm} của những người hoạt động trong 10 phút */
function touchPresence_(email) {
  const cache = CacheService.getScriptCache(), now = Date.now();
  let map = {};
  try { map = JSON.parse(cache.get('presence') || '{}') || {}; } catch (e) { map = {}; }
  if (email) map[email] = now;
  Object.keys(map).forEach(k => { if (now - Number(map[k]) > ONLINE_KEEP_MS) delete map[k]; });
  try { cache.put('presence', JSON.stringify(map), 21600); } catch (e) {}
  return map;
}

/* ================= ĐỒNG BỘ (chỉ gửi phần thay đổi) =================
 * req = { ops:[{type, record}], have:{projects:[ids],...}, since:<serverTime lần trước> }
 */
function sync(token, req) {
  req = req || {};
  const ops = req.ops || [], have = req.have || {}, since = Number(req.since) || 0;
  let res, db, notices = [];
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    db = {};
    Object.keys(TYPE_KEY).forEach(t => db[TYPE_KEY[t]] = readRows_(TYPE_KEY[t]));
    const u = auth_(token, db.members);
    const now = Date.now();
    if (!db.fields.some(f => f.id === 'f_map')) {      // dữ liệu cũ chưa có trường bản đồ
      db.fields.push({ id: 'f_map', label: 'Bản đồ vị trí (My Maps)', type: 'map', unit: '', group: 'Thông tin chung', options: '',
                       sort: 5, createdAt: now, updatedAt: now, deleted: false, updatedBy: '', srvAt: now });
      writeTable_('fields', db.fields);
    }
    const idx = {}, dirty = {}, forced = {}, rejected = [], taskChanges = [], newMembers = [], ledgerChanges = [], audit = [], commentNew = [];
    Object.keys(db).forEach(k => { idx[k] = {}; db[k].forEach((r, i) => idx[k][r.id] = i); });
    const force = (k, id) => { (forced[k] = forced[k] || {})[id] = 1; };

    ops.forEach(op => {
      const key = TYPE_KEY[op.type], rec = op.record;
      if (!key || !rec || !rec.id) return;
      const i = idx[key][rec.id], cur = i === undefined ? null : db[key][i];
      if (cur && Number(rec.updatedAt) < Number(cur.updatedAt || 0)) { force(key, rec.id); return; }
      const why = checkOp_(u, op.type, cur, rec, db, idx);
      if (why) {
        rejected.push({ type: op.type, id: rec.id, title: rec.title || rec.name || rec.label || '', reason: why });
        force(key, rec.id);
        return;
      }
      const next = Object.assign({}, cur || {}, rec, { updatedBy: u.email, srvAt: now });
      next.createdBy = cur ? (cur.createdBy || '') : u.email;
      if (op.type === 'project' && !cur) {
        const acl = Array.isArray(next.acl) ? next.acl : [];
        if (!acl.some(a => lc(a.email) === u.email)) acl.push({ email: u.email, role: 'manager' });
        next.acl = acl;
      }
      if (op.type === 'ledger' || op.type === 'diary') {
        const pi = idx.projects[next.projectId];
        const pr = pi === undefined ? null : projRole_(u, db.projects[pi]);
        if (op.type === 'ledger') {
          ['qty', 'price', 'amount'].forEach(k => { next[k] = Number(next[k]) || 0; });
          if (!next.person) next.person = u.email;
          next.person = lc(next.person);
          const lr = pi === undefined ? null : ledgerRole_(u, db.projects[pi]);
          if (lr !== 'approve') {
            if (!next.deleted) { next.status = 'pending'; next.approvedBy = ''; next.approvedAt = 0; next.rejectReason = ''; }
          } else if (next.status === 'approved') {
            if (!cur || cur.status !== 'approved') { next.approvedBy = u.email; next.approvedAt = now; }
          } else { next.approvedBy = ''; next.approvedAt = 0; }
          if (next.status !== 'rejected') next.rejectReason = next.status === 'pending' ? '' : (next.rejectReason || '');
          if (cur && cur.status !== next.status && !next.deleted) ledgerChanges.push(next);
        } else {
          if (pr === 'manager') {
            if (next.confirmedBy && !(cur && cur.confirmedBy)) { next.confirmedBy = u.email; next.confirmedAt = now; }
            if (!next.confirmedBy) next.confirmedAt = 0;
          } else { next.confirmedBy = cur ? (cur.confirmedBy || '') : ''; next.confirmedAt = cur ? (cur.confirmedAt || 0) : 0; }
        }
      }
      if (op.type === 'labor') {
        const pi = idx.projects[next.projectId];
        const lr = pi === undefined ? null : laborRole_(u, db.projects[pi]);
        if (lr !== 'edit') {
          LABOR_MONEY.forEach(k => { if (cur && k in cur) next[k] = cur[k]; else delete next[k]; });
          if (!cur) {
            const wi = idx.workers[next.workerId], w = wi === undefined ? null : db.workers[wi];
            next.rate = w ? Number(w.rate) || 0 : 0; next.payType = w && w.payType === 'month' ? 'month' : 'day'; next.stdDays = 26;
          }
        }
      }
      if (op.type === 'member') {
        next.email = lc(next.email);
        if (next.email === ownerEmail_()) { next.role = 'admin'; next.active = 'true'; next.deleted = false; }
        if (!cur && !next.deleted) newMembers.push(next);
      }
      if (i === undefined) { db[key].push(next); idx[key][rec.id] = db[key].length - 1; }
      else db[key][i] = next;
      dirty[key] = true;
      if (op.type === 'task') {
        if (next.status === 'done' && !(cur && cur.status === 'done')) next.doneAt = now;
        if (next.status !== 'done') next.doneAt = 0;
        taskChanges.push({ before: cur, after: next });
      }
      if (op.type === 'comment' && !cur && !next.deleted) commentNew.push(next);
      if (op.type === 'issue' && !next.deleted) {
        if ((next.status === 'fixed' || next.status === 'closed') && !(cur && (cur.status === 'fixed' || cur.status === 'closed'))) next.fixedAt = now;
        if (next.status === 'closed' && !(cur && cur.status === 'closed')) next.closedBy = u.email;
        const na = lc(next.assignee);
        if (na && na !== u.email && (!cur || lc(cur.assignee) !== na)) notices.push({ kind: 'issue', to: na, entry: next, by: u.name });
        if (next.status === 'fixed' && cur && cur.status !== 'fixed' && lc(next.createdBy) && lc(next.createdBy) !== u.email) notices.push({ kind: 'issuefixed', to: lc(next.createdBy), entry: next, by: u.name });
      }
      const ar = auditRow_(u, op.type, cur, next, now);
      if (ar) audit.push(ar);
    });
    Object.keys(dirty).forEach(k => writeTable_(k, db[k]));
    try { appendAudit_(audit); } catch (e) { console.error('Ghi nhật ký lỗi: ' + e); }

    notices = notices.concat(collectNotices_(taskChanges, u.email));
    notices = notices.concat(commentNotices_(commentNew, u, db, idx));
    newMembers.forEach(m => notices.push({ kind: 'invite', to: m.email, member: m, by: u.name }));
    ledgerChanges.filter(l => (l.status === 'approved' || l.status === 'rejected') && lc(l.person) !== u.email)
      .forEach(l => notices.push({ kind: 'ledger', to: lc(l.person), entry: l, by: u.name }));

    const vis = visibleData_(u, db);
    res = { serverTime: now, rejected: rejected, data: {}, appUrl: appUrl_(), online: touchPresence_(u.email),
            user: { email: u.email, name: u.name, admin: u.admin, owner: u.owner } };
    Object.keys(vis).forEach(k => {
      const hs = new Set(have[k] || []), f = forced[k] || {};
      const visIds = new Set(vis[k].map(r => r.id));
      res.data[k] = {
        rows: vis[k].filter(r => Number(r.srvAt || 0) > since || !hs.has(r.id) || f[r.id]).map(strip_),
        remove: Array.from(hs).filter(id => !visIds.has(id))
      };
    });
  } finally {
    lock.releaseLock();
  }
  if (notices.length) sendNotices_(notices, db);
  return res;
}

/* ================= SHEET HELPERS ================= */

function getSS_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SS_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  const ss = SpreadsheetApp.create('TodoApp - Dữ liệu');
  props.setProperty('SS_ID', ss.getId());
  return ss;
}

function getSheet_(key) {
  const def = SHEETS[key];
  const ss = getSS_();
  let sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    ensureSize_(sh, 2, def.cols.length);
    sh.getRange(1, 1, sh.getMaxRows(), Math.max(26, def.cols.length)).setNumberFormat('@');
    sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
    const now = Date.now();
    let seed = null;
    if (key === 'fields') seed = DEFAULT_FIELDS.map((f, i) => ({ id: f[0], label: f[1], type: f[2], unit: f[3], group: f[4], options: f[5], sort: (i + 1) * 10 }));
    if (key === 'categories') seed = DEFAULT_CATEGORIES.map((c, i) => ({ id: c[0], name: c[1], kind: c[2], sort: (i + 1) * 10 }));
    if (seed) {
      const rows = seed.map(o => def.cols.map(c => {
        const v = Object.assign({ createdAt: now, updatedAt: now, deleted: 'false', updatedBy: '', srvAt: now }, o)[c];
        return v == null ? '' : String(v);
      }));
      sh.getRange(2, 1, rows.length, def.cols.length).setValues(rows);
    }
  } else if (sh.getLastColumn() < def.cols.length) {
    if (sh.getMaxColumns() < def.cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), def.cols.length - sh.getMaxColumns());
    sh.getRange(1, 1, sh.getMaxRows(), def.cols.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols]).setFontWeight('bold');
  }
  return sh;
}

function readRows_(key) {
  const sh = getSheet_(key), def = SHEETS[key];
  const last = sh.getLastRow();
  if (last < 2) return [];
  const tz = Session.getScriptTimeZone();
  const vals = sh.getRange(2, 1, last - 1, def.cols.length).getValues();
  return vals.map(r => {
    const o = {};
    def.cols.forEach((c, j) => {
      let v = r[j];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      if (c in def.json) {
        const arr = Array.isArray(def.json[c]);
        try { v = v ? JSON.parse(v) : (arr ? [] : {}); } catch (e) { v = arr ? [] : {}; }
      }
      o[c] = v;
    });
    o.deleted = String(o.deleted).toLowerCase() === 'true';
    NUM_COLS.forEach(c => { if (c in o) o[c] = Number(o[c]) || 0; });
    return o;
  }).filter(o => o.id);
}

function serialize_(def, rows) {
  return rows.map(r => def.cols.map(c => {
    const v = r[c];
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }));
}

function ensureSize_(sh, rows, cols) {
  const mr = sh.getMaxRows(), mc = sh.getMaxColumns();
  if (mr < rows) sh.insertRowsAfter(mr, rows - mr + 200);
  if (mc < cols) sh.insertColumnsAfter(mc, cols - mc);
}

function writeTable_(key, rows) {
  if (!rows.length) return;
  const sh = getSheet_(key), def = SHEETS[key];
  ensureSize_(sh, rows.length + 1, def.cols.length);
  sh.getRange(2, 1, rows.length, def.cols.length).setNumberFormat('@').setValues(serialize_(def, rows));
}

/** Ghi lại toàn bộ bảng, xoá các dòng thừa (dùng cho Sessions) */
function rewriteTable_(key, rows) {
  const sh = getSheet_(key), def = SHEETS[key];
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, def.cols.length).clearContent();
  ensureSize_(sh, rows.length + 1, def.cols.length);
  if (rows.length) sh.getRange(2, 1, rows.length, def.cols.length).setNumberFormat('@').setValues(serialize_(def, rows));
}

function strip_(r) { const o = Object.assign({}, r); delete o.deleted; return o; }

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* Link ứng dụng gửi trong email / tem QR.
   ScriptApp.getService().getUrl() hay trả về link thử nghiệm /dev – người khác mở link đó sẽ bị lỗi
   "Không thể mở tệp tại thời điểm này". Vì vậy ưu tiên link /exec do quản trị viên lưu trong Cài đặt. */
function appUrl_() {
  try { const p = PropertiesService.getScriptProperties().getProperty('APP_URL'); if (p) return p; } catch (e) {}
  try { const u = ScriptApp.getService().getUrl() || ''; return /\/exec$/.test(u) ? u : ''; } catch (e) { return ''; }
}

/** Quản trị viên lưu link triển khai chính thức (kết thúc bằng /exec) */
function setAppUrl(token, url) {
  const u = auth_(token);
  if (!u.admin) throw new Error('Chỉ quản trị viên được đổi link ứng dụng.');
  url = String(url || '').trim().replace(/\?.*$/, '');
  const props = PropertiesService.getScriptProperties();
  if (!url) { props.deleteProperty('APP_URL'); return appUrl_(); }
  if (/\/dev$/.test(url)) throw new Error('Đây là link THỬ NGHIỆM (/dev) – chỉ chủ tài khoản mở được. Hãy dùng link Ứng dụng web kết thúc bằng /exec (Triển khai → Quản lý triển khai).');
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) throw new Error('Link không hợp lệ. Link đúng có dạng https://script.google.com/macros/s/…/exec');
  props.setProperty('APP_URL', url);
  return url;
}

function fmtDate_(s) { return s ? String(s).split('-').reverse().join('/') : ''; }

/* ================= THÔNG BÁO EMAIL ================= */

function collectNotices_(changes, me) {
  const list = [];
  changes.forEach(ch => {
    const a = ch.after, b = ch.before;
    if (a.deleted === true || String(a.deleted) === 'true') return;
    const newA = assigneesOf_(a), oldA = b ? assigneesOf_(b) : [];
    newA.filter(e => oldA.indexOf(e) < 0 && e !== me).forEach(e => list.push({ kind: 'assign', to: e, task: a }));
    const assigner = lc(a.assigner);
    if (a.status === 'done' && !(b && b.status === 'done') && assigner && assigner !== me)
      list.push({ kind: 'done', to: assigner, task: a });
  });
  return list;
}

/** Tin nhắn mới trong đầu việc → email cho người liên quan (tối đa 1 email / 15 phút / người / đầu việc) */
function commentNotices_(list, u, db, idx) {
  const out = [], cache = CacheService.getScriptCache();
  list.forEach(c => {
    const ti = idx.tasks[c.taskId], t = ti === undefined ? null : db.tasks[ti];
    if (!t) return;
    const p = t.projectId ? db.projects[idx.projects[t.projectId]] : null;
    const to = {};
    assigneesOf_(t).concat([lc(t.assigner), lc(t.createdBy)]).forEach(e => { if (e) to[e] = 1; });
    (db.comments || []).forEach(x => { if (x.taskId === t.id && !x.deleted) to[lc(x.createdBy)] = 1; });
    Object.keys(to).filter(e => e && e !== u.email).forEach(e => {
      const m = findMember_(e, db.members);
      if (e !== ownerEmail_() && !isActive_(m)) return;
      const ue = { email: e, admin: e === ownerEmail_() || (!!m && m.role === 'admin') };
      if (!taskVisible_(ue, t, p)) return;
      const key = 'cmn_' + t.id + '_' + hash_(e).slice(0, 16);
      if (cache.get(key)) return;
      cache.put(key, '1', 900);
      out.push({ kind: 'comment', to: e, task: t, entry: c, by: u.name, project: p });
    });
  });
  return out;
}

function sendNotices_(list, db) {
  try {
    const members = {};
    db.members.filter(m => !m.deleted).forEach(m => members[lc(m.email)] = m);
    const projects = {};
    db.projects.forEach(p => projects[p.id] = p);
    const url = appUrl_();
    const nm = e => { const m = members[lc(e)]; return m ? (m.fullName || m.name) : (e || ''); };
    const PRI = { high: 'Cao', med: 'Trung bình', low: 'Thấp' };
    const btn = url ? '<p style="margin-top:16px"><a href="' + url + '" style="background:#2563eb;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">Mở ứng dụng</a></p>' : '';

    list.forEach(n => {
      try {
        if (MailApp.getRemainingDailyQuota() < 1) return;
        if (n.kind === 'invite') {
          MailApp.sendEmail({ to: n.to, name: APP_NAME, subject: 'Bạn được mời sử dụng ' + APP_NAME,
            htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px"><b>' + esc_(n.by) + '</b> đã thêm bạn (' + esc_(n.member.name) +
              ') vào ứng dụng ' + APP_NAME + '.<br>Mở ứng dụng, nhập email này và mã đăng nhập sẽ được gửi về hộp thư.' + btn + '</div>' });
          return;
        }
        if (n.kind === 'issue' || n.kind === 'issuefixed') {
          const x = n.entry, p = projects[x.projectId], fixed = n.kind === 'issuefixed';
          MailApp.sendEmail({ to: n.to, name: APP_NAME, subject: (fixed ? '[Lỗi đã sửa] ' : '[Lỗi tồn tại cần xử lý] ') + x.title,
            htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px"><b>' + esc_(n.by) + '</b> ' + (fixed ? 'báo đã sửa xong lỗi:' : 'giao cho bạn xử lý lỗi tồn tại:') +
              '<p style="font-size:16px"><b>' + esc_(x.title) + '</b></p>Dự án: ' + esc_(p ? p.name : '') + (x.location ? '<br>Vị trí: ' + esc_(x.location) : '') +
              (x.dueDate ? '<br>Hạn xử lý: <b>' + fmtDate_(x.dueDate) + '</b>' : '') + (x.note ? '<br>Ghi chú: ' + esc_(x.note) : '') + btn + '</div>' });
          return;
        }
        if (n.kind === 'comment') {
          const t = n.task, c = n.entry, link = url ? url + '?t=' + encodeURIComponent(t.id) : '';
          const nf = (c.files || []).length;
          MailApp.sendEmail({ to: n.to, name: APP_NAME, subject: '[Trao đổi] ' + t.title,
            htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px"><b>' + esc_(n.by) + '</b> nhắn trong đầu việc <b>' + esc_(t.title) + '</b>' +
              (n.project ? ' (' + esc_(n.project.name) + ')' : '') + ':<div style="margin:10px 0;padding:10px 12px;background:#f1f5f9;border-radius:8px;white-space:pre-wrap">' +
              esc_(c.text || '') + (nf ? '<br><i>📎 ' + nf + ' tệp đính kèm</i>' : '') + '</div>' +
              (link ? '<p><a href="' + link + '" style="background:#2563eb;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">Trả lời trong ứng dụng</a></p>' : '') +
              '<div style="color:#6b7280;font-size:12px">Các tin nhắn tiếp theo trong 15 phút sẽ không gửi email lại.</div></div>' });
          return;
        }
        if (n.kind === 'ledger') {
          const l = n.entry, p = projects[l.projectId], ok = l.status === 'approved';
          MailApp.sendEmail({ to: n.to, name: APP_NAME,
            subject: (ok ? '[Đã duyệt] ' : '[Từ chối] ') + 'Phiếu ' + (l.kind === 'nhan' ? 'nhận' : 'chi') + ': ' + l.content,
            htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px"><b>' + esc_(n.by) + '</b> đã ' + (ok ? 'duyệt' : '<b style="color:#dc2626">từ chối</b>') +
              ' phiếu ' + (l.kind === 'nhan' ? 'nhận' : 'chi') + ' của bạn:<p style="font-size:16px"><b>' + esc_(l.content) + '</b> – ' +
              Number(l.amount || 0).toLocaleString('vi-VN') + ' đ</p>Dự án: ' + esc_(p ? p.name : '') + '<br>Ngày: ' + fmtDate_(l.date) +
              (!ok && l.rejectReason ? '<br>Lý do: <b>' + esc_(l.rejectReason) + '</b>' : '') + btn + '</div>' });
          return;
        }
        const t = n.task, p = projects[t.projectId];
        const folder = p && (p.folders || []).find(f => f.id === t.folderId);
        const isAssign = n.kind === 'assign';
        const subject = (isAssign ? '[Giao việc] ' : '[Đã hoàn thành] ') + t.title;
        const head = isAssign
          ? '<b>' + esc_(nm(t.assigner || t.updatedBy)) + '</b> đã giao cho bạn một công việc:'
          : '<b>' + esc_(nm(t.updatedBy)) + '</b> đã hoàn thành công việc bạn giao:';
        const people = assigneesOf_(t).map((e, i) => esc_(nm(e)) + (i === 0 ? ' (chủ trì)' : '')).join(', ');
        const row = (k, v) => v ? '<tr><td style="color:#6b7280;padding:4px 12px 4px 0;vertical-align:top">' + k + '</td><td style="padding:4px 0">' + v + '</td></tr>' : '';
        MailApp.sendEmail({
          to: n.to, subject: subject, name: APP_NAME,
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937"><p>' + head + '</p>' +
            '<p style="font-size:17px;font-weight:bold;margin:8px 0">' + esc_(t.title) + '</p><table style="border-collapse:collapse">' +
            row('Dự án', p ? esc_(p.name) : '') + row('Hạng mục', folder ? esc_(folder.name) : '') +
            row('Người giao', esc_(nm(t.assigner))) + row('Người nhận', people) +
            row('Hạn chót', fmtDate_(t.dueDate)) + row('Ưu tiên', PRI[t.priority] || '') +
            row('Tiến độ', (t.status === 'done' ? 100 : Number(t.progress) || 0) + '%') +
            row('Ghi chú', esc_(t.note).replace(/\n/g, '<br>')) + '</table>' + btn + '</div>'
        });
      } catch (e) { console.error('Gửi email lỗi: ' + e); }
    });
  } catch (e) { console.error(e); }
}

/* ================= TỆP ĐÍNH KÈM (Drive của chủ hệ thống, xem qua app) ================= */

function getUploadRoot_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('TodoApp - Tệp đính kèm');
  props.setProperty('FOLDER_ID', f.getId());
  return f;
}

function inRoot_(file) {
  const rootId = getUploadRoot_().getId();
  const ps = file.getParents();
  while (ps.hasNext()) {
    const p = ps.next();
    if (p.getId() === rootId) return true;
    const gp = p.getParents();
    while (gp.hasNext()) if (gp.next().getId() === rootId) return true;
  }
  return false;
}

/** Người dùng được xem tệp nếu tệp nằm trong dự án/đầu việc họ thấy, hoặc do chính họ tải lên */
function canSeeFile_(u, file) {
  if (!inRoot_(file)) return false;
  if (u.admin || file.getDescription() === 'by:' + u.email) return true;
  const db = { projects: readRows_('projects'), tasks: readRows_('tasks'), members: readRows_('members'), fields: [],
               diary: readRows_('diary'), ledger: readRows_('ledger'), categories: [],
               advances: readRows_('advances'), contracts: readRows_('contracts'),
               devices: readRows_('devices'), receipts: readRows_('receipts'), guarantees: readRows_('guarantees'),
               checks: readRows_('checks'), issues: readRows_('issues'), comments: readRows_('comments') };
  const vis = visibleData_(u, db), id = file.getId();
  if (vis.members.some(m => (m.idFiles || []).some(f => f.id === id))) return true;
  return vis.projects.concat(vis.comments, vis.tasks, vis.diary, vis.ledger, vis.advances, vis.contracts, vis.devices, vis.receipts, vis.guarantees, vis.checks, vis.issues).some(r => (r.files || []).some(f => f.id === id));
}

function uploadFile(token, meta, b64) {
  const u = auth_(token);
  if (b64.length * 0.75 > MAX_UPLOAD_MB * 1024 * 1024) throw new Error('Tệp vượt quá ' + MAX_UPLOAD_MB + 'MB.');
  const root = getUploadRoot_();
  const name = String(meta.projectName || 'Chung').replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
  const it = root.getFoldersByName(name);
  const folder = it.hasNext() ? it.next() : root.createFolder(name);
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), meta.mime || 'application/octet-stream', meta.name || 'tep');
  const f = folder.createFile(blob);
  f.setDescription('by:' + u.email);
  return { id: f.getId(), name: f.getName(), mime: f.getMimeType(), size: f.getSize(), by: u.email, at: Date.now() };
}

function getFile(token, id) {
  const u = auth_(token);
  const f = DriveApp.getFileById(id);
  if (!canSeeFile_(u, f)) throw new Error('Bạn không có quyền xem tệp này.');
  const b = f.getBlob();
  return { name: f.getName(), mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
}

function getThumbs(token, ids) {
  const u = auth_(token), out = {};
  (ids || []).slice(0, 24).forEach(id => {
    try {
      const f = DriveApp.getFileById(id);
      if (!canSeeFile_(u, f)) return;
      const t = f.getThumbnail();
      out[id] = t ? 'data:' + (t.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(t.getBytes()) : '';
    } catch (e) { out[id] = ''; }
  });
  return out;
}

function deleteFiles(token, ids) {
  const u = auth_(token);
  (ids || []).forEach(id => {
    try {
      const f = DriveApp.getFileById(id);
      if (inRoot_(f) && (u.admin || f.getDescription() === 'by:' + u.email)) f.setTrashed(true);
    } catch (e) {}
  });
  return true;
}

/* ================= XUẤT THỐNG KÊ ================= */

function exportStats(token, rows) { return exportRows(token, 'Thống kê dự án', rows); }

function exportRows(token, title, rows) {
  const u = auth_(token);
  const ss = SpreadsheetApp.create(String(title || 'Báo cáo').slice(0, 80) + ' ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HHmm'));
  const sh = ss.getSheets()[0];
  sh.setName('Thống kê');
  const w = Math.max.apply(null, rows.map(r => r.length).concat([1]));
  const vals = rows.map(r => {
    const a = r.map(v => (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v);
    while (a.length < w) a.push('');
    return a;
  });
  sh.getRange(1, 1, vals.length, w).setValues(vals);
  vals.forEach((r, i) => { if (r.filter(v => v !== '').length === 1) sh.getRange(i + 1, 1).setFontWeight('bold').setFontSize(12); });
  sh.autoResizeColumns(1, w);
  const file = DriveApp.getFileById(ss.getId());
  const root = getUploadRoot_();
  const it = root.getFoldersByName('Xuất báo cáo');
  file.moveTo(it.hasNext() ? it.next() : root.createFolder('Xuất báo cáo'));
  if (!u.owner) { try { file.addViewer(u.email); } catch (e) {} }
  return ss.getUrl();
}

/* ================= EMAIL NHẮC DEADLINE HẰNG NGÀY ================= */

function installReminder() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailyReminder').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyReminder').timeBased().everyDays(1).atHour(7).create();
  const msg = 'Đã cài nhắc việc lúc ~7h sáng hằng ngày.';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

function dailyReminder() {
  const tz = Session.getScriptTimeZone();
  const today = new Date(Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd') + 'T00:00:00Z');
  const projects = {};
  readRows_('projects').filter(p => !p.deleted).forEach(p => projects[p.id] = p);
  const members = {};
  readRows_('members').filter(m => !m.deleted).forEach(m => members[lc(m.email)] = m);
  const nm = e => { const m = members[lc(e)]; return m ? m.name : (e || ''); };

  const items = [];
  readRows_('tasks').filter(t => !t.deleted && t.status !== 'done' && t.dueDate && (!t.projectId || projects[t.projectId]))
    .forEach(t => {
      const d = Math.round((new Date(String(t.dueDate) + 'T00:00:00Z') - today) / 86400000);
      if (!isNaN(d) && d <= REMIND_DAYS) items.push({ t: t, d: d });
    });
  items.sort((a, b) => a.d - b.d);
  const dd = s => Math.round((new Date(String(s) + 'T00:00:00Z') - today) / 86400000);
  const GT = { performance: 'Bảo lãnh thực hiện HĐ', advance: 'Bảo lãnh tạm ứng', warranty: 'Bảo lãnh bảo hành', bid: 'Bảo lãnh dự thầu', other: 'Bảo lãnh khác' };
  const gItems = readRows_('guarantees').filter(g => !g.deleted && g.status !== 'released' && g.expiryDate && projects[g.projectId])
    .map(g => ({ g: g, d: dd(g.expiryDate) })).filter(x => !isNaN(x.d) && x.d <= GUAR_DAYS).sort((a, b) => a.d - b.d);
  const rItems = readRows_('receipts').filter(r => !r.deleted && r.status !== 'received' && r.plannedDate && projects[r.projectId])
    .map(r => ({ r: r, d: dd(r.plannedDate) })).filter(x => !isNaN(x.d) && x.d <= 3).sort((a, b) => a.d - b.d);
  const membersAll = members;
  const iItems = readRows_('issues').filter(x => !x.deleted && (x.status === 'open' || x.status === 'fixing') && x.dueDate && projects[x.projectId])
    .map(x => ({ x: x, d: dd(x.dueDate) })).filter(o => !isNaN(o.d) && o.d <= 1).sort((a, b) => a.d - b.d);
  const iTable = list => list.length ? '<h3 style="font-family:Arial">Lỗi tồn tại quá hạn / sắp hạn</h3><table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
    '<tr style="background:#f1f5f9"><th>Dự án</th><th>Lỗi</th><th>Vị trí</th><th>Người xử lý</th><th>Hạn</th></tr>' +
    list.map(({ x, d }) => '<tr><td>' + esc_(projects[x.projectId].name) + '</td><td>' + esc_(x.title) + '</td><td>' + esc_(x.location || '') + '</td><td>' + esc_(nm(x.assignee)) +
      '</td><td style="color:#dc2626;font-weight:bold">' + (d < 0 ? 'Quá hạn ' + (-d) + ' ngày' : d === 0 ? 'Hôm nay' : 'Ngày mai') + '</td></tr>').join('') + '</table>' : '';
  if (!items.length && !gItems.length && !rItems.length && !iItems.length) return;
  const money_ = v => (Number(v) || 0).toLocaleString('vi-VN');
  const due_ = d => d < 0 ? 'Quá hạn ' + (-d) + ' ngày' : d === 0 ? 'Hôm nay' : 'Còn ' + d + ' ngày';
  const gTable = list => list.length ? '<h3 style="font-family:Arial">Bảo lãnh sắp hết hạn</h3><table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
    '<tr style="background:#f1f5f9"><th>Dự án</th><th>Loại</th><th>Ngân hàng / số</th><th>Giá trị</th><th>Hết hạn</th><th>Tình trạng</th></tr>' +
    list.map(({ g, d }) => '<tr><td>' + esc_(projects[g.projectId].name) + '</td><td>' + (GT[g.gtype] || GT.other) + '</td><td>' + esc_([g.bank, g.number].filter(Boolean).join(' – ')) +
      '</td><td style="text-align:right">' + money_(g.amount) + '</td><td>' + fmtDate_(g.expiryDate) + '</td><td style="color:' + (d < 7 ? '#dc2626' : '#ea580c') + ';font-weight:bold">' + due_(d) + '</td></tr>').join('') + '</table>' : '';
  const rTable = list => list.length ? '<h3 style="font-family:Arial">Đợt thanh toán từ chủ đầu tư đến hạn</h3><table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
    '<tr style="background:#f1f5f9"><th>Dự án</th><th>Đợt</th><th>Số tiền</th><th>Ngày dự kiến</th><th>Tình trạng</th></tr>' +
    list.map(({ r, d }) => '<tr><td>' + esc_(projects[r.projectId].name) + '</td><td>' + esc_(r.name) + '</td><td style="text-align:right">' + money_(r.amount) +
      '</td><td>' + fmtDate_(r.plannedDate) + '</td><td style="color:' + (d < 0 ? '#dc2626' : '#ea580c') + ';font-weight:bold">' + due_(d) + '</td></tr>').join('') + '</table>' : '';

  const url = appUrl_();
  const table = list => '<table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
    '<tr style="background:#f1f5f9"><th>Công việc</th><th>Dự án</th><th>Người nhận</th><th>Hạn</th><th>Tình trạng</th><th>Tiến độ</th></tr>' +
    list.map(({ t, d }) => '<tr><td>' + esc_(t.title) + '</td><td>' + esc_(projects[t.projectId] ? projects[t.projectId].name : '') +
      '</td><td>' + esc_(assigneesOf_(t).map(nm).join(', ')) + '</td><td>' + fmtDate_(t.dueDate) +
      '</td><td style="color:' + (d < 0 ? '#dc2626' : '#ea580c') + ';font-weight:bold">' + (d < 0 ? 'Quá hạn ' + (-d) + ' ngày' : d === 0 ? 'Hôm nay' : 'Còn ' + d + ' ngày') +
      '</td><td>' + (Number(t.progress) || 0) + '%</td></tr>').join('') +
    '</table>' + (url ? '<p><a href="' + url + '">Mở ứng dụng</a></p>' : '');
  const taskTable = list => list.length ? '<h3 style="font-family:Arial">Công việc quá hạn / sắp đến hạn</h3>' + table(list) : '';
  const subj = list => { const o = list.filter(i => i.d < 0).length; return '[Công việc] ' + o + ' việc quá hạn, ' + (list.length - o) + ' việc sắp đến hạn'; };

  const owner = ownerEmail_();
  const ownerSubj = [items.length ? subj(items).replace('[Công việc] ', '') : '', iItems.length ? iItems.length + ' lỗi tồn tại quá hạn' : '', gItems.length ? gItems.length + ' bảo lãnh sắp hết hạn' : '',
                     rItems.length ? rItems.length + ' đợt thanh toán đến hạn' : ''].filter(Boolean).join(' · ');
  MailApp.sendEmail({ to: owner, subject: '[Tổng hợp] ' + ownerSubj, htmlBody: gTable(gItems) + rTable(rItems) + iTable(iItems) + taskTable(items) + (url ? '<p><a href="' + url + '">Mở ứng dụng</a></p>' : ''), name: APP_NAME });
  /* quản lý từng dự án nhận phần bảo lãnh / thanh toán của dự án mình */
  const mgrOf = p => [lc(p.createdBy)].concat((p.acl || []).filter(a => a.role === 'manager').map(a => lc(a.email))).filter(e => e && e !== owner);
  const byMgr = {};
  gItems.forEach(x => mgrOf(projects[x.g.projectId]).forEach(e => { (byMgr[e] = byMgr[e] || { g: [], r: [] }).g.push(x); }));
  rItems.forEach(x => mgrOf(projects[x.r.projectId]).forEach(e => { (byMgr[e] = byMgr[e] || { g: [], r: [] }).r.push(x); }));
  Object.keys(byMgr).forEach(e => { try {
    if (MailApp.getRemainingDailyQuota() < 1) return;
    MailApp.sendEmail({ to: e, name: APP_NAME, subject: '[Tài chính dự án] ' + [byMgr[e].g.length ? byMgr[e].g.length + ' bảo lãnh sắp hết hạn' : '', byMgr[e].r.length ? byMgr[e].r.length + ' đợt thanh toán đến hạn' : ''].filter(Boolean).join(' · '),
      htmlBody: gTable(byMgr[e].g) + rTable(byMgr[e].r) });
  } catch (x) { console.error(x); } });
  const byPerson = {};
  items.forEach(i => assigneesOf_(i.t).forEach(a => { if (a !== owner) (byPerson[a] = byPerson[a] || []).push(i); }));
  const byIss = {};
  iItems.forEach(o => { const a = lc(o.x.assignee); if (a && a !== owner) (byIss[a] = byIss[a] || []).push(o); });
  Object.keys(byIss).forEach(e => { try {
    if (MailApp.getRemainingDailyQuota() < 1) return;
    MailApp.sendEmail({ to: e, name: APP_NAME, subject: '[Lỗi tồn tại] ' + byIss[e].length + ' lỗi cần xử lý gấp', htmlBody: iTable(byIss[e]) + (url ? '<p><a href="' + url + '">Mở ứng dụng</a></p>' : '') });
  } catch (x) { console.error(x); } });
  Object.keys(byPerson).forEach(email => {
    try {
      if (MailApp.getRemainingDailyQuota() < 1) return;
      MailApp.sendEmail({ to: email, subject: subj(byPerson[email]), htmlBody: table(byPerson[email]), name: APP_NAME });
    } catch (e) { console.error(e); }
  });
}

/* ================= XUẤT NHẬT KÝ THI CÔNG (Word / PDF) =================
 * opt = { projectId, from:'yyyy-mm-dd', to:'yyyy-mm-dd', format:'docx'|'pdf', photos:bool, pageBreak:bool }
 * Khổ A4, Times New Roman 13, lề trên/dưới 20mm, trái 30mm, phải 15mm.
 */
function exportDiary(token, opt) {
  opt = opt || {};
  const u = auth_(token);
  const projects = readRows_('projects');
  const p = projects.find(x => x.id === opt.projectId && !x.deleted);
  if (!p || !projRole_(u, p)) throw new Error('Bạn không có quyền với dự án này.');
  const from = opt.from || '0000-00-00', to = opt.to || '9999-99-99';
  const list = readRows_('diary')
    .filter(d => !d.deleted && d.projectId === p.id && String(d.date) >= from && String(d.date) <= to)
    .sort((a, b) => String(a.date) < String(b.date) ? -1 : String(a.date) > String(b.date) ? 1 : 0);
  if (!list.length) throw new Error('Không có nhật ký nào trong khoảng ngày đã chọn.');

  const mem = {};
  readRows_('members').forEach(m => mem[lc(m.email)] = m);
  const nm = e => { const m = mem[lc(e)]; return m ? (m.fullName || m.name) : (e || ''); };
  const fields = {};
  readRows_('fields').filter(f => !f.deleted).forEach(f => fields[f.id] = f);
  const folders = {};
  (p.folders || []).forEach(f => folders[f.id] = f.name);
  const info = p.info || {};
  const num = v => Number(v) || 0;
  const fmtN = v => num(v).toLocaleString('vi-VN');
  const DOW = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dow = d => DOW[new Date(String(d) + 'T00:00:00Z').getUTCDay()];
  const FONT = 'Times New Roman';
  const CENTER = DocumentApp.HorizontalAlignment.CENTER;

  const title = 'Nhật ký thi công - ' + p.name + ' (' + fmtDate_(list[0].date) + ' - ' + fmtDate_(list[list.length - 1].date) + ')';
  const doc = DocumentApp.create(title.replace(/\//g, '.'));
  const body = doc.getBody();
  body.setPageWidth(595.28).setPageHeight(841.89)
      .setMarginTop(56.7).setMarginBottom(56.7).setMarginLeft(85).setMarginRight(42.5);

  const para = (text, o) => {
    o = o || {};
    const pg = body.appendParagraph(text || '');
    if (o.center) pg.setAlignment(CENTER);
    pg.setSpacingBefore(o.before || 0).setSpacingAfter(o.after == null ? 3 : o.after);
    if (text) {
      const t = pg.editAsText();
      t.setFontFamily(FONT).setFontSize(o.size || 13).setBold(!!o.bold).setItalic(!!o.italic);
    }
    return pg;
  };
  const styleTable = (tb, o) => {
    o = o || {};
    tb.setBorderWidth(o.border == null ? 0.5 : o.border);
    tb.editAsText().setFontFamily(FONT).setFontSize(o.size || 12);
    if (o.widths) o.widths.forEach((w, i) => { try { tb.setColumnWidth(i, w); } catch (e) {} });
    for (let r = 0; r < tb.getNumRows(); r++) {
      const row = tb.getRow(r);
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        cell.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(5).setPaddingRight(5);
        if (o.center) for (let k = 0; k < cell.getNumChildren(); k++) { try { cell.getChild(k).asParagraph().setAlignment(CENTER); } catch (e) {} }
        if ((o.headRow && r === 0) || (o.footRow && r === tb.getNumRows() - 1)) { cell.editAsText().setBold(true); cell.setBackgroundColor('#eeeeee'); }
        if (o.keyCol && c === 0) { cell.editAsText().setBold(true); cell.setBackgroundColor('#f3f3f3'); }
      }
    }
    return tb;
  };

  /* ----- Tiêu đề & thông tin dự án ----- */
  para('NHẬT KÝ THI CÔNG', { center: true, bold: true, size: 16, after: 2 });
  para('Từ ngày ' + fmtDate_(list[0].date) + ' đến ngày ' + fmtDate_(list[list.length - 1].date), { center: true, italic: true, after: 10 });
  const head = [['Công trình / Dự án', p.name]];
  [['f_cdt', 'Chủ đầu tư'], ['f_diadiem', 'Địa điểm'], ['f_sohd', 'Hợp đồng số']].forEach(([id, lb]) => {
    if (info[id]) head.push([fields[id] ? fields[id].label : lb, String(info[id])]);
  });
  styleTable(body.appendTable(head), { keyCol: true, widths: [150] });

  /* ----- Từng ngày ----- */
  list.forEach((d, i) => {
    if (opt.pageBreak && i > 0) body.appendPageBreak();
    para('NGÀY ' + fmtDate_(d.date) + ' (' + dow(d.date) + ')', { bold: true, size: 13, before: 14, after: 6 });
    const L = d.labor || {};
    const rows = [];
    const add = (k, v) => { if (v != null && String(v).trim() !== '') rows.push([k, String(v)]); };
    add('Thời tiết', [d.weatherAM ? 'Sáng: ' + d.weatherAM : '', d.weatherPM ? 'Chiều: ' + d.weatherPM : ''].filter(Boolean).join('; '));
    add('Hạng mục / vị trí', [folders[d.folderId] || '', d.area || ''].filter(Boolean).join(' – '));
    const lab = [];
    if (num(L.tech)) lab.push('Cán bộ kỹ thuật: ' + num(L.tech) + ' người');
    if (num(L.perm)) lab.push('Nhân công cơ hữu: ' + num(L.perm) + ' người');
    if (num(L.contract)) lab.push('Nhân công khoán: ' + num(L.contract) + ' người');
    if (lab.length) lab.push('Tổng cộng: ' + (num(L.tech) + num(L.perm) + num(L.contract)) + ' người');
    add('Nhân lực', lab.join('\n'));
    if (num(L.otPeople) || num(L.otHours)) add('Tăng ca', num(L.otPeople) + ' người × ' + num(L.otHours) + ' giờ' + (L.otNote ? ' – ' + L.otNote : ''));
    add('Máy thi công', (d.machines || []).filter(m => m.name).map(m => '- ' + m.name + (num(m.shifts) ? ': ' + fmtN(m.shifts) + ' ca' : '') + (m.note ? ' (' + m.note + ')' : '')).join('\n'));
    add('Vật tư nhập / sử dụng', (d.materials || []).filter(m => m.name).map(m => '- ' + m.name + (num(m.qty) ? ': ' + fmtN(m.qty) + ' ' + (m.unit || '') : '') + (m.note ? ' (' + m.note + ')' : '')).join('\n'));
    const work = [d.workText || ''].concat((d.tasks || []).map(t => '- ' + t.title + (t.progress != null ? ' (' + num(t.progress) + '%)' : '')));
    add('Công việc thực hiện', work.filter(Boolean).join('\n'));
    add('Khối lượng hoàn thành', (d.quantities || []).filter(q => q.name).map(q => '- ' + q.name + ': ' + fmtN(q.qty) + ' ' + (q.unit || '') + (q.note ? ' (' + q.note + ')' : '')).join('\n'));
    add('An toàn lao động, VSMT', d.safety);
    add('Sự cố, vướng mắc', d.issues);
    add('Kiến nghị', d.proposals);
    add('Ý kiến giám sát / CĐT', d.supervisorNote);
    if (!rows.length) rows.push(['Ghi chú', '(không có nội dung)']);
    styleTable(body.appendTable(rows), { keyCol: true, widths: [150] });

    /* Ảnh hiện trường */
    const imgs = (d.files || []).filter(f => String(f.mime || '').indexOf('image/') === 0).slice(0, 6);
    if (opt.photos && imgs.length) {
      para('Hình ảnh hiện trường:', { italic: true, before: 6 });
      let pg = null;
      imgs.forEach((f, k) => {
        try {
          if (k % 2 === 0) pg = body.appendParagraph('');
          const im = pg.appendInlineImage(DriveApp.getFileById(f.id).getBlob());
          const w = im.getWidth(), h = im.getHeight(), W = 215;
          im.setWidth(W).setHeight(Math.round(h * W / w));
          if (k % 2 === 0) pg.appendText('   ');
        } catch (e) { /* bỏ qua ảnh lỗi */ }
      });
    }

    /* Chữ ký */
    const sig = body.appendTable([
      ['NGƯỜI LẬP', 'XÁC NHẬN CỦA CÁN BỘ GIÁM SÁT / QUẢN LÝ'],
      ['(Ký, ghi rõ họ tên)', '(Ký, ghi rõ họ tên)'],
      ['\n\n\n' + nm(d.createdBy), d.confirmedBy ? '\n\n\n' + nm(d.confirmedBy) : '']
    ]);
    styleTable(sig, { border: 0, center: true });
    sig.getRow(0).editAsText().setBold(true);
    sig.getRow(1).editAsText().setItalic(true).setFontSize(11);
    sig.getRow(2).editAsText().setBold(true);
  });

  /* ----- Bảng tổng hợp nhân lực, ca máy ----- */
  body.appendPageBreak();
  para('BẢNG TỔNG HỢP NHÂN LỰC VÀ CA MÁY', { center: true, bold: true, size: 14, after: 8 });
  const sum = [['Ngày', 'CB kỹ thuật', 'NC cơ hữu', 'NC khoán', 'Tăng ca (giờ công)', 'Ca máy']];
  const tot = [0, 0, 0, 0, 0];
  list.forEach(d => {
    const L = d.labor || {};
    const v = [num(L.tech), num(L.perm), num(L.contract), num(L.otPeople) * num(L.otHours),
               (d.machines || []).reduce((a, m) => a + num(m.shifts), 0)];
    v.forEach((x, k) => tot[k] += x);
    sum.push([fmtDate_(d.date)].concat(v.map(x => x ? fmtN(x) : '')));
  });
  sum.push(['Tổng cộng'].concat(tot.map(fmtN)));
  styleTable(body.appendTable(sum), { headRow: true, footRow: true, center: true });

  try { const first = body.getChild(0); if (first.getType() === DocumentApp.ElementType.PARAGRAPH && !first.asParagraph().getText()) body.removeChild(first); } catch (e) {}
  doc.saveAndClose();

  const file = DriveApp.getFileById(doc.getId());
  const root = getUploadRoot_();
  const it = root.getFoldersByName('Xuất báo cáo');
  file.moveTo(it.hasNext() ? it.next() : root.createFolder('Xuất báo cáo'));
  let blob, name = file.getName();
  if (opt.format === 'docx') {
    blob = UrlFetchApp.fetch('https://docs.google.com/document/d/' + doc.getId() + '/export?format=docx',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
    name += '.docx';
  } else {
    blob = file.getAs(MimeType.PDF);
    name += '.pdf';
  }
  return { name: name, mime: blob.getContentType(), b64: Utilities.base64Encode(blob.getBytes()), url: u.owner ? doc.getUrl() : '' };
}

/* ================= NHẬT KÝ THAY ĐỔI (ai sửa gì, lúc nào) ================= */

function auditRow_(u, type, cur, next, now, action) {
  const skip = { srvAt: 1, updatedAt: 1, updatedBy: 1 };
  const before = {}, after = {};
  Object.keys(next).forEach(k => {
    if (skip[k]) return;
    if (!cur || !same_(cur[k], next[k])) { if (cur) before[k] = cur[k]; after[k] = next[k]; }
  });
  if (!Object.keys(after).length && !action) return null;
  const isDel = v => v === true || String(v) === 'true';
  action = action || (!cur ? 'create' : (isDel(next.deleted) && !isDel(cur.deleted)) ? 'delete' : 'update');
  const pid = type === 'project' ? next.id : (next.projectId || '');
  const title = next.title || next.name || next.content || next.text || next.team || next.serial || next.label || next.date || next.month || '';
  const cut = o => { const s = JSON.stringify(o); return s.length > 8000 ? s.slice(0, 8000) + '…' : s; };
  return [Utilities.getUuid().slice(0, 13), String(now), u.email, type, String(next.id), String(pid), action, String(title).slice(0, 200), cut(before), cut(after)];
}

function appendAudit_(rows) {
  rows = (rows || []).filter(Boolean);
  if (!rows.length) return;
  const sh = getSheet_('audit'), n = sh.getLastRow(), w = SHEETS.audit.cols.length;
  ensureSize_(sh, n + rows.length + 1, w);
  sh.getRange(n + 1, 1, rows.length, w).setNumberFormat('@').setValues(rows);
}

/** Lịch sử thay đổi: quản trị xem tất cả; quản lý dự án xem các dự án mình quản lý */
function getAudit(token, opt) {
  opt = opt || {};
  const projects = readRows_('projects');
  const u = auth_(token);
  const mine = {};
  projects.forEach(p => { if (projRole_(u, p) === 'manager') mine[p.id] = true; });
  if (!u.admin && !Object.keys(mine).length) throw new Error('Chỉ quản trị viên hoặc quản lý dự án xem được lịch sử thay đổi.');
  const sh = getSheet_('audit'), n = sh.getLastRow();
  if (n < 2) return [];
  const cols = SHEETS.audit.cols, vals = sh.getRange(2, 1, n - 1, cols.length).getValues();
  const limit = Math.min(Number(opt.limit) || 300, 2000), out = [];
  for (let i = vals.length - 1; i >= 0 && out.length < limit; i--) {
    const r = {};
    cols.forEach((c, j) => r[c] = String(vals[i][j]));
    if (!u.admin && !mine[r.projectId]) continue;
    if (opt.type && r.type !== opt.type) continue;
    if (opt.recId && r.recId !== opt.recId) continue;
    if (opt.projectId && r.projectId !== opt.projectId) continue;
    if (opt.user && lc(r.user) !== lc(opt.user)) continue;
    if (opt.action && r.action !== opt.action) continue;
    r.at = Number(r.at) || 0;
    out.push(r);
  }
  return out;
}

/** Khôi phục bản ghi đã xoá (kèm các đầu việc, nhật ký… bị xoá cùng dự án) */
function restoreRecord(token, type, id) {
  const key = TYPE_KEY[type];
  if (!key) throw new Error('Loại dữ liệu không hợp lệ.');
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const db = {};
    Object.keys(TYPE_KEY).forEach(t => db[TYPE_KEY[t]] = readRows_(TYPE_KEY[t]));
    const u = auth_(token, db.members);
    const idx = {};
    Object.keys(db).forEach(k => { idx[k] = {}; db[k].forEach((r, i) => idx[k][r.id] = i); });
    const i = idx[key][id], cur = i === undefined ? null : db[key][i];
    if (!cur || !cur.deleted) throw new Error('Không tìm thấy bản ghi đã xoá (có thể đã được khôi phục).');
    const now = Date.now();
    const rec = Object.assign({}, cur, { deleted: false, updatedAt: now });
    const why = checkOp_(u, type, cur, rec, db, idx);
    if (why) throw new Error(why);
    rec.srvAt = now; rec.updatedBy = u.email;
    db[key][i] = rec;
    const audit = [auditRow_(u, type, cur, rec, now, 'restore')];
    let extra = 0;
    if (type === 'project') {   /* các bản ghi bị xoá cùng lúc với dự án (trong vòng 2 phút) */
      ['tasks', 'diary', 'ledger', 'devices'].forEach(k => {
        let changed = false;
        db[k].forEach((r, j) => {
          if (r.projectId === id && r.deleted && Math.abs((Number(r.updatedAt) || 0) - (Number(cur.updatedAt) || 0)) < 120000) {
            const t = Object.keys(TYPE_KEY).filter(x => TYPE_KEY[x] === k)[0];
            const nr = Object.assign({}, r, { deleted: false, updatedAt: now, srvAt: now, updatedBy: u.email });
            audit.push(auditRow_(u, t, r, nr, now, 'restore'));
            db[k][j] = nr; changed = true; extra++;
          }
        });
        if (changed) writeTable_(k, db[k]);
      });
    }
    writeTable_(key, db[key]);
    appendAudit_(audit);
    return { ok: true, extra: extra };
  } finally { lock.releaseLock(); }
}

/* ================= SAO LƯU TỰ ĐỘNG ================= */

function subFolder_(name) {
  const root = getUploadRoot_(), it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

/** Chạy tự động 23h hằng ngày: chép toàn bộ Sheet dữ liệu, giữ KEEP_BACKUPS bản gần nhất */
function backupNow() {
  const ss = getSS_(), folder = subFolder_('Sao lưu dữ liệu');
  const name = 'Sao lưu ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  DriveApp.getFileById(ss.getId()).makeCopy(name, folder);
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated());
  files.slice(KEEP_BACKUPS).forEach(f => { try { f.setTrashed(true); } catch (e) {} });
  try {
    const sh = getSheet_('audit'), n = sh.getLastRow();
    if (n > AUDIT_MAX + 1) sh.deleteRows(2, n - 1 - AUDIT_MAX);
  } catch (e) {}
  return name;
}

function backupMenu() {
  const n = backupNow();
  try { SpreadsheetApp.getUi().alert('Đã sao lưu: ' + n + '\nThư mục: TodoApp - Tệp đính kèm / Sao lưu dữ liệu'); } catch (e) { Logger.log(n); }
}

function backupApi(token) {
  const u = auth_(token);
  if (!u.admin) throw new Error('Chỉ quản trị viên được sao lưu.');
  return backupNow();
}

function listBackups(token) {
  const u = auth_(token);
  if (!u.admin) throw new Error('Chỉ quản trị viên xem được bản sao lưu.');
  const out = [], it = subFolder_('Sao lưu dữ liệu').getFiles();
  while (it.hasNext()) { const f = it.next(); out.push({ name: f.getName(), at: f.getDateCreated().getTime(), url: u.owner ? f.getUrl() : '' }); }
  return out.sort((a, b) => b.at - a.at);
}

function ensureTriggers_() {
  const have = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  if (have.indexOf('dailyReminder') < 0) ScriptApp.newTrigger('dailyReminder').timeBased().everyDays(1).atHour(7).create();
  if (have.indexOf('backupNow') < 0) ScriptApp.newTrigger('backupNow').timeBased().everyDays(1).atHour(23).create();
  if (have.indexOf('weeklyReport') < 0) ScriptApp.newTrigger('weeklyReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
}

/* ================= XUẤT TÀI LIỆU (dùng chung) ================= */

function docTools_(doc, landscape) {
  const body = doc.getBody(), FONT = 'Times New Roman', CENTER = DocumentApp.HorizontalAlignment.CENTER;
  if (landscape) body.setPageWidth(841.89).setPageHeight(595.28).setMarginTop(42.5).setMarginBottom(42.5).setMarginLeft(56.7).setMarginRight(42.5);
  else body.setPageWidth(595.28).setPageHeight(841.89).setMarginTop(56.7).setMarginBottom(56.7).setMarginLeft(85).setMarginRight(42.5);
  const para = (text, o) => {
    o = o || {};
    const pg = body.appendParagraph(text || '');
    if (o.center) pg.setAlignment(CENTER);
    pg.setSpacingBefore(o.before || 0).setSpacingAfter(o.after == null ? 3 : o.after);
    if (text) pg.editAsText().setFontFamily(FONT).setFontSize(o.size || 13).setBold(!!o.bold).setItalic(!!o.italic);
    return pg;
  };
  const table = (rows, o) => {
    o = o || {};
    const tb = body.appendTable(rows);
    tb.setBorderWidth(o.border == null ? 0.5 : o.border);
    tb.editAsText().setFontFamily(FONT).setFontSize(o.size || 12);
    if (o.widths) o.widths.forEach((w, i) => { try { if (w) tb.setColumnWidth(i, w); } catch (e) {} });
    for (let r = 0; r < tb.getNumRows(); r++) {
      const row = tb.getRow(r);
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        cell.setPaddingTop(2).setPaddingBottom(2).setPaddingLeft(4).setPaddingRight(4);
        if (o.center) for (let k = 0; k < cell.getNumChildren(); k++) { try { cell.getChild(k).asParagraph().setAlignment(CENTER); } catch (e) {} }
        if ((o.headRow && r === 0) || (o.boldRows && o.boldRows.indexOf(r) >= 0)) { cell.editAsText().setBold(true); cell.setBackgroundColor('#eeeeee'); }
        if (o.keyCol && c === 0) { cell.editAsText().setBold(true); cell.setBackgroundColor('#f3f3f3'); }
      }
    }
    return tb;
  };
  const signature = (left, right, names) => {
    const sig = table([[left, right], ['(Ký, ghi rõ họ tên)', '(Ký, ghi rõ họ tên)'], ['\n\n\n' + (names ? names[0] || '' : ''), '\n\n\n' + (names ? names[1] || '' : '')]], { border: 0, center: true });
    sig.getRow(0).editAsText().setBold(true);
    sig.getRow(1).editAsText().setItalic(true).setFontSize(11);
    return sig;
  };
  const cleanFirst = () => { try { const f = body.getChild(0); if (f.getType() === DocumentApp.ElementType.PARAGRAPH && !f.asParagraph().getText()) body.removeChild(f); } catch (e) {} };
  return { body: body, para: para, table: table, signature: signature, cleanFirst: cleanFirst };
}

function finishDoc_(doc, u, format) {
  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(subFolder_('Xuất báo cáo'));
  let blob, name = file.getName();
  if (format === 'docx') {
    blob = UrlFetchApp.fetch('https://docs.google.com/document/d/' + doc.getId() + '/export?format=docx',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
    name += '.docx';
  } else { blob = file.getAs(MimeType.PDF); name += '.pdf'; }
  return { name: name, mime: blob.getContentType(), b64: Utilities.base64Encode(blob.getBytes()), url: u.owner ? doc.getUrl() : '' };
}

function projectHeadRows_(p) {
  const info = p.info || {}, fields = {};
  readRows_('fields').filter(f => !f.deleted).forEach(f => fields[f.id] = f);
  const rows = [['Công trình / Dự án', p.name]];
  [['f_cdt', 'Chủ đầu tư'], ['f_diadiem', 'Địa điểm'], ['f_sohd', 'Hợp đồng số']].forEach(([id, lb]) => {
    if (info[id]) rows.push([fields[id] ? fields[id].label : lb, String(info[id])]);
  });
  return rows;
}

/* ================= XUẤT DANH MỤC THIẾT BỊ BÀN GIAO ================= */

const DEV_STATUS_ = { stock: 'Trong kho', installed: 'Đã lắp đặt', accepted: 'Đã nghiệm thu', warranty: 'Đang bảo hành / sửa chữa', broken: 'Hỏng / thay thế' };

/** opt = { projectId, format:'docx'|'pdf', ids:[...] (tuỳ chọn – chỉ các thiết bị đã chọn) } */
function exportDevices(token, opt) {
  opt = opt || {};
  const u = auth_(token);
  const p = readRows_('projects').find(x => x.id === opt.projectId && !x.deleted);
  if (!p || !projRole_(u, p)) throw new Error('Bạn không có quyền với dự án này.');
  const pick = opt.ids && opt.ids.length ? new Set(opt.ids) : null;
  const folders = {};
  (p.folders || []).forEach(f => folders[f.id] = f.name);
  const list = readRows_('devices').filter(d => !d.deleted && d.projectId === p.id && (!pick || pick.has(d.id)))
    .sort((a, b) => String(a.category).localeCompare(String(b.category), 'vi') || String(a.location).localeCompare(String(b.location), 'vi') || String(a.serial).localeCompare(String(b.serial)));
  if (!list.length) throw new Error('Không có thiết bị nào để xuất.');
  const doc = DocumentApp.create(('Danh mục thiết bị bàn giao - ' + p.name).replace(/\//g, '.'));
  const T = docTools_(doc, true);
  T.para('DANH MỤC THIẾT BỊ BÀN GIAO', { center: true, bold: true, size: 15, after: 2 });
  T.para('Ngày ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy'), { center: true, italic: true, after: 8 });
  T.table(projectHeadRows_(p), { keyCol: true, widths: [160] });
  T.para('', { after: 6 });
  const rows = [['STT', 'Loại thiết bị', 'Hãng / Model', 'Serial', 'MAC', 'IP', 'Vị trí lắp đặt', 'Ngày lắp', 'Bảo hành đến']];
  list.forEach((d, i) => rows.push([String(i + 1), d.category || '', [d.brand, d.model].filter(Boolean).join(' '), d.serial || '', d.mac || '', d.ip || '',
    [folders[d.folderId], d.location].filter(Boolean).join(' – '), fmtDate_(d.installDate), fmtDate_(d.warrantyEnd)]));
  T.table(rows, { headRow: true, size: 10, widths: [30, 85, 110, 105, 105, 80, 140, 60, 60] });
  T.para('', { after: 6 });
  T.para('TỔNG HỢP THEO LOẠI THIẾT BỊ', { bold: true, size: 12, before: 8, after: 4 });
  const cnt = {};
  list.forEach(d => { const k = (d.category || '(chưa phân loại)') + '|' + [d.brand, d.model].filter(Boolean).join(' '); cnt[k] = (cnt[k] || 0) + 1; });
  const sum = [['STT', 'Loại thiết bị', 'Hãng / Model', 'Số lượng']];
  Object.keys(cnt).forEach((k, i) => { const a = k.split('|'); sum.push([String(i + 1), a[0], a[1], String(cnt[k])]); });
  sum.push(['', 'Tổng cộng', '', String(list.length)]);
  T.table(sum, { headRow: true, boldRows: [sum.length - 1], widths: [40, 200, 250, 80] });
  T.para('', { after: 10 });
  T.signature('ĐẠI DIỆN BÊN GIAO', 'ĐẠI DIỆN BÊN NHẬN');
  T.cleanFirst();
  return finishDoc_(doc, u, opt.format);
}

/* ================= BIÊN BẢN NGHIỆM THU & LỖI TỒN TẠI ================= */

const CHECK_RES_ = { ok: 'Đạt', fail: 'Không đạt', na: 'Không áp dụng' };
const CONCL_ = { pass: 'Đồng ý nghiệm thu, đưa vào sử dụng.', conditional: 'Đồng ý nghiệm thu, nhà thầu khắc phục các tồn tại nêu trên trong thời hạn thống nhất.', fail: 'Chưa đồng ý nghiệm thu, nhà thầu khắc phục và tổ chức nghiệm thu lại.' };
const ISSUE_ST_ = { open: 'Chưa xử lý', fixing: 'Đang xử lý', fixed: 'Đã sửa – chờ kiểm tra', closed: 'Đã đóng' };
const SEV_ = { high: 'Nghiêm trọng', med: 'Trung bình', low: 'Nhẹ' };

function nationalHeader_(T) {
  T.para('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { center: true, bold: true, size: 13, after: 0 });
  T.para('Độc lập – Tự do – Hạnh phúc', { center: true, bold: true, size: 13, after: 2 });
  T.para('_______________', { center: true, size: 11, after: 12 });
}

/** opt = { id, format } – xuất một biên bản nghiệm thu */
function exportCheck(token, opt) {
  opt = opt || {};
  const u = auth_(token);
  const c = readRows_('checks').find(x => x.id === opt.id && !x.deleted);
  if (!c) throw new Error('Không tìm thấy biên bản.');
  const p = readRows_('projects').find(x => x.id === c.projectId && !x.deleted);
  if (!p || !projRole_(u, p)) throw new Error('Bạn không có quyền với dự án này.');
  const folder = (p.folders || []).find(f => f.id === c.folderId);
  const doc = DocumentApp.create(('Biên bản nghiệm thu - ' + c.name + ' - ' + p.name).replace(/\//g, '.'));
  const T = docTools_(doc, false);
  nationalHeader_(T);
  T.para('BIÊN BẢN NGHIỆM THU', { center: true, bold: true, size: 15, after: 2 });
  T.para(c.name, { center: true, bold: true, size: 13, after: 10 });
  const head = projectHeadRows_(p);
  if (folder) head.push(['Hạng mục', folder.name]);
  head.push(['Thời gian nghiệm thu', fmtDate_(c.date)]);
  T.table(head, { keyCol: true, widths: [160] });
  if (c.participants) {
    T.para('Thành phần tham gia nghiệm thu:', { bold: true, before: 8 });
    String(c.participants).split('\n').filter(s => s.trim()).forEach(l => T.para(l.trim(), { after: 1 }));
  }
  T.para('Nội dung kiểm tra:', { bold: true, before: 8 });
  const items = (c.items || []).filter(it => String(it.text || '').trim());
  const rows = [['STT', 'Nội dung kiểm tra', 'Kết quả', 'Ghi chú']];
  items.forEach((it, i) => rows.push([String(i + 1), it.text, CHECK_RES_[it.result] || '', it.note || '']));
  T.table(rows, { headRow: true, size: 12, widths: [35, 255, 75, 105] });
  const nOk = items.filter(it => it.result === 'ok').length, nFail = items.filter(it => it.result === 'fail').length;
  T.para('Tổng hợp: ' + items.length + ' nội dung · Đạt ' + nOk + ' · Không đạt ' + nFail + '.', { italic: true, before: 4 });
  const iss = readRows_('issues').filter(x => !x.deleted && x.projectId === p.id && (!c.folderId || x.folderId === c.folderId) && x.status !== 'closed');
  if (iss.length) {
    T.para('Các tồn tại cần khắc phục:', { bold: true, before: 8 });
    const ir = [['STT', 'Tồn tại', 'Vị trí', 'Hạn khắc phục']];
    iss.forEach((x, i) => ir.push([String(i + 1), x.title, x.location || '', fmtDate_(x.dueDate)]));
    T.table(ir, { headRow: true, size: 12, widths: [35, 255, 105, 75] });
  }
  T.para('Kết luận:', { bold: true, before: 8 });
  T.para(CONCL_[c.conclusion] || CONCL_.pass, { after: 2 });
  if (c.note) T.para(c.note, { after: 2 });
  T.para('', { after: 10 });
  const sig = T.table([['ĐẠI DIỆN CHỦ ĐẦU TƯ', 'ĐẠI DIỆN TƯ VẤN GIÁM SÁT', 'ĐẠI DIỆN NHÀ THẦU'], ['(Ký, ghi rõ họ tên)', '(Ký, ghi rõ họ tên)', '(Ký, ghi rõ họ tên)'], ['\n\n\n', '\n\n\n', '\n\n\n']], { border: 0, center: true, size: 12 });
  sig.getRow(0).editAsText().setBold(true);
  sig.getRow(1).editAsText().setItalic(true).setFontSize(11);
  T.cleanFirst();
  return finishDoc_(doc, u, opt.format);
}

/** opt = { projectId, format, ids:[...], photos:bool } – danh sách lỗi tồn tại kèm ảnh trước / sau */
function exportIssues(token, opt) {
  opt = opt || {};
  const u = auth_(token);
  const p = readRows_('projects').find(x => x.id === opt.projectId && !x.deleted);
  if (!p || !projRole_(u, p)) throw new Error('Bạn không có quyền với dự án này.');
  const pick = opt.ids && opt.ids.length ? new Set(opt.ids) : null;
  const mem = {};
  readRows_('members').forEach(m => mem[lc(m.email)] = m);
  const nm = e => { const m = mem[lc(e)]; return m ? (m.fullName || m.name) : (e || ''); };
  const folders = {};
  (p.folders || []).forEach(f => folders[f.id] = f.name);
  const list = readRows_('issues').filter(x => !x.deleted && x.projectId === p.id && (!pick || pick.has(x.id)))
    .sort((a, b) => String(a.dueDate || '9').localeCompare(String(b.dueDate || '9')));
  if (!list.length) throw new Error('Không có lỗi tồn tại nào để xuất.');
  const doc = DocumentApp.create(('Danh sách tồn tại - ' + p.name).replace(/\//g, '.'));
  const T = docTools_(doc, true);
  T.para('DANH SÁCH TỒN TẠI CẦN KHẮC PHỤC', { center: true, bold: true, size: 15, after: 2 });
  T.para('Ngày ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy'), { center: true, italic: true, after: 8 });
  T.table(projectHeadRows_(p), { keyCol: true, widths: [160] });
  T.para('', { after: 6 });
  const rows = [['STT', 'Tồn tại', 'Hạng mục / vị trí', 'Mức độ', 'Người xử lý', 'Hạn', 'Trạng thái']];
  list.forEach((x, i) => rows.push([String(i + 1), x.title + (x.note ? '\n' + x.note : ''), [folders[x.folderId], x.location].filter(Boolean).join(' – '),
    SEV_[x.severity] || '', nm(x.assignee), fmtDate_(x.dueDate), ISSUE_ST_[x.status] || '']));
  T.table(rows, { headRow: true, size: 11, widths: [30, 230, 150, 70, 100, 60, 90] });
  if (opt.photos) {
    list.forEach((x, i) => {
      const imgs = (x.files || []).filter(f => String(f.mime || '').indexOf('image/') === 0);
      if (!imgs.length) return;
      T.para((i + 1) + '. ' + x.title, { bold: true, before: 10 });
      ['before', 'after'].forEach(tag => {
        const set = imgs.filter(f => (f.tag || 'before') === tag).slice(0, 3);
        if (!set.length) return;
        T.para(tag === 'before' ? 'Ảnh hiện trạng lỗi:' : 'Ảnh sau khi khắc phục:', { italic: true, size: 11 });
        const pg = T.body.appendParagraph('');
        set.forEach(f => { try { const im = pg.appendInlineImage(DriveApp.getFileById(f.id).getBlob()); const w = im.getWidth(), h = im.getHeight(); im.setWidth(200).setHeight(Math.round(h * 200 / w)); pg.appendText('  '); } catch (e) {} });
      });
    });
  }
  T.cleanFirst();
  return finishDoc_(doc, u, opt.format);
}

/* ================= BÁO CÁO TUẦN ================= */

/** Tổng hợp số liệu 1 dự án trong khoảng [from, to] (yyyy-mm-dd) */
function weeklyData_(p, from, to, db) {
  const inR = d => d && String(d) >= from && String(d) <= to;
  const tz = Session.getScriptTimeZone();
  const dOf = ms => ms ? Utilities.formatDate(new Date(Number(ms)), tz, 'yyyy-MM-dd') : '';
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const tasks = db.tasks.filter(t => !t.deleted && t.projectId === p.id);
  const prog = t => t.status === 'done' ? 100 : (Number(t.progress) || 0);
  const pct = tasks.length ? Math.round(tasks.reduce((a, t) => a + prog(t), 0) / tasks.length) : 0;
  const doneWeek = tasks.filter(t => t.status === 'done' && inR(dOf(t.doneAt || t.updatedAt)));
  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && String(t.dueDate) < today);
  const diary = db.diary.filter(d => !d.deleted && d.projectId === p.id && inR(d.date)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const num = v => Number(v) || 0;
  const lab = diary.reduce((a, d) => { const L = d.labor || {}; a.people += num(L.tech) + num(L.perm) + num(L.contract); a.ot += num(L.otPeople) * num(L.otHours); a.shifts += (d.machines || []).reduce((s, m) => s + num(m.shifts), 0); return a; }, { people: 0, ot: 0, shifts: 0 });
  const led = db.ledger.filter(l => !l.deleted && l.projectId === p.id);
  const spentWeek = led.filter(l => l.status === 'approved' && l.kind !== 'nhan' && inR(l.date)).reduce((a, l) => a + num(l.amount), 0);
  const pending = led.filter(l => l.status === 'pending');
  const iss = db.issues.filter(x => !x.deleted && x.projectId === p.id);
  const dev = db.devices.filter(d => !d.deleted && d.projectId === p.id);
  const guar = db.guarantees.filter(g => !g.deleted && g.projectId === p.id && g.status !== 'released' && g.expiryDate && String(g.expiryDate) <= Utilities.formatDate(new Date(Date.now() + 30 * 864e5), tz, 'yyyy-MM-dd'));
  return {
    p: p, pct: pct, nTasks: tasks.length, nDone: tasks.filter(t => t.status === 'done').length, doneWeek: doneWeek, overdue: overdue,
    diary: diary, lab: lab, spentWeek: spentWeek, pending: pending,
    issNew: iss.filter(x => inR(dOf(x.createdAt))).length, issFixed: iss.filter(x => inR(dOf(x.fixedAt))).length, issOpen: iss.filter(x => x.status === 'open' || x.status === 'fixing'),
    devInstalled: dev.filter(d => inR(d.installDate)).length, devAccepted: dev.filter(d => inR(d.acceptDate)).length, devTotal: dev.length, guar: guar
  };
}

function weeklyHtml_(w, from, to, nm) {
  const e = esc_, money_ = v => (Number(v) || 0).toLocaleString('vi-VN');
  const li = arr => arr.length ? '<ul style="margin:4px 0 8px 18px;padding:0">' + arr.map(x => '<li>' + x + '</li>').join('') + '</ul>' : '<div style="color:#6b7280;margin:2px 0 8px">Không có</div>';
  return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:14px">' +
    '<div style="font-size:17px;font-weight:bold">' + e(w.p.name) + '</div>' +
    '<div style="margin:6px 0 10px">Tiến độ chung <b>' + w.pct + '%</b> · ' + w.nDone + '/' + w.nTasks + ' đầu việc xong · <b>' + w.doneWeek.length + '</b> việc hoàn thành trong tuần' +
    (w.overdue.length ? ' · <b style="color:#dc2626">' + w.overdue.length + ' việc quá hạn</b>' : '') + '</div>' +
    '<b>Hoàn thành trong tuần</b>' + li(w.doneWeek.slice(0, 15).map(t => e(t.title))) +
    (w.overdue.length ? '<b style="color:#dc2626">Đầu việc quá hạn</b>' + li(w.overdue.slice(0, 15).map(t => e(t.title) + ' – hạn ' + fmtDate_(t.dueDate) + (t.assignee ? ' – ' + e(nm(t.assignee)) : ''))) : '') +
    '<b>Hiện trường</b>' + li([w.diary.length + ' ngày có nhật ký · ' + w.lab.people + ' lượt nhân công · ' + w.lab.ot + ' giờ công tăng ca · ' + w.lab.shifts + ' ca máy']
      .concat(w.diary.filter(d => d.issues).map(d => '⚠ ' + fmtDate_(d.date) + ': ' + e(d.issues)))) +
    '<b>Thiết bị · Lỗi tồn tại</b>' + li(['Lắp đặt ' + w.devInstalled + ', nghiệm thu ' + w.devAccepted + ' thiết bị trong tuần (tổng ' + w.devTotal + ')',
      'Lỗi tồn tại: mới ' + w.issNew + ', đã sửa ' + w.issFixed + ', còn mở <b>' + w.issOpen.length + '</b>']) +
    '<b>Chi phí</b>' + li(['Chi đã duyệt trong tuần: <b>' + money_(w.spentWeek) + ' đ</b>', 'Phiếu chờ duyệt: ' + w.pending.length + ' phiếu · ' + money_(w.pending.reduce((a, l) => a + (Number(l.amount) || 0), 0)) + ' đ']) +
    (w.guar.length ? '<b style="color:#dc2626">Bảo lãnh sắp hết hạn</b>' + li(w.guar.map(g => e(g.bank || '') + ' ' + e(g.number || '') + ' – hết hạn ' + fmtDate_(g.expiryDate))) : '') +
    '</div>';
}

function weeklyDb_() {
  const db = {};
  ['projects', 'tasks', 'diary', 'ledger', 'issues', 'devices', 'guarantees', 'members'].forEach(k => db[k] = readRows_(k));
  return db;
}

/** Chạy tự động 7h sáng thứ Hai: gửi báo cáo tuần trước cho chủ hệ thống và quản lý từng dự án */
function weeklyReport() {
  const tz = Session.getScriptTimeZone();
  const to = Utilities.formatDate(new Date(Date.now() - 864e5), tz, 'yyyy-MM-dd');
  const from = Utilities.formatDate(new Date(Date.now() - 7 * 864e5), tz, 'yyyy-MM-dd');
  const db = weeklyDb_();
  const mem = {};
  db.members.forEach(m => mem[lc(m.email)] = m);
  const nm = e => { const m = mem[lc(e)]; return m ? m.name : (e || ''); };
  const active = db.projects.filter(p => !p.deleted && p.stage !== 'done');
  if (!active.length) return;
  const owner = ownerEmail_(), url = appUrl_();
  const reports = active.map(p => ({ p: p, html: weeklyHtml_(weeklyData_(p, from, to, db), from, to, nm) }));
  const head = '<div style="font-family:Arial,sans-serif;font-size:14px;margin-bottom:12px">Báo cáo tuần <b>' + fmtDate_(from) + ' – ' + fmtDate_(to) + '</b></div>';
  const foot = url ? '<p style="font-family:Arial"><a href="' + url + '">Mở ứng dụng</a></p>' : '';
  MailApp.sendEmail({ to: owner, name: APP_NAME, subject: '[Báo cáo tuần] ' + fmtDate_(from) + ' – ' + fmtDate_(to) + ' · ' + active.length + ' dự án', htmlBody: head + reports.map(r => r.html).join('') + foot });
  const byMgr = {};
  reports.forEach(r => [lc(r.p.createdBy)].concat((r.p.acl || []).filter(a => a.role === 'manager').map(a => lc(a.email)))
    .filter(e => e && e !== owner).forEach(e => (byMgr[e] = byMgr[e] || []).push(r)));
  Object.keys(byMgr).forEach(e => { try {
    if (MailApp.getRemainingDailyQuota() < 1) return;
    MailApp.sendEmail({ to: e, name: APP_NAME, subject: '[Báo cáo tuần] ' + fmtDate_(from) + ' – ' + fmtDate_(to), htmlBody: head + byMgr[e].map(r => r.html).join('') + foot });
  } catch (x) { console.error(x); } });
}

/** Xuất báo cáo tiến độ 1 dự án ra Word / PDF. opt = { projectId, from, to, format } */
function exportWeekly(token, opt) {
  opt = opt || {};
  const u = auth_(token);
  const db = weeklyDb_();
  const p = db.projects.find(x => x.id === opt.projectId && !x.deleted);
  if (!p || projRole_(u, p) !== 'manager') throw new Error('Chỉ quản lý dự án xuất được báo cáo.');
  const from = opt.from, to = opt.to;
  if (!from || !to) throw new Error('Chọn khoảng ngày.');
  const mem = {};
  db.members.forEach(m => mem[lc(m.email)] = m);
  const nm = e => { const m = mem[lc(e)]; return m ? (m.fullName || m.name) : (e || ''); };
  const w = weeklyData_(p, from, to, db);
  const money_ = v => (Number(v) || 0).toLocaleString('vi-VN');
  const doc = DocumentApp.create(('Báo cáo tiến độ - ' + p.name + ' (' + fmtDate_(from) + ' - ' + fmtDate_(to) + ')').replace(/\//g, '.'));
  const T = docTools_(doc, false);
  T.para('BÁO CÁO TIẾN ĐỘ THỰC HIỆN', { center: true, bold: true, size: 15, after: 2 });
  T.para('Từ ngày ' + fmtDate_(from) + ' đến ngày ' + fmtDate_(to), { center: true, italic: true, after: 10 });
  T.table(projectHeadRows_(p), { keyCol: true, widths: [160] });
  T.para('1. Tổng quan tiến độ', { bold: true, before: 10 });
  T.table([['Tiến độ chung', w.pct + '%'], ['Đầu việc hoàn thành / tổng', w.nDone + ' / ' + w.nTasks], ['Hoàn thành trong kỳ', String(w.doneWeek.length)], ['Đầu việc quá hạn', String(w.overdue.length)]], { keyCol: true, widths: [220] });
  const listTbl = (title, arr, cols, map, widths) => {
    T.para(title, { bold: true, before: 10 });
    if (!arr.length) { T.para('Không có.', { italic: true }); return; }
    T.table([cols].concat(arr.map(map)), { headRow: true, size: 12, widths: widths });
  };
  listTbl('2. Công việc hoàn thành trong kỳ', w.doneWeek, ['STT', 'Đầu việc', 'Người thực hiện'], (t, i) => [String(i + 1), t.title, (t.assignees && t.assignees.length ? t.assignees : [t.assignee]).filter(Boolean).map(nm).join(', ')], [35, 300, 135]);
  listTbl('3. Công việc chậm tiến độ', w.overdue, ['STT', 'Đầu việc', 'Hạn', 'Tiến độ', 'Người thực hiện'], (t, i) => [String(i + 1), t.title, fmtDate_(t.dueDate), (Number(t.progress) || 0) + '%', nm(t.assignee)], [35, 220, 70, 55, 90]);
  T.para('4. Tình hình hiện trường', { bold: true, before: 10 });
  T.table([['Số ngày có nhật ký', String(w.diary.length)], ['Lượt nhân công', String(w.lab.people)], ['Giờ công tăng ca', String(w.lab.ot)], ['Ca máy', String(w.lab.shifts)],
           ['Thiết bị lắp đặt / nghiệm thu trong kỳ', w.devInstalled + ' / ' + w.devAccepted], ['Lỗi tồn tại: mới / đã sửa / còn mở', w.issNew + ' / ' + w.issFixed + ' / ' + w.issOpen.length]], { keyCol: true, widths: [220] });
  const iss = w.diary.filter(d => d.issues || d.proposals);
  if (iss.length) { T.para('Sự cố, vướng mắc, kiến nghị:', { italic: true, before: 4 }); iss.forEach(d => T.para('- ' + fmtDate_(d.date) + ': ' + [d.issues, d.proposals].filter(Boolean).join('. '), { after: 1 })); }
  T.para('5. Chi phí trong kỳ', { bold: true, before: 10 });
  T.table([['Chi đã duyệt trong kỳ', money_(w.spentWeek) + ' đ'], ['Phiếu chờ duyệt', w.pending.length + ' phiếu']], { keyCol: true, widths: [220] });
  T.para('6. Kế hoạch kỳ tới', { bold: true, before: 10 });
  const next = db.tasks.filter(t => !t.deleted && t.projectId === p.id && t.status !== 'done' && t.dueDate && String(t.dueDate) > to &&
    String(t.dueDate) <= Utilities.formatDate(new Date(new Date(to + 'T00:00:00Z').getTime() + 14 * 864e5), 'UTC', 'yyyy-MM-dd'))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  if (next.length) T.table([['STT', 'Đầu việc', 'Hạn', 'Người thực hiện']].concat(next.map((t, i) => [String(i + 1), t.title, fmtDate_(t.dueDate), nm(t.assignee)])), { headRow: true, size: 12, widths: [35, 270, 70, 95] });
  else T.para('Chưa có đầu việc nào đến hạn trong 2 tuần tới.', { italic: true });
  T.para('', { after: 10 });
  T.signature('NGƯỜI LẬP BÁO CÁO', 'QUẢN LÝ DỰ ÁN', [nm(u.email), '']);
  T.cleanFirst();
  return finishDoc_(doc, u, opt.format);
}
