import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { api } from '../api.js';

let sortablesInstances = [];

export function renderTasksMain() {
  const container = document.getElementById('tasksContainer');
  if (!container) return;

  const scope = state.curProject === 'all'
    ? state.data.tasks
    : state.data.tasks.filter(t => t.projectId === state.curProject);

  // Render Alert Banner
  const alertEl = document.getElementById('tasksAlert');
  if (alertEl) {
    const ov = scope.filter(t => state.dueState(t) === 'overdue').length;
    const td = scope.filter(t => t.status !== 'done' && state.daysLeft(t.dueDate) === 0).length;
    const mine = scope.filter(t => t.status !== 'done' && String(t.assignee || '').toLowerCase() === apiUserEmail()).length;

    if (ov || td) {
      alertEl.innerHTML = `
        <div class="alert-banner anim-fade-in" onclick="window.app.setFilter('${ov ? 'overdue' : 'soon'}')">
          ⚠ ${ov ? `<b>${ov}</b> việc đã quá hạn` : ''}${ov && td ? ' · ' : ''}${td ? `<b>${td}</b> việc đến hạn hôm nay` : ''}${mine ? ` · bạn đang có <b>${mine}</b> việc được giao` : ''} — bấm để xem danh sách
        </div>
      `;
    } else {
      alertEl.innerHTML = '';
    }
  }

  // Render Filter Tabs with counters
  const tabsEl = document.getElementById('filterTabs');
  if (tabsEl) {
    tabsEl.innerHTML = CONFIG.FILTERS.map(([k, label]) => {
      const count = scope.filter(t => matchFilter(t, k)).length;
      const isActive = state.curFilter === k;
      return `
        <span class="tab ${isActive ? 'active' : ''}" onclick="window.app.setFilter('${k}')">
          ${label}<b>${count}</b>
        </span>
      `;
    }).join('');
  }

  // Render Assignee Filter Dropdown
  renderAssigneeFilter(scope);

  // Filter and Sort Tasks
  const q = state.searchQuery.trim().toLowerCase();
  const sort = state.sortMode;
  const fa = state.assigneeFilter;

  const visibleFilter = t => matchFilter(t, state.curFilter)
    && (!q || (t.title + ' ' + (t.note || '') + ' ' + state.formatAssignees(t.assignee)).toLowerCase().includes(q))
    && (!fa || (fa === '__none' ? !t.assignee : state.getAssignees(t).some(a => a.toLowerCase() === fa)));

  const dragOn = state.curProject !== 'all' && state.curFilter === 'all' && !q && !fa && sort === 'manual' && typeof Sortable !== 'undefined';

  const hintEl = document.getElementById('dragHint');
  if (hintEl) {
    hintEl.textContent = (state.curProject !== 'all' && !dragOn)
      ? 'Kéo thả sắp xếp chỉ bật khi: tab "Tất cả", không tìm kiếm/lọc người, sắp xếp "Thứ tự thực hiện".'
      : (dragOn ? 'Giữ ⋮⋮ để kéo đầu việc lên/xuống hoặc sang hạng mục khác; kéo ⋮⋮ ở tiêu đề để đổi thứ tự hạng mục.' : '');
  }

  if (state.curProject === 'all') {
    const list = sortTasksList(scope.filter(visibleFilter), sort);
    container.innerHTML = list.length
      ? `<div class="tlist anim-fade-in">${list.map(t => taskItemHtml(t, true, false)).join('')}</div>`
      : emptyTasksHtml();
    setupSortables(false);
    return;
  }

  const p = state.projById(state.curProject);
  const folders = p ? (p.folders || []) : [];
  const fids = new Set(folders.map(f => f.id));
  const filtering = state.curFilter !== 'all' || q || fa;

  const groupHtml = (g, idx, isNone) => {
    const all = scope.filter(t => isNone ? !fids.has(t.folderId) : t.folderId === g.id);
    const vis = sortTasksList(all.filter(visibleFilter), sort);
    if (!vis.length && filtering) return '';

    const pct = state.avgPct(all);
    const done = all.filter(t => t.status === 'done').length;
    const key = (p ? p.id : 'proj') + ':' + g.id;
    const col = state.collapsed[key] && !filtering;

    return `
      <div class="group" data-folder="${g.id}">
        <div class="ghead">
          ${dragOn && !isNone ? '<span class="ghandle" title="Kéo để đổi thứ tự hạng mục">⋮⋮</span>' : ''}
          <span class="gtog" onclick="window.app.toggleGroup('${key}')">${col ? '▸' : '▾'}</span>
          <b class="gname" onclick="window.app.toggleGroup('${key}')">${isNone ? '' : (idx + 1) + '. '}${state.esc(g.name)}</b>
          <span class="small" style="color:var(--text-muted)">${done}/${all.length}</span>
          <span class="bar mini"><i style="width:${pct}%"></i></span>
          <span class="small" style="color:var(--text-muted)">${pct}%</span>
          <button class="ibtn" title="Thêm việc vào hạng mục này" onclick="window.app.openTaskModal(null, '${g.id}')" style="margin-left:auto">+</button>
        </div>
        ${col ? '' : `<div class="tlist" data-folder="${g.id}">${vis.map(t => taskItemHtml(t, false, dragOn)).join('')}</div>`}
      </div>
    `;
  };

  let html = '<div id="groupsList">' + folders.map((f, i) => groupHtml(f, i, false)).join('') + '</div>';
  const noneCount = scope.filter(t => !fids.has(t.folderId)).length;
  if (noneCount || !folders.length) {
    html += groupHtml({ id: '__none', name: folders.length ? 'Chưa phân loại' : 'Đầu việc' }, folders.length, true);
  }

  container.innerHTML = html.includes('class="group"') ? html : emptyTasksHtml();
  setupSortables(dragOn);
}

