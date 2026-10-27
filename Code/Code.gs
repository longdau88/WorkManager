/**
 * TODO APP v3 – Quản lý công việc theo dự án
 * Backend Google Apps Script + Google Sheet làm cơ sở dữ liệu + Google Drive lưu tệp đính kèm
 *
 * Chạy thủ công (hoặc dùng menu "📋 Todo App" trên Google Sheet):
 *   setup()             – chạy 1 lần: tạo các sheet, thư mục đính kèm, cấp quyền
 *   shareAttachments()  – chia sẻ thư mục đính kèm cho đúng những người đã được chia sẻ Sheet
 *   installReminder()   – email nhắc deadline 7h sáng hằng ngày
 */

const APP_NAME = 'Quản lý công việc';
const REMIND_DAYS = 2;              // nhắc các việc còn <= 2 ngày đến hạn (và đã quá hạn)
const MAX_UPLOAD_MB = 20;

/* Các cột mới luôn thêm ở CUỐI để tương thích dữ liệu cũ */
const SHEETS = {
  projects: {
    name: 'Projects',
    cols: ['id', 'name', 'color', 'note', 'dueDate', 'createdAt', 'updatedAt', 'deleted', 'updatedBy',
           'info', 'folders', 'files'],
    json: { info: {}, folders: [], files: [] }
  },
  tasks: {
    name: 'Tasks',
    cols: ['id', 'projectId', 'title', 'note', 'status', 'priority', 'progress', 'startDate', 'dueDate',
           'createdAt', 'updatedAt', 'deleted', 'updatedBy',
           'folderId', 'sort', 'assignee', 'assigner', 'files'],
    json: { files: [] }
  },
  members: {
    name: 'Members',
    cols: ['id', 'name', 'fullName', 'email', 'unit', 'phone', 'createdAt', 'updatedAt', 'deleted', 'updatedBy'],
    json: {}
  },
  fields: {
    name: 'Fields',
    cols: ['id', 'label', 'type', 'unit', 'group', 'options', 'sort', 'createdAt', 'updatedAt', 'deleted', 'updatedBy'],
    json: {}
  }
};
const TYPE_KEY = { project: 'projects', task: 'tasks', member: 'members', field: 'fields' };
const NUM_COLS = ['progress', 'sort', 'createdAt', 'updatedAt'];

/* Bộ trường thông tin dự án mặc định (chỉ tạo khi sheet Fields được tạo lần đầu) */
const DEFAULT_FIELDS = [
  ['f_cdt',      'Chủ đầu tư',            'text',   '',    'Thông tin chung', ''],
  ['f_sohd',     'Số hợp đồng',           'text',   '',    'Thông tin chung', ''],
  ['f_giatri',   'Giá trị hợp đồng',      'number', 'VNĐ', 'Thông tin chung', ''],
  ['f_diadiem',  'Địa điểm',              'text',   '',    'Thông tin chung', ''],
  ['f_trangthai','Trạng thái dự án',      'select', '',    'Thông tin chung', 'Chuẩn bị, Đang triển khai, Nghiệm thu, Bảo hành, Tạm dừng'],
  ['f_cam_ptz',  'Camera tầm cao (PTZ)',  'number', 'cái', 'Thiết bị', ''],
  ['f_cam_fix',  'Camera cố định (fix)',  'number', 'cái', 'Thiết bị', ''],
  ['f_nvr',      'Đầu ghi (NVR)',         'number', 'bộ',  'Thiết bị', ''],
  ['f_switch',   'Switch mạng',           'number', 'cái', 'Thiết bị', ''],
  ['f_cap',      'Cáp quang / cáp mạng',  'number', 'm',   'Thiết bị', '']
];

/* ================= WEB APP ================= */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📋 Todo App')
    .addItem('Mở ứng dụng', 'showAppLink')
    .addItem('Chia sẻ thư mục đính kèm theo quyền Sheet', 'shareAttachments')
    .addItem('Cài email nhắc deadline 7h sáng', 'installReminder')
    .addToUi();
}

