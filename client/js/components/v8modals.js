import { state } from '../state.js';
import { api } from '../api.js';
import { WEATHER, CHK_TPL } from './modules.js';

export function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

export function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

// Current editing IDs
export const v8Edit = {
  diaryId: null,
  diaryDraft: { machines: [], materials: [], quantities: [], tasks: [], files: [] },
  ledgerId: null,
  ledgerKind: 'chi',
  ledgerFiles: [],
  workerId: null,
  advanceId: null,
  advanceKind: 'salary',
  advanceFiles: [],
  contractId: null,
  contractDraftItems: [],
  contractFiles: [],
  deviceId: null,
  deviceFiles: [],
  checkId: null,
  checkDraftItems: [],
  checkFiles: [],
  issueId: null,
  issueFiles: [],
  receiptId: null,
  receiptFiles: [],
  guaranteeId: null,
  guaranteeFiles: []
};

// ==========================================
// 1. DIARY MODAL HANDLERS
// ==========================================
export function openDiaryModal(id) {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.diaryId = id || null;
  const d = id ? state.data.diary.find(x => x.id === id) : null;

  document.getElementById('dTitle').textContent = d ? `Nhật ký ${state.dowOf(d.date)}, ${state.fmtDate(d.date)}` : `Nhật ký mới – ${state.esc(p.name)}`;

  // Weather dropdowns
  const wopt = v => '<option value="">— Thời tiết —</option>' + WEATHER.map(w => `<option value="${w}" ${w === v ? 'selected' : ''}>${w}</option>`).join('');
  document.getElementById('d_wam').innerHTML = wopt(d ? d.weatherAM : '');
  document.getElementById('d_wpm').innerHTML = wopt(d ? d.weatherPM : '');

  // Folders dropdown
  document.getElementById('d_folder').innerHTML = '<option value="">— Hạng mục —</option>' +
    (p.folders || []).map((f, i) => `<option value="${f.id}" ${d && d.folderId === f.id ? 'selected' : ''}>${i + 1}. ${state.esc(f.name)}</option>`).join('');

  document.getElementById('d_date').value = d ? d.date : state.todayStr();
  document.getElementById('d_area').value = d ? (d.area || '') : '';

  const L = d ? (d.labor || {}) : {};
  document.getElementById('d_tech').value = L.tech || '';
  document.getElementById('d_perm').value = L.perm || '';
  document.getElementById('d_contract').value = L.contract || '';
  document.getElementById('d_otp').value = L.otPeople || '';
  document.getElementById('d_oth').value = L.otHours || '';
  document.getElementById('d_otn').value = L.otNote || '';

  document.getElementById('d_work').value = d ? (d.workText || '') : '';
  document.getElementById('d_safety').value = d ? (d.safety || '') : '';
  document.getElementById('d_issues').value = d ? (d.issues || '') : '';
  document.getElementById('d_proposals').value = d ? (d.proposals || '') : '';
  document.getElementById('d_super').value = d ? (d.supervisorNote || '') : '';

  v8Edit.diaryDraft = {
    machines: d && d.machines ? JSON.parse(JSON.stringify(d.machines)) : [{}],
    materials: d && d.materials ? JSON.parse(JSON.stringify(d.materials)) : [],
    quantities: d && d.quantities ? JSON.parse(JSON.stringify(d.quantities)) : [],
    tasks: d && d.tasks ? JSON.parse(JSON.stringify(d.tasks)) : [],
    files: d && d.files ? [...d.files] : []
  };

  renderDiarySubRows('machines');
  renderDiarySubRows('materials');
  renderDiarySubRows('quantities');
  renderDiaryTasks();
  renderFileList('d_files', v8Edit.diaryDraft.files);

  const btnDel = document.getElementById('d_del');
  if (btnDel) btnDel.style.display = d ? '' : 'none';

  const btnConfirm = document.getElementById('d_confirm');
  if (btnConfirm) {
    btnConfirm.style.display = d ? '' : 'none';
    btnConfirm.textContent = d && d.confirmedBy ? '↺ Bỏ xác nhận' : '✔ Xác nhận nhật ký';
  }

  showModal('modalDiary');
}

export function renderDiarySubRows(kind) {
  const container = document.getElementById(`d_${kind}`);
  if (!container) return;

  const rows = v8Edit.diaryDraft[kind] || [];
  let html = '';

  if (kind === 'machines') {
    html = rows.map((r, i) => `
      <div class="drow" style="display:flex;gap:6px;margin-bottom:6px">
        <input style="flex:2" placeholder="Tên máy (VD: Máy xúc, cẩu, xe ben)" value="${state.esc(r.name || '')}" oninput="window.app.setDiaryDraftRow('machines', ${i}, 'name', this.value)">
        <input style="flex:1" type="number" step="0.5" placeholder="Số ca máy" value="${r.shifts || ''}" oninput="window.app.setDiaryDraftRow('machines', ${i}, 'shifts', this.value)">
        <button class="ibtn danger" onclick="window.app.removeDiaryDraftRow('machines', ${i})">✕</button>
      </div>
    `).join('');
    html += `<button class="btn" style="padding:3px 8px;font-size:12px" onclick="window.app.addDiaryDraftRow('machines')">+ Thêm máy thi công</button>`;
  } else if (kind === 'materials') {
    html = rows.map((r, i) => `
      <div class="drow" style="display:flex;gap:6px;margin-bottom:6px">
        <input style="flex:2" placeholder="Tên vật tư (VD: Cáp mạng, ống ghen, xi măng)" value="${state.esc(r.name || '')}" oninput="window.app.setDiaryDraftRow('materials', ${i}, 'name', this.value)">
        <input style="flex:1" placeholder="ĐVT" value="${state.esc(r.unit || '')}" oninput="window.app.setDiaryDraftRow('materials', ${i}, 'unit', this.value)">
        <input style="flex:1" type="number" step="0.1" placeholder="Khối lượng" value="${r.qty || ''}" oninput="window.app.setDiaryDraftRow('materials', ${i}, 'qty', this.value)">
        <button class="ibtn danger" onclick="window.app.removeDiaryDraftRow('materials', ${i})">✕</button>
      </div>
    `).join('');
    html += `<button class="btn" style="padding:3px 8px;font-size:12px" onclick="window.app.addDiaryDraftRow('materials')">+ Thêm vật tư</button>`;
  } else if (kind === 'quantities') {
    html = rows.map((r, i) => `
      <div class="drow" style="display:flex;gap:6px;margin-bottom:6px">
        <input style="flex:2" placeholder="Nội dung công việc hoàn thành" value="${state.esc(r.name || '')}" oninput="window.app.setDiaryDraftRow('quantities', ${i}, 'name', this.value)">
        <input style="flex:1" placeholder="ĐVT (m, cái, bộ)" value="${state.esc(r.unit || '')}" oninput="window.app.setDiaryDraftRow('quantities', ${i}, 'unit', this.value)">
        <input style="flex:1" type="number" step="0.1" placeholder="Khối lượng xong" value="${r.qty || ''}" oninput="window.app.setDiaryDraftRow('quantities', ${i}, 'qty', this.value)">
        <button class="ibtn danger" onclick="window.app.removeDiaryDraftRow('quantities', ${i})">✕</button>
      </div>
    `).join('');
    html += `<button class="btn" style="padding:3px 8px;font-size:12px" onclick="window.app.addDiaryDraftRow('quantities')">+ Thêm khối lượng hoàn thành</button>`;
  }

  container.innerHTML = html;
}