function taskItemHtml(t, showProjectName, canDrag) {
  const p = showProjectName ? state.projById(t.projectId) : null;
  const pg = state.prog(t);
  const done = t.status === 'done';
  const pc = p ? state.esc(p.color || CONFIG.DEFAULT_COLOR) : '';
  const nFiles = (t.files || []).length;

  const canComplete = state.canCompleteTask(t);
  const canEdit = state.canEditTask(t);
  const isViewOnly = !canComplete && !canEdit;

  // Hiển thị danh sách người được giao (1 hoặc nhiều người)
  const assignees = state.getAssignees(t);
  let who = '';
  if (assignees.length) {
    const from = t.assigner && !assignees.some(a => a.toLowerCase() === String(t.assigner).toLowerCase())
      ? state.esc(state.shortName(t.assigner)) + ' → '
      : '';
    const assigneesText = assignees.map(a => state.shortName(a)).join(', ');
    const icon = assignees.length > 1 ? '👥 ' : '';
    const tooltip = `Người giao: ${state.fullName(t.assigner) || t.assigner || '–'}\nNgười nhận (${assignees.length}):\n${assignees.map(a => '• ' + (state.fullName(a) || a)).join('\n')}`;
    who = `<span class="task-who" title="${state.esc(tooltip)}">${from}${icon}<b>${state.esc(assigneesText)}</b></span>`;
  }

  // Hiển thị tiến độ checklist nếu có
  let clHtml = '';
  if (t.checklist && t.checklist.length) {
    const doneCl = t.checklist.filter(c => c.done).length;
    clHtml = `<span class="badge b-gray" style="font-size:11px" title="Checklist: ${doneCl}/${t.checklist.length} bước đã hoàn thành">☑ ${doneCl}/${t.checklist.length}</span>`;
  }

  const pgHtml = done
    ? '<span class="done-badge">✓ Xong</span>'
    : `<span class="task-progress"><span class="bar mini"><i style="width:${pg}%"></i></span>${pg}%</span>`;

  // Checkbox hoàn thành: người được giao HOẶC Admin đều có thể hoàn thành!
  const checkHtml = canComplete
    ? `<input type="checkbox" class="task-check" ${done ? 'checked' : ''} onclick="event.stopPropagation(); window.app.toggleDone('${t.id}')">`
    : `<input type="checkbox" class="task-check task-check-readonly" ${done ? 'checked' : ''} title="Chỉ người được giao việc hoặc Quản trị viên (Admin) mới có quyền hoàn thành công việc này" onclick="event.stopPropagation(); window.app.notifyNotTaskOwner('${t.id}')">`;

  // Huy hiệu chỉ xem nếu người dùng không có quyền sửa lẫn hoàn thành
  const lockBadge = isViewOnly
    ? `<span class="badge b-gray task-readonly-badge" title="Chế độ chỉ xem">👁️ Chỉ xem</span>`
    : '';

  return `
    <div class="task ${state.dueState(t)} ${done ? 'done' : ''} ${isViewOnly ? 'task-readonly-item' : ''}" data-id="${t.id}" onclick="window.app.openTaskModal('${t.id}')">
      ${canDrag && canEdit ? '<span class="handle" onclick="event.stopPropagation()" title="Kéo để sắp xếp">⋮⋮</span>' : ''}
      <span class="task-code">${state.CODE[t.id] || ''}</span>
      ${checkHtml}
      <span class="task-title">
        ${t.priority === 'high' ? '<span class="task-priority-hi" title="Ưu tiên cao">!</span>' : ''}
        ${state.esc(t.title)}
      </span>
      <span class="task-meta">
        ${p ? `<span class="badge" style="background:${pc}22;color:${pc};border-color:${pc}44">${state.esc(p.name)}</span>` : ''}
        ${who}
        ${clHtml}
        ${lockBadge}
        <span class="due">${state.dueLabel(t)}</span>
        ${nFiles ? `<span class="small" title="${nFiles} tệp đính kèm">📎${nFiles}</span>` : ''}
        ${t.note ? '<span class="small" title="Có ghi chú">📝</span>' : ''}
        ${pgHtml}
        <button type="button" class="btn-task-updates" onclick="event.stopPropagation(); window.app.openTaskUpdatesModal('${t.id}')" title="Xem tiến độ, ghi chú, ảnh và tệp do thành viên làm việc cập nhật">
          📊 Xem cập nhật
        </button>
      </span>
    </div>
  `;
}