function showAppLink() {
  const url = appUrl_();
  SpreadsheetApp.getUi().alert(url ? 'Link ứng dụng:\n' + url : 'Chưa triển khai Ứng dụng web (Triển khai → Tùy chọn triển khai mới).');
}

function setup() {
  Object.keys(SHEETS).forEach(getSheet_);
  const folder = getUploadRoot_();
  Logger.log('Dữ liệu: ' + getSS_().getUrl());
  Logger.log('Thư mục đính kèm: ' + folder.getUrl());
}

/* ================= PHÂN QUYỀN =================
 * Theo nút "Chia sẻ" của Google Sheet dữ liệu:
 *   Chủ sở hữu / Người chỉnh sửa → thêm, sửa, xoá ;  Người xem → chỉ xem
 */
function currentUser_() {
  return (Session.getActiveUser().getEmail() || '').toLowerCase();
}

function canEdit_() {
  const email = currentUser_();
  if (!email) return false;
  const cache = CacheService.getScriptCache();
  const key = 'perm_' + email;
  const hit = cache.get(key);
  if (hit) return hit === '1';
  let ok = false;
  try {
    const ss = getSS_();
    const owner = ss.getOwner();
    ok = (owner && owner.getEmail().toLowerCase() === email) ||
         ss.getEditors().some(u => u.getEmail().toLowerCase() === email);
  } catch (e) { ok = false; }
  cache.put(key, ok ? '1' : '0', 300);
  return ok;
}

function getMe() {
  getSS_();
  return { email: currentUser_(), canEdit: canEdit_() };
}

/* ================= ĐỒNG BỘ =================
 * ops = [{type:'project'|'task'|'member'|'field', record:{...}}]
 * Xung đột: bản ghi có updatedAt mới hơn thắng.
 */
function sync(ops) {
  ops = ops || [];
  const me = currentUser_();
  let notices = [];
  let res;
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (ops.length) {
      if (!canEdit_()) throw new Error('Bạn chỉ có quyền xem, không thể lưu thay đổi.');
      ops.forEach(o => { if (o.record) o.record.updatedBy = me; });
    }
    Object.keys(TYPE_KEY).forEach(type => {
      const recs = ops.filter(o => o.type === type && o.record && o.record.id).map(o => o.record);
      const changes = applyOps_(TYPE_KEY[type], recs);
      if (type === 'task') notices = collectNotices_(changes, me);
    });
    SpreadsheetApp.flush();
    res = { serverTime: Date.now() };
    Object.keys(TYPE_KEY).forEach(type => {
      const key = TYPE_KEY[type];
      res[key] = readRows_(key).filter(r => !r.deleted).map(strip_);
    });
  } finally {
    lock.releaseLock();
  }
  if (notices.length) sendNotices_(notices);
  return res;
}

/* ================= SHEET HELPERS ================= */

function getSS_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SS_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* tạo mới */ }
  }
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
    sh.getRange('A:Z').setNumberFormat('@');
    sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
    if (key === 'fields') {
      const now = Date.now();
      const rows = DEFAULT_FIELDS.map((f, i) => def.cols.map(c => ({
        id: f[0], label: f[1], type: f[2], unit: f[3], group: f[4], options: f[5],
        sort: String((i + 1) * 10), createdAt: String(now), updatedAt: String(now), deleted: 'false', updatedBy: ''
      })[c]));
      sh.getRange(2, 1, rows.length, def.cols.length).setValues(rows);
    }
  } else if (sh.getLastColumn() < def.cols.length) {
    sh.getRange(1, 1, 1, def.cols.length).setNumberFormat('@').setValues([def.cols]).setFontWeight('bold');
    sh.getRange(1, 1, sh.getMaxRows(), def.cols.length).setNumberFormat('@');
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
        const dflt = def.json[c];
        try { v = v ? JSON.parse(v) : (Array.isArray(dflt) ? [] : {}); }
        catch (e) { v = Array.isArray(dflt) ? [] : {}; }
      }
      o[c] = v;
    });
    o.deleted = String(o.deleted).toLowerCase() === 'true';
    NUM_COLS.forEach(c => { if (c in o) o[c] = Number(o[c]) || 0; });
    return o;
  }).filter(o => o.id);
}

