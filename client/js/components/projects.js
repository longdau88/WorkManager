import { state } from '../state.js';
import { CONFIG } from '../config.js';

export function renderProjectsSidebar() {
  const container = document.getElementById('projectsList');
  if (!container) return;

  const all = state.data.tasks;
  const ov = all.filter(t => state.dueState(t) === 'overdue').length;
  const pct = state.avgPct(all);

  const isAllActive = state.curProject === 'all' && state.view === 'tasks';

  let html = `
    <div class="proj-item ${isAllActive ? 'active' : ''}" onclick="window.app.selProject('all')">
      <div class="proj-row">
        <span class="proj-dot" style="background:var(--text-muted)"></span>
        <span class="proj-name">Tất cả công việc</span>
        ${ov ? `<span class="badge b-red">${ov}</span>` : ''}
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="proj-meta">${all.length} việc · ${pct}% hoàn thành</div>
    </div>
  `;

  const sortedProjects = [...state.data.projects].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'vi')
  );

  sortedProjects.forEach(p => {
    const s = state.projStats(p.id);
    const c = state.esc(p.color || CONFIG.DEFAULT_COLOR);
    const isAct = state.curProject === p.id && state.view === 'tasks';

    const warn = s.overdue
      ? `<span class="badge b-red" title="Quá hạn">${s.overdue}</span>`
      : s.soon
      ? `<span class="badge b-orange" title="Sắp hạn">${s.soon}</span>`
      : '';

    html += `
      <div class="proj-item ${isAct ? 'active' : ''}" onclick="window.app.selProject('${p.id}')">
        <div class="proj-row">
          <span class="proj-dot" style="background:${c}"></span>
          <span class="proj-name">${state.esc(p.name)}</span>
          ${warn}
        </div>
        <div class="bar"><i style="width:${s.pct}%;background:${c}"></i></div>
        <div class="proj-meta">${s.done}/${s.n} việc · ${s.pct}%</div>
      </div>
    `;
  });

  html += `
    <div class="proj-item" style="text-align:center;color:var(--pri-500);border-style:dashed;font-weight:600;margin-top:8px" onclick="window.app.openProjectModal()">
      + Dự án mới
    </div>
  `;

  container.innerHTML = html;
}

export function renderProjectHeader() {
  const container = document.getElementById('projectHeader');
  if (!container) return;

  if (state.curProject === 'all') {
    container.innerHTML = '';
    return;
  }

  const p = state.projById(state.curProject);
  if (!p) {
    container.innerHTML = '';
    return;
  }

  const s = state.projStats(p.id);
  const c = state.esc(p.color || CONFIG.DEFAULT_COLOR);

  let dueBadge = '';
  if (p.dueDate) {
    const d = state.daysLeft(p.dueDate);
    dueBadge = (s.pct < 100 && d < 0)
      ? `<span class="badge b-red">⚠ Dự án quá hạn ${-d} ngày</span>`
      : (s.pct < 100 && d <= CONFIG.WARN_DAYS * 2)
      ? `<span class="badge b-orange">Hạn ${state.fmtDate(p.dueDate)} · còn ${d} ngày</span>`
      : `<span class="badge b-gray">Hạn ${state.fmtDate(p.dueDate)}</span>`;
  }

  const fields = [...state.data.fields].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  const chips = fields
    .filter(f => p.info && p.info[f.id] !== undefined && p.info[f.id] !== '')
    .map(f => {
      const v = p.info[f.id];
      const val = f.type === 'number' ? state.fmtNum(v) : f.type === 'date' ? state.fmtDate(v) : state.esc(v);
      return `<span class="ichip"><span class="small" style="color:var(--text-muted)">${state.esc(f.label)}:</span> <b>${val}</b>${f.unit && f.type === 'number' ? ' ' + state.esc(f.unit) : ''}</span>`;
    });

  const filesHtml = (p.files && p.files.length)
    ? `<div class="files" style="margin-top:8px">${p.files.map(f => `
        <div class="file">
          <span class="ficon">📎</span>
          <div class="fbody">
            <a href="${state.esc(f.url)}" target="_blank" rel="noopener">${state.esc(f.name)}</a>
            <span class="small">${f.by ? 'bởi ' + state.esc(state.shortName(f.by)) : ''}</span>
          </div>
        </div>
      `).join('')}</div>`
    : '';

  const isOpen = localStorage.getItem('wm.infoOpen') === 'true';

  container.innerHTML = `
    <div class="phead-card anim-slide-up">
      <div class="proj-row">
        <span class="proj-dot" style="background:${c};width:14px;height:14px"></span>
        <b style="font-size:var(--font-lg);flex:1">${state.esc(p.name)}</b>
        <div style="display:flex;gap:6px">
          <button class="btn" onclick="window.app.openProjectPermissionsModal('${p.id}')" title="Phân quyền tài khoản đối với dự án này">🔒 Phân quyền</button>
          <button class="btn" onclick="window.app.openProjectModal('${p.id}')">✎ Sửa</button>
        </div>
      </div>
      <div class="bar" style="height:8px;margin-top:8px">
        <i style="width:${s.pct}%;background:${c}"></i>
      </div>
      <div class="proj-row" style="flex-wrap:wrap;margin-top:8px;gap:12px">
        <b>${s.pct}% hoàn thành</b>
        <span class="small">${s.done}/${s.n} việc xong</span>
        ${s.overdue ? `<span class="badge b-red">${s.overdue} việc quá hạn</span>` : ''}
        ${dueBadge}
      </div>
      ${(chips.length || p.note || filesHtml) ? `
        <details ${isOpen ? 'open' : ''} ontoggle="localStorage.setItem('wm.infoOpen', this.open)">
          <summary>Thông tin chi tiết dự án${chips.length ? ` (${chips.length})` : ''}${p.files && p.files.length ? ` · 📎${p.files.length}` : ''}</summary>
          ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
          ${p.note ? `<div class="small" style="margin-top:8px;white-space:pre-wrap;color:var(--text-secondary)">${state.esc(p.note)}</div>` : ''}
          ${filesHtml}
        </details>
      ` : ''}
    </div>
  `;
}