export function renderDiaryTasks() {
  const container = document.getElementById('d_tasks');
  const selAdd = document.getElementById('d_task_add');
  if (!container) return;

  const list = v8Edit.diaryDraft.tasks || [];
  container.innerHTML = list.map((t, i) => `
    <span class="project-member-chip" style="margin-right:4px">
      ${state.esc(t.title)} <b>(${+t.progress || 0}%)</b>
      <button class="ibtn xs" style="margin-left:4px" onclick="window.app.removeDiaryTask(${i})">✕</button>
    </span>
  `).join('') || '<span class="small" style="color:var(--text-muted)">Chưa gắn đầu việc nào</span>';

  if (selAdd) {
    const projTasks = state.data.tasks.filter(t => t.projectId === state.curProject && !list.some(x => x.id === t.id));
    selAdd.innerHTML = '<option value="">+ Gắn đầu việc liên quan…</option>' +
      projTasks.map(t => `<option value="${t.id}">${state.esc(t.title)} (${t.progress || 0}%)</option>`).join('');
  }
}

export function saveDiary() {
  const p = state.projById(state.curProject);
  if (!p) return;

  const date = document.getElementById('d_date').value;
  if (!date) {
    alert('Vui lòng chọn ngày nhật ký.');
    return;
  }

  const existing = v8Edit.diaryId ? state.data.diary.find(x => x.id === v8Edit.diaryId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const cleanRows = list => (list || []).filter(r => (r.name || '').trim());

  const record = {
    id: v8Edit.diaryId || state.uid(),
    projectId: p.id,
    date,
    weatherAM: document.getElementById('d_wam').value,
    weatherPM: document.getElementById('d_wpm').value,
    folderId: document.getElementById('d_folder').value,
    area: document.getElementById('d_area').value.trim(),
    labor: {
      tech: Number(document.getElementById('d_tech').value) || 0,
      perm: Number(document.getElementById('d_perm').value) || 0,
      contract: Number(document.getElementById('d_contract').value) || 0,
      otPeople: Number(document.getElementById('d_otp').value) || 0,
      otHours: Number(document.getElementById('d_oth').value) || 0,
      otNote: document.getElementById('d_otn').value.trim()
    },
    machines: cleanRows(v8Edit.diaryDraft.machines),
    materials: cleanRows(v8Edit.diaryDraft.materials),
    quantities: cleanRows(v8Edit.diaryDraft.quantities),
    tasks: v8Edit.diaryDraft.tasks,
    workText: document.getElementById('d_work').value.trim(),
    safety: document.getElementById('d_safety').value.trim(),
    issues: document.getElementById('d_issues').value.trim(),
    proposals: document.getElementById('d_proposals').value.trim(),
    supervisorNote: document.getElementById('d_super').value.trim(),
    files: v8Edit.diaryDraft.files,
    confirmedBy: existing ? existing.confirmedBy : '',
    confirmedAt: existing ? existing.confirmedAt : null,
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('diary', record);
  hideModal('modalDiary');
}

export function deleteDiary() {
  if (!v8Edit.diaryId) return;
  const d = state.data.diary.find(x => x.id === v8Edit.diaryId);
  if (!d || !confirm(`Xoá nhật ký ngày ${state.fmtDate(d.date)}?`)) return;

  state.commit('diary', { ...d, deleted: true });
  hideModal('modalDiary');
}

export function toggleConfirmDiary() {
  if (!v8Edit.diaryId) return;
  const d = state.data.diary.find(x => x.id === v8Edit.diaryId);
  if (!d) return;

  const isConfirmed = Boolean(d.confirmedBy);
  const user = api.currentUser ? (api.currentUser.fullName || api.currentUser.username) : 'admin';

  state.commit('diary', {
    ...d,
    confirmedBy: isConfirmed ? '' : user,
    confirmedAt: isConfirmed ? null : Date.now()
  });

  hideModal('modalDiary');
}

// ==========================================
// 2. LEDGER MODAL HANDLERS
// ==========================================
export function openLedgerModal(id, kind = 'chi') {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.ledgerId = id || null;
  const l = id ? state.data.ledger.find(x => x.id === id) : null;
  v8Edit.ledgerKind = l ? l.kind : kind;

  document.getElementById('lTitle').textContent = l ? `Phiếu ${l.kind === 'nhan' ? 'nhận (ứng)' : 'chi'}` : `Phiếu ${v8Edit.ledgerKind === 'nhan' ? 'nhận (ứng)' : 'chi'} mới`;

  // Kind tabs
  setLedgerModalKind(v8Edit.ledgerKind);

  // Date
  document.getElementById('l_date').value = l ? l.date : state.todayStr();

  // Person dropdown
  const members = state.data.users || [];
  document.getElementById('l_person').innerHTML = members.map(u => {
    const email = u.email || u.username;
    const name = u.fullName || u.username;
    return `<option value="${state.esc(email)}" ${l && l.person === email ? 'selected' : ''}>${state.esc(name)}</option>`;
  }).join('');
  if (!l && api.currentUser) {
    document.getElementById('l_person').value = api.currentUser.email || api.currentUser.username;
  }

  // Category dropdown
  const cats = state.sortedCats(v8Edit.ledgerKind);
  document.getElementById('l_cat').innerHTML = '<option value="">— Chọn danh mục —</option>' +
    cats.map(c => `<option value="${c.id}" ${l && l.categoryId === c.id ? 'selected' : ''}>${state.esc(c.name)}</option>`).join('');

  // Folder dropdown
  document.getElementById('l_folder').innerHTML = '<option value="">— Hạng mục dự án (nếu có) —</option>' +
    (p.folders || []).map((f, i) => `<option value="${f.id}" ${l && l.folderId === f.id ? 'selected' : ''}>${i + 1}. ${state.esc(f.name)}</option>`).join('');

  document.getElementById('l_content').value = l ? l.content : '';
  document.getElementById('l_unit').value = l ? (l.unit || '') : '';
  document.getElementById('l_qty').value = l && l.qty ? l.qty : '';
  document.getElementById('l_price').value = l && l.price ? state.money(l.price) : '';
  document.getElementById('l_amount').value = l && l.amount ? state.money(l.amount) : '';
  document.getElementById('l_note').value = l ? (l.note || '') : '';

  v8Edit.ledgerFiles = l && l.files ? [...l.files] : [];
  renderFileList('l_files', v8Edit.ledgerFiles);

  const btnDel = document.getElementById('l_del');
  if (btnDel) btnDel.style.display = l ? '' : 'none';

  showModal('modalLedger');
}

export function setLedgerModalKind(kind) {
  v8Edit.ledgerKind = kind;
  const tabChi = document.getElementById('l_k_chi');
  const tabNhan = document.getElementById('l_k_nhan');
  if (tabChi) tabChi.classList.toggle('active', kind === 'chi');
  if (tabNhan) tabNhan.classList.toggle('active', kind === 'nhan');

  // Update Category list
  const cats = state.sortedCats(kind);
  const selCat = document.getElementById('l_cat');
  if (selCat) {
    const curVal = selCat.value;
    selCat.innerHTML = '<option value="">— Chọn danh mục —</option>' +
      cats.map(c => `<option value="${c.id}" ${c.id === curVal ? 'selected' : ''}>${state.esc(c.name)}</option>`).join('');
  }
}

export function calcLedgerAmount() {
  const qty = parseFloat(document.getElementById('l_qty').value) || 0;
  const price = parseFloat(document.getElementById('l_price').value.replace(/[^\d]/g, '')) || 0;
  if (qty && price) {
    document.getElementById('l_amount').value = state.money(Math.round(qty * price));
  }
}

export function saveLedger(status) {
  const p = state.projById(state.curProject);
  if (!p) return;

  const content = document.getElementById('l_content').value.trim();
  const cat = document.getElementById('l_cat').value;
  const amount = parseFloat(document.getElementById('l_amount').value.replace(/[^\d]/g, '')) || 0;

  if (!content) { alert('Vui lòng nhập nội dung phiếu.'); return; }
  if (!cat) { alert('Vui lòng chọn danh mục thu chi.'); return; }
  if (!amount) { alert('Vui lòng nhập số tiền thành tiền.'); return; }

  const existing = v8Edit.ledgerId ? state.data.ledger.find(x => x.id === v8Edit.ledgerId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  let st = status || (existing ? existing.status : 'approved');

  const record = {
    id: v8Edit.ledgerId || state.uid(),
    projectId: p.id,
    kind: v8Edit.ledgerKind,
    date: document.getElementById('l_date').value || state.todayStr(),
    person: document.getElementById('l_person').value || user,
    categoryId: cat,
    folderId: document.getElementById('l_folder').value,
    content,
    unit: document.getElementById('l_unit').value.trim(),
    qty: parseFloat(document.getElementById('l_qty').value) || 0,
    price: parseFloat(document.getElementById('l_price').value.replace(/[^\d]/g, '')) || 0,
    amount,
    note: document.getElementById('l_note').value.trim(),
    files: v8Edit.ledgerFiles,
    status: st,
    approvedBy: st === 'approved' ? user : '',
    approvedAt: st === 'approved' ? Date.now() : null,
    rejectReason: '',
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('ledger', record);
  hideModal('modalLedger');
}

export function deleteLedger() {
  if (!v8Edit.ledgerId) return;
  const l = state.data.ledger.find(x => x.id === v8Edit.ledgerId);
  if (!l || !confirm(`Xoá phiếu "${l.content}"?`)) return;

  state.commit('ledger', { ...l, deleted: true });
  hideModal('modalLedger');
}

// ==========================================
// 3. WORKER MODAL HANDLERS
// ==========================================
export function openWorkerModal(id) {
  v8Edit.workerId = id || null;
  const w = id ? state.data.workers.find(x => x.id === id) : null;

  document.getElementById('wTitle').textContent = w ? `Nhân công: ${w.name}` : 'Thêm nhân công mới';
  document.getElementById('w_name').value = w ? w.name : '';
  document.getElementById('w_team').value = w ? (w.team || '') : '';
  document.getElementById('w_job').value = w ? (w.job || '') : '';
  document.getElementById('w_phone').value = w ? (w.phone || '') : '';
  document.getElementById('w_pay').value = w && w.payType === 'month' ? 'month' : 'day';
  document.getElementById('w_rate').value = w && w.rate ? state.money(w.rate) : '';
  document.getElementById('w_bank').value = w ? (w.bank || '') : '';
  document.getElementById('w_note').value = w ? (w.note || '') : '';
  document.getElementById('w_active').checked = !w || String(w.active) !== 'false';

  const btnDel = document.getElementById('w_del');
  if (btnDel) btnDel.style.display = w ? '' : 'none';

  showModal('modalWorker');
}

export function saveWorker() {
  const name = document.getElementById('w_name').value.trim();
  if (!name) { alert('Vui lòng nhập họ tên nhân công.'); return; }

  const existing = v8Edit.workerId ? state.data.workers.find(x => x.id === v8Edit.workerId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const record = {
    id: v8Edit.workerId || state.uid(),
    name,
    team: document.getElementById('w_team').value.trim(),
    job: document.getElementById('w_job').value.trim(),
    phone: document.getElementById('w_phone').value.trim(),
    payType: document.getElementById('w_pay').value,
    rate: parseFloat(document.getElementById('w_rate').value.replace(/[^\d]/g, '')) || 0,
    bank: document.getElementById('w_bank').value.trim(),
    note: document.getElementById('w_note').value.trim(),
    active: document.getElementById('w_active').checked ? 'true' : 'false',
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('worker', record);
  hideModal('modalWorker');
}

export function deleteWorker() {
  if (!v8Edit.workerId) return;
  const w = state.data.workers.find(x => x.id === v8Edit.workerId);
  if (!w || !confirm(`Xoá nhân công "${w.name}"?`)) return;

  state.commit('worker', { ...w, deleted: true });
  hideModal('modalWorker');
}

// ==========================================
// 4. ADVANCE MODAL HANDLERS
// ==========================================
export function openAdvanceModal(id, kind = 'salary', refId = '') {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.advanceId = id || null;
  v8Edit.advanceKind = kind;
  const a = id ? state.data.advances.find(x => x.id === id) : null;

  document.getElementById('aTitle').textContent = a ? `Phiếu tạm ứng: ${state.money(a.amount)}` : `Tạm ứng ${kind === 'salary' ? 'lương nhân công' : 'giao khoán tổ đội'}`;

  // Ref picker
  const selRef = document.getElementById('a_ref');
  if (kind === 'salary') {
    selRef.innerHTML = '<option value="">— Chọn nhân công ứng tiền —</option>' +
      state.data.workers.map(w => `<option value="${w.id}" ${a && a.refId === w.id ? 'selected' : ''}>${state.esc(w.name)} (${state.esc(w.team || 'Tự do')})</option>`).join('');
  } else {
    selRef.innerHTML = '<option value="">— Chọn tổ đội nhận khoán —</option>' +
      state.data.contracts.filter(c => c.projectId === p.id).map(c => `<option value="${c.id}" ${a && a.refId === c.id ? 'selected' : ''}>${state.esc(c.team)}</option>`).join('');
  }
  if (!a && refId) selRef.value = refId;

  document.getElementById('a_date').value = a ? a.date : state.todayStr();
  document.getElementById('a_amount').value = a && a.amount ? state.money(a.amount) : '';

  // Month selector for salary
  const selMonth = document.getElementById('a_month');
  const monthWrap = document.getElementById('a_month_wrap');
  if (monthWrap) monthWrap.style.display = kind === 'salary' ? '' : 'none';
  if (selMonth) {
    const curM = state.curMonth();
    selMonth.innerHTML = `<option value="${curM}">${state.monthLabel(curM)}</option>`;
  }

  document.getElementById('a_method').value = a ? (a.method || 'Chuyển khoản') : 'Chuyển khoản';
  document.getElementById('a_note').value = a ? (a.note || '') : '';

  v8Edit.advanceFiles = a && a.files ? [...a.files] : [];
  renderFileList('a_files', v8Edit.advanceFiles);

  const btnDel = document.getElementById('a_del');
  if (btnDel) btnDel.style.display = a ? '' : 'none';

  showModal('modalAdvance');
}

export function saveAdvance() {
  const p = state.projById(state.curProject);
  if (!p) return;

  const refId = document.getElementById('a_ref').value;
  const amount = parseFloat(document.getElementById('a_amount').value.replace(/[^\d]/g, '')) || 0;
  if (!refId) { alert('Vui lòng chọn người hoặc tổ đội ứng tiền.'); return; }
  if (!amount) { alert('Vui lòng nhập số tiền tạm ứng.'); return; }

  const existing = v8Edit.advanceId ? state.data.advances.find(x => x.id === v8Edit.advanceId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const record = {
    id: v8Edit.advanceId || state.uid(),
    projectId: p.id,
    kind: v8Edit.advanceKind,
    refId,
    date: document.getElementById('a_date').value || state.todayStr(),
    month: v8Edit.advanceKind === 'salary' ? (document.getElementById('a_month').value || state.curMonth()) : '',
    amount,
    method: document.getElementById('a_method').value,
    payer: user,
    note: document.getElementById('a_note').value.trim(),
    files: v8Edit.advanceFiles,
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('advance', record);
  hideModal('modalAdvance');
}

export function deleteAdvance(id) {
  const targetId = id || v8Edit.advanceId;
  if (!targetId) return;
  const a = state.data.advances.find(x => x.id === targetId);
  if (!a || !confirm(`Xoá phiếu tạm ứng ${state.money(a.amount)}?`)) return;

  state.commit('advance', { ...a, deleted: true });
  hideModal('modalAdvance');
}

// ==========================================
// 5. CONTRACT MODAL HANDLERS
// ==========================================
export function openContractModal(id) {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.contractId = id || null;
  const c = id ? state.data.contracts.find(x => x.id === id) : null;

  document.getElementById('cTitle').textContent = c ? `Giao khoán: ${c.team}` : 'Hợp đồng giao khoán tổ đội mới';
  document.getElementById('c_team').value = c ? c.team : '';
  document.getElementById('c_leader').value = c ? (c.leader || '') : '';
  document.getElementById('c_phone').value = c ? (c.phone || '') : '';
  document.getElementById('c_note').value = c ? (c.note || '') : '';

  v8Edit.contractDraftItems = c && c.items ? JSON.parse(JSON.stringify(c.items)) : [{ name: '', unit: '', qty: 0, price: 0, accQty: 0, note: '' }];
  renderContractItems();

  v8Edit.contractFiles = c && c.files ? [...c.files] : [];
  renderFileList('c_files', v8Edit.contractFiles);

  const btnDel = document.getElementById('c_del');
  if (btnDel) btnDel.style.display = c ? '' : 'none';

  showModal('modalContract');
}

export function renderContractItems() {
  const container = document.getElementById('c_items');
  if (!container) return;

  const rows = v8Edit.contractDraftItems;
  let totalVal = 0;
  let totalAcc = 0;

  let html = `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Hạng mục công việc giao khoán</th>
            <th style="width:60px">ĐVT</th>
            <th style="width:70px">KL giao</th>
            <th style="width:100px">Đơn giá (đ)</th>
            <th class="num">Thành tiền giao</th>
            <th style="width:70px">KL nghiệm thu</th>
            <th class="num">Giá trị NT</th>
            <th>Ghi chú</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((it, i) => {
            const v = (Number(it.qty) || 0) * (Number(it.price) || 0);
            const a = (Number(it.accQty) || 0) * (Number(it.price) || 0);
            totalVal += v;
            totalAcc += a;
            return `
              <tr>
                <td>${i + 1}</td>
                <td><input style="min-width:160px" placeholder="Tên công việc" value="${state.esc(it.name || '')}" oninput="window.app.updateContractItem(${i}, 'name', this.value)"></td>
                <td><input style="width:60px" placeholder="m, cái" value="${state.esc(it.unit || '')}" oninput="window.app.updateContractItem(${i}, 'unit', this.value)"></td>
                <td><input style="width:70px" type="number" step="0.1" value="${it.qty || ''}" oninput="window.app.updateContractItem(${i}, 'qty', this.value)"></td>
                <td><input style="width:100px" placeholder="Đơn giá" value="${it.price ? state.money(it.price) : ''}" onchange="window.app.updateContractItem(${i}, 'price', this.value)"></td>
                <td class="num font-bold">${state.money(v)}</td>
                <td><input style="width:70px" type="number" step="0.1" value="${it.accQty || ''}" oninput="window.app.updateContractItem(${i}, 'accQty', this.value)"></td>
                <td class="num font-bold" style="color:var(--green)">${state.money(a)}</td>
                <td><input style="min-width:100px" placeholder="Ghi chú" value="${state.esc(it.note || '')}" oninput="window.app.updateContractItem(${i}, 'note', this.value)"></td>
                <td><button class="ibtn danger" onclick="window.app.removeContractItem(${i})">✕</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5"><b>Tổng giá trị giao khoán:</b></td>
            <td class="num" style="font-weight:700">${state.money(totalVal)}</td>
            <td><b>Tổng NT:</b></td>
            <td class="num" style="font-weight:700;color:var(--green)">${state.money(totalAcc)}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <button class="btn" style="margin-top:6px" onclick="window.app.addContractItem()">+ Thêm đầu mục công việc</button>
  `;

  container.innerHTML = html;
}

export function saveContract() {
  const p = state.projById(state.curProject);
  if (!p) return;

  const team = document.getElementById('c_team').value.trim();
  if (!team) { alert('Vui lòng nhập tên tổ đội nhận khoán.'); return; }

  const existing = v8Edit.contractId ? state.data.contracts.find(x => x.id === v8Edit.contractId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const items = v8Edit.contractDraftItems.filter(it => (it.name || '').trim());

  const record = {
    id: v8Edit.contractId || state.uid(),
    projectId: p.id,
    team,
    leader: document.getElementById('c_leader').value.trim(),
    phone: document.getElementById('c_phone').value.trim(),
    items,
    note: document.getElementById('c_note').value.trim(),
    files: v8Edit.contractFiles,
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('contract', record);
  hideModal('modalContract');
}

export function deleteContract() {
  if (!v8Edit.contractId) return;
  const c = state.data.contracts.find(x => x.id === v8Edit.contractId);
  if (!c || !confirm(`Xoá hợp đồng giao khoán "${c.team}"?`)) return;

  state.commit('contract', { ...c, deleted: true });
  hideModal('modalContract');
}

// ==========================================
// 6. DEVICE MODAL HANDLERS
// ==========================================
export function openDeviceModal(id) {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.deviceId = id || null;
  const d = id ? state.data.devices.find(x => x.id === id) : null;

  document.getElementById('dvTitle').textContent = d ? `Thiết bị: ${d.category} – ${d.serial || d.model || ''}` : `Thiết bị mới – ${p.name}`;

  document.getElementById('dv_cat').value = d ? (d.category || '') : '';
  document.getElementById('dv_brand').value = d ? (d.brand || '') : '';
  document.getElementById('dv_model').value = d ? (d.model || '') : '';
  document.getElementById('dv_serial').value = d ? (d.serial || '') : '';
  document.getElementById('dv_mac').value = d ? (d.mac || '') : '';
  document.getElementById('dv_ip').value = d ? (d.ip || '') : '';

  // Folders dropdown
  document.getElementById('dv_folder').innerHTML = '<option value="">— Hạng mục —</option>' +
    (p.folders || []).map((f, i) => `<option value="${f.id}" ${d && d.folderId === f.id ? 'selected' : ''}>${i + 1}. ${state.esc(f.name)}</option>`).join('');

  document.getElementById('dv_loc').value = d ? (d.location || '') : '';
  document.getElementById('dv_status').value = d ? (d.status || 'stock') : 'installed';
  document.getElementById('dv_installer').value = d ? (d.installer || '') : '';
  document.getElementById('dv_install').value = d ? (d.installDate || '') : state.todayStr();
  document.getElementById('dv_accept').value = d ? (d.acceptDate || '') : '';
  document.getElementById('dv_warr').value = d ? (d.warrantyEnd || '') : '';
  document.getElementById('dv_note').value = d ? (d.note || '') : '';

  v8Edit.deviceFiles = d && d.files ? [...d.files] : [];
  renderFileList('dv_files', v8Edit.deviceFiles);

  const btnDel = document.getElementById('dv_del');
  if (btnDel) btnDel.style.display = d ? '' : 'none';

  showModal('modalDevice');
}

export function saveDevice(keepOpen = false) {
  const p = state.projById(state.curProject);
  if (!p) return;

  const serial = document.getElementById('dv_serial').value.trim();
  const cat = document.getElementById('dv_cat').value.trim();
  const model = document.getElementById('dv_model').value.trim();

  if (!serial && !model) {
    alert('Vui lòng nhập số Serial (S/N) hoặc Mã Model thiết bị.');
    return;
  }

  const existing = v8Edit.deviceId ? state.data.devices.find(x => x.id === v8Edit.deviceId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const record = {
    id: v8Edit.deviceId || state.uid(),
    projectId: p.id,
    folderId: document.getElementById('dv_folder').value,
    category: cat || 'Thiết bị khác',
    brand: document.getElementById('dv_brand').value.trim(),
    model,
    serial,
    mac: document.getElementById('dv_mac').value.trim(),
    ip: document.getElementById('dv_ip').value.trim(),
    location: document.getElementById('dv_loc').value.trim(),
    status: document.getElementById('dv_status').value,
    installer: document.getElementById('dv_installer').value.trim(),
    installDate: document.getElementById('dv_install').value,
    acceptDate: document.getElementById('dv_accept').value,
    warrantyEnd: document.getElementById('dv_warr').value,
    note: document.getElementById('dv_note').value.trim(),
    files: v8Edit.deviceFiles,
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('device', record);

  if (keepOpen) {
    v8Edit.deviceId = null;
    document.getElementById('dv_serial').value = '';
    document.getElementById('dv_mac').value = '';
    document.getElementById('dv_ip').value = '';
    document.getElementById('dv_serial').focus();
  } else {
    hideModal('modalDevice');
  }
}

export function deleteDevice() {
  if (!v8Edit.deviceId) return;
  const d = state.data.devices.find(x => x.id === v8Edit.deviceId);
  if (!d || !confirm(`Xoá thiết bị ${d.serial || d.model}?`)) return;

  state.commit('device', { ...d, deleted: true });
  hideModal('modalDevice');
}

// ==========================================
// 7. QA CHECKS MODAL HANDLERS
// ==========================================
export function openCheckModal(id) {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.checkId = id || null;
  const c = id ? state.data.checks.find(x => x.id === id) : null;

  document.getElementById('ckTitle').textContent = c ? `Biên bản: ${c.name}` : 'Biên bản nghiệm thu mới';
  document.getElementById('ck_name').value = c ? c.name : '';
  document.getElementById('ck_date').value = c ? c.date : state.todayStr();

  // Folders dropdown
  document.getElementById('ck_folder').innerHTML = '<option value="">— Hạng mục nghiệm thu —</option>' +
    (p.folders || []).map((f, i) => `<option value="${f.id}" ${c && c.folderId === f.id ? 'selected' : ''}>${i + 1}. ${state.esc(f.name)}</option>`).join('');

  document.getElementById('ck_part').value = c ? (c.participants || '') : '';
  document.getElementById('ck_concl').value = c ? (c.conclusion || 'ok') : 'ok';
  document.getElementById('ck_note').value = c ? (c.note || '') : '';

  // Checklist template selector
  document.getElementById('ck_tpl').innerHTML = '<option value="">➕ Chọn mẫu checklist nghiệm thu…</option>' +
    Object.entries(CHK_TPL).map(([k, v]) => `<option value="${k}">${v[0]} (${v[1].length} mục)</option>`).join('');

  v8Edit.checkDraftItems = c && c.items ? JSON.parse(JSON.stringify(c.items)) : [];
  renderCheckItems();

  v8Edit.checkFiles = c && c.files ? [...c.files] : [];
  renderFileList('ck_files', v8Edit.checkFiles);

  const btnDel = document.getElementById('ck_del');
  if (btnDel) btnDel.style.display = c ? '' : 'none';

  showModal('modalCheck');
}

export function applyCheckTemplate(tplKey) {
  const tpl = CHK_TPL[tplKey];
  if (!tpl) return;

  const currentTexts = new Set(v8Edit.checkDraftItems.map(it => (it.text || '').trim()));
  tpl[1].forEach(t => {
    if (!currentTexts.has(t)) {
      v8Edit.checkDraftItems.push({ text: t, result: 'ok', note: '' });
    }
  });

  if (!document.getElementById('ck_name').value.trim()) {
    document.getElementById('ck_name').value = `Nghiệm thu ${tpl[0].toLowerCase()}`;
  }

  renderCheckItems();
}

export function renderCheckItems() {
  const container = document.getElementById('ck_items');
  if (!container) return;

  const rows = v8Edit.checkDraftItems;
  let html = `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Nội dung kiểm tra</th>
            <th>Kết quả</th>
            <th>Ghi chú</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((it, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><input style="min-width:260px" value="${state.esc(it.text || '')}" oninput="window.app.updateCheckItem(${i}, 'text', this.value)"></td>
              <td style="white-space:nowrap">
                <select onchange="window.app.updateCheckItem(${i}, 'result', this.value)">
                  <option value="ok" ${it.result === 'ok' ? 'selected' : ''}>✔ Đạt</option>
                  <option value="fail" ${it.result === 'fail' ? 'selected' : ''}>✗ Không đạt</option>
                  <option value="na" ${it.result === 'na' ? 'selected' : ''}>– Không áp dụng</option>
                </select>
              </td>
              <td><input style="min-width:140px" placeholder="Ghi chú" value="${state.esc(it.note || '')}" oninput="window.app.updateCheckItem(${i}, 'note', this.value)"></td>
              <td><button class="ibtn danger" onclick="window.app.removeCheckItem(${i})">✕</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <button class="btn" style="margin-top:6px" onclick="window.app.addCheckItem()">+ Thêm dòng kiểm tra</button>
  `;

  container.innerHTML = html;
}

export function saveCheck() {
  const p = state.projById(state.curProject);
  if (!p) return;

  const name = document.getElementById('ck_name').value.trim();
  if (!name) { alert('Vui lòng nhập tên biên bản nghiệm thu.'); return; }

  const existing = v8Edit.checkId ? state.data.checks.find(x => x.id === v8Edit.checkId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const items = v8Edit.checkDraftItems.filter(it => (it.text || '').trim());

  const record = {
    id: v8Edit.checkId || state.uid(),
    projectId: p.id,
    name,
    date: document.getElementById('ck_date').value || state.todayStr(),
    folderId: document.getElementById('ck_folder').value,
    participants: document.getElementById('ck_part').value.trim(),
    items,
    conclusion: document.getElementById('ck_concl').value,
    note: document.getElementById('ck_note').value.trim(),
    files: v8Edit.checkFiles,
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('check', record);
  hideModal('modalCheck');
}

export function deleteCheck() {
  if (!v8Edit.checkId) return;
  const c = state.data.checks.find(x => x.id === v8Edit.checkId);
  if (!c || !confirm(`Xoá biên bản "${c.name}"?`)) return;

  state.commit('check', { ...c, deleted: true });
  hideModal('modalCheck');
}

// ==========================================
// 8. QA ISSUES MODAL HANDLERS
// ==========================================
export function openIssueModal(id) {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.issueId = id || null;
  const x = id ? state.data.issues.find(i => i.id === id) : null;

  document.getElementById('isTitle').textContent = x ? 'Lỗi tồn tại' : 'Ghi nhận lỗi tồn tại mới';
  document.getElementById('is_title').value = x ? x.title : '';

  // Folders dropdown
  document.getElementById('is_folder').innerHTML = '<option value="">— Hạng mục —</option>' +
    (p.folders || []).map((f, i) => `<option value="${f.id}" ${x && x.folderId === f.id ? 'selected' : ''}>${i + 1}. ${state.esc(f.name)}</option>`).join('');

  document.getElementById('is_loc').value = x ? (x.location || '') : '';
  document.getElementById('is_sev').value = x ? (x.severity || 'med') : 'med';

  // Assignee dropdown
  const members = state.data.users || [];
  document.getElementById('is_assignee').innerHTML = '<option value="">— Người phụ trách sửa —</option>' +
    members.map(u => {
      const email = u.email || u.username;
      return `<option value="${state.esc(email)}" ${x && x.assignee === email ? 'selected' : ''}>${state.esc(u.fullName || u.username)}</option>`;
    }).join('');

  document.getElementById('is_due').value = x ? (x.dueDate || '') : '';
  document.getElementById('is_status').value = x ? (x.status || 'open') : 'open';
  document.getElementById('is_note').value = x ? (x.note || '') : '';

  v8Edit.issueFiles = x && x.files ? [...x.files] : [];
  renderFileList('is_files', v8Edit.issueFiles);

  const btnDel = document.getElementById('is_del');
  if (btnDel) btnDel.style.display = x ? '' : 'none';

  showModal('modalIssue');
}

export function saveIssue() {
  const p = state.projById(state.curProject);
  if (!p) return;

  const title = document.getElementById('is_title').value.trim();
  if (!title) { alert('Vui lòng nhập nội dung lỗi tồn tại.'); return; }

  const existing = v8Edit.issueId ? state.data.issues.find(x => x.id === v8Edit.issueId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const record = {
    id: v8Edit.issueId || state.uid(),
    projectId: p.id,
    title,
    folderId: document.getElementById('is_folder').value,
    location: document.getElementById('is_loc').value.trim(),
    severity: document.getElementById('is_sev').value,
    assignee: document.getElementById('is_assignee').value,
    dueDate: document.getElementById('is_due').value,
    status: document.getElementById('is_status').value,
    note: document.getElementById('is_note').value.trim(),
    files: v8Edit.issueFiles,
    fixedAt: document.getElementById('is_status').value === 'fixed' || document.getElementById('is_status').value === 'closed' ? (existing?.fixedAt || Date.now()) : null,
    closedBy: document.getElementById('is_status').value === 'closed' ? user : '',
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('issue', record);
  hideModal('modalIssue');
}

export function deleteIssue() {
  if (!v8Edit.issueId) return;
  const x = state.data.issues.find(i => i.id === v8Edit.issueId);
  if (!x || !confirm(`Xoá lỗi "${x.title}"?`)) return;

  state.commit('issue', { ...x, deleted: true });
  hideModal('modalIssue');
}

// ==========================================
// 9. FINANCE: RECEIPTS & GUARANTEES
// ==========================================
export function openReceiptModal(id) {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.receiptId = id || null;
  const r = id ? state.data.receipts.find(x => x.id === id) : null;

  document.getElementById('rcTitle').textContent = r ? `Đợt thanh toán: ${r.name}` : 'Thêm đợt thanh toán từ CĐT';
  document.getElementById('rc_name').value = r ? r.name : '';
  document.getElementById('rc_amount').value = r && r.amount ? state.money(r.amount) : '';
  document.getElementById('rc_planned').value = r ? (r.plannedDate || '') : '';
  document.getElementById('rc_status').value = r ? (r.status || 'planned') : 'planned';
  document.getElementById('rc_date').value = r ? (r.receivedDate || '') : '';
  document.getElementById('rc_got').value = r && r.receivedAmount ? state.money(r.receivedAmount) : '';
  document.getElementById('rc_note').value = r ? (r.note || '') : '';

  v8Edit.receiptFiles = r && r.files ? [...r.files] : [];
  renderFileList('rc_files', v8Edit.receiptFiles);

  const btnDel = document.getElementById('rc_del');
  if (btnDel) btnDel.style.display = r ? '' : 'none';

  showModal('modalReceipt');
}

export function saveReceipt() {
  const p = state.projById(state.curProject);
  if (!p) return;

  const name = document.getElementById('rc_name').value.trim();
  const amount = parseFloat(document.getElementById('rc_amount').value.replace(/[^\d]/g, '')) || 0;
  if (!name) { alert('Vui lòng nhập tên đợt thanh toán.'); return; }

  const existing = v8Edit.receiptId ? state.data.receipts.find(x => x.id === v8Edit.receiptId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const record = {
    id: v8Edit.receiptId || state.uid(),
    projectId: p.id,
    name,
    amount,
    plannedDate: document.getElementById('rc_planned').value,
    status: document.getElementById('rc_status').value,
    receivedDate: document.getElementById('rc_date').value,
    receivedAmount: parseFloat(document.getElementById('rc_got').value.replace(/[^\d]/g, '')) || 0,
    note: document.getElementById('rc_note').value.trim(),
    files: v8Edit.receiptFiles,
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('receipt', record);
  hideModal('modalReceipt');
}

export function deleteReceipt() {
  if (!v8Edit.receiptId) return;
  const r = state.data.receipts.find(x => x.id === v8Edit.receiptId);
  if (!r || !confirm(`Xoá đợt thanh toán "${r.name}"?`)) return;

  state.commit('receipt', { ...r, deleted: true });
  hideModal('modalReceipt');
}

export function openGuaranteeModal(id) {
  const p = state.projById(state.curProject);
  if (!p) return;

  v8Edit.guaranteeId = id || null;
  const g = id ? state.data.guarantees.find(x => x.id === id) : null;

  document.getElementById('gTitle').textContent = g ? `Bảo lãnh: ${g.number || ''}` : 'Thêm thư bảo lãnh ngân hàng';
  document.getElementById('g_type').value = g ? (g.gtype || 'performance') : 'performance';
  document.getElementById('g_bank').value = g ? (g.bank || '') : '';
  document.getElementById('g_number').value = g ? (g.number || '') : '';
  document.getElementById('g_amount').value = g && g.amount ? state.money(g.amount) : '';
  document.getElementById('g_issue').value = g ? (g.issueDate || '') : '';
  document.getElementById('g_expiry').value = g ? (g.expiryDate || '') : '';
  document.getElementById('g_status').value = g ? (g.status || 'active') : 'active';
  document.getElementById('g_note').value = g ? (g.note || '') : '';

  v8Edit.guaranteeFiles = g && g.files ? [...g.files] : [];
  renderFileList('g_files', v8Edit.guaranteeFiles);

  const btnDel = document.getElementById('g_del');
  if (btnDel) btnDel.style.display = g ? '' : 'none';

  showModal('modalGuarantee');
}

export function saveGuarantee() {
  const p = state.projById(state.curProject);
  if (!p) return;

  const number = document.getElementById('g_number').value.trim();
  const expiry = document.getElementById('g_expiry').value;
  if (!expiry) { alert('Vui lòng chọn ngày hết hạn bảo lãnh.'); return; }

  const existing = v8Edit.guaranteeId ? state.data.guarantees.find(x => x.id === v8Edit.guaranteeId) : null;
  const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';

  const record = {
    id: v8Edit.guaranteeId || state.uid(),
    projectId: p.id,
    gtype: document.getElementById('g_type').value,
    bank: document.getElementById('g_bank').value.trim(),
    number,
    amount: parseFloat(document.getElementById('g_amount').value.replace(/[^\d]/g, '')) || 0,
    issueDate: document.getElementById('g_issue').value,
    expiryDate: expiry,
    status: document.getElementById('g_status').value,
    note: document.getElementById('g_note').value.trim(),
    files: v8Edit.guaranteeFiles,
    createdBy: existing ? existing.createdBy : user,
    createdAt: existing ? existing.createdAt : Date.now(),
    deleted: false
  };

  state.commit('guarantee', record);
  hideModal('modalGuarantee');
}

export function deleteGuarantee() {
  if (!v8Edit.guaranteeId) return;
  const g = state.data.guarantees.find(x => x.id === v8Edit.guaranteeId);
  if (!g || !confirm(`Xoá bảo lãnh số "${g.number}"?`)) return;

  state.commit('guarantee', { ...g, deleted: true });
  hideModal('modalGuarantee');
}

// ==========================================
// FILE ATTACHMENTS HELPER
// ==========================================
export function renderFileList(containerId, files) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!files || !files.length) {
    container.innerHTML = '<span class="small" style="color:var(--text-muted)">Chưa có tệp/ảnh đính kèm</span>';
    return;
  }

  container.innerHTML = files.map((f, i) => `
    <div class="file-item" style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <span class="ficon">📎</span>
      <a href="${state.esc(f.url)}" target="_blank" rel="noopener" style="flex:1;font-size:12px">${state.esc(f.name)}</a>
      <button class="ibtn xs danger" onclick="window.app.removeModalFile('${containerId}', ${i})">✕</button>
    </div>
  `).join('');
}
