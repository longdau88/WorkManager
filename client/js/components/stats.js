import { state } from '../state.js';
import { CONFIG } from '../config.js';

let lastStatsExportData = [];

export function renderStatsView() {
  const container = document.getElementById('statsContainer');
  if (!container) return;

  const ps = [...state.data.projects].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
  const ts = state.data.tasks;
  const fs = [...state.data.fields].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));

  const numFields = fs.filter(f => f.type === 'number');
  const selFields = fs.filter(f => f.type === 'select');

  const ov = ts.filter(t => state.dueState(t) === 'overdue').length;
  const soon = ts.filter(t => state.dueState(t) === 'soon').length;
  const done = ts.filter(t => t.status === 'done').length;

  const exportRows = [];

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="margin:0">📊 Thống kê & Báo cáo tổng hợp</h2>
      <button class="btn primary" onclick="window.app.exportStatsCsv()">⤓ Xuất file CSV (Excel)</button>
    </div>

    <div class="cards anim-fade-in">
      <div class="card">
        <div class="v">${ps.length}</div>
        <div class="l">Tổng số dự án</div>
      </div>
      <div class="card">
        <div class="v">${ts.length}</div>
        <div class="l">Tổng đầu việc (${done} hoàn thành)</div>
      </div>
      <div class="card">
        <div class="v">${state.avgPct(ts)}%</div>
        <div class="l">Tiến độ chung toàn bộ</div>
      </div>
      <div class="card">
        <div class="v" style="color:var(--danger-main)">${ov}</div>
        <div class="l">Công việc quá hạn</div>
      </div>
      <div class="card">
        <div class="v" style="color:var(--warning-main)">${soon}</div>
        <div class="l">Sắp đến hạn</div>
      </div>
    </div>
  `;

  // Totals for Number Fields
  const totals = {};
  numFields.forEach(f => {
    let sum = 0, cnt = 0;
    ps.forEach(p => {
      const v = Number(p.info && p.info[f.id]);
      if (p.info && p.info[f.id] !== undefined && p.info[f.id] !== '' && !isNaN(v)) {
        sum += v;
        cnt++;
      }
    });
    totals[f.id] = { sum, cnt };
  });

  const numGroups = [];
  numFields.forEach(f => {
    const g = f.group || 'Khác';
    let x = numGroups.find(y => y.name === g);
    if (!x) numGroups.push(x = { name: g, fields: [] });
    x.fields.push(f);
  });

  numGroups.forEach(g => {
    html += `
      <div style="font-weight:700;font-size:var(--font-xs);text-transform:uppercase;color:var(--text-muted);margin:16px 0 8px">Tổng hợp ${state.esc(g.name)}</div>
      <div class="cards">
        ${g.fields.map(f => `
          <div class="card">
            <div class="v">${state.fmtNum(totals[f.id].sum)} <span class="small">${state.esc(f.unit || '')}</span></div>
            <div class="l">${state.esc(f.label)} · ${totals[f.id].cnt} dự án</div>
          </div>
        `).join('')}
      </div>
    `;
  });

  // Table 1: Projects Overview
  const head1 = ['STT', 'Dự án', 'Tiến độ', 'Việc xong/tổng', 'Quá hạn', 'Hạn dự án', ...fs.map(f => f.label + (f.unit ? ` (${f.unit})` : ''))];
  exportRows.push(['TỔNG HỢP DỰ ÁN'], head1);

  html += `
    <div style="font-weight:700;font-size:var(--font-xs);text-transform:uppercase;color:var(--text-muted);margin:20px 0 8px">Bảng 1: Chi tiết từng dự án</div>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Dự án</th>
            <th>Tiến độ</th>
            <th class="num">Việc</th>
            <th class="num">Quá hạn</th>
            <th>Hạn</th>
            ${fs.map(f => `<th class="${f.type === 'number' ? 'num' : ''}">${state.esc(f.label)}${f.unit ? ` (${state.esc(f.unit)})` : ''}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  ps.forEach((p, i) => {
    const s = state.projStats(p.id);
    const c = state.esc(p.color || CONFIG.DEFAULT_COLOR);
    const cell = f => {
      const v = p.info && p.info[f.id];
      if (v === undefined || v === '') return '';
      return f.type === 'number' ? state.fmtNum(v) : f.type === 'date' ? state.fmtDate(v) : state.esc(v);
    };

    html += `
      <tr class="click" onclick="window.app.selProject('${p.id}')">
        <td>${i + 1}</td>
        <td>
          <span class="proj-dot" style="display:inline-block;background:${c};margin-right:6px"></span>
          <b>${state.esc(p.name)}</b>
        </td>
        <td>
          <span class="bar mini" style="width:70px"><i style="width:${s.pct}%;background:${c}"></i></span> ${s.pct}%
        </td>
        <td class="num">${s.done}/${s.n}</td>
        <td class="num" style="${s.overdue ? 'color:var(--danger-main);font-weight:700' : ''}">${s.overdue || ''}</td>
        <td>${state.fmtDate(p.dueDate)}</td>
        ${fs.map(f => `<td class="${f.type === 'number' ? 'num' : ''}">${cell(f)}</td>`).join('')}
      </tr>
    `;

    exportRows.push([
      i + 1,
      p.name,
      `${s.pct}%`,
      `${s.done}/${s.n}`,
      s.overdue || 0,
      state.fmtDate(p.dueDate),
      ...fs.map(f => (p.info && p.info[f.id] !== undefined ? p.info[f.id] : ''))
    ]);
  });

  html += `
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            <td>TỔNG CỘNG</td>
            <td>${state.avgPct(ts)}%</td>
            <td class="num">${done}/${ts.length}</td>
            <td class="num">${ov || ''}</td>
            <td></td>
            ${fs.map(f => `<td class="num">${f.type === 'number' ? state.fmtNum(totals[f.id].sum) : ''}</td>`).join('')}
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // Table 2: Category matrix progress heatmap
  const fnames = [];
  ps.forEach(p => (p.folders || []).forEach(f => {
    const n = f.name.trim();
    if (!fnames.some(x => x.toLowerCase() === n.toLowerCase())) fnames.push(n);
  }));

  if (fnames.length) {
    exportRows.push([], ['TIẾN ĐỘ THEO HẠNG MỤC'], ['Dự án', ...fnames]);
    html += `
      <div style="font-weight:700;font-size:var(--font-xs);text-transform:uppercase;color:var(--text-muted);margin:20px 0 8px">Bảng 2: Ma trận tiến độ theo hạng mục</div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Dự án</th>
              ${fnames.map(n => `<th class="num">${state.esc(n)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    ps.forEach(p => {
      const expRow = [p.name];
      html += `
        <tr class="click" onclick="window.app.selProject('${p.id}')">
          <td><b>${state.esc(p.name)}</b></td>
          ${fnames.map(n => {
            const f = (p.folders || []).find(x => x.name.trim().toLowerCase() === n.toLowerCase());
            if (!f) {
              expRow.push('–');
              return '<td class="num small" style="color:var(--text-muted)">–</td>';
            }
            const tasksInFolder = ts.filter(x => x.projectId === p.id && x.folderId === f.id);
            if (!tasksInFolder.length) {
              expRow.push('·');
              return '<td class="num small" style="color:var(--text-muted)">·</td>';
            }
            const pc = state.avgPct(tasksInFolder);
            expRow.push(`${pc}%`);
            const bg = pc === 100 ? 'rgba(16, 185, 129, 0.15)' : pc >= 50 ? 'rgba(59, 130, 246, 0.15)' : pc > 0 ? 'rgba(245, 158, 11, 0.15)' : 'transparent';
            return `<td class="num" style="background:${bg};font-weight:600">${pc}%</td>`;
          }).join('')}
        </tr>
      `;
      exportRows.push(expRow);
    });

    html += `</tbody></table></div>`;
  }

  // Table 3: Workload by Assignee
  const emails = new Set(ts.map(t => String(t.assignee || '').toLowerCase()).filter(Boolean));
  if (emails.size) {
    exportRows.push([], ['KHỐI LƯỢNG THEO NGƯỜI NHẬN VIỆC'], ['Người nhận', 'Đơn vị', 'Được giao', 'Đang làm', 'Quá hạn', 'Hoàn thành', 'Tiến độ TB']);
    html += `
      <div style="font-weight:700;font-size:var(--font-xs);text-transform:uppercase;color:var(--text-muted);margin:20px 0 8px">Bảng 3: Khối lượng theo người nhận việc</div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Người nhận</th>
              <th>Đơn vị</th>
              <th class="num">Được giao</th>
              <th class="num">Đang làm</th>
              <th class="num">Quá hạn</th>
              <th class="num">Hoàn thành</th>
              <th class="num">Tiến độ TB</th>
            </tr>
          </thead>
          <tbody>
    `;

    [...emails].sort((a, b) => state.shortName(a).localeCompare(state.shortName(b), 'vi')).forEach(e => {
      const my = ts.filter(t => String(t.assignee || '').toLowerCase() === e);
      const m = state.memberBy(e);
      const name = state.shortName(e);
      const unit = m ? (m.unit || '') : '';
      const total = my.length;
      const doing = my.filter(t => t.status === 'doing').length;
      const myOv = my.filter(t => state.dueState(t) === 'overdue').length;
      const myDone = my.filter(t => t.status === 'done').length;
      const avg = state.avgPct(my);

      exportRows.push([name, unit, total, doing, myOv, myDone, `${avg}%`]);

      html += `
        <tr>
          <td><b>${state.esc(name)}</b> <span class="small" style="color:var(--text-muted)">(${state.esc(e)})</span></td>
          <td>${state.esc(unit)}</td>
          <td class="num">${total}</td>
          <td class="num">${doing}</td>
          <td class="num" style="${myOv ? 'color:var(--danger-main);font-weight:700' : ''}">${myOv || ''}</td>
          <td class="num">${myDone}</td>
          <td class="num" style="font-weight:600">${avg}%</td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
  }

  lastStatsExportData = exportRows;
  container.innerHTML = html;
}

export function exportStatsCsv() {
  if (!lastStatsExportData.length) {
    alert('Chưa có dữ liệu để xuất.');
    return;
  }

  const escapeCell = val => {
    let str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = '\uFEFF' + lastStatsExportData.map(row => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bao_cao_WorkManager_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