function emptyTasksHtml() {
  return `
    <div class="empty-state anim-fade-in">
      <div class="empty-state-icon">📝</div>
      <div>Không có công việc nào phù hợp.</div>
      <button class="btn primary" onclick="window.app.openTaskModal()" style="margin-top:12px">+ Thêm công việc mới</button>
    </div>
  `;
}

function matchFilter(t, filterKey) {
  if (filterKey === 'all') return true;
  if (filterKey === 'mine') return state.isTaskAssignee(t);
  if (filterKey === 'done') return t.status === 'done';
  if (filterKey === 'doing') return t.status === 'doing';
  return state.dueState(t) === filterKey;
}

function sortTasksList(list, sortMode) {
  const cmpDue = (a, b) => {
    const x = a.dueDate || '9999', y = b.dueDate || '9999';
    return x < y ? -1 : x > y ? 1 : 0;
  };
  const man = (a, b) => (state.ORD[a.id] ?? 0) - (state.ORD[b.id] ?? 0);

  return [...list].sort((a, b) => {
    if (sortMode === 'manual') return man(a, b);
    if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
    if (sortMode === 'priority') {
      const pwA = CONFIG.PRIORITY_WEIGHTS[a.priority] ?? 1;
      const pwB = CONFIG.PRIORITY_WEIGHTS[b.priority] ?? 1;
      return pwA - pwB || cmpDue(a, b);
    }
    if (sortMode === 'updated') return (b.updatedAt || 0) - (a.updatedAt || 0);
    return cmpDue(a, b) || man(a, b);
  });
}

function renderAssigneeFilter(scope) {
  const sel = document.getElementById('assigneeFilter');
  if (!sel) return;
  const currentVal = sel.value;
  const emails = new Set();
  scope.forEach(t => state.getAssignees(t).forEach(e => emails.add(e.toLowerCase())));
  (state.data.users || []).forEach(u => u.email && emails.add(String(u.email).toLowerCase()));

  const options = [
    '<option value="">👤 Mọi người nhận</option>',
    '<option value="__none">Chưa giao</option>'
  ];

  [...emails].sort((a, b) => state.shortName(a).localeCompare(state.shortName(b), 'vi')).forEach(e => {
    options.push(`<option value="${state.esc(e)}">${state.esc(state.shortName(e))}</option>`);
  });

  sel.innerHTML = options.join('');
  if ([...sel.options].some(o => o.value === currentVal)) {
    sel.value = currentVal;
  }
}

function setupSortables(enable) {
  sortablesInstances.forEach(s => {
    try { s.destroy(); } catch (e) {}
  });
  sortablesInstances = [];

  if (!enable || typeof Sortable === 'undefined') return;

  document.querySelectorAll('.tlist').forEach(el => {
    sortablesInstances.push(Sortable.create(el, {
      group: 'tasks',
      handle: '.handle',
      draggable: '.task',
      animation: 150,
      onEnd: () => {
        const recs = [];
        document.querySelectorAll('.tlist').forEach(list => {
          const fid = list.dataset.folder === '__none' ? '' : list.dataset.folder;
          [...list.querySelectorAll('.task')].forEach((itemEl, i) => {
            const t = state.taskById(itemEl.dataset.id);
            if (!t) return;
            const newSort = (i + 1) * 10;
            const curFid = (state.projById(t.projectId)?.folders || []).some(f => f.id === t.folderId) ? t.folderId : '';
            if (Number(t.sort) !== newSort || curFid !== fid) {
              recs.push({ ...t, sort: newSort, folderId: fid });
            }
          });
        });
        if (recs.length) state.commitMany('task', recs);
      }
    }));
  });

  const groupsEl = document.getElementById('groupsList');
  if (groupsEl) {
    sortablesInstances.push(Sortable.create(groupsEl, {
      handle: '.ghandle',
      draggable: '.group',
      animation: 150,
      onEnd: () => {
        const p = state.projById(state.curProject);
        if (!p) return;
        const ids = [...groupsEl.children].map(e => e.dataset.folder);
        const nf = ids.map(id => p.folders.find(f => f.id === id)).filter(Boolean);
        p.folders.forEach(f => { if (!nf.includes(f)) nf.push(f); });
        state.commit('project', { ...p, folders: nf });
      }
    }));
  }
}

function apiUserEmail() {
  return String(api.userEmail || localStorage.getItem('wm.userEmail') || '').toLowerCase();
}