function applyOps_(key, records) {
  const changes = [];
  if (!records.length) return changes;
  const sh = getSheet_(key), def = SHEETS[key];
  const rows = readRows_(key);
  const idx = {};
  rows.forEach((r, i) => idx[r.id] = i);

  records.forEach(rec => {
    const i = idx[rec.id];
    if (i === undefined) {
      rows.push(rec);
      idx[rec.id] = rows.length - 1;
      changes.push({ before: null, after: rec });
    } else if (Number(rec.updatedAt) >= Number(rows[i].updatedAt || 0)) {
      const before = rows[i];
      rows[i] = Object.assign({}, before, rec);
      changes.push({ before: before, after: rows[i] });
    }
  });
  if (!changes.length) return changes;

  const out = rows.map(r => def.cols.map(c => {
    const v = r[c];
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }));
  sh.getRange(2, 1, out.length, def.cols.length).setNumberFormat('@').setValues(out);
  return changes;
}

function strip_(r) {
  const o = Object.assign({}, r);
  delete o.deleted;
  return o;
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function appUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function memberMap_() {
  const m = {};
  readRows_('members').filter(x => !x.deleted && x.email).forEach(x => m[String(x.email).toLowerCase()] = x);
  return m;
}

function fmtDate_(s) {
  return s ? String(s).split('-').reverse().join('/') : '';
}

/* ================= THÔNG BÁO EMAIL ================= */

function collectNotices_(changes, me) {
  const list = [];
  changes.forEach(ch => {
    const a = ch.after, b = ch.before;
    if (a.deleted === true || String(a.deleted) === 'true') return;
    const newAsg = String(a.assignee || '').toLowerCase();
    const oldAsg = b ? String(b.assignee || '').toLowerCase() : '';
    if (newAsg && newAsg !== oldAsg && newAsg !== me) list.push({ kind: 'assign', to: newAsg, task: a });

    const assigner = String(a.assigner || '').toLowerCase();
    const wasDone = b && b.status === 'done';
    if (a.status === 'done' && !wasDone && assigner && assigner !== me) list.push({ kind: 'done', to: assigner, task: a });
  });
  return list;
}

function sendNotices_(list) {
  try {
    const members = memberMap_();
    const projects = {};
    readRows_('projects').forEach(p => projects[p.id] = p);
    const url = appUrl_();
    const nm = e => { const m = members[String(e || '').toLowerCase()]; return m ? (m.fullName || m.name) : (e || ''); };
    const PRI = { high: 'Cao', med: 'Trung bình', low: 'Thấp' };

    list.forEach(n => {
      try {
        if (MailApp.getRemainingDailyQuota() < 1) return;
        const t = n.task, p = projects[t.projectId];
        const folder = p && (p.folders || []).find(f => f.id === t.folderId);
        const isAssign = n.kind === 'assign';
        const subject = (isAssign ? '[Giao việc] ' : '[Đã hoàn thành] ') + t.title;
        const head = isAssign
          ? '<b>' + esc_(nm(t.assigner || t.updatedBy)) + '</b> đã giao cho bạn một công việc:'
          : '<b>' + esc_(nm(t.assignee || t.updatedBy)) + '</b> đã hoàn thành công việc bạn giao:';
        const row = (k, v) => v ? '<tr><td style="color:#6b7280;padding:4px 12px 4px 0">' + k + '</td><td style="padding:4px 0">' + v + '</td></tr>' : '';
        const html =
          '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937">' +
          '<p>' + head + '</p>' +
          '<p style="font-size:17px;font-weight:bold;margin:8px 0">' + esc_(t.title) + '</p>' +
          '<table style="border-collapse:collapse">' +
          row('Dự án', p ? esc_(p.name) : '') +
          row('Hạng mục', folder ? esc_(folder.name) : '') +
          row('Người giao', esc_(nm(t.assigner))) +
          row('Người nhận', esc_(nm(t.assignee))) +
          row('Hạn chót', fmtDate_(t.dueDate)) +
          row('Ưu tiên', PRI[t.priority] || '') +
          row('Tiến độ', (t.status === 'done' ? 100 : Number(t.progress) || 0) + '%') +
          row('Ghi chú', esc_(t.note).replace(/\n/g, '<br>')) +
          '</table>' +
          (url ? '<p style="margin-top:16px"><a href="' + url + '" style="background:#2563eb;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">Mở ứng dụng</a></p>' : '') +
          '</div>';
        MailApp.sendEmail({ to: n.to, subject: subject, htmlBody: html, name: APP_NAME });
      } catch (e) { console.error('Gửi email lỗi: ' + e); }
    });
  } catch (e) { console.error(e); }
}

/* ================= TỆP ĐÍNH KÈM (Google Drive) ================= */

function getUploadRoot_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); }
    catch (e) { throw new Error('Bạn chưa có quyền vào thư mục đính kèm. Nhờ chủ sở hữu chạy menu "📋 Todo App → Chia sẻ thư mục đính kèm".'); }
  }
  const f = DriveApp.createFolder('TodoApp - Tệp đính kèm');
  props.setProperty('FOLDER_ID', f.getId());
  return f;
}

