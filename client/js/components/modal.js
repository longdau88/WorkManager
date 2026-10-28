import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { api } from '../api.js';

let editTaskId = null;
let editProjId = null;
let editMemberId = null;
let selColor = CONFIG.DEFAULT_COLOR;
let draftFolders = [];
let taskFileCtx = { files: [], added: [], removed: [] };
let projFileCtx = { files: [], added: [], removed: [] };
let draftAssignees = [];
let draftChecklist = [];
let canUserEditTask = true;
let canUserCompleteTask = true;
let canUserDeleteTask = true;
let isCurrentTaskReadOnly = false;

export const modals = {
  // ================= TASK MODAL =================
  openTask(id, folderId) {
    editTaskId = id || null;
    const t = id ? state.taskById(id) : null;

    if (!t) {
      canUserEditTask = true;
      canUserCompleteTask = true;
      canUserDeleteTask = false;
      isCurrentTaskReadOnly = false;
      draftAssignees = [];
      draftChecklist = [];
    } else {
      canUserEditTask = state.canEditTask(t);
      canUserCompleteTask = state.canCompleteTask(t);
      canUserDeleteTask = state.canDeleteTask(t);
      isCurrentTaskReadOnly = !canUserEditTask && !canUserCompleteTask;
      draftAssignees = state.getAssignees(t);
      draftChecklist = Array.isArray(t.checklist) ? JSON.parse(JSON.stringify(t.checklist)) : [];
    }

    // Fill Projects dropdown
    const projSel = document.getElementById('t_project');
    const sortedProjects = [...state.data.projects].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    projSel.innerHTML = '<option value="">— Không thuộc dự án —</option>' +
      sortedProjects.map(p => `<option value="${p.id}">${state.esc(p.name)}</option>`).join('');

    const targetProjId = t ? (t.projectId || '') : (state.curProject === 'all' ? '' : state.curProject);
    projSel.value = targetProjId;

    this.fillFolders(t ? t.folderId : (folderId && folderId !== '__none' ? folderId : ''));

    // Fill Assigner
    const userList = (state.data.users || []).filter(u => u.isActive !== false);
    const userEmail = api.userEmail;
    const meOpt = userEmail && !state.memberBy(userEmail) ? `<option value="${state.esc(userEmail)}">Tôi (${state.esc(userEmail)})</option>` : '';

    const renderUserOption = u => {
      const displayName = u.fullName ? `${u.fullName} (${u.username})` : u.username;
      const unitStr = u.unit ? ` – ${u.unit}` : '';
      return `<option value="${state.esc(String(u.email).toLowerCase())}">${state.esc(displayName + unitStr)}</option>`;
    };
    const userOpts = userList.map(renderUserOption).join('');

    const assignerSel = document.getElementById('t_assigner');
    assignerSel.innerHTML = '<option value="">— Người giao —</option>' + meOpt + userOpts;
    ensureSelectOption(assignerSel, t && t.assigner);
    assignerSel.value = t ? (t.assigner || '') : (userEmail || '');

    // Render Assignees chips and picker
    this.renderAssignees();

    // Populate Fields
    document.getElementById('t_title').value = t ? t.title : '';
    document.getElementById('t_status').value = t ? (t.status || 'todo') : 'todo';
    document.getElementById('t_priority').value = t ? (t.priority || 'med') : 'med';
    document.getElementById('t_start').value = t ? (t.startDate || '') : state.todayStr();
    document.getElementById('t_due').value = t ? (t.dueDate || '') : '';

    const progVal = t ? state.prog(t) : 0;
    document.getElementById('t_progress').value = progVal;
    document.getElementById('t_note').value = t ? (t.note || '') : '';

    // Files
    taskFileCtx = { files: t ? [...(t.files || [])] : [], added: [], removed: [] };
    this.renderTaskFiles();

    // Render detailed progress card & checklist
    this.renderChecklist();
    this.syncProgressDisplay();

    // Notice banner
    const noticeEl = document.getElementById('taskReadOnlyNotice');
    if (noticeEl) {
      if (isCurrentTaskReadOnly) {
        const assigneesStr = state.formatAssignees(t.assignee) || 'chưa giao';
        noticeEl.innerHTML = `
          <div class="readonly-icon">👁️</div>
          <div class="readonly-text">
            <b>Chế độ xem chi tiết tiến độ (Chỉ xem)</b>
            <div class="readonly-sub">Công việc này được giao cho: <b>${state.esc(assigneesStr)}</b>. Bạn có thể theo dõi tiến độ chi tiết và danh sách checklist, nhưng <u>không thể chỉnh sửa</u> hoặc can thiệp vào công việc của người khác.</div>
          </div>
        `;
        noticeEl.style.display = 'flex';
      } else if (t && canUserCompleteTask && !canUserEditTask) {
        noticeEl.innerHTML = `
          <div class="readonly-icon" style="color:var(--pri-500)">📋</div>
          <div class="readonly-text">
            <b>Bạn là thành viên được giao thực hiện công việc này</b>
            <div class="readonly-sub">Bạn có quyền đánh dấu hoàn thành các bước checklist, điều chỉnh tỷ lệ hoàn thành (%) và đánh dấu hoàn tất công việc.</div>
          </div>
        `;
        noticeEl.style.display = 'flex';
      } else {
        noticeEl.style.display = 'none';
        noticeEl.innerHTML = '';
      }
    }

    // Toggle disabled state on inputs based on granular permissions
    // 1. Structure / Info inputs: only editable if canUserEditTask
    const structureInputIds = ['t_title', 't_project', 't_folder', 't_assigner', 't_priority', 't_start', 't_due'];
    structureInputIds.forEach(fid => {
      const el = document.getElementById(fid);
      if (el) el.disabled = !canUserEditTask;
    });

    const assigneePickerRow = document.querySelector('.assignee-picker-row');
    if (assigneePickerRow) assigneePickerRow.style.display = canUserEditTask ? 'flex' : 'none';

    // 2. Progress / Completion inputs: editable if canUserCompleteTask or canUserEditTask
    const canTouchProgress = canUserCompleteTask || canUserEditTask;
    const progressInputEl = document.getElementById('t_progress');
    if (progressInputEl) progressInputEl.disabled = !canTouchProgress;

    const statusSelEl = document.getElementById('t_status');
    if (statusSelEl) statusSelEl.disabled = !canTouchProgress;

    const quickBtnsEl = document.getElementById('t_prog_quick_btns');
    if (quickBtnsEl) quickBtnsEl.style.display = canTouchProgress ? 'flex' : 'none';

    const addChecklistBtn = document.getElementById('btnAddChecklistBtn');
    if (addChecklistBtn) addChecklistBtn.style.display = canTouchProgress ? '' : 'none';
    const addChecklistWrap = document.getElementById('t_checklist_add_wrap');
    if (addChecklistWrap) addChecklistWrap.style.display = canTouchProgress ? 'flex' : 'none';
    const newChecklistInput = document.getElementById('t_new_checklist_title');
    if (newChecklistInput) newChecklistInput.value = '';

    // Note is editable if canTouchProgress
    const noteEl = document.getElementById('t_note');
    if (noteEl) noteEl.disabled = !canTouchProgress;

    // Attachments upload is available if canTouchProgress
    const uploadWrap = document.getElementById('t_upload_wrap');
    if (uploadWrap) uploadWrap.style.display = canTouchProgress ? 'flex' : 'none';

    // Save button: visible if user can edit or complete/update progress
    const btnSaveTaskEl = document.getElementById('btnSaveTask');
    if (btnSaveTaskEl) btnSaveTaskEl.style.display = canTouchProgress ? '' : 'none';

    // Delete button: visible only if canUserDeleteTask
    const btnDeleteTaskEl = document.getElementById('btnDeleteTask');
    if (btnDeleteTaskEl) btnDeleteTaskEl.style.display = (t && canUserDeleteTask) ? '' : 'none';

    // Title & Permission Badges
    const titleEl = document.getElementById('taskModalTitle');
    if (t) {
      let badge = '';
      if (isCurrentTaskReadOnly) {
        badge = '<span class="badge b-gray" style="font-size:11px;margin-left:6px;vertical-align:middle">👁️ Chỉ xem</span>';
      } else if (canUserEditTask) {
        badge = '<span class="badge b-blue" style="font-size:11px;margin-left:6px;vertical-align:middle">✏️ Có quyền sửa</span>';
      } else if (canUserCompleteTask) {
        badge = '<span class="badge b-green" style="font-size:11px;margin-left:6px;vertical-align:middle">✓ Người thực hiện</span>';
      }
      titleEl.innerHTML = `Đầu việc ${state.CODE[t.id] || ''} ${badge}`;
    } else {
      titleEl.textContent = 'Đầu việc mới';
    }

    openModalEl('modalTask');
    if (!t) setTimeout(() => document.getElementById('t_title').focus(), 50);
  },

  renderAssignees() {
    const container = document.getElementById('t_assignees_selected');
    const hiddenInput = document.getElementById('t_assignee');
    const pickerSel = document.getElementById('t_assignee_picker');

    if (hiddenInput) {
      hiddenInput.value = draftAssignees.join(', ');
    }

    if (container) {
      if (!draftAssignees.length) {
        container.innerHTML = '<span class="small" style="color:var(--text-muted);font-style:italic">Chưa có người nhận việc (công việc chung)</span>';
      } else {
        container.innerHTML = draftAssignees.map((email, idx) => {
          const u = state.memberBy(email);
          const name = u ? (u.fullName || u.name) : state.shortName(email);
          const initials = (name || email).split(' ').filter(Boolean).map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';
          const removeBtn = canUserEditTask
            ? `<button type="button" class="chip-remove" onclick="window.app.removeAssignee(${idx})" title="Gỡ người này">✕</button>`
            : '';
          return `
            <span class="assignee-chip" title="${state.esc(email)}">
              <span class="chip-avatar">${state.esc(initials)}</span>
              <span class="chip-name">${state.esc(name)}</span>
              ${removeBtn}
            </span>
          `;
        }).join('');
      }
    }

    // Populate picker dropdown excluding already selected assignees
    if (pickerSel) {
      const selectedSet = new Set(draftAssignees.map(e => e.toLowerCase()));
      const userList = (state.data.users || []).filter(u => u.isActive !== false && !selectedSet.has(String(u.email || '').toLowerCase()));

      const projId = document.getElementById('t_project') ? document.getElementById('t_project').value : '';
      const proj = state.projById(projId);
      const projMemberUserIds = new Set();
      if (proj && Array.isArray(proj.projectPermissions)) {
        proj.projectPermissions.forEach(pp => {
          if (pp.access && pp.access !== 'none') projMemberUserIds.add(pp.userId);
        });
      }

      const renderOpt = u => {
        const displayName = u.fullName ? `${u.fullName} (${u.username})` : u.username;
        const unitStr = u.unit ? ` – ${u.unit}` : '';
        return `<option value="${state.esc(String(u.email).toLowerCase())}">${state.esc(displayName + unitStr)}</option>`;
      };

      let html = '<option value="">+ Thêm người nhận việc…</option>';
      if (proj && projMemberUserIds.size > 0) {
        const inProj = userList.filter(u => projMemberUserIds.has(u.id));
        const notInProj = userList.filter(u => !projMemberUserIds.has(u.id));
        if (inProj.length) {
          html += `<optgroup label="Thành viên triển khai dự án (${inProj.length})">${inProj.map(renderOpt).join('')}</optgroup>`;
        }
        if (notInProj.length) {
          html += `<optgroup label="Tài khoản khác (${notInProj.length})">${notInProj.map(renderOpt).join('')}</optgroup>`;
        }
      } else {
        html += userList.map(renderOpt).join('');
      }
      pickerSel.innerHTML = html;
      pickerSel.value = '';
    }
  },

  addAssigneeFromPicker(val) {
    if (!canUserEditTask || !val) return;
    const lower = val.trim().toLowerCase();
    if (!draftAssignees.some(e => e.toLowerCase() === lower)) {
      draftAssignees.push(lower);
      this.renderAssignees();
    }
  },

  removeAssignee(index) {
    if (!canUserEditTask) return;
    if (index >= 0 && index < draftAssignees.length) {
      draftAssignees.splice(index, 1);
      this.renderAssignees();
    }
  },

  syncProgressDisplay() {
    const progEl = document.getElementById('t_progress');
    const val = progEl ? +progEl.value : 0;

    const valEl = document.getElementById('t_progress_val');
    if (valEl) valEl.textContent = val + '%';

    const barFillEl = document.getElementById('t_progress_bar_fill');
    if (barFillEl) barFillEl.style.width = Math.min(100, Math.max(0, val)) + '%';

    const tagEl = document.getElementById('t_prog_status_tag');
    if (tagEl) {
      if (val === 100) {
        tagEl.className = 'prog-status-tag tag-done';
        tagEl.textContent = '✓ Đã hoàn thành';
      } else if (val > 0) {
        tagEl.className = 'prog-status-tag tag-doing';
        tagEl.textContent = `⚡ Đang làm (${val}%)`;
      } else {
        tagEl.className = 'prog-status-tag tag-todo';
        tagEl.textContent = '⏳ Chưa bắt đầu';
      }
    }

    const summaryEl = document.getElementById('t_prog_summary_text');
    if (summaryEl) {
      const total = draftChecklist.length;
      const done = draftChecklist.filter(c => c.done).length;
      if (total > 0) {
        const pct = Math.round((done / total) * 100);
        summaryEl.textContent = `${done}/${total} bước checklist hoàn thành (${pct}%)`;
      } else {
        summaryEl.textContent = val === 100 ? 'Công việc đã hoàn thành 100%' : (val > 0 ? `Tiến độ hiện tại: ${val}%` : 'Chưa có bước thực hiện cụ thể');
      }
    }
  },

  renderChecklist() {
    const container = document.getElementById('t_checklist_list');
    const countBadge = document.getElementById('t_checklist_count');
    const canTouch = canUserCompleteTask || canUserEditTask;

    const total = draftChecklist.length;
    const done = draftChecklist.filter(c => c.done).length;

    if (countBadge) {
      countBadge.textContent = `${done}/${total}`;
      countBadge.className = `badge ${total > 0 && done === total ? 'b-green' : 'b-gray'}`;
    }

    if (container) {
      if (!total) {
        container.innerHTML = `<div class="checklist-empty">Chưa có bước thực hiện cụ thể nào. ${canTouch ? 'Bấm <b>+ Thêm bước thực hiện</b> để phân rã công việc chi tiết.' : ''}</div>`;
      } else {
        container.innerHTML = draftChecklist.map((c, i) => `
          <div class="checklist-item ${c.done ? 'done' : ''}">
            <input type="checkbox" id="chk_item_${i}" class="checklist-item-check" ${c.done ? 'checked' : ''} ${!canTouch ? 'disabled' : ''} onchange="window.app.toggleChecklistItem(${i})">
            <label for="chk_item_${i}" class="checklist-item-title ${c.done ? 'strikethrough' : ''}">${state.esc(c.title)}</label>
            ${canUserEditTask ? `<button type="button" class="ibtn checklist-del-btn" title="Xóa bước này" onclick="window.app.removeChecklistItem(${i})">✕</button>` : ''}
          </div>
        `).join('');
      }
    }

    this.syncProgressDisplay();
  },

  addChecklistItemFromInput() {
    const canTouch = canUserCompleteTask || canUserEditTask;
    if (!canTouch) return;
    const input = document.getElementById('t_new_checklist_title');
    if (!input) return;
    const title = input.value.trim();
    if (!title) {
      input.focus();
      return;
    }

    draftChecklist.push({
      id: state.uid(),
      title,
      done: false
    });
    input.value = '';

    // Auto update progress based on checklist ratio
    if (draftChecklist.length > 0) {
      const done = draftChecklist.filter(c => c.done).length;
      const pct = Math.round((done / draftChecklist.length) * 100);
      document.getElementById('t_progress').value = pct;
      this.onProgressInput();
    }
    this.renderChecklist();
    input.focus();
  },

  promptAddChecklistItem() {
    const canTouch = canUserCompleteTask || canUserEditTask;
    if (!canTouch) return;
    const title = prompt('Nhập tên bước thực hiện chi tiết:');
    if (!title || !title.trim()) return;

    draftChecklist.push({
      id: state.uid(),
      title: title.trim(),
      done: false
    });

    // Auto update progress based on checklist ratio
    if (draftChecklist.length > 0) {
      const done = draftChecklist.filter(c => c.done).length;
      const pct = Math.round((done / draftChecklist.length) * 100);
      document.getElementById('t_progress').value = pct;
      this.onProgressInput();
    }
    this.renderChecklist();
  },

  toggleChecklistItem(index) {
    const canTouch = canUserCompleteTask || canUserEditTask;
    if (!canTouch) return;
    if (index < 0 || index >= draftChecklist.length) return;

    draftChecklist[index].done = !draftChecklist[index].done;

    // Auto recalculate progress based on checklist items
    const total = draftChecklist.length;
    const done = draftChecklist.filter(c => c.done).length;
    const newPct = total > 0 ? Math.round((done / total) * 100) : 0;

    const progEl = document.getElementById('t_progress');
    if (progEl) {
      progEl.value = newPct;
      this.onProgressInput();
    }
    this.renderChecklist();
  },

  removeChecklistItem(index) {
    if (!canUserEditTask) return;
    if (index < 0 || index >= draftChecklist.length) return;
    draftChecklist.splice(index, 1);

    if (draftChecklist.length > 0) {
      const done = draftChecklist.filter(c => c.done).length;
      const newPct = Math.round((done / draftChecklist.length) * 100);
      document.getElementById('t_progress').value = newPct;
      this.onProgressInput();
    }
    this.renderChecklist();
  },

  setTaskProgressQuick(val) {
    const canTouch = canUserCompleteTask || canUserEditTask;
    if (!canTouch) return;
    const num = Math.min(100, Math.max(0, +val));
    const progEl = document.getElementById('t_progress');
    if (progEl) {
      progEl.value = num;
      this.onProgressInput();
    }
    if (num === 100 && draftChecklist.length > 0) {
      draftChecklist.forEach(c => c.done = true);
    } else if (num === 0 && draftChecklist.length > 0) {
      draftChecklist.forEach(c => c.done = false);
    }
    this.renderChecklist();
  },

  fillFolders(selectedFolderId) {
    const projId = document.getElementById('t_project').value;
    const p = state.projById(projId);
    const fs = p ? (p.folders || []) : [];
    const folderSel = document.getElementById('t_folder');

    folderSel.innerHTML = '<option value="">— Chưa phân loại —</option>' +
      fs.map((f, i) => `<option value="${f.id}">${i + 1}. ${state.esc(f.name)}</option>`).join('');

    folderSel.value = selectedFolderId && fs.some(f => f.id === selectedFolderId) ? selectedFolderId : '';
    folderSel.disabled = !canUserEditTask || !p;

    // Refresh assignee picker based on newly selected project
    if (canUserEditTask) {
      this.renderAssignees();
    }
  },

  onProgressInput() {
    const canTouch = canUserCompleteTask || canUserEditTask;
    if (!canTouch) return;
    const val = +document.getElementById('t_progress').value;
    const statusSel = document.getElementById('t_status');

    if (val === 100) statusSel.value = 'done';
    else if (val > 0) {
      if (statusSel.value === 'todo') statusSel.value = 'doing';
    } else if (statusSel.value === 'done') {
      statusSel.value = 'todo';
    }

    this.syncProgressDisplay();
  },

  onStatusChange() {
    const canTouch = canUserCompleteTask || canUserEditTask;
    if (!canTouch) return;
    const s = document.getElementById('t_status').value;
    const progEl = document.getElementById('t_progress');

    if (s === 'done') {
      progEl.value = 100;
      if (draftChecklist.length > 0) draftChecklist.forEach(c => c.done = true);
    } else if (+progEl.value === 100) {
      progEl.value = s === 'doing' ? 50 : 0;
      if (draftChecklist.length > 0) {
        const half = Math.floor(draftChecklist.length / 2);
        draftChecklist.forEach((c, i) => c.done = s === 'doing' ? i < half : false);
      }
    }

    this.syncProgressDisplay();
    this.renderChecklist();
  },

  saveTask() {
    if (editTaskId) {
      const existing = state.taskById(editTaskId);
      if (existing && !state.canModifyTask(existing)) {
        alert('Bạn không có quyền chỉnh sửa hoặc cập nhật công việc này.');
        return;
      }
    }

    const old = editTaskId ? state.taskById(editTaskId) : null;
    let title = document.getElementById('t_title').value.trim();
    if (canUserEditTask && !title) {
      document.getElementById('t_title').focus();
      return;
    }
    if (!canUserEditTask && old) {
      title = old.title;
    }

    const startDate = canUserEditTask ? document.getElementById('t_start').value : (old ? old.startDate : '');
    const dueDate = canUserEditTask ? document.getElementById('t_due').value : (old ? old.dueDate : '');
    if (startDate && dueDate && dueDate < startDate) {
      alert('Hạn chót phải sau hoặc bằng ngày bắt đầu.');
      return;
    }

    const pid = canUserEditTask ? document.getElementById('t_project').value : (old ? old.projectId : '');
    const fid = canUserEditTask ? document.getElementById('t_folder').value : (old ? old.folderId : '');

    let sort = old ? old.sort : 10;
    if (!old || old.projectId !== pid || (old.folderId || '') !== fid) {
      const p = state.projById(pid);
      const fids = new Set(p ? p.folders.map(f => f.id) : []);
      const same = state.data.tasks.filter(t => t.projectId === pid && (fid ? t.folderId === fid : !fids.has(t.folderId)));
      sort = same.reduce((m, t) => Math.max(m, Number(t.sort) || 0), 0) + 10;
    }

    const assignerVal = canUserEditTask ? document.getElementById('t_assigner').value : (old ? old.assigner : '');
    const assigneeVal = canUserEditTask ? draftAssignees.join(', ') : (old ? old.assignee : '');
    const priorityVal = canUserEditTask ? document.getElementById('t_priority').value : (old ? old.priority : 'med');

    const record = Object.assign({ id: state.uid(), createdAt: Date.now(), deleted: false }, old || {}, {
      projectId: pid,
      folderId: fid,
      sort,
      title,
      assigner: assignerVal,
      assignee: assigneeVal,
      status: document.getElementById('t_status').value,
      priority: priorityVal,
      progress: +document.getElementById('t_progress').value,
      startDate,
      dueDate,
      note: document.getElementById('t_note').value,
      checklist: draftChecklist,
      files: taskFileCtx.files
    });

    if (record.assignee && !record.assigner) {
      record.assigner = api.userEmail;
    }

    state.commit('task', record);
    closeModalEl('modalTask');
  },

  deleteTask() {
    const t = state.taskById(editTaskId);
    if (!t) return;
    if (!state.canDeleteTask(t)) {
      alert('Bạn không có quyền xoá công việc này. Chỉ Quản trị viên (Admin) hoặc Người giao việc mới có quyền xoá.');
      return;
    }
    if (!confirm(`Xoá công việc "${t.title}"?`)) return;

    state.commit('task', { ...t, deleted: true });
    closeModalEl('modalTask');
  },

  renderTaskFiles() {
    const container = document.getElementById('t_files_list');
    if (!container) return;
    container.innerHTML = taskFileCtx.files.map((f, i) => `
      <div class="file">
        <span class="ficon">📎</span>
        <div class="fbody">
          <a href="${state.esc(f.url)}" target="_blank" rel="noopener">${state.esc(f.name)}</a>
          <span class="small">${fmtFileSize(f.size)}</span>
        </div>
        ${!isCurrentTaskReadOnly ? `<button class="ibtn" title="Gỡ tệp" onclick="window.app.removeTaskFile(${i})">✕</button>` : ''}
      </div>
    `).join('') || '<span class="small" style="color:var(--text-muted)">Chưa có tệp đính kèm</span>';
  },

  removeTaskFile(index) {
    const removed = taskFileCtx.files.splice(index, 1)[0];
    if (removed) taskFileCtx.removed.push(removed.id);
    this.renderTaskFiles();
  },

  async handleTaskFileUpload(input) {
    const files = [...input.files];
    input.value = '';
    if (!files.length) return;

    const statusEl = document.getElementById('t_upload_status');
    for (const file of files) {
      try {
        statusEl.textContent = `⏳ Đang tải ${file.name}…`;
        const uploadedMeta = await api.uploadFile(file);
        taskFileCtx.files.push(uploadedMeta);
        taskFileCtx.added.push(uploadedMeta.id);
        this.renderTaskFiles();
      } catch (err) {
        alert('Lỗi tải tệp: ' + err.message);
      }
    }
    statusEl.textContent = '';
  },

  // ================= PROJECT MODAL =================
  openProject(id) {
    editProjId = id || null;
    const p = id ? state.projById(id) : null;

    document.getElementById('projectModalTitle').textContent = p ? 'Dự án: ' + p.name : 'Dự án mới';
    document.getElementById('p_name').value = p ? p.name : '';
    document.getElementById('p_due').value = p ? (p.dueDate || '') : '';
    document.getElementById('p_note').value = p ? (p.note || '') : '';

    selColor = p ? (p.color || CONFIG.DEFAULT_COLOR) : CONFIG.COLORS[state.data.projects.length % CONFIG.COLORS.length];
    this.renderColorSwatches();

    // Render Dynamic Info Fields
    this.renderProjectInfoFields(p ? (p.info || {}) : {});

    // Categories (Folders)
    draftFolders = p ? (p.folders || []).map(f => ({ id: f.id, name: f.name })) : [];

    const tplSel = document.getElementById('p_template');
    tplSel.innerHTML = `<option value="">${p ? '➕ Thêm hạng mục từ mẫu…' : '📁 Chọn mẫu hạng mục…'}</option>` +
      Object.entries(CONFIG.TEMPLATES).map(([k, t]) => `<option value="${k}">${state.esc(t.name)}</option>`).join('');

    document.getElementById('p_tasks_toggle_wrap').style.display = 'none';
    document.getElementById('p_include_tasks').checked = false;

    if (!p) {
      tplSel.value = 'basic';
      this.applyTemplate();
    }
    this.renderFoldersList();

    // Project Files
    projFileCtx = { files: p ? [...(p.files || [])] : [], added: [], removed: [] };
    this.renderProjFiles();

    document.getElementById('btnDeleteProject').style.display = p ? '' : 'none';
    openModalEl('modalProject');
    if (!p) setTimeout(() => document.getElementById('p_name').focus(), 50);
  },

  renderColorSwatches() {
    const container = document.getElementById('colorSwatches');
    if (!container) return;
    container.innerHTML = CONFIG.COLORS.map(c => `
      <span class="sw ${c === selColor ? 'sel' : ''}" style="background:${c}" onclick="window.app.selectProjectColor('${c}')"></span>
    `).join('');
  },

  selectColor(c) {
    selColor = c;
    this.renderColorSwatches();
  },

  renderProjectInfoFields(info) {
    const container = document.getElementById('p_custom_fields');
    if (!container) return;
    const fields = [...state.data.fields].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));

    if (!fields.length) {
      container.innerHTML = '<div class="small" style="color:var(--text-muted)">Chưa có trường nào. Mở Cài đặt để thêm trường.</div>';
      return;
    }

    const groups = [];
    fields.forEach(f => {
      const g = f.group || 'Khác';
      let x = groups.find(y => y.name === g);
      if (!x) groups.push(x = { name: g, fields: [] });
      x.fields.push(f);
    });

    container.innerHTML = groups.map(g => `
      <div style="font-weight:700;font-size:var(--font-xs);color:var(--text-muted);text-transform:uppercase;margin:8px 0 4px">${state.esc(g.name)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
        ${g.fields.map(f => {
          const v = info[f.id] ?? '';
          const id = 'pf_' + f.id;
          const lbl = state.esc(f.label) + (f.unit ? ` <span class="small">(${state.esc(f.unit)})</span>` : '');
          let inp = '';
          if (f.type === 'number') {
            inp = `<input id="${id}" type="number" step="any" value="${state.esc(v)}">`;
          } else if (f.type === 'date') {
            inp = `<input id="${id}" type="date" value="${state.esc(v)}">`;
          } else if (f.type === 'select') {
            const opts = String(f.options || '').split(',').map(s => s.trim()).filter(Boolean);
            if (v && !opts.includes(v)) opts.push(v);
            inp = `<select id="${id}"><option value="">—</option>${opts.map(o => `<option ${o === v ? 'selected' : ''}>${state.esc(o)}</option>`).join('')}</select>`;
          } else {
            inp = `<input id="${id}" value="${state.esc(v)}">`;
          }
          return `<div class="field"><label>${lbl}</label>${inp}</div>`;
        }).join('')}
      </div>
    `).join('');
  },

  collectProjectInfo(oldInfo) {
    const info = Object.assign({}, oldInfo || {});
    state.data.fields.forEach(f => {
      const el = document.getElementById('pf_' + f.id);
      if (!el) return;
      let v = el.value.trim();
      if (f.type === 'number' && v !== '') v = Number(v);
      if (v === '' || (typeof v === 'number' && isNaN(v))) {
        delete info[f.id];
      } else {
        info[f.id] = v;
      }
    });
    return info;
  },

  applyTemplate() {
    const val = document.getElementById('p_template').value;
    const tp = CONFIG.TEMPLATES[val];
    if (!tp) return;

    if (!editProjId) {
      draftFolders = tp.folders.map(([n]) => ({ id: state.uid(), name: n }));
      const hasTasks = tp.folders.some(([, ts]) => ts.length);
      document.getElementById('p_tasks_toggle_wrap').style.display = hasTasks ? 'block' : 'none';
      document.getElementById('p_include_tasks').checked = hasTasks;
    } else {
      const have = new Set(draftFolders.map(f => f.name.trim().toLowerCase()));
      tp.folders.forEach(([n]) => {
        if (!have.has(n.toLowerCase())) draftFolders.push({ id: state.uid(), name: n });
      });
      document.getElementById('p_template').value = '';
    }
    this.renderFoldersList();
  },

  renderFoldersList() {
    const container = document.getElementById('p_folders_list');
    if (!container) return;

    container.innerHTML = draftFolders.map((f, i) => `
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <span class="task-code">${i + 1}.</span>
        <input value="${state.esc(f.name)}" oninput="window.app.updateDraftFolder(${i}, this.value)" style="flex:1">
        <button class="ibtn" onclick="window.app.moveFolder(${i}, -1)" title="Lên">↑</button>
        <button class="ibtn" onclick="window.app.moveFolder(${i}, 1)" title="Xuống">↓</button>
        <button class="ibtn" onclick="window.app.removeFolder(${i})" title="Xoá">✕</button>
      </div>
    `).join('') || '<div class="small" style="color:var(--text-muted)">Chưa có hạng mục con.</div>';
  },

  addFolder() {
    draftFolders.push({ id: state.uid(), name: 'Hạng mục mới' });
    this.renderFoldersList();
  },

  moveFolder(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= draftFolders.length) return;
    [draftFolders[i], draftFolders[j]] = [draftFolders[j], draftFolders[i]];
    this.renderFoldersList();
  },

  removeFolder(i) {
    draftFolders.splice(i, 1);
    this.renderFoldersList();
  },

  saveProject() {
    const name = document.getElementById('p_name').value.trim();
    if (!name) {
      document.getElementById('p_name').focus();
      return;
    }

    const old = editProjId ? state.projById(editProjId) : null;
    const folders = draftFolders.map(f => ({ id: f.id, name: f.name.trim() })).filter(f => f.name);

    const record = Object.assign({ id: state.uid(), createdAt: Date.now(), deleted: false }, old || {}, {
      name,
      color: selColor,
      dueDate: document.getElementById('p_due').value,
      note: document.getElementById('p_note').value,
      info: this.collectProjectInfo(old && old.info),
      folders,
      files: projFileCtx.files
    });

    const tpVal = document.getElementById('p_template').value;
    const tp = CONFIG.TEMPLATES[tpVal];
    const tasks = [];

    if (!old && tp && document.getElementById('p_include_tasks').checked) {
      const now = Date.now();
      folders.forEach(f => {
        const src = tp.folders.find(([n]) => n.toLowerCase() === f.name.toLowerCase());
        (src ? src[1] : []).forEach((title, i) => tasks.push({
          id: state.uid(),
          projectId: record.id,
          folderId: f.id,
          sort: (i + 1) * 10,
          title,
          note: '',
          status: 'todo',
          priority: 'med',
          progress: 0,
          startDate: '',
          dueDate: '',
          assignee: '',
          assigner: '',
          files: [],
          createdAt: now + i,
          deleted: false
        }));
      });
    }

    state.commit('project', record);
    if (tasks.length) state.commitMany('task', tasks);

    if (!old) state.curProject = record.id;
    closeModalEl('modalProject');
  },

  deleteProject() {
    const p = state.projById(editProjId);
    if (!p) return;
    const tasks = state.data.tasks.filter(t => t.projectId === p.id);
    if (!confirm(`Xoá dự án "${p.name}" cùng ${tasks.length} đầu việc bên trong?`)) return;

    const taskDeletions = tasks.map(t => ({ ...t, deleted: true }));
    if (taskDeletions.length) state.commitMany('task', taskDeletions);
    state.commit('project', { ...p, deleted: true });

    state.curProject = 'all';
    closeModalEl('modalProject');
  },

  renderProjFiles() {
    const container = document.getElementById('p_files_list');
    if (!container) return;
    container.innerHTML = projFileCtx.files.map((f, i) => `
      <div class="file">
        <span class="ficon">📎</span>
        <div class="fbody">
          <a href="${state.esc(f.url)}" target="_blank" rel="noopener">${state.esc(f.name)}</a>
          <span class="small">${fmtFileSize(f.size)}</span>
        </div>
        <button class="ibtn" title="Gỡ tệp" onclick="window.app.removeProjFile(${i})">✕</button>
      </div>
    `).join('') || '<span class="small" style="color:var(--text-muted)">Chưa có tệp đính kèm</span>';
  },

  removeProjFile(index) {
    const removed = projFileCtx.files.splice(index, 1)[0];
    if (removed) projFileCtx.removed.push(removed.id);
    this.renderProjFiles();
  },

  async handleProjFileUpload(input) {
    const files = [...input.files];
    input.value = '';
    if (!files.length) return;

    const statusEl = document.getElementById('p_upload_status');
    for (const file of files) {
      try {
        statusEl.textContent = `⏳ Đang tải ${file.name}…`;
        const uploadedMeta = await api.uploadFile(file);
        projFileCtx.files.push(uploadedMeta);
        projFileCtx.added.push(uploadedMeta.id);
        this.renderProjFiles();
      } catch (err) {
        alert('Lỗi tải tệp: ' + err.message);
      }
    }
    statusEl.textContent = '';
  },

  // ================= SETTINGS MODAL =================
  openSettings(tab = null) {
    const isManageUsers = api.currentUser?.isAdmin || (api.currentUser?.permissions || []).includes('manage_users');
    const isManageRoles = api.currentUser?.isAdmin || (api.currentUser?.permissions || []).includes('manage_roles');

    const tabUsersEl = document.getElementById('tabSetUsers');
    const tabRolesEl = document.getElementById('tabSetRoles');
    if (tabUsersEl) tabUsersEl.style.display = isManageUsers ? '' : 'none';
    if (tabRolesEl) tabRolesEl.style.display = isManageRoles ? '' : 'none';

    let targetTab = tab;
    if (!targetTab) {
      targetTab = isManageUsers ? 'users' : 'fields';
    }

    this.switchSettingsTab(targetTab);
    openModalEl('modalSettings');
  },

  switchSettingsTab(tab) {
    const tabUsersEl = document.getElementById('tabSetUsers');
    const tabRolesEl = document.getElementById('tabSetRoles');
    const tabFieldsEl = document.getElementById('tabSetFields');

    if (tabUsersEl) tabUsersEl.classList.toggle('active', tab === 'users');
    if (tabRolesEl) tabRolesEl.classList.toggle('active', tab === 'roles');
    if (tabFieldsEl) tabFieldsEl.classList.toggle('active', tab === 'fields');

    const paneUsersEl = document.getElementById('paneSetUsers');
    const paneRolesEl = document.getElementById('paneSetRoles');
    const paneFieldsEl = document.getElementById('paneSetFields');

    if (paneUsersEl) paneUsersEl.style.display = tab === 'users' ? '' : 'none';
    if (paneRolesEl) paneRolesEl.style.display = tab === 'roles' ? '' : 'none';
    if (paneFieldsEl) paneFieldsEl.style.display = tab === 'fields' ? '' : 'none';

    if (tab === 'users') this.renderUsersTab();
    else if (tab === 'roles') this.renderRolesTab();
    else if (tab === 'fields') this.renderFieldsTab();
  },

  renderFieldsTab() {
    const container = document.getElementById('fieldsTableWrap');
    if (!container) return;

    const fields = [...state.data.fields].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));

    container.innerHTML = `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Nhóm</th>
              <th>Tên trường</th>
              <th>Kiểu</th>
              <th>Đơn vị</th>
              <th>Lựa chọn (cách nhau dấu phẩy)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${fields.map((f, i) => `
              <tr>
                <td><input value="${state.esc(f.group)}" onchange="window.app.updateField('${f.id}','group',this.value)"></td>
                <td><input value="${state.esc(f.label)}" onchange="window.app.updateField('${f.id}','label',this.value)"></td>
                <td>
                  <select onchange="window.app.updateField('${f.id}','type',this.value)">
                    ${CONFIG.FIELD_TYPES.map(([k, l]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${l}</option>`).join('')}
                  </select>
                </td>
                <td><input value="${state.esc(f.unit || '')}" onchange="window.app.updateField('${f.id}','unit',this.value)" style="width:70px"></td>
                <td>${f.type === 'select' ? `<input value="${state.esc(f.options || '')}" onchange="window.app.updateField('${f.id}','options',this.value)">` : '<span class="small">–</span>'}</td>
                <td style="white-space:nowrap;text-align:right">
                  <button class="ibtn" onclick="window.app.moveField(${i},-1)">↑</button>
                  <button class="ibtn" onclick="window.app.moveField(${i},1)">↓</button>
                  <button class="ibtn" onclick="window.app.deleteField('${f.id}')">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <button class="btn" onclick="window.app.addField()">+ Thêm trường mới</button>
    `;
  },

  updateField(id, key, val) {
    const f = state.data.fields.find(x => x.id === id);
    if (!f) return;
    val = String(val).trim();
    if (key === 'label' && !val) return;
    state.commit('field', { ...f, [key]: val });
  },

  moveField(i, dir) {
    const fields = [...state.data.fields].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    [fields[i], fields[j]] = [fields[j], fields[i]];
    const recs = fields.map((f, k) => ({ ...f, sort: (k + 1) * 10 }));
    state.commitMany('field', recs);
    this.renderFieldsTab();
  },

  addField() {
    const fields = state.data.fields;
    const maxSort = fields.reduce((m, f) => Math.max(m, Number(f.sort) || 0), 0);
    state.commit('field', {
      id: state.uid(),
      label: 'Trường mới',
      type: 'number',
      unit: '',
      group: 'Thiết bị',
      options: '',
      sort: maxSort + 10,
      createdAt: Date.now(),
      deleted: false
    });
    this.renderFieldsTab();
  },

  deleteField(id) {
    const f = state.data.fields.find(x => x.id === id);
    if (!f) return;
    if (!confirm(`Xoá trường thông tin "${f.label}"?`)) return;

    state.commit('field', { ...f, deleted: true });
    this.renderFieldsTab();
  },

  // ================= LOGIN & AUTH =================
  openLogin() {
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
    openModalEl('modalLogin');
    setTimeout(() => document.getElementById('loginUsername').focus(), 50);
  },

  async submitLogin() {
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value.trim();
    const errEl = document.getElementById('loginError');

    if (!u || !p) {
      errEl.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu';
      return;
    }

    try {
      errEl.textContent = '⏳ Đang xác thực…';
      await api.login(u, p);
      closeModalEl('modalLogin');
      errEl.textContent = '';
      window.app.render();
      state.flush();
    } catch (err) {
      errEl.textContent = '❌ ' + (err.message || 'Đăng nhập không thành công');
    }
  },

  fillAdminCredentials() {
    document.getElementById('loginUsername').value = 'admin';
    document.getElementById('loginPassword').value = 'admin123';
    this.submitLogin();
  },

  logout() {
    api.logout();
    state.data = { projects: [], tasks: [], users: [], fields: [] };
    state.notify();
    this.openLogin();
  },

  // ================= PROJECT PERMISSIONS (PHÂN QUYỀN DỰ ÁN) =================
  async openProjectPermissions(projectId) {
    curProjectPermId = projectId;
    const project = state.projById(projectId);
    document.getElementById('projPermTitle').textContent = `🔒 Phân quyền dự án: ${project ? project.name : ''}`;
    const wrap = document.getElementById('projPermTableWrap');
    wrap.innerHTML = '<div class="small" style="padding:16px;text-align:center">⏳ Đang tải danh sách người dùng…</div>';
    openModalEl('modalProjectPermissions');

    try {
      const data = await api.getProjectPermissions(projectId);
      cachedProjectPermUsers = data.users || [];
      this.renderProjectPermissionsTable();
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state">❌ Lỗi: ${state.esc(err.message)}</div>`;
    }
  },

  renderProjectPermissionsTable() {
    const wrap = document.getElementById('projPermTableWrap');
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="small" style="color:var(--text-muted);margin-bottom:12px">
        Chọn quyền truy cập cho từng tài khoản vào dự án này:
        <b>Chủ sở hữu</b> (toàn quyền), <b>Chỉnh sửa</b> (thêm/sửa công việc), <b>Chỉ xem</b> (chỉ đọc), hoặc <b>Không truy cập</b>.
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò hệ thống</th>
              <th>Quyền đối với dự án</th>
            </tr>
          </thead>
          <tbody>
            ${cachedProjectPermUsers.map((u, i) => `
              <tr>
                <td><b>${state.esc(u.username)}</b></td>
                <td>${state.esc(u.fullName || '')}</td>
                <td>${state.esc(u.email)}</td>
                <td><span class="badge b-gray">${state.esc(u.roleName || '')}</span></td>
                <td>
                  <select onchange="window.app.setProjectUserAccess(${i}, this.value)" style="min-width:140px">
                    <option value="owner" ${u.access === 'owner' ? 'selected' : ''}>👑 Chủ sở hữu (Owner)</option>
                    <option value="editor" ${u.access === 'editor' ? 'selected' : ''}>✏️ Chỉnh sửa (Editor)</option>
                    <option value="viewer" ${u.access === 'viewer' ? 'selected' : ''}>👁️ Chỉ xem (Viewer)</option>
                    <option value="none" ${u.access === 'none' ? 'selected' : ''}>🚫 Không truy cập</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  setProjectUserAccess(index, accessVal) {
    if (cachedProjectPermUsers[index]) {
      cachedProjectPermUsers[index].access = accessVal;
    }
  },

  async saveProjectPermissions() {
    if (!curProjectPermId) return;
    const btn = document.getElementById('btnSaveProjectPerm');
    try {
      if (btn) btn.textContent = '⏳ Đang lưu…';
      const permissionsPayload = cachedProjectPermUsers.map(u => ({
        userId: u.userId,
        access: u.access
      }));
      await api.updateProjectPermissions(curProjectPermId, permissionsPayload);
      alert('Đã cập nhật phân quyền dự án thành công!');
      closeModalEl('modalProjectPermissions');
      state.flush();
    } catch (err) {
      alert('Lỗi lưu phân quyền: ' + err.message);
    } finally {
      if (btn) btn.textContent = 'Lưu phân quyền';
    }
  },

  // ================= USERS MANAGEMENT (QUẢN LÝ TÀI KHOẢN) =================
  async renderUsersTab() {
    const wrap = document.getElementById('usersTableWrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="small" style="padding:16px;text-align:center">⏳ Đang tải danh sách tài khoản…</div>';

    try {
      const [users, roles] = await Promise.all([api.getUsers(), api.getRoles()]);
      cachedRoles = roles || [];
      state.data.users = users || [];

      // Fill roles select in user creation form
      const roleSel = document.getElementById('u_role');
      if (roleSel) {
        roleSel.innerHTML = roles.map(r => `<option value="${r.id}">${state.esc(r.displayName)}</option>`).join('');
      }

      wrap.innerHTML = users.length ? `
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Username</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Đơn vị / Chức vụ</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><b>${state.esc(u.username)}</b></td>
                  <td>${state.esc(u.fullName || '')}</td>
                  <td>${state.esc(u.email)}</td>
                  <td>${state.esc(u.unit || '–')}</td>
                  <td>${state.esc(u.phone || '–')}</td>
                  <td><span class="badge ${u.role?.name === 'admin' ? 'b-blue' : 'b-gray'}">${state.esc(u.role?.displayName || u.role?.name || '–')}</span></td>
                  <td><span class="badge ${u.isActive ? 'b-green' : 'b-red'}">${u.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td>
                  <td style="white-space:nowrap;text-align:right">
                    <button class="ibtn" title="Sửa tài khoản" onclick="window.app.editUser('${u.id}')">✎</button>
                    ${u.username !== 'admin' ? `<button class="ibtn" title="Xóa tài khoản" onclick="window.app.deleteUser('${u.id}')">✕</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">Chưa có người dùng nào.</div>';
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state">❌ Lỗi: ${state.esc(err.message)}</div>`;
    }
  },

  async editUser(id) {
    try {
      const user = await api.request(`/users/${id}`);
      editUserId = id;
      document.getElementById('u_username').value = user.username;
      document.getElementById('u_username').disabled = true;
      document.getElementById('u_fullname').value = user.fullName || '';
      document.getElementById('u_email').value = user.email;
      if (document.getElementById('u_unit')) document.getElementById('u_unit').value = user.unit || '';
      if (document.getElementById('u_phone')) document.getElementById('u_phone').value = user.phone || '';
      document.getElementById('u_password').value = '';
      document.getElementById('u_password').placeholder = 'Bỏ trống nếu giữ nguyên mật khẩu';
      document.getElementById('u_role').value = user.roleId;
      document.getElementById('u_isactive').checked = user.isActive;
      const isAdminUser = user.username === 'admin';
      document.getElementById('u_role').disabled = isAdminUser;
      document.getElementById('u_isactive').disabled = isAdminUser;

      document.getElementById('btnSaveUser').textContent = 'Lưu thay đổi';
      document.getElementById('btnCancelUser').style.display = '';
      document.getElementById('u_fullname').focus();
    } catch (err) {
      alert('Lỗi tải thông tin tài khoản: ' + err.message);
    }
  },

  cancelUserEdit() {
    editUserId = null;
    document.getElementById('u_username').value = '';
    document.getElementById('u_username').disabled = false;
    document.getElementById('u_role').disabled = false;
    document.getElementById('u_isactive').disabled = false;
    document.getElementById('u_fullname').value = '';
    document.getElementById('u_email').value = '';
    if (document.getElementById('u_unit')) document.getElementById('u_unit').value = '';
    if (document.getElementById('u_phone')) document.getElementById('u_phone').value = '';
    document.getElementById('u_password').value = '';
    document.getElementById('u_password').placeholder = 'Mật khẩu *';
    document.getElementById('u_isactive').checked = true;

    document.getElementById('btnSaveUser').textContent = '+ Thêm tài khoản';
    document.getElementById('btnCancelUser').style.display = 'none';
  },

  async saveUser() {
    const username = document.getElementById('u_username').value.trim();
    const email = document.getElementById('u_email').value.trim();
    const fullName = document.getElementById('u_fullname').value.trim();
    const unit = document.getElementById('u_unit')?.value.trim() || '';
    const phone = document.getElementById('u_phone')?.value.trim() || '';
    const password = document.getElementById('u_password').value.trim();
    const roleId = document.getElementById('u_role').value;
    const isActive = document.getElementById('u_isactive').checked;

    if (!editUserId && (!username || !email || !password)) {
      alert('Vui lòng nhập Tên đăng nhập, Email và Mật khẩu.');
      return;
    }

    try {
      if (editUserId) {
        await api.updateUser(editUserId, { email, fullName, unit, phone, roleId, isActive, password: password || undefined });
      } else {
        await api.createUser({ username, email, fullName, unit, phone, password, roleId, isActive });
      }
      this.cancelUserEdit();
      await this.renderUsersTab();
    } catch (err) {
      alert('Lỗi lưu tài khoản: ' + err.message);
    }
  },

  async deleteUser(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      await api.deleteUser(id);
      await this.renderUsersTab();
    } catch (err) {
      alert('Lỗi xóa tài khoản: ' + err.message);
    }
  },

  // ================= ROLES & PERMISSIONS MANAGEMENT (QUẢN LÝ VAI TRÒ) =================
  async renderRolesTab() {
    const wrap = document.getElementById('rolesTableWrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="small" style="padding:16px;text-align:center">⏳ Đang tải danh sách vai trò…</div>';

    try {
      let roles = [];
      let perms = [];
      try {
        [roles, perms] = await Promise.all([api.getRoles(), api.getSystemPermissions()]);
      } catch (loadErr) {
        try { perms = await api.getSystemPermissions(); } catch (_) { perms = cachedPermissions || []; }
        try { roles = await api.getRoles(); } catch (_) { roles = cachedRoles || []; }
      }

      cachedRoles = roles || [];
      cachedPermissions = (perms && perms.length) ? perms : (cachedPermissions.length ? cachedPermissions : [
        { id: 'manage_users', label: 'Quản lý tài khoản (Thêm/Sửa/Khóa người dùng)' },
        { id: 'manage_roles', label: 'Quản lý vai trò & Phân quyền hệ thống' },
        { id: 'create_project', label: 'Tạo dự án mới' },
        { id: 'delete_project', label: 'Xóa dự án' },
        { id: 'edit_all_projects', label: 'Toàn quyền chỉnh sửa mọi dự án' },
        { id: 'manage_project_permissions', label: 'Phân quyền người dùng cho từng dự án' },
        { id: 'export_stats', label: 'Xem & Xuất báo cáo thống kê' }
      ]);

      // Render Permissions Checkboxes in form
      const permCheckWrap = document.getElementById('rolePermCheckboxes');
      if (permCheckWrap) {
        permCheckWrap.innerHTML = cachedPermissions.map(p => `
          <label class="perm-card" title="${state.esc(p.label)} (${state.esc(p.id)})">
            <input type="checkbox" value="${p.id}" class="role-perm-chk">
            <div class="perm-card-body">
              <span class="perm-card-label">${state.esc(p.label)}</span>
              <code class="perm-card-key">${state.esc(p.id)}</code>
            </div>
          </label>
        `).join('');
      }

      wrap.innerHTML = roles.length ? `
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Tên vai trò</th>
                <th>Mã (Key)</th>
                <th>Mô tả</th>
                <th>Quyền hạn hệ thống</th>
                <th>Người dùng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${roles.map(r => `
                <tr>
                  <td><b>${state.esc(r.displayName)}</b> ${r.isSystem ? '<span class="badge b-gray">Hệ thống</span>' : ''}</td>
                  <td><code>${state.esc(r.name)}</code></td>
                  <td class="small" style="color:var(--text-muted);max-width:200px;white-space:normal">${state.esc(r.description || '')}</td>
                  <td style="max-width:280px;white-space:normal">
                    <div style="display:flex;flex-wrap:wrap;gap:4px">
                      ${(r.permissions || []).map(p => `<span class="badge b-blue" style="font-size:10px">${state.esc(p)}</span>`).join('') || '<span class="small" style="color:var(--text-muted)">Không có</span>'}
                    </div>
                  </td>
                  <td class="num">${r._count?.users || 0}</td>
                  <td style="white-space:nowrap;text-align:right">
                    <button class="ibtn" title="Sửa vai trò" onclick="window.app.editRole('${r.id}')">✎</button>
                    ${!r.isSystem && r.name !== 'admin' ? `<button class="ibtn" title="Xóa vai trò" onclick="window.app.deleteRole('${r.id}')">✕</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">Chưa có vai trò nào.</div>';
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state">❌ Lỗi: ${state.esc(err.message)}</div>`;
    }
  },

  editRole(id) {
    const role = cachedRoles.find(r => r.id === id);
    if (!role) return;
    editRoleId = id;
    document.getElementById('r_name').value = role.name;
    document.getElementById('r_name').disabled = true;
    document.getElementById('r_display').value = role.displayName;
    document.getElementById('r_desc').value = role.description || '';

    const permsSet = new Set(role.permissions || []);
    document.querySelectorAll('.role-perm-chk').forEach(chk => {
      chk.checked = permsSet.has(chk.value);
    });

    document.getElementById('btnSaveRole').textContent = 'Lưu vai trò';
    document.getElementById('btnCancelRole').style.display = '';
    document.getElementById('r_display').focus();
  },

  cancelRoleEdit() {
    editRoleId = null;
    document.getElementById('r_name').value = '';
    document.getElementById('r_name').disabled = false;
    document.getElementById('r_display').value = '';
    document.getElementById('r_desc').value = '';
    document.querySelectorAll('.role-perm-chk').forEach(chk => { chk.checked = false; });

    document.getElementById('btnSaveRole').textContent = '+ Thêm vai trò';
    document.getElementById('btnCancelRole').style.display = 'none';
  },

  async saveRole() {
    const name = document.getElementById('r_name').value.trim().toLowerCase();
    const displayName = document.getElementById('r_display').value.trim();
    const description = document.getElementById('r_desc').value.trim();

    if (!displayName || (!editRoleId && !name)) {
      alert('Vui lòng nhập Tên hiển thị và Mã vai trò.');
      return;
    }

    const permissions = [];
    document.querySelectorAll('.role-perm-chk:checked').forEach(chk => {
      permissions.push(chk.value);
    });

    try {
      if (editRoleId) {
        await api.updateRole(editRoleId, { displayName, description, permissions });
      } else {
        await api.createRole({ name, displayName, description, permissions });
      }
      this.cancelRoleEdit();
      await this.renderRolesTab();
    } catch (err) {
      alert('Lỗi lưu vai trò: ' + err.message);
    }
  },

  async deleteRole(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa vai trò này?')) return;
    try {
      await api.deleteRole(id);
      await this.renderRolesTab();
    } catch (err) {
      alert('Lỗi xóa vai trò: ' + err.message);
    }
  }
};

let curProjectPermId = null;
let cachedProjectPermUsers = [];
let cachedRoles = [];
let cachedPermissions = [];
let editUserId = null;
let editRoleId = null;

function openModalEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

export function closeModalEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function ensureSelectOption(selectEl, value) {
  if (value && ![...selectEl.options].some(o => o.value === value)) {
    selectEl.insertAdjacentHTML('beforeend', `<option value="${state.esc(value)}">${state.esc(value)}</option>`);
  }
}

function fmtFileSize(bytes) {
  bytes = Number(bytes) || 0;
  return bytes > 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

