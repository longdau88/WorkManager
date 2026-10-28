import { state } from '../state.js';
import { api } from '../api.js';

// Weather options
export const WEATHER = ['Nắng', 'Nắng nóng', 'Mưa nhỏ', 'Mưa to', 'Nhiều mây', 'Âm u', 'Gió mạnh'];

// Ledger status map
export const LSTATUS = {
  pending: ['Chờ duyệt', 'b-orange'],
  approved: ['Đã duyệt', 'b-green'],
  rejected: ['Từ chối', 'b-red']
};

// Device status map
export const DSTAT = {
  stock: ['Trong kho', 'b-gray'],
  installed: ['Đã lắp đặt', 'b-blue'],
  accepted: ['Đã nghiệm thu', 'b-green'],
  warranty: ['Bảo hành / sửa', 'b-orange'],
  broken: ['Hỏng / thay thế', 'b-red']
};

export const DCATS = [
  'Camera PTZ', 'Camera cố định', 'Đầu ghi NVR', 'Switch', 'Ổ cứng',
  'Màn hình', 'Tủ rack', 'Bộ lưu điện UPS', 'Máy tính / máy chủ', 'Thiết bị mạng khác', 'Phụ kiện'
];

// QA Checks Conclusion map
export const CONCL = {
  ok: ['Đạt yêu cầu', 'b-green'],
  cond: ['Đạt có điều kiện', 'b-orange'],
  fail: ['Không đạt', 'b-red']
};

export const CHK_RES = {
  ok: ['Đạt', 'b-green'],
  fail: ['Không đạt', 'b-red'],
  na: ['K/Áp dụng', 'b-gray']
};

// Checklist templates
export const CHK_TPL = {
  cam: ['Lắp đặt camera giám sát', [
    'Vị trí, cao độ, góc quan sát đúng bản vẽ',
    'Chân đế, giá đỡ chắc chắn, chống rung lắc',
    'Đầu nối bấm đúng chuẩn, bọc kín nước hộp kỹ thuật',
    'Dây tín hiệu, dây nguồn đánh số, luồn ống bảo vệ',
    'Hình ảnh ban ngày rõ nét, đúng vùng quan sát',
    'Hình ảnh ban đêm (hồng ngoại/đèn trợ sáng) đạt yêu cầu',
    'Cấu hình IP, đặt tên camera, gán luồng về NVR'
  ]],
  net: ['Mạng nội bộ & cáp quang', [
    'Tủ rack thông thoáng, đấu nối tiếp địa',
    'Patch panel đánh số đầy đủ nhãn cổng',
    'Đo thông mạch cáp mạng (kết quả cáp đạt Cat5e/Cat6)',
    'Hàn nối cáp quang, đo suy hao quang trong giới hạn',
    'Switch cấu hình VLAN, chia dải IP theo thiết kế',
    'Kiểm tra tốc độ truyền dữ liệu nội bộ'
  ]],
  pwr: ['Nguồn điện & UPS', [
    'Điện áp cấp đúng định mức (220V ± 10%)',
    'UPS chạy thử khi ngắt điện lưới đạt thời gian yêu cầu',
    'Hệ thống tiếp địa đạt (điện trở tiếp địa < 4 Ohm)',
    'Aptomat, dây dẫn đúng tiết diện và công suất tải',
    'Thiết bị chống sét lan truyền lắp đặt đúng kỹ thuật'
  ]],
  sw: ['Phần mềm & Quản trị hệ thống', [
    'Cài đặt phần mềm trên máy chủ / máy trạm',
    'Phân quyền tài khoản theo chức vụ',
    'Xem trực tiếp, xem lại, trích xuất dữ liệu mượt mà',
    'Cảnh báo sự kiện (mất mạng, chuyển động, báo động)',
    'Cấu hình sao lưu dự phòng tự động'
  ]],
  hand: ['Hồ sơ hoàn công & Bàn giao', [
    'Bản vẽ hoàn công đúng thực tế thi công',
    'Danh mục thiết bị (serial, MAC, IP, vị trí)',
    'CO, CQ, phiếu bảo hành của nhà phân phối',
    'Tài liệu hướng dẫn vận hành hệ thống',
    'Biên bản đào tạo, chuyển giao công nghệ',
    'Bàn giao toàn bộ tài khoản quản trị và mật khẩu gốc'
  ]]
};

// Punch-list issue status and severity maps
export const ISS_ST = {
  open: ['Chưa sửa', 'b-red'],
  fixing: ['Đang sửa', 'b-orange'],
  fixed: ['Đã sửa xong', 'b-blue'],
  closed: ['Đã đóng', 'b-green']
};

export const SEV = {
  high: ['Nghiêm trọng', 'b-red'],
  med: ['Trung bình', 'b-orange'],
  low: ['Nhẹ', 'b-gray']
};

// Guarantee types and status
export const GTYPES = {
  performance: 'Bảo lãnh thực hiện HĐ',
  advance: 'Bảo lãnh tạm ứng',
  warranty: 'Bảo lãnh bảo hành',
  bid: 'Bảo lãnh dự thầu',
  other: 'Bảo lãnh khác'
};

export const GSTAT = {
  active: ['Đang hiệu lực', 'b-blue'],
  extended: ['Đã gia hạn', 'b-orange'],
  released: ['Đã giải toả', 'b-gray']
};

// Module state filters
export const moduleState = {
  diaryFrom: '',
  diaryTo: '',
  ltab: 'list', // 'list' | 'sum'
  ledgerKind: '',
  ledgerPerson: '',
  ledgerCat: '',
  ledgerStatus: '',
  ledgerMonth: '',
  lsub: 'att', // 'att' (chấm công) | 'pay' (bảng lương) | 'adv' (tạm ứng) | 'wk' (danh sách)
  lmonth: '',
  attMode: 'day', // 'day' | 'ot'
  devQ: '',
  devStatus: '',
  devCat: '',
  devFolder: '',
  devAll: false,
  devSel: new Set(),
  qsub: 'chk', // 'chk' | 'iss'
  issStatus: 'live',
  issAssignee: '',
  issFolder: ''
};