function uploadFile(meta, b64) {
  if (!canEdit_()) throw new Error('Bạn chỉ có quyền xem.');
  if (b64.length * 0.75 > MAX_UPLOAD_MB * 1024 * 1024) throw new Error('Tệp vượt quá ' + MAX_UPLOAD_MB + 'MB.');
  const root = getUploadRoot_();
  const name = String(meta.projectName || 'Chung').replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
  const it = root.getFoldersByName(name);
  const folder = it.hasNext() ? it.next() : root.createFolder(name);
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), meta.mime || 'application/octet-stream', meta.name || 'tep');
  const f = folder.createFile(blob);
  return {
    id: f.getId(), name: f.getName(), mime: f.getMimeType(), size: f.getSize(),
    url: f.getUrl(), by: currentUser_(), at: Date.now()
  };
}

function deleteFiles(ids) {
  if (!canEdit_()) return;
  (ids || []).forEach(id => { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* không phải chủ tệp */ } });
}

/** Chủ sở hữu chạy sau khi chia sẻ Sheet: cấp quyền thư mục đính kèm tương ứng */
function shareAttachments() {
  const ss = getSS_(), folder = getUploadRoot_();
  const ownerEmail = (ss.getOwner() && ss.getOwner().getEmail()) || '';
  const editors = ss.getEditors().map(u => u.getEmail()).filter(e => e && e !== ownerEmail);
  const viewers = ss.getViewers().map(u => u.getEmail()).filter(e => e && editors.indexOf(e) < 0 && e !== ownerEmail);
  editors.forEach(e => { try { folder.addEditor(e); } catch (x) {} });
  viewers.forEach(e => { try { folder.addViewer(e); } catch (x) {} });
  const msg = 'Đã chia sẻ thư mục đính kèm: ' + editors.length + ' người chỉnh sửa, ' + viewers.length + ' người xem.';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

/* ================= XUẤT THỐNG KÊ ================= */

function exportStats(rows) {
  if (!canEdit_()) throw new Error('Bạn chỉ có quyền xem.');
  const ss = getSS_();
  let sh = ss.getSheetByName('Thống kê');
  if (!sh) sh = ss.insertSheet('Thống kê');
  sh.clear();
  const w = Math.max.apply(null, rows.map(r => r.length).concat([1]));
  const vals = rows.map(r => {
    const a = r.map(v => (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v);
    while (a.length < w) a.push('');
    return a;
  });
  sh.getRange(1, 1, vals.length, w).setValues(vals);
  vals.forEach((r, i) => { if (r.filter(v => v !== '').length === 1) sh.getRange(i + 1, 1).setFontWeight('bold').setFontSize(12); });
  sh.autoResizeColumns(1, w);
  return ss.getUrl() + '#gid=' + sh.getSheetId();
}

/* ================= EMAIL NHẮC DEADLINE HẰNG NGÀY ================= */

function installReminder() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyReminder')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyReminder').timeBased().everyDays(1).atHour(7).create();
  const msg = 'Đã cài nhắc việc lúc ~7h sáng hằng ngày (gửi cho người nhận việc và chủ sở hữu).';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

function dailyReminder() {
  const tz = Session.getScriptTimeZone();
  const today = new Date(Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd') + 'T00:00:00Z');
  const projects = {};
  readRows_('projects').filter(p => !p.deleted).forEach(p => projects[p.id] = p.name);
  const members = memberMap_();
  const nm = e => { const m = members[String(e || '').toLowerCase()]; return m ? m.name : (e || ''); };

  const items = [];
  readRows_('tasks')
    .filter(t => !t.deleted && t.status !== 'done' && t.dueDate)
    .forEach(t => {
      const d = Math.round((new Date(String(t.dueDate) + 'T00:00:00Z') - today) / 86400000);
      if (!isNaN(d) && d <= REMIND_DAYS) items.push({ t: t, d: d });
    });
  if (!items.length) return;
  items.sort((a, b) => a.d - b.d);

  const table = list => {
    const rows = list.map(({ t, d }) => {
      const st = d < 0 ? 'Quá hạn ' + (-d) + ' ngày' : d === 0 ? 'Hôm nay' : 'Còn ' + d + ' ngày';
      return '<tr><td>' + esc_(t.title) + '</td><td>' + esc_(projects[t.projectId] || '') + '</td><td>' + esc_(nm(t.assignee)) +
        '</td><td>' + fmtDate_(t.dueDate) + '</td><td style="color:' + (d < 0 ? '#dc2626' : '#ea580c') + ';font-weight:bold">' + st +
        '</td><td>' + (Number(t.progress) || 0) + '%</td></tr>';
    }).join('');
    const url = appUrl_();
    return '<table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
      '<tr style="background:#f1f5f9"><th>Công việc</th><th>Dự án</th><th>Người nhận</th><th>Hạn</th><th>Tình trạng</th><th>Tiến độ</th></tr>' +
      rows + '</table>' + (url ? '<p><a href="' + url + '">Mở ứng dụng</a></p>' : '');
  };
  const subj = list => {
    const o = list.filter(i => i.d < 0).length;
    return '[Công việc] ' + o + ' việc quá hạn, ' + (list.length - o) + ' việc sắp đến hạn';
  };

  const owner = Session.getEffectiveUser().getEmail().toLowerCase();
  MailApp.sendEmail({ to: owner, subject: subj(items) + ' (tổng hợp)', htmlBody: table(items), name: APP_NAME });

  const byPerson = {};
  items.forEach(i => {
    const a = String(i.t.assignee || '').toLowerCase();
    if (a && a !== owner) (byPerson[a] = byPerson[a] || []).push(i);
  });
  Object.keys(byPerson).forEach(email => {
    try {
      if (MailApp.getRemainingDailyQuota() < 1) return;
      MailApp.sendEmail({ to: email, subject: subj(byPerson[email]), htmlBody: table(byPerson[email]), name: APP_NAME });
    } catch (e) { console.error(e); }
  });
}
