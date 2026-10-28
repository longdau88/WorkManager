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

export function mapEmbed(url) {
  if (!url) return '';
  const s = String(url).trim();
  // If user pasted full iframe tag: <iframe src="..." ...>
  const srcMatch = s.match(/src=["']([^"']+)["']/i);
  const target = srcMatch ? srcMatch[1] : s;
  // Match mid parameter in Google My Maps
  const midMatch = target.match(/google\.[a-z.]+\/maps\/d\/(?:u\/\d+\/)?(?:viewer|edit|embed)\?[^#]*?\bmid=([\w-]+)/i);
  if (midMatch) {
    return `https://www.google.com/maps/d/embed?mid=${midMatch[1]}`;
  }
  if (/google\.[a-z.]+\/maps\/embed/i.test(target)) {
    return target;
  }
  if (/google\.[a-z.]+\/maps/i.test(target) && target.includes('mid=')) {
    const m = target.match(/mid=([\w-]+)/);
    if (m) return `https://www.google.com/maps/d/embed?mid=${m[1]}`;
  }
  return target.startsWith('http') ? target : '';
}

export function mapExternalUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  const srcMatch = s.match(/src=["']([^"']+)["']/i);
  const target = srcMatch ? srcMatch[1] : s;
  const midMatch = target.match(/google\.[a-z.]+\/maps\/d\/(?:u\/\d+\/)?(?:viewer|edit|embed)\?[^#]*?\bmid=([\w-]+)/i);
  if (midMatch) {
    return `https://www.google.com/maps/d/viewer?mid=${midMatch[1]}`;
  }
  return target.startsWith('http') ? target : '';
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
  const canManage = state.canManageProject(p);

  let dueBadge = '';
  if (p.dueDate) {
    const d = state.daysLeft(p.dueDate);
    dueBadge = (s.pct < 100 && d < 0)
      ? `<span class="badge b-red">⚠ Dự án quá hạn ${-d} ngày</span>`
      : (s.pct < 100 && d <= CONFIG.WARN_DAYS * 2)
        ? `<span class="badge b-orange">Hạn ${state.fmtDate(p.dueDate)} · còn ${d} ngày</span>`
        : `<span class="badge b-gray">Hạn ${state.fmtDate(p.dueDate)}</span>`;
  }

  // Map Detection (via p.mapUrl, p.info.f_map, or any field with type 'map')
  let rawMapUrl = p.mapUrl || (p.info && p.info.f_map) || '';
  if (!rawMapUrl && p.info) {
    const mapField = state.data.fields.find(f => f.type === 'map');
    if (mapField && p.info[mapField.id]) rawMapUrl = p.info[mapField.id];
  }
  const embedUrl = mapEmbed(rawMapUrl);
  const extUrl = mapExternalUrl(rawMapUrl);

  const mapStorageKey = 'wm.mapOpen_' + p.id;
  const isMapOpen = localStorage.getItem(mapStorageKey) !== 'false';

  const netlabBtnHtml = `
    <button type="button" class="btn btn-netlab-link" onclick="window.app.openNetlab('${p.id}')" title="Mở sơ đồ thiết kế mạng & thiết bị NetLab của dự án này">
      🌐 Sơ đồ mạng NetLab
    </button>
  `;

  let mapToolbarHtml = '';
  let mapBoxHtml = '';
  if (embedUrl) {
    mapToolbarHtml = `
      <div class="project-map-toolbar">
        <a class="btn btn-map-link" href="${state.esc(extUrl)}" target="_blank" rel="noopener" title="Mở bản đồ vị trí trong tab mới">
          📍 Bản đồ vị trí (My Maps)
        </a>
        <button type="button" class="btn btn-map-toggle" onclick="window.app.toggleProjectMap('${p.id}')" title="Ẩn/hiện bản đồ">
          ${isMapOpen ? '▾ Ẩn bản đồ' : '🗺 Xem nhanh'}
        </button>
        ${netlabBtnHtml}
      </div>
    `;
    if (isMapOpen) {
      mapBoxHtml = `
        <div class="mapbox anim-fade-in">
          <iframe src="${state.esc(embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        </div>
      `;
    }
  } else {
    mapToolbarHtml = `
      <div class="project-map-toolbar">
        ${canManage ? `
          <button type="button" class="btn ghost btn-add-map-quick" onclick="window.app.openProjectModal('${p.id}', 'p_mapUrl')" title="Nhúng Google My Maps vào dự án này">
            📍 + Thêm bản đồ vị trí (My Maps)
          </button>
        ` : ''}
        ${netlabBtnHtml}
      </div>
    `;
  }

  const fields = [...state.data.fields].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  const chips = fields
    .filter(f => f.type !== 'map' && f.type !== 'link' && p.info && p.info[f.id] !== undefined && p.info[f.id] !== '')
    .map(f => {
      const v = p.info[f.id];
      const val = f.type === 'number' ? state.fmtNum(v) : f.type === 'date' ? state.fmtDate(v) : state.esc(v);
      return `<span class="ichip"><span class="small" style="color:var(--text-muted)">${state.esc(f.label)}:</span> <b>${val}</b>${f.unit && f.type === 'number' ? ' ' + state.esc(f.unit) : ''}</span>`;
    });

  const filesHtml = (p.files && p.files.length)
    ? `<div class="files" style="margin-top:10px">${p.files.map(f => `
        <div class="file">
          <span class="ficon">📎</span>
          <div class="fbody">
            <a href="${state.esc(f.url)}" target="_blank" rel="noopener">${state.esc(f.name)}</a>
            <span class="small">${f.by ? 'bởi ' + state.esc(state.shortName(f.by)) : ''}</span>
          </div>
        </div>
      `).join('')}</div>`
    : '';

  const isOpen = localStorage.getItem('wm.infoOpen') !== 'false';

  // Thống kê thành viên tham gia triển khai dự án
  const projTasks = state.data.tasks.filter(t => t.projectId === p.id);
  const memberMap = new Map();

  // 1. Từ phân quyền dự án (projectPermissions)
  (p.projectPermissions || []).forEach(pp => {
    if (pp.access && pp.access !== 'none') {
      const u = (state.data.users || []).find(x => x.id === pp.userId);
      const email = u ? u.email : pp.userId;
      if (email) {
        memberMap.set(String(email).toLowerCase(), {
          email: String(email).toLowerCase(),
          name: u ? (u.fullName || u.username) : email,
          access: pp.access,
          tasksCount: 0,
          tasksDone: 0
        });
      }
    }
  });

  // 2. Từ các đầu việc đã giao (task assignees)
  projTasks.forEach(t => {
    if (t.assignee) {
      const em = String(t.assignee).toLowerCase();
      let m = memberMap.get(em);
      if (!m) {
        const u = state.memberBy(em);
        m = {
          email: em,
          name: u ? (u.fullName || u.name || em) : state.shortName(em),
          access: 'member',
          tasksCount: 0,
          tasksDone: 0
        };
        memberMap.set(em, m);
      }
      m.tasksCount++;
      if (t.status === 'done') m.tasksDone++;
    }
  });

  const memberList = Array.from(memberMap.values());
  const curFilterAssignee = (state.assigneeFilter || '').toLowerCase();

  const membersHtml = `
    <div class="project-members-bar">
      <span class="project-members-label">👥 Thành viên triển khai (${memberList.length}):</span>
      <div class="project-members-chips">
        ${memberList.map(m => {
    const isAct = curFilterAssignee === m.email;
    const pct = m.tasksCount ? Math.round((m.tasksDone / m.tasksCount) * 100) : 0;
    return `
            <span class="project-member-chip ${isAct ? 'active' : ''}" onclick="window.app.setAssigneeFilter('${isAct ? '' : state.esc(m.email)}')" title="Lọc theo ${state.esc(m.name)} (${m.tasksDone}/${m.tasksCount} việc hoàn thành)">
              👤 <b>${state.esc(m.name)}</b>
              <span class="chip-progress">${m.tasksCount ? `${m.tasksDone}/${m.tasksCount} (${pct}%)` : 'Chưa giao việc'}</span>
            </span>
          `;
  }).join('')}
        ${canManage ? `
          <button class="btn ghost" style="padding:2px 8px;font-size:11px;color:var(--pri-500)" onclick="window.app.openProjectPermissionsModal('${p.id}')" title="Thêm / Phân quyền tài khoản tham gia triển khai dự án">
            + Phân quyền tài khoản
          </button>
        ` : ''}
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="phead-card anim-slide-up">
      <div class="proj-row">
        <span class="proj-dot" style="background:${c};width:14px;height:14px"></span>
        <b style="font-size:var(--font-lg);flex:1">
          ${p.visibility === 'restricted' ? '🔒 ' : ''}${state.esc(p.name)}
        </b>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="badge ${canManage ? 'b-blue' : 'b-gray'}" style="font-size:11px">
            ${canManage ? 'Được sửa' : 'Chỉ xem'}
          </span>
          <button class="btn" onclick="window.app.openProjectModal('${p.id}')">${canManage ? '✎ Sửa' : 'Xem'}</button>
          <button class="btn" onclick="window.app.openReportExportModal('${p.id}')" title="Xuất báo cáo của dự án này">📊 Xuất báo cáo</button>
          ${canManage ? `
            <button class="btn primary" onclick="window.app.openTaskModal(null, null)" title="Tạo và giao việc mới trong dự án này">+ Giao việc</button>
            <button class="btn" onclick="window.app.openProjectPermissionsModal('${p.id}')" title="Phân quyền tài khoản đối với dự án này">👥 Phân quyền</button>
          ` : ''}
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

      ${mapToolbarHtml}
      ${mapBoxHtml}

      ${membersHtml}

      ${(chips.length || p.note || filesHtml) ? `
        <details class="project-info-details" ${isOpen ? 'open' : ''} ontoggle="localStorage.setItem('wm.infoOpen', this.open)">
          <summary class="project-info-summary">
            ▾ Thông tin dự án${chips.length ? ` (${chips.length})` : ''}${p.files && p.files.length ? ` · 📎${p.files.length}` : ''}
          </summary>
          ${chips.length ? `<div class="chips project-info-chips">${chips.join('')}</div>` : ''}
          ${p.note ? `<div class="project-info-note">${state.esc(p.note)}</div>` : ''}
          ${filesHtml}
        </details>
      ` : ''}
    </div>
  `;
}