// ==========================================
// 1. RENDER PROJECT SUB-TABS BAR
// ==========================================
export function renderProjectTabs() {
  const container = document.getElementById('projectSubTabs');
  const taskPane = document.getElementById('taskPane');
  const pane2 = document.getElementById('pane2');
  if (!container) return;

  if (state.curProject === 'all') {
    container.innerHTML = '';
    if (taskPane) taskPane.style.display = '';
    if (pane2) pane2.style.display = 'none';
    return;
  }

  const p = state.projById(state.curProject);
  if (!p) {
    container.innerHTML = '';
    return;
  }

  const curPtab = state.curPtab || 'tasks';

  // Counts
  const nTasks = state.data.tasks.filter(t => t.projectId === p.id).length;
  const nDiary = state.data.diary.filter(d => d.projectId === p.id).length;
  const lp = state.data.ledger.filter(l => l.projectId === p.id);
  const nPendingLedger = lp.filter(l => l.status === 'pending').length;
  const curMonth = moduleState.lmonth || state.curMonth();
  const nLabor = state.data.labor.filter(l => l.projectId === p.id && l.month === curMonth).length;
  const nContracts = state.data.contracts.filter(c => c.projectId === p.id).length;
  const nDevices = state.data.devices.filter(d => d.projectId === p.id).length;
  const nOpenIssues = state.data.issues.filter(x => x.projectId === p.id && (x.status === 'open' || x.status === 'fixing')).length;
  const nChecks = state.data.checks.filter(c => c.projectId === p.id).length;

  const tabs = [
    { key: 'tasks', label: '📋 Đầu việc', count: nTasks },
    { key: 'diary', label: '📒 Nhật ký', count: nDiary },
    { key: 'ledger', label: '💰 Sổ quỹ Thu chi', count: lp.length, badge: nPendingLedger ? `<span class="badge b-orange">${nPendingLedger} chờ duyệt</span>` : '' },
    { key: 'labor', label: '👷 Chấm công & Lương', count: nLabor },
    { key: 'contract', label: '🤝 Giao khoán', count: nContracts },
    { key: 'device', label: '📡 Thiết bị & QR', count: nDevices },
    { key: 'qa', label: '✅ Nghiệm thu & Lỗi', count: nChecks, badge: nOpenIssues ? `<span class="badge b-red">${nOpenIssues} lỗi</span>` : '' },
    { key: 'finance', label: '💼 Tài chính & Bảo lãnh', count: '' }
  ];

  container.innerHTML = `
    <div class="tabs ptabs">
      ${tabs.map(t => `
        <button class="tab ${curPtab === t.key ? 'active' : ''}" onclick="window.app.setPtab('${t.key}')">
          ${t.label} <b>${t.count}</b> ${t.badge || ''}
        </button>
      `).join('')}
    </div>
  `;

  // Control Visibility
  if (curPtab === 'tasks') {
    if (taskPane) taskPane.style.display = '';
    if (pane2) pane2.style.display = 'none';
  } else {
    if (taskPane) taskPane.style.display = 'none';
    if (pane2) {
      pane2.style.display = '';
      renderActiveModule(p, curPtab);
    }
  }
}

function renderActiveModule(p, tabKey) {
  switch (tabKey) {
    case 'diary': renderDiary(p); break;
    case 'ledger': renderLedger(p); break;
    case 'labor': renderLabor(p); break;
    case 'contract': renderContracts(p); break;
    case 'device': renderDevices(p); break;
    case 'qa': renderQA(p); break;
    case 'finance': renderFinance(p); break;
    default: renderDiary(p); break;
  }
}

// ==========================================
// 2. MODULE: NHẬT KÝ CÔNG TRÌNH (DIARY)
// ==========================================
export function renderDiary(p) {
  const pane = document.getElementById('pane2');
  if (!pane) return;

  const fFrom = moduleState.diaryFrom;
  const fTo = moduleState.diaryTo;

  const list = state.data.diary
    .filter(d => d.projectId === p.id && (!fFrom || d.date >= fFrom) && (!fTo || d.date <= fTo))
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));

  const tot = state.diaryTotals(list);
  const today = state.todayStr();
  const hasToday = state.data.diary.some(d => d.projectId === p.id && d.date === today);

  let html = `
    <div class="toolbar" style="margin-top:8px">
      <span class="small" style="font-weight:600">Từ ngày:</span>
      <input type="date" value="${fFrom}" onchange="window.app.setDiaryFilter('from', this.value)" style="width:auto">
      <span class="small" style="font-weight:600">đến:</span>
      <input type="date" value="${fTo}" onchange="window.app.setDiaryFilter('to', this.value)" style="width:auto">
      <span style="flex:1"></span>
      <button class="btn primary" onclick="window.app.openDiaryModal()">
        + ${hasToday ? 'Thêm nhật ký' : 'Nhật ký hôm nay'}
      </button>
    </div>

    <div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));margin-bottom:12px">
      <div class="card"><div class="v">${list.length}</div><div class="l">Ngày có nhật ký</div></div>
      <div class="card"><div class="v">${state.fmtNum(tot.lab)}</div><div class="l">Lượt nhân công</div></div>
      <div class="card"><div class="v">${state.fmtNum(tot.ot)}</div><div class="l">Giờ công tăng ca</div></div>
      <div class="card"><div class="v">${state.fmtNum(tot.ms)}</div><div class="l">Ca máy thi công</div></div>
    </div>
  `;

  if (!list.length) {
    html += `<div class="empty">Chưa có nhật ký nào ${fFrom || fTo ? 'trong khoảng thời gian này' : ''}.<br><br><button class="btn primary" onclick="window.app.openDiaryModal()">+ Viết nhật ký đầu tiên</button></div>`;
  } else {
    html += list.map(d => {
      const L = d.labor || {};
      const lab = (+L.tech || 0) + (+L.perm || 0) + (+L.contract || 0);
      const ms = (d.machines || []).reduce((s, m) => s + (+m.shifts || 0), 0);
      const imgs = (d.files || []).filter(f => String(f.mime || '').startsWith('image/')).length;
      const fo = (p.folders || []).find(f => f.id === d.folderId);

      const parts = [];
      if (+L.tech) parts.push(`CBKT: ${L.tech}`);
      if (+L.perm) parts.push(`Cơ hữu: ${L.perm}`);
      if (+L.contract) parts.push(`Khoán: ${L.contract}`);

      const meta = [
        fo ? `📁 ${state.esc(fo.name)}` : '',
        d.area ? `📍 ${state.esc(d.area)}` : '',
        lab ? `👷 ${lab} người (${parts.join(', ')})` : '',
        (+L.otPeople && +L.otHours) ? `⏱ Tăng ca ${L.otPeople} người × ${L.otHours}h` : '',
        ms ? `🚜 ${state.fmtNum(ms)} ca máy` : '',
        imgs ? `📷 ${imgs} ảnh` : '',
        `✍ ${state.esc(state.shortName(d.createdBy))}`
      ].filter(Boolean).join(' · ');

      const w = [d.weatherAM && `Sáng: ${d.weatherAM}`, d.weatherPM && `Chiều: ${d.weatherPM}`].filter(Boolean).join(' · ');

      return `
        <div class="dcard anim-slide-up" onclick="window.app.openDiaryModal('${d.id}')">
          <div class="proj-row" style="flex-wrap:wrap">
            <b>${state.dowOf(d.date)}, ${state.fmtDate(d.date)}</b>
            ${w ? `<span class="small" style="color:var(--text-muted)">🌤 ${state.esc(w)}</span>` : ''}
            <span style="flex:1"></span>
            ${d.confirmedBy
              ? `<span class="badge b-green" title="Xác nhận bởi ${state.esc(state.fullName(d.confirmedBy))}">✔ Đã xác nhận</span>`
              : `<span class="badge b-gray">Chưa xác nhận</span>`}
          </div>
          <div class="small" style="margin-top:4px;color:var(--text-muted)">${meta}</div>
          ${d.workText ? `<div class="dtext" style="margin-top:6px;line-height:1.5">${state.esc(d.workText)}</div>` : ''}
          ${(d.tasks || []).length ? `
            <div class="small" style="margin-top:5px;color:var(--pri-600)">
              ✅ Đầu việc liên quan: ${d.tasks.map(t => `${state.esc(t.title)} (${+t.progress || 0}%)`).join(' · ')}
            </div>
          ` : ''}
          ${d.issues ? `<div class="small" style="color:var(--danger-text);margin-top:4px">⚠ Sự cố/Vướng mắc: ${state.esc(d.issues)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  pane.innerHTML = html;
}

// ==========================================
// 3. MODULE: SỔ QUỸ THU CHI (LEDGER)
// ==========================================
export function renderLedger(p) {
  const pane = document.getElementById('pane2');
  if (!pane) return;

  const all = state.data.ledger.filter(l => l.projectId === p.id);
  const recv = state.lsum(all, 'nhan', 'approved');
  const spent = state.lsum(all, 'chi', 'approved');
  const pend = all.filter(l => l.status === 'pending');
  const pendSum = pend.reduce((a, l) => a + (+l.amount || 0), 0);

  const ltab = moduleState.ltab;

  let html = `
    <div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));margin:8px 0 12px">
      <div class="card"><div class="v" style="color:var(--green)">${state.money(recv)}</div><div class="l">Đã nhận (Đã duyệt)</div></div>
      <div class="card"><div class="v" style="color:var(--red)">${state.money(spent)}</div><div class="l">Đã chi (Đã duyệt)</div></div>
      <div class="card"><div class="v" style="font-weight:700">${state.money(recv - spent)}</div><div class="l">Số dư quỹ (Nhận − Chi)</div></div>
      <div class="card"><div class="v" style="color:var(--orange)">${pend.length}</div><div class="l">Chờ duyệt · ${state.money(pendSum)}</div></div>
    </div>

    <div class="toolbar">
      <div class="tabs">
        <button class="tab ${ltab === 'list' ? 'active' : ''}" onclick="window.app.setLedgerTab('list')">Danh sách phiếu</button>
        <button class="tab ${ltab === 'sum' ? 'active' : ''}" onclick="window.app.setLedgerTab('sum')">Tổng quan quyết toán</button>
      </div>
      <span style="flex:1"></span>
      <button class="btn" onclick="window.app.openLedgerModal(null, 'nhan')">+ Phiếu nhận (Ứng)</button>
      <button class="btn primary" onclick="window.app.openLedgerModal(null, 'chi')">+ Phiếu chi</button>
    </div>
  `;

  if (ltab === 'sum') {
    html += renderLedgerSummary(p, all);
  } else {
    // Filter controls
    const people = [...new Set(all.map(l => (l.person || '').toLowerCase()).filter(Boolean))];
    const months = [...new Set(all.map(l => String(l.date || '').slice(0, 7)).filter(Boolean))].sort().reverse();

    const list = all.filter(l => {
      const matchKind = !moduleState.ledgerKind || l.kind === moduleState.ledgerKind;
      const matchPerson = !moduleState.ledgerPerson || (l.person || '').toLowerCase() === moduleState.ledgerPerson;
      const matchCat = !moduleState.ledgerCat || l.categoryId === moduleState.ledgerCat;
      const matchStatus = !moduleState.ledgerStatus || l.status === moduleState.ledgerStatus;
      const matchMonth = !moduleState.ledgerMonth || String(l.date || '').slice(0, 7) === moduleState.ledgerMonth;
      return matchKind && matchPerson && matchCat && matchStatus && matchMonth;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));

    const nIn = state.lsum(list, 'nhan');
    const nOut = state.lsum(list, 'chi');

    html += `
      <div class="toolbar" style="margin-top:8px">
        <select style="width:auto" onchange="window.app.setLedgerFilter('kind', this.value)">
          <option value="">Thu & Chi</option>
          <option value="chi" ${moduleState.ledgerKind === 'chi' ? 'selected' : ''}>Chi</option>
          <option value="nhan" ${moduleState.ledgerKind === 'nhan' ? 'selected' : ''}>Nhận</option>
        </select>
        <select style="width:auto" onchange="window.app.setLedgerFilter('person', this.value)">
          <option value="">👤 Mọi người thực hiện</option>
          ${people.map(e => `<option value="${state.esc(e)}" ${moduleState.ledgerPerson === e ? 'selected' : ''}>${state.esc(state.shortName(e))}</option>`).join('')}
        </select>
        <select style="width:auto" onchange="window.app.setLedgerFilter('cat', this.value)">
          <option value="">Mọi danh mục</option>
          ${state.sortedCats().map(c => `<option value="${c.id}" ${moduleState.ledgerCat === c.id ? 'selected' : ''}>${state.esc(c.name)}</option>`).join('')}
        </select>
        <select style="width:auto" onchange="window.app.setLedgerFilter('status', this.value)">
          <option value="">Mọi trạng thái</option>
          ${Object.entries(LSTATUS).map(([k, v]) => `<option value="${k}" ${moduleState.ledgerStatus === k ? 'selected' : ''}>${v[0]}</option>`).join('')}
        </select>
        <select style="width:auto" onchange="window.app.setLedgerFilter('month', this.value)">
          <option value="">Mọi tháng</option>
          ${months.map(m => `<option value="${m}" ${moduleState.ledgerMonth === m ? 'selected' : ''}>Tháng ${m.slice(5)}/${m.slice(0, 4)}</option>`).join('')}
        </select>
        <span style="flex:1"></span>
        <button class="btn" onclick="window.app.exportLedgerCsv()">⤓ Xuất CSV</button>
      </div>
    `;

    if (!list.length) {
      html += `<div class="empty">Chưa có phiếu thu chi nào khớp bộ lọc.</div>`;
    } else {
      html += `
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Người</th>
                <th>Loại</th>
                <th>Danh mục</th>
                <th>Nội dung</th>
                <th class="num">SL × Đơn giá</th>
                <th class="num">Thành tiền</th>
                <th>Chứng từ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(l => {
                const c = state.catById(l.categoryId);
                const st = LSTATUS[l.status] || LSTATUS.pending;
                const isChi = l.kind !== 'nhan';
                return `
                  <tr class="click" onclick="window.app.openLedgerModal('${l.id}')">
                    <td>${state.fmtShort(l.date)}</td>
                    <td><b>${state.esc(state.shortName(l.person))}</b></td>
                    <td>${isChi ? '<span class="badge b-red">Chi</span>' : '<span class="badge b-green">Nhận</span>'}</td>
                    <td>${state.esc(c ? c.name : '')}</td>
                    <td style="white-space:normal;min-width:180px">
                      ${state.esc(l.content)}
                      ${l.status === 'rejected' && l.rejectReason ? `<div class="small" style="color:var(--danger-text)">Lý do: ${state.esc(l.rejectReason)}</div>` : ''}
                    </td>
                    <td class="num small">${+l.qty ? `${state.fmtNum(l.qty)} ${state.esc(l.unit || '')} × ${state.money(l.price)}` : ''}</td>
                    <td class="num" style="font-weight:700;color:${isChi ? 'var(--red)' : 'var(--green)'}">
                      ${isChi ? '−' : '+'}${state.money(l.amount)}
                    </td>
                    <td>${(l.files || []).length ? `📎 ${l.files.length}` : ''}</td>
                    <td><span class="badge ${st[1]}">${st[0]}</span></td>
                    <td onclick="event.stopPropagation()" style="white-space:nowrap">
                      ${l.status !== 'approved' ? `<button class="ibtn" title="Duyệt phiếu" style="color:var(--green)" onclick="window.app.setLedgerStatus('${l.id}', 'approved')">✔</button>` : ''}
                      ${l.status !== 'rejected' ? `<button class="ibtn" title="Từ chối phiếu" style="color:var(--red)" onclick="window.app.setLedgerStatus('${l.id}', 'rejected')">✗</button>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6"><b>Tổng: ${list.length} phiếu · Nhận ${state.money(nIn)} · Chi ${state.money(nOut)}</b></td>
                <td class="num" style="font-weight:700">${nIn - nOut >= 0 ? '+' : '−'}${state.money(Math.abs(nIn - nOut))}</td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }
  }

  pane.innerHTML = html;
}

function renderLedgerSummary(p, all) {
  const ap = all.filter(l => l.status === 'approved');
  const totalChi = state.lsum(ap, 'chi');
  const people = [...new Set(all.map(l => (l.person || '').toLowerCase()).filter(Boolean))].sort((a, b) => state.shortName(a).localeCompare(state.shortName(b), 'vi'));
  const pendSum = list => list.filter(l => l.status === 'pending').reduce((a, l) => a + (+l.amount || 0), 0);

  let html = `
    <h3 style="margin:16px 0 8px">Theo người thực hiện (Quyết toán tạm ứng)</h3>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Người</th>
            <th class="num">Đã nhận</th>
            <th class="num">Đã chi</th>
            <th class="num">% tổng chi</th>
            <th class="num">Chờ duyệt</th>
            <th class="num">Còn lại</th>
            <th>Quyết toán</th>
          </tr>
        </thead>
        <tbody>
          ${people.map(e => {
            const mine = all.filter(l => (l.person || '').toLowerCase() === e);
            const r = state.lsum(mine, 'nhan', 'approved');
            const c = state.lsum(mine, 'chi', 'approved');
            const bal = r - c;
            const pd = pendSum(mine);
            return `
              <tr>
                <td><b>${state.esc(state.shortName(e))}</b></td>
                <td class="num">${state.money(r)}</td>
                <td class="num">${state.money(c)}</td>
                <td class="num">${totalChi ? Math.round(c * 100 / totalChi) : 0}%</td>
                <td class="num" style="color:var(--orange)">${pd ? state.money(pd) : ''}</td>
                <td class="num" style="font-weight:700">${state.money(bal)}</td>
                <td class="small" style="font-weight:600">
                  ${bal > 0 ? `Phải nộp hoàn lại ${state.money(bal)}` : bal < 0 ? `Được thanh toán bù ${state.money(-bal)}` : 'Đã cân đối'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td><b>Tổng cộng</b></td>
            <td class="num">${state.money(state.lsum(ap, 'nhan'))}</td>
            <td class="num">${state.money(totalChi)}</td>
            <td class="num">100%</td>
            <td class="num">${state.money(pendSum(all))}</td>
            <td class="num"><b>${state.money(state.lsum(ap, 'nhan') - totalChi)}</b></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // Chi theo danh mục
  const byCat = {};
  ap.filter(l => l.kind !== 'nhan').forEach(l => {
    const c = state.catById(l.categoryId);
    const k = c ? c.name : '(khác)';
    byCat[k] = (byCat[k] || 0) + (+l.amount || 0);
  });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  html += `
    <h3 style="margin:20px 0 8px">Chi theo danh mục</h3>
    <div class="card" style="padding:12px">
      ${catEntries.map(([name, v]) => {
        const pc = totalChi ? (v * 100 / totalChi) : 0;
        return `
          <div class="hbar">
            <span class="hl"><b>${state.esc(name)}</b></span>
            <span class="hb"><i style="width:${pc}%"></i></span>
            <span class="hv">${state.money(v)} <span class="small">(${Math.round(pc)}%)</span></span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  return html;
}

// ==========================================
// 4. MODULE: CHẤM CÔNG & LƯƠNG (LABOR)
// ==========================================
export function renderLabor(p) {
  const pane = document.getElementById('pane2');
  if (!pane) return;

  const curM = moduleState.lmonth || state.curMonth();
  moduleState.lmonth = curM;

  const lsub = moduleState.lsub;
  const numDays = state.monthDays(curM);

  // Month options
  const monthOpts = [];
  const [curY, curMm] = curM.split('-').map(Number);
  for (let i = -2; i <= 6; i++) {
    const d = new Date(curY, curMm - 1 - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthOpts.push(mStr);
  }

  let html = `
    <div class="toolbar" style="margin-top:8px">
      <div class="tabs">
        <button class="tab ${lsub === 'att' ? 'active' : ''}" onclick="window.app.setLaborSubTab('att')">📅 Bảng chấm công</button>
        <button class="tab ${lsub === 'pay' ? 'active' : ''}" onclick="window.app.setLaborSubTab('pay')">💰 Bảng lương & Tạm ứng</button>
        <button class="tab ${lsub === 'wk' ? 'active' : ''}" onclick="window.app.setLaborSubTab('wk')">👷 Danh sách nhân công</button>
      </div>
      <span style="flex:1"></span>
      <span class="small" style="font-weight:600">Tháng:</span>
      <select style="width:auto" onchange="window.app.setLaborMonth(this.value)">
        ${monthOpts.map(m => `<option value="${m}" ${m === curM ? 'selected' : ''}>${state.monthLabel(m)}</option>`).join('')}
      </select>
      ${lsub === 'att' ? `
        <button class="btn ${moduleState.attMode === 'ot' ? 'primary' : ''}" onclick="window.app.toggleAttMode()">
          ${moduleState.attMode === 'ot' ? '⏱ Đang chấm Tăng ca' : 'Chấm Tăng ca (OT)'}
        </button>
        <button class="btn" onclick="window.app.promptAddWorkerToLabor()">+ Thêm người vào bảng</button>
      ` : lsub === 'pay' ? `
        <button class="btn primary" onclick="window.app.openAdvanceModal(null, 'salary')">+ Phiếu tạm ứng</button>
      ` : `
        <button class="btn primary" onclick="window.app.openWorkerModal()">+ Thêm nhân công</button>
      `}
    </div>
  `;

  if (lsub === 'att') {
    // Attendance Matrix
    const rows = state.data.labor.filter(l => l.projectId === p.id && l.month === curM);
    html += `
      <div class="small" style="margin:4px 0 8px;color:var(--text-muted)">
        💡 Bấm vào ô ngày để chấm: <b>1 (công đủ) ➔ ½ (nửa công) ➔ – (nghỉ) ➔ xoá</b>. Bấm vào tiêu đề ngày ở cột trên cùng để chấm nhanh cho cả đội.
      </div>
      <div class="tbl-wrap" style="overflow-x:auto;max-height:600px">
        <table class="att tbl">
          <thead>
            <tr>
              <th class="nm">Họ tên nhân công</th>
              <th style="min-width:60px">Tổ/đội</th>
              ${Array.from({ length: numDays }, (_, i) => {
                const dayNum = i + 1;
                const dStr = `${curM}-${String(dayNum).padStart(2, '0')}`;
                const dow = new Date(dStr + 'T00:00:00').getDay();
                const isSun = dow === 0;
                return `
                  <th class="click ${isSun ? 'wk' : ''}" onclick="window.app.bulkFillDay(${dayNum})" title="Bấm để chấm nhanh ngày ${dayNum}">
                    <div>${dayNum}</div>
                    <div class="dw">${dow === 0 ? 'CN' : `T${dow + 1}`}</div>
                  </th>
                `;
              }).join('')}
              <th class="sum">Công</th>
              <th class="sum">OT</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(l => {
              const w = state.workerById(l.workerId) || { name: l.workerId, team: '' };
              const daysObj = l.days || {};
              const otObj = l.ot || {};
              const totalDays = Object.values(daysObj).reduce((s, v) => s + (Number(v) || 0), 0);
              const totalOt = Object.values(otObj).reduce((s, v) => s + (Number(v) || 0), 0);

              return `
                <tr>
                  <td class="nm">
                    <b>${state.esc(w.name)}</b>
                    <button class="ibtn xs" style="margin-left:4px" onclick="window.app.removeLaborRow('${l.id}')" title="Bỏ khỏi bảng tháng này">✕</button>
                  </td>
                  <td>${state.esc(w.team || '')}</td>
                  ${Array.from({ length: numDays }, (_, i) => {
                    const dayNum = i + 1;
                    const val = daysObj[dayNum];
                    const ot = otObj[dayNum];
                    const txt = val === 1 ? '1' : val === 0.5 ? '½' : val === 0 ? '–' : '';
                    const cls = val === 1 ? 'full' : val === 0.5 ? 'half' : val === 0 ? 'off' : '';
                    return `
                      <td class="c ${cls}" onclick="window.app.cycleAttCell('${l.id}', ${dayNum})">
                        ${txt}${ot ? `<sup>+${ot}</sup>` : ''}
                      </td>
                    `;
                  }).join('')}
                  <td class="sum"><b>${totalDays}</b></td>
                  <td class="sum" style="color:var(--orange)"><b>${totalOt}</b></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (lsub === 'pay') {
    // Payroll & Advances
    const rows = state.data.labor.filter(l => l.projectId === p.id && l.month === curM);
    html += `
      <h3 style="margin:12px 0 6px">Bảng tính lương tháng ${state.monthLabel(curM)}</h3>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Tổ</th>
              <th>Hình thức</th>
              <th class="num">Đơn giá</th>
              <th class="num">Tổng công</th>
              <th class="num">Lương cơ bản</th>
              <th class="num">Phụ cấp</th>
              <th class="num">Thưởng</th>
              <th class="num">Giảm trừ</th>
              <th class="num">Tổng lương</th>
              <th class="num">Đã tạm ứng</th>
              <th class="num">Thực lĩnh</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(l => {
              const w = state.workerById(l.workerId) || { name: l.workerId, team: '' };
              const daysObj = l.days || {};
              const otObj = l.ot || {};
              const totalDays = Object.values(daysObj).reduce((s, v) => s + (Number(v) || 0), 0) + Object.values(otObj).reduce((s, v) => s + (Number(v) || 0), 0);
              const rate = Number(l.rate) || Number(w.rate) || 0;
              const base = Math.round(l.payType === 'month' ? (rate * totalDays / 26) : (rate * totalDays));
              const allow = Number(l.allowance) || 0;
              const bonus = Number(l.bonus) || 0;
              const deduct = Number(l.deduction) || 0;
              const gross = base + allow + bonus - deduct;
              const adv = state.data.advances
                .filter(a => a.projectId === p.id && a.kind === 'salary' && a.refId === l.workerId && a.month === curM)
                .reduce((s, a) => s + (Number(a.amount) || 0), 0);
              const net = gross - adv;

              return `
                <tr>
                  <td><b>${state.esc(w.name)}</b></td>
                  <td>${state.esc(w.team || '')}</td>
                  <td>${l.payType === 'month' ? 'Tháng' : 'Ngày'}</td>
                  <td class="num">${state.money(rate)}</td>
                  <td class="num"><b>${totalDays}</b></td>
                  <td class="num">${state.money(base)}</td>
                  <td class="num">${state.money(allow)}</td>
                  <td class="num">${state.money(bonus)}</td>
                  <td class="num">${state.money(deduct)}</td>
                  <td class="num" style="font-weight:700">${state.money(gross)}</td>
                  <td class="num" style="color:var(--orange)">${state.money(adv)}</td>
                  <td class="num" style="font-weight:700;color:${net < 0 ? 'var(--red)' : 'var(--green)'}">${state.money(net)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <h3 style="margin:20px 0 6px">Danh sách tạm ứng lương trong tháng</h3>
      ${(() => {
        const advs = state.data.advances.filter(a => a.projectId === p.id && a.kind === 'salary' && a.month === curM);
        if (!advs.length) return '<div class="small">Chưa có lần tạm ứng lương nào trong tháng này.</div>';
        return `
          <div class="tbl-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Ngày ứng</th>
                  <th>Người ứng</th>
                  <th class="num">Số tiền</th>
                  <th>Hình thức</th>
                  <th>Người chi</th>
                  <th>Ghi chú</th>
                  <th>Chứng từ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${advs.map(a => `
                  <tr class="click" onclick="window.app.openAdvanceModal('${a.id}', 'salary')">
                    <td>${state.fmtDate(a.date)}</td>
                    <td><b>${state.esc(state.workerName(a.refId))}</b></td>
                    <td class="num" style="font-weight:700;color:var(--orange)">${state.money(a.amount)}</td>
                    <td>${state.esc(a.method || 'Chuyển khoản')}</td>
                    <td>${state.esc(state.shortName(a.payer))}</td>
                    <td>${state.esc(a.note || '')}</td>
                    <td>${(a.files || []).length ? `📎 ${a.files.length}` : ''}</td>
                    <td><button class="ibtn danger" onclick="event.stopPropagation();window.app.deleteAdvance('${a.id}')">✕</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      })()}
    `;
  } else {
    // Workers master list
    const ws = [...state.data.workers].sort((a, b) => String(a.team || '').localeCompare(String(b.team || ''), 'vi') || String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    html += `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Tổ / Đội</th>
              <th>Chức danh</th>
              <th>Điện thoại</th>
              <th>Hình thức</th>
              <th class="num">Đơn giá chuẩn</th>
              <th>Tài khoản ngân hàng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${ws.map(w => `
              <tr class="click" onclick="window.app.openWorkerModal('${w.id}')">
                <td><b>${state.esc(w.name)}</b></td>
                <td>${state.esc(w.team || '')}</td>
                <td>${state.esc(w.job || '')}</td>
                <td>${state.esc(w.phone || '')}</td>
                <td>${w.payType === 'month' ? 'Lương tháng' : 'Lương ngày'}</td>
                <td class="num">${state.money(w.rate)}</td>
                <td style="white-space:normal">${state.esc(w.bank || '')}</td>
                <td>${String(w.active) === 'false' ? '<span class="badge b-gray">Nghỉ</span>' : '<span class="badge b-green">Đang làm</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  pane.innerHTML = html;
}

// ==========================================
// 5. MODULE: HỢP ĐỒNG GIAO KHOÁN (CONTRACTS)
// ==========================================
export function renderContracts(p) {
  const pane = document.getElementById('pane2');
  if (!pane) return;

  const list = state.data.contracts.filter(c => c.projectId === p.id);

  const getContractVals = c => {
    const items = c.items || [];
    const val = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const acc = items.reduce((s, it) => s + (Number(it.accQty) || 0) * (Number(it.price) || 0), 0);
    const adv = state.data.advances
      .filter(a => a.projectId === p.id && a.kind === 'contract' && a.refId === c.id)
      .reduce((s, a) => s + (Number(a.amount) || 0), 0);
    return { val: Math.round(val), acc: Math.round(acc), adv, remain: Math.round(acc) - adv };
  };

  const T = list.reduce((t, c) => {
    const v = getContractVals(c);
    t.val += v.val;
    t.acc += v.acc;
    t.adv += v.adv;
    t.remain += v.remain;
    return t;
  }, { val: 0, acc: 0, adv: 0, remain: 0 });

  let html = `
    <div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));margin:8px 0 12px">
      <div class="card"><div class="v">${state.money(T.val)}</div><div class="l">Giá trị giao khoán (${list.length} đội)</div></div>
      <div class="card"><div class="v">${state.money(T.acc)}</div><div class="l">Đã nghiệm thu (${T.val ? Math.round(T.acc * 100 / T.val) : 0}%)</div></div>
      <div class="card"><div class="v" style="color:var(--orange)">${state.money(T.adv)}</div><div class="l">Đã tạm ứng</div></div>
      <div class="card"><div class="v" style="color:${T.remain < 0 ? 'var(--red)' : 'var(--green)'}">${state.money(T.remain)}</div><div class="l">Còn phải trả (NT − Ứng)</div></div>
    </div>

    <div class="toolbar">
      <span style="flex:1"></span>
      <button class="btn" onclick="window.app.exportContractCsv()">⤓ Xuất CSV</button>
      <button class="btn primary" onclick="window.app.openContractModal()">+ Hợp đồng giao khoán mới</button>
    </div>
  `;

  if (!list.length) {
    html += `<div class="empty">Chưa có tổ đội nhận giao khoán nào.<br><br><button class="btn primary" onclick="window.app.openContractModal()">+ Giao khoán đầu tiên</button></div>`;
  } else {
    html += `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Tổ đội nhận khoán</th>
              <th>Tổ trưởng</th>
              <th class="num">Đầu mục</th>
              <th class="num">Giá trị giao</th>
              <th class="num">Nghiệm thu</th>
              <th>Tiến độ</th>
              <th class="num">Đã ứng</th>
              <th class="num">Còn phải trả</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(c => {
              const v = getContractVals(c);
              const pc = v.val ? Math.round(v.acc * 100 / v.val) : 0;
              return `
                <tr class="click" onclick="window.app.openContractModal('${c.id}')">
                  <td><b>${state.esc(c.team)}</b></td>
                  <td>${state.esc(c.leader || '')} ${c.phone ? `<span class="small">(${state.esc(c.phone)})</span>` : ''}</td>
                  <td class="num">${(c.items || []).length}</td>
                  <td class="num">${state.money(v.val)}</td>
                  <td class="num">${state.money(v.acc)}</td>
                  <td>
                    <span class="bar mini" style="width:70px"><i style="width:${Math.min(100, pc)}%"></i></span>
                    <span class="small">${pc}%</span>
                  </td>
                  <td class="num" style="color:var(--orange)">${v.adv ? state.money(v.adv) : ''}</td>
                  <td class="num" style="font-weight:700;color:${v.remain < 0 ? 'var(--red)' : 'var(--green)'}">
                    ${state.money(v.remain)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td><b>Tổng cộng</b></td>
              <td colspan="2"></td>
              <td class="num">${state.money(T.val)}</td>
              <td class="num">${state.money(T.acc)}</td>
              <td></td>
              <td class="num">${state.money(T.adv)}</td>
              <td class="num"><b>${state.money(T.remain)}</b></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  pane.innerHTML = html;
}

// ==========================================
// 6. MODULE: THIẾT BỊ & IN NHÃN QR (DEVICES)
// ==========================================
export function renderDevices(p) {
  const pane = document.getElementById('pane2');
  if (!pane) return;

  const all = moduleState.devAll ? state.data.devices : state.data.devices.filter(d => d.projectId === p.id);
  const q = (moduleState.devQ || '').toLowerCase().trim();

  const list = all.filter(d => {
    const matchStatus = !moduleState.devStatus || d.status === moduleState.devStatus;
    const matchCat = !moduleState.devCat || d.category === moduleState.devCat;
    const matchFolder = !moduleState.devFolder || d.folderId === moduleState.devFolder;
    const matchQ = !q || [d.serial, d.mac, d.ip, d.model, d.brand, d.location, d.category, d.note].join(' ').toLowerCase().includes(q);
    return matchStatus && matchCat && matchFolder && matchQ;
  });

  const cats = [...new Set(all.map(d => d.category).filter(Boolean))].sort();

  let html = `
    <div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));margin:8px 0 12px">
      <div class="card click" onclick="window.app.setDeviceFilter('status', '')">
        <div class="v">${all.length}</div>
        <div class="l">Tổng thiết bị</div>
      </div>
      ${Object.entries(DSTAT).map(([k, v]) => `
        <div class="card click" onclick="window.app.setDeviceFilter('status', '${k}')">
          <div class="v">${all.filter(d => d.status === k).length}</div>
          <div class="l"><span class="badge ${v[1]}">${v[0]}</span></div>
        </div>
      `).join('')}
    </div>

    <div class="toolbar">
      <input placeholder="🔎 Tìm serial, MAC, IP, model, vị trí…" value="${state.esc(moduleState.devQ)}" oninput="window.app.setDeviceFilter('q', this.value)" style="flex:1;min-width:200px">
      <label class="small row" style="gap:4px">
        <input type="checkbox" ${moduleState.devAll ? 'checked' : ''} onchange="window.app.setDeviceFilter('all', this.checked)"> Tìm toàn bộ dự án
      </label>
      <select style="width:auto" onchange="window.app.setDeviceFilter('status', this.value)">
        <option value="">Mọi trạng thái</option>
        ${Object.entries(DSTAT).map(([k, v]) => `<option value="${k}" ${moduleState.devStatus === k ? 'selected' : ''}>${v[0]}</option>`).join('')}
      </select>
      <select style="width:auto" onchange="window.app.setDeviceFilter('cat', this.value)">
        <option value="">Mọi loại thiết bị</option>
        ${cats.map(c => `<option value="${state.esc(c)}" ${moduleState.devCat === c ? 'selected' : ''}>${state.esc(c)}</option>`).join('')}
      </select>
      <span style="flex:1"></span>
      <button class="btn" onclick="window.app.printQR()">🏷 In tem QR (A4)</button>
      <button class="btn primary" onclick="window.app.openDeviceModal()">+ Thêm thiết bị</button>
    </div>
  `;

  if (!list.length) {
    html += `<div class="empty">Chưa có thiết bị nào khớp bộ lọc.</div>`;
  } else {
    html += `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Loại</th>
              <th>Hãng / Model</th>
              <th>Serial (S/N)</th>
              <th>MAC</th>
              <th>IP</th>
              <th>Vị trí</th>
              <th>Trạng thái</th>
              <th>Bảo hành</th>
              <th>Ảnh</th>
              <th>Tem QR</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((d, i) => {
              const st = DSTAT[d.status] || DSTAT.stock;
              const wl = d.warrantyEnd ? state.daysLeft(d.warrantyEnd) : null;
              return `
                <tr class="click" onclick="window.app.openDeviceModal('${d.id}')">
                  <td>${i + 1}</td>
                  <td><b>${state.esc(d.category || '')}</b></td>
                  <td>${state.esc([d.brand, d.model].filter(Boolean).join(' '))}</td>
                  <td class="mono">${state.esc(d.serial || '')}</td>
                  <td class="mono">${state.esc(d.mac || '')}</td>
                  <td class="mono">${state.esc(d.ip || '')}</td>
                  <td style="white-space:normal">${state.esc(d.location || '')}</td>
                  <td><span class="badge ${st[1]}">${st[0]}</span></td>
                  <td class="small">
                    ${d.warrantyEnd ? (wl < 0 ? '<span class="badge b-red">Hết hạn</span>' : wl <= 60 ? `<span class="badge b-orange">Còn ${wl} ngày</span>` : state.fmtDate(d.warrantyEnd)) : ''}
                  </td>
                  <td>${(d.files || []).length ? `📷 ${d.files.length}` : ''}</td>
                  <td onclick="event.stopPropagation()">
                    <button class="btn" style="padding:2px 8px;font-size:11px" onclick="window.app.printQR('${d.id}')">🏷 Tem</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  pane.innerHTML = html;
}

// Generate QR Code URI using qrcode-generator
export function generateQRDataUrl(text) {
  if (typeof window.qrcode === 'undefined') return '';
  try {
    const q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createDataURL(3, 0);
  } catch (e) {
    console.error('QR Generator Error:', e);
    return '';
  }
}

export function printDeviceQR(singleId) {
  const p = state.projById(state.curProject);
  let list = [];
  if (singleId) {
    list = state.data.devices.filter(d => d.id === singleId);
  } else {
    list = state.data.devices.filter(d => d.projectId === state.curProject);
  }

  if (!list.length) {
    alert('Không có thiết bị nào để in tem.');
    return;
  }

  const printArea = document.getElementById('printArea');
  if (!printArea) return;

  printArea.innerHTML = `
    <div class="qrgrid">
      ${list.map(d => {
        const qrUrl = `${window.location.origin}${window.location.pathname}?device=${encodeURIComponent(d.id)}`;
        const imgUri = generateQRDataUrl(qrUrl);
        return `
          <div class="qrlabel">
            <img src="${imgUri}" alt="QR">
            <div>
              <b>${state.esc([d.category, d.model].filter(Boolean).join(' '))}</b><br>
              SN: ${state.esc(d.serial || '—')}<br>
              ${d.mac ? `MAC: ${state.esc(d.mac)}<br>` : ''}
              ${d.ip ? `IP: ${state.esc(d.ip)}<br>` : ''}
              <span>${state.esc([p ? p.name : '', d.location].filter(Boolean).join(' · '))}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  setTimeout(() => window.print(), 200);
}

// ==========================================
// 7. MODULE: NGHIỆM THU & LỖI TỒN ĐỌNG (QA)
// ==========================================
export function renderQA(p) {
  const pane = document.getElementById('pane2');
  if (!pane) return;

  const qsub = moduleState.qsub;
  const nOpen = state.data.issues.filter(x => x.projectId === p.id && (x.status === 'open' || x.status === 'fixing')).length;

  let html = `
    <div class="toolbar" style="margin-top:8px">
      <div class="tabs">
        <button class="tab ${qsub === 'chk' ? 'active' : ''}" onclick="window.app.setQASubTab('chk')">📝 Biên bản nghiệm thu</button>
        <button class="tab ${qsub === 'iss' ? 'active' : ''}" onclick="window.app.setQASubTab('iss')">
          🔧 Lỗi tồn tại (Punch-list) ${nOpen ? `<span class="badge b-red">${nOpen}</span>` : ''}
        </button>
      </div>
      <span style="flex:1"></span>
      ${qsub === 'chk' ? `
        <button class="btn primary" onclick="window.app.openCheckModal()">+ Lập biên bản nghiệm thu</button>
      ` : `
        <button class="btn primary" onclick="window.app.openIssueModal()">+ Ghi nhận lỗi tồn tại</button>
      `}
    </div>
  `;

  if (qsub === 'chk') {
    const list = state.data.checks.filter(c => c.projectId === p.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!list.length) {
      html += `<div class="empty">Chưa có biên bản nghiệm thu nào.<br><br><button class="btn primary" onclick="window.app.openCheckModal()">+ Tạo biên bản nghiệm thu</button></div>`;
    } else {
      html += `
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Tên biên bản / Đối tượng</th>
                <th>Hạng mục</th>
                <th class="num">Kết quả kiểm tra</th>
                <th>Kết luận</th>
                <th>Tệp đính kèm</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(c => {
                const it = c.items || [];
                const ok = it.filter(x => x.result === 'ok').length;
                const fail = it.filter(x => x.result === 'fail').length;
                const fo = (p.folders || []).find(f => f.id === c.folderId);
                const cc = CONCL[c.conclusion] || ['Chưa kết luận', 'b-gray'];
                return `
                  <tr class="click" onclick="window.app.openCheckModal('${c.id}')">
                    <td>${state.fmtDate(c.date)}</td>
                    <td><b>${state.esc(c.name)}</b></td>
                    <td>${state.esc(fo ? fo.name : '')}</td>
                    <td class="num">
                      <b>${ok}/${it.length} đạt</b>
                      ${fail ? ` · <span style="color:var(--red)">${fail} không đạt</span>` : ''}
                    </td>
                    <td><span class="badge ${cc[1]}">${cc[0]}</span></td>
                    <td>${(c.files || []).length ? `📎 ${c.files.length}` : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  } else {
    const all = state.data.issues.filter(x => x.projectId === p.id);
    const list = all.filter(x => {
      if (moduleState.issStatus === 'live') return x.status !== 'closed';
      return !moduleState.issStatus || x.status === moduleState.issStatus;
    });

    html += `
      <div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));margin:8px 0 12px">
        ${Object.entries(ISS_ST).map(([k, v]) => `
          <div class="card click" onclick="window.app.setIssueStatusFilter('${k}')">
            <div class="v">${all.filter(x => x.status === k).length}</div>
            <div class="l"><span class="badge ${v[1]}">${v[0]}</span></div>
          </div>
        `).join('')}
      </div>
    `;

    if (!list.length) {
      html += `<div class="empty">Không có lỗi tồn tại nào khớp bộ lọc.</div>`;
    } else {
      html += `
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Nội dung lỗi tồn tại</th>
                <th>Vị trí</th>
                <th>Mức độ</th>
                <th>Người xử lý</th>
                <th>Hạn khắc phục</th>
                <th>Trạng thái</th>
                <th>Ảnh trước & sau</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((x, i) => {
                const st = ISS_ST[x.status] || ISS_ST.open;
                const sv = SEV[x.severity] || SEV.med;
                const dl = x.dueDate ? state.daysLeft(x.dueDate) : null;
                const imgs = (x.files || []).filter(f => String(f.mime || '').startsWith('image/'));
                return `
                  <tr class="click" onclick="window.app.openIssueModal('${x.id}')">
                    <td>${i + 1}</td>
                    <td style="white-space:normal;min-width:200px">
                      <b>${state.esc(x.title)}</b>
                      ${x.note ? `<div class="small" style="color:var(--text-muted)">${state.esc(x.note)}</div>` : ''}
                    </td>
                    <td>${state.esc(x.location || '')}</td>
                    <td><span class="badge ${sv[1]}">${sv[0]}</span></td>
                    <td><b>${state.esc(state.shortName(x.assignee))}</b></td>
                    <td>
                      ${state.fmtDate(x.dueDate)}
                      ${dl !== null && dl < 0 ? `<span class="badge b-red">Quá ${-dl} ngày</span>` : ''}
                    </td>
                    <td><span class="badge ${st[1]}">${st[0]}</span></td>
                    <td>${imgs.length ? `📷 ${imgs.length} ảnh` : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  pane.innerHTML = html;
}

// ==========================================
// 8. MODULE: TÀI CHÍNH & BẢO LÃNH (FINANCE)
// ==========================================
export function renderFinance(p) {
  const pane = document.getElementById('pane2');
  if (!pane) return;

  const costs = state.projCosts(p);
  const rev = state.projRevenue(p);
  const cv = Number(p.contractValue) || 0;
  const ret = Number(p.retentionPct) || 5;
  const profit = cv - costs.total;

  const budget = p.budget || {};
  const lines = state.sortedCats('chi').map(cat => ({
    key: cat.id,
    name: cat.name,
    actual: costs.byCat[cat.id] || 0
  }));

  if (costs.labor !== null) lines.push({ key: '__labor', name: '👷 Nhân công (Quỹ lương)', actual: costs.labor });
  if (costs.contract !== null) lines.push({ key: '__contract', name: '🤝 Giao khoán tổ đội', actual: costs.contract });
  lines.push({ key: '__other', name: 'Chi phí dự phòng / khác', actual: 0 });

  const bTotal = lines.reduce((a, l) => a + (Number(budget[l.key]) || 0), 0);

  let html = `
    <div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(190px, 1fr));margin:8px 0 12px">
      <div class="card"><div class="v">${state.money(cv)}</div><div class="l">Giá trị hợp đồng</div></div>
      <div class="card"><div class="v" style="color:var(--green)">${state.money(rev.got)}</div><div class="l">Đã thu từ CĐT (${cv ? Math.round(rev.got * 100 / cv) : 0}%)</div></div>
      <div class="card"><div class="v">${state.money(cv - rev.got)}</div><div class="l">Còn phải thu</div></div>
      <div class="card"><div class="v" style="color:var(--red)">${state.money(costs.total)}</div><div class="l">Chi phí thực tế (${bTotal ? Math.round(costs.total * 100 / bTotal) + '% dự toán' : ''})</div></div>
      <div class="card"><div class="v" style="font-weight:700;color:${profit < 0 ? 'var(--red)' : 'var(--green)'}">${state.money(profit)}</div><div class="l">Lợi nhuận tạm tính</div></div>
    </div>

    <h3 style="margin:16px 0 6px">Giá trị hợp đồng & Giữ lại bảo hành</h3>
    <div class="toolbar" style="gap:12px">
      <span class="small" style="font-weight:600">Giá trị hợp đồng (đ):</span>
      <input class="ninp" style="width:180px" value="${cv ? state.money(cv) : ''}" onchange="window.app.updateProjectFinance('contractValue', this.value)">
      <span class="small" style="font-weight:600">Giữ lại bảo hành (%):</span>
      <input class="ninp" style="width:70px" value="${ret}" onchange="window.app.updateProjectFinance('retentionPct', this.value)">
      <span class="small">= <b>${state.money(cv * ret / 100)}</b></span>
    </div>

    <h3 style="margin:20px 0 6px">Bảng phân bổ Dự toán & Chi phí thực tế</h3>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Khoản mục chi phí</th>
            <th class="num">Dự toán</th>
            <th class="num">Thực chi</th>
            <th class="num">Chênh lệch</th>
            <th>Tỷ lệ sử dụng</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map(l => {
            const b = Number(budget[l.key]) || 0;
            const pc = b ? Math.round(l.actual * 100 / b) : (l.actual ? 100 : 0);
            const over = b && l.actual > b;
            return `
              <tr>
                <td><b>${state.esc(l.name)}</b></td>
                <td class="num">
                  <input class="ninp" style="width:130px" value="${b ? state.money(b) : ''}" onchange="window.app.updateBudgetLine('${l.key}', this.value)">
                </td>
                <td class="num">${state.money(l.actual)}</td>
                <td class="num" style="${over ? 'color:var(--red);font-weight:700' : ''}">${b ? state.money(b - l.actual) : ''}</td>
                <td>
                  ${b ? `
                    <span class="bar mini" style="width:80px"><i style="width:${Math.min(100, pc)}%;background:${over ? 'var(--red)' : pc > 85 ? 'var(--orange)' : 'var(--green)'}"></i></span>
                    <span class="small">${pc}%</span>
                  ` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td><b>Tổng cộng</b></td>
            <td class="num"><b>${state.money(bTotal)}</b></td>
            <td class="num"><b>${state.money(costs.total)}</b></td>
            <td class="num"><b>${bTotal ? state.money(bTotal - costs.total) : ''}</b></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Đợt thanh toán từ CĐT -->
    <div class="proj-row" style="margin:24px 0 8px">
      <h3 style="margin:0;flex:1">Các đợt thanh toán từ Chủ đầu tư</h3>
      <button class="btn primary" onclick="window.app.openReceiptModal()">+ Đợt thanh toán</button>
    </div>
    ${(() => {
      const rec = state.data.receipts.filter(r => r.projectId === p.id);
      if (!rec.length) return '<div class="small">Chưa có đợt thanh toán nào (VD: Tạm ứng 30%, Thanh toán đợt 1, Quyết toán...).</div>';
      return `
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Tên đợt</th>
                <th class="num">Số tiền dự kiến</th>
                <th>Hạn dự kiến</th>
                <th>Trạng thái</th>
                <th>Ngày thực thu</th>
                <th class="num">Thực thu</th>
                <th>Chứng từ</th>
              </tr>
            </thead>
            <tbody>
              ${rec.map(r => {
                const isGot = r.status === 'received';
                return `
                  <tr class="click" onclick="window.app.openReceiptModal('${r.id}')">
                    <td><b>${state.esc(r.name)}</b></td>
                    <td class="num">${state.money(r.amount)}</td>
                    <td>${state.fmtDate(r.plannedDate)}</td>
                    <td>${isGot ? '<span class="badge b-green">Đã thu</span>' : '<span class="badge b-gray">Chưa thu</span>'}</td>
                    <td>${state.fmtDate(r.receivedDate)}</td>
                    <td class="num" style="font-weight:700;color:var(--green)">${isGot ? state.money(r.receivedAmount || r.amount) : ''}</td>
                    <td>${(r.files || []).length ? `📎 ${r.files.length}` : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    })()}

    <!-- Bảo lãnh ngân hàng -->
    <div class="proj-row" style="margin:24px 0 8px">
      <h3 style="margin:0;flex:1">Bảo lãnh ngân hàng</h3>
      <button class="btn primary" onclick="window.app.openGuaranteeModal()">+ Thư bảo lãnh</button>
    </div>
    ${(() => {
      const gs = state.data.guarantees.filter(g => g.projectId === p.id);
      if (!gs.length) return '<div class="small">Chưa có bảo lãnh nào (Bảo lãnh dự thầu, thực hiện hợp đồng, tạm ứng, bảo hành...).</div>';
      return `
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Loại bảo lãnh</th>
                <th>Ngân hàng</th>
                <th>Số thư bảo lãnh</th>
                <th class="num">Giá trị</th>
                <th>Phát hành</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th>Tệp</th>
              </tr>
            </thead>
            <tbody>
              ${gs.map(g => {
                const dl = g.expiryDate ? state.daysLeft(g.expiryDate) : null;
                const st = GSTAT[g.status] || GSTAT.active;
                return `
                  <tr class="click" onclick="window.app.openGuaranteeModal('${g.id}')">
                    <td><b>${state.esc(GTYPES[g.gtype] || GTYPES.other)}</b></td>
                    <td>${state.esc(g.bank || '')}</td>
                    <td class="mono">${state.esc(g.number || '')}</td>
                    <td class="num" style="font-weight:700">${state.money(g.amount)}</td>
                    <td>${state.fmtDate(g.issueDate)}</td>
                    <td>
                      ${state.fmtDate(g.expiryDate)}
                      ${dl !== null && dl <= 30 && g.status !== 'released' ? `
                        <span class="badge ${dl < 0 ? 'b-red' : 'b-orange'}">${dl < 0 ? `Hết hạn ${-dl} ngày` : `Còn ${dl} ngày`}</span>
                      ` : ''}
                    </td>
                    <td><span class="badge ${st[1]}">${st[0]}</span></td>
                    <td>${(g.files || []).length ? `📎 ${g.files.length}` : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    })()}
  `;

  pane.innerHTML = html;
}
