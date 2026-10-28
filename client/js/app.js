import { state } from './state.js';
import { api } from './api.js';
import { CONFIG } from './config.js';
import { renderProjectsSidebar, renderProjectHeader } from './components/projects.js';
import { renderTasksMain } from './components/tasks.js';
import { renderStatsView, exportStatsCsv } from './components/stats.js';
import { modals, closeModalEl } from './components/modal.js';
import {
  renderProjectTabs,
  moduleState,
  printDeviceQR
} from './components/modules.js';
import * as v8Modals from './components/v8modals.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    // Apply Theme
    this.applyTheme(state.theme);

    // Subscribe to state changes
    state.subscribe(() => this.render());

    // Bind Event Listeners
    this.bindEvents();

    // Check Authentication
    if (!api.token) {
      this.showLoginModal();
    } else {
      // Initial Render & Bootstrap
      this.render();
      state.flush();
    }

    // Periodic Auto-Sync
    setInterval(() => {
      if (api.token) state.flush();
    }, CONFIG.AUTO_SYNC_MS);
  }

  bindEvents() {
    // Search Input
    const searchInput = document.getElementById('searchTasks');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value;
        renderTasksMain();
      });
    }

    // Sort Select
    const sortSelect = document.getElementById('sortTasks');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        state.sortMode = e.target.value;
        renderTasksMain();
      });
    }

    // Assignee Filter Select
    const assigneeSelect = document.getElementById('assigneeFilter');
    if (assigneeSelect) {
      assigneeSelect.addEventListener('change', e => {
        state.assigneeFilter = e.target.value;
        renderTasksMain();
      });
    }

    // Keyboard Shortcuts (Esc to close modals)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        [
          'modalTask', 'modalTaskUpdates', 'modalProject', 'modalSettings', 'modalProjectPermissions', 'modalLightbox',
          'modalDiary', 'modalLedger', 'modalWorker', 'modalAdvance', 'modalContract',
          'modalDevice', 'modalCheck', 'modalIssue', 'modalReceipt', 'modalGuarantee'
        ].forEach(id => closeModalEl(id));
      }
    });

    // Network status events
    window.addEventListener('online', () => { if (api.token) state.flush(); });
    window.addEventListener('offline', () => state.updateSyncUI());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && api.token) state.flush();
    });
  }

  render() {
    renderProjectsSidebar();

    const pgTasks = document.getElementById('pageTasks');
    const pgStats = document.getElementById('pageStats');
    const fabBtn = document.getElementById('fabAddTask');
    const btnNavTasks = document.getElementById('navTasks');
    const btnNavStats = document.getElementById('navStats');

    if (pgTasks) pgTasks.style.display = state.view === 'tasks' ? '' : 'none';
    if (pgStats) pgStats.style.display = state.view === 'stats' ? '' : 'none';
    if (fabBtn) fabBtn.style.display = state.view === 'tasks' ? 'flex' : 'none';

    if (btnNavTasks) btnNavTasks.classList.toggle('active', state.view === 'tasks');
    if (btnNavStats) btnNavStats.classList.toggle('active', state.view === 'stats');

    if (state.view === 'tasks') {
      renderProjectHeader();
      renderProjectTabs();
      if (!state.curPtab || state.curPtab === 'tasks') {
        renderTasksMain();
      }
    } else {
      renderStatsView();
    }

    // Current User & Role Display
    const userBadgeEl = document.getElementById('currentUserBadge');
    const btnLogoutEl = document.getElementById('btnLogout');
    const u = api.currentUser;

    if (userBadgeEl) {
      if (u) {
        userBadgeEl.innerHTML = `👤 <b>${state.esc(u.fullName || u.username)}</b> <span class="badge ${u.isAdmin ? 'b-blue' : 'b-gray'}" style="margin-left:4px;font-size:11px">${state.esc(u.roleDisplayName || 'Thành viên')}</span>`;
        userBadgeEl.title = `Đang đăng nhập: ${u.username} (${u.email})`;
        if (btnLogoutEl) btnLogoutEl.style.display = '';
      } else {
        userBadgeEl.textContent = 'Chưa đăng nhập';
        if (btnLogoutEl) btnLogoutEl.style.display = 'none';
      }
    }

    state.updateSyncUI();
  }

  // Navigation
  setView(viewKey) {
    state.view = viewKey;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selProject(id, ptab = null) {
    if (id !== state.curProject || ptab) {
      state.curPtab = ptab || 'tasks';
    }
    state.curProject = id;
    state.view = 'tasks';
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setPtab(ptabKey) {
    state.curPtab = ptabKey;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFabClick() {
    const ptab = state.curPtab || 'tasks';
    if (ptab === 'diary') this.openDiaryModal();
    else if (ptab === 'ledger') this.openLedgerModal(null, 'chi');
    else if (ptab === 'labor') {
      if (moduleState.lsub === 'pay') this.openAdvanceModal(null, 'salary');
      else this.openWorkerModal();
    }
    else if (ptab === 'contract') this.openContractModal();
    else if (ptab === 'device') this.openDeviceModal();
    else if (ptab === 'qa') {
      if (moduleState.qsub === 'iss') this.openIssueModal();
      else this.openCheckModal();
    }
    else if (ptab === 'finance') this.openReceiptModal();
    else this.openTaskModal();
  }

  setFilter(filterKey) {
    state.curFilter = filterKey;
    renderTasksMain();
  }

  toggleGroup(key) {
    state.collapsed[key] = !state.collapsed[key];
    localStorage.setItem('wm.collapsed', JSON.stringify(state.collapsed));
    renderTasksMain();
  }

  toggleDone(id) {
    const t = state.taskById(id);
    if (!t) return;
    if (!state.canCompleteTask(t)) {
      this.notifyNotTaskOwner(id);
      return;
    }
    const isDone = t.status === 'done';
    const updated = {
      ...t,
      status: isDone ? 'doing' : 'done',
      progress: isDone ? 90 : 100
    };
    if (updated.checklist && updated.checklist.length > 0) {
      updated.checklist = updated.checklist.map(c => ({ ...c, done: !isDone }));
    }
    state.commit('task', updated);
  }

  notifyNotTaskOwner(id) {
    const t = state.taskById(id);
    const who = t && t.assignee ? state.formatAssignees(t.assignee) : 'thành viên khác';
    alert(`🔒 Bạn không có quyền hoàn thành công việc này.\n\nCông việc này được giao cho: "${who}". Chỉ người nhận việc hoặc Quản trị viên (Admin) mới có quyền hoàn thành và cập nhật tiến độ.`);
  }

  setAssigneeFilter(email) {
    state.assigneeFilter = email || '';
    const sel = document.getElementById('assigneeFilter');
    if (sel) sel.value = state.assigneeFilter;
    renderTasksMain();
  }

  flushSync() {
    state.flush();
  }

  // Theme Management
  toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('wm.theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('btnThemeToggle');
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeBtn.title = theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
    }
  }

  // Auth & Login
  showLoginModal() { modals.openLogin(); }
  submitLogin() { modals.submitLogin(); }
  fillAdminCredentials() { modals.fillAdminCredentials(); }
  logout() { modals.logout(); }

  // Project Permissions
  openProjectPermissionsModal(projectId) { modals.openProjectPermissions(projectId); }
  closeProjectPermissionsModal() { closeModalEl('modalProjectPermissions'); }
  setProjectUserAccess(i, v) { modals.setProjectUserAccess(i, v); }
  saveProjectPermissions() { modals.saveProjectPermissions(); }

  // Users (Admin RBAC)
  editUser(id) { modals.editUser(id); }
  cancelUserEdit() { modals.cancelUserEdit(); }
  saveUser() { modals.saveUser(); }
  deleteUser(id) { modals.deleteUser(id); }

  // Roles (Admin RBAC)
  editRole(id) { modals.editRole(id); }
  cancelRoleEdit() { modals.cancelRoleEdit(); }
  saveRole() { modals.saveRole(); }
  deleteRole(id) { modals.deleteRole(id); }

  // Task & Project Modals Delegation
  openTaskModal(id, folderId) { modals.openTask(id, folderId); }
  closeTaskModal() { closeModalEl('modalTask'); }
  saveTaskModal() { modals.saveTask(); }
  deleteTaskModal() { modals.deleteTask(); }
  switchTaskTab(tab) { modals.switchTaskTab(tab); }
  onTaskNoteInput() { modals.onTaskNoteInput(); }
  openLightbox(url, name, size) { modals.openLightbox(url, name, size); }
  closeLightbox() { modals.closeLightbox(); }
  fillFolders(folderId) { modals.fillFolders(folderId); }
  onTaskProgressInput() { modals.onProgressInput(); }
  onTaskStatusChange() { modals.onStatusChange(); }
  handleTaskFileUpload(input) { modals.handleTaskFileUpload(input); }
  removeTaskFile(i) { modals.removeTaskFile(i); }
  addAssigneeFromPicker(val) { modals.addAssigneeFromPicker(val); }
  removeAssignee(i) { modals.removeAssignee(i); }
  promptAddChecklistItem() { modals.promptAddChecklistItem(); }
  addChecklistItemFromInput() { modals.addChecklistItemFromInput(); }
  toggleChecklistItem(i) { modals.toggleChecklistItem(i); }
  removeChecklistItem(i) { modals.removeChecklistItem(i); }
  setTaskProgressQuick(val) { modals.setTaskProgressQuick(val); }

  // Task Updates View Delegation (Dành cho mọi thành viên dự án)
  openTaskUpdatesModal(id) { modals.openTaskUpdates(id); }
  closeTaskUpdatesModal() { modals.closeTaskUpdates(); }
  onTaskUpdatesGoEdit() { modals.onTaskUpdatesGoEdit(); }
  getCurrentTaskId() { return modals.getCurrentTaskId(); }

  openProjectModal(id, focusFieldId) { modals.openProject(id, focusFieldId); }
  toggleProjectMap(projectId) {
    const pId = projectId || state.curProject;
    if (!pId || pId === 'all') return;
    const k = 'wm.mapOpen_' + pId;
    const current = localStorage.getItem(k) !== 'false';
    localStorage.setItem(k, !current);
    renderProjectHeader();
  }

  // NetLab Integration: Mở màn hình thiết kế mạng & nạp CSDL tương ứng
  openNetlab(projectId) {
    const pId = projectId || state.curProject;
    if (!pId || pId === 'all') {
      state.toast('Vui lòng chọn một dự án cụ thể để mở NetLab', 'warn');
      return;
    }
    const project = (state.data.projects || []).find(p => p.id === pId);
    const projectName = project ? project.name : pId;

    let overlay = document.getElementById('netlabOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'netlabOverlay';
      overlay.className = 'netlab-overlay';
      document.body.appendChild(overlay);
    }

    const netlabUrl = `/netlab/?projectId=${encodeURIComponent(pId)}&token=${encodeURIComponent(api.token || '')}`;

    overlay.innerHTML = `
      <div class="netlab-topbar">
        <div class="netlab-topbar-left">
          <button type="button" class="btn netlab-btn-back" onclick="window.app.closeNetlab()" title="Lưu thay đổi và quay lại dự án">
            ⬅ Quay lại dự án
          </button>
          <div class="netlab-topbar-title">
            <span>🌐 NetLab Kho Thông Minh</span>
            <span class="netlab-topbar-projname" title="${state.esc(projectName)}">${state.esc(projectName)}</span>
          </div>
        </div>
        <div class="netlab-topbar-actions">
          <button type="button" class="btn netlab-btn-action" onclick="window.app.toggleNetlabFullscreen()" title="Bật/Tắt toàn màn hình">
            ⛶ Toàn màn hình
          </button>
          <a href="${state.esc(netlabUrl)}" target="_blank" rel="noopener" class="btn netlab-btn-action" title="Mở sơ đồ trong tab riêng">
            ↗ Tab mới
          </a>
          <button type="button" class="btn netlab-btn-action" onclick="window.app.closeNetlab()" title="Đóng NetLab" style="color:#ef4444;font-weight:700">
            ✕ Thoát
          </button>
        </div>
      </div>
      <div class="netlab-iframe-container">
        <div id="netlabLoadingCover" class="netlab-loading-cover">
          <div class="netlab-spinner"></div>
          <div style="font-size:14px;font-weight:600">Đang khởi tạo không gian thiết kế mạng NetLab...</div>
          <div style="font-size:12px;opacity:0.8">${state.esc(projectName)}</div>
        </div>
        <iframe id="netlabIframe" class="netlab-iframe" src="${state.esc(netlabUrl)}" allow="clipboard-read; clipboard-write; fullscreen"></iframe>
      </div>
    `;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const iframe = overlay.querySelector('#netlabIframe');
    const loader = overlay.querySelector('#netlabLoadingCover');
    iframe.onload = () => {
      setTimeout(() => {
        if (loader) loader.style.opacity = '0';
        setTimeout(() => loader && loader.remove(), 300);
      }, 400);
    };
  }

  closeNetlab() {
    const overlay = document.getElementById('netlabOverlay');
    if (!overlay) return;

    // Gửi tín hiệu lưu và đóng cho iframe
    const iframe = overlay.querySelector('#netlabIframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({ type: 'NETLAB_SAVE_AND_CLOSE' }, '*');
      } catch (e) {}
    }

    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      document.body.style.overflow = '';
      state.toast('Đã quay lại dự án', 'info');
      if (typeof window.renderAll === 'function') window.renderAll();
    }, 150);
  }

  toggleNetlabFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }
  closeProjectModal() { closeModalEl('modalProject'); }
  saveProjectModal() { modals.saveProject(); }
  deleteProjectModal() { modals.deleteProject(); }
  selectProjectColor(c) { modals.selectColor(c); }
  applyProjectTemplate() { modals.applyTemplate(); }
  addFolder() { modals.addFolder(); }
  updateDraftFolder(i, val) { modals.updateDraftFolder(i, val); }
  moveFolder(i, dir) { modals.moveFolder(i, dir); }
  removeFolder(i) { modals.removeFolder(i); }
  handleProjFileUpload(input) { modals.handleProjFileUpload(input); }
  removeProjFile(i) { modals.removeProjFile(i); }

  openSettingsModal(tab) { modals.openSettings(tab); }
  closeSettingsModal() { closeModalEl('modalSettings'); }
  switchSettingsTab(tab) { modals.switchSettingsTab(tab); }
  updateField(id, k, v) { modals.updateField(id, k, v); }
  moveField(i, d) { modals.moveField(i, d); }
  addField() { modals.addField(); }
  deleteField(id) { modals.deleteField(id); }

  addNewGroup() { modals.addNewGroup(); }
  deleteGroup(id) { modals.deleteGroup(id); }
  addNewCategory() { modals.addNewCategory(); }
  deleteCategory(id) { modals.deleteCategory(id); }

  exportStatsCsv() { exportStatsCsv(); }

  // ==========================================
  // V8 CONSTRUCTION ERP MODULE DELEGATIONS
  // ==========================================
  // 1. Site Diary
  setDiaryFilter(kind, val) {
    if (kind === 'from') moduleState.diaryFrom = val;
    else if (kind === 'to') moduleState.diaryTo = val;
    renderProjectTabs();
  }
  openDiaryModal(id) { v8Modals.openDiaryModal(id); }
  closeDiaryModal() { closeModalEl('modalDiary'); }
  saveDiary() { v8Modals.saveDiary(); }
  deleteDiary() { v8Modals.deleteDiary(); }
  toggleConfirmDiary() { v8Modals.toggleConfirmDiary(); }
  setDiaryDraftRow(kind, i, k, v) {
    if (!v8Modals.v8Edit.diaryDraft[kind][i]) v8Modals.v8Edit.diaryDraft[kind][i] = {};
    v8Modals.v8Edit.diaryDraft[kind][i][k] = v;
  }
  addDiaryDraftRow(kind) {
    v8Modals.v8Edit.diaryDraft[kind].push({});
    v8Modals.renderDiarySubRows(kind);
  }
  removeDiaryDraftRow(kind, i) {
    v8Modals.v8Edit.diaryDraft[kind].splice(i, 1);
    v8Modals.renderDiarySubRows(kind);
  }
  addDiaryTask(id) {
    const t = state.taskById(id);
    if (t) {
      v8Modals.v8Edit.diaryDraft.tasks.push({ id: t.id, title: t.title, progress: t.progress || 0 });
      v8Modals.renderDiaryTasks();
    }
  }
  removeDiaryTask(i) {
    v8Modals.v8Edit.diaryDraft.tasks.splice(i, 1);
    v8Modals.renderDiaryTasks();
  }

  // 2. Ledger
  setLedgerTab(t) {
    moduleState.ltab = t;
    renderProjectTabs();
  }
  setLedgerFilter(k, v) {
    if (k === 'kind') moduleState.ledgerKind = v;
    else if (k === 'person') moduleState.ledgerPerson = v.toLowerCase();
    else if (k === 'cat') moduleState.ledgerCat = v;
    else if (k === 'status') moduleState.ledgerStatus = v;
    else if (k === 'month') moduleState.ledgerMonth = v;
    renderProjectTabs();
  }
  openLedgerModal(id, kind) { v8Modals.openLedgerModal(id, kind); }
  closeLedgerModal() { closeModalEl('modalLedger'); }
  setLedgerModalKind(k) { v8Modals.setLedgerModalKind(k); }
  calcLedgerAmount() { v8Modals.calcLedgerAmount(); }
  saveLedger() { v8Modals.saveLedger(); }
  deleteLedger() { v8Modals.deleteLedger(); }
  setLedgerStatus(id, st) {
    const l = state.data.ledger.find(x => x.id === id);
    if (!l) return;
    const user = api.currentUser ? (api.currentUser.username || api.currentUser.email) : 'admin';
    state.commit('ledger', {
      ...l,
      status: st,
      approvedBy: st === 'approved' ? user : '',
      approvedAt: st === 'approved' ? Date.now() : null
    });
  }
  exportLedgerCsv() {
    const p = state.projById(state.curProject);
    const list = state.data.ledger.filter(l => l.projectId === state.curProject);
    const rows = [
      ['Ngày', 'Người thực hiện', 'Loại', 'Danh mục', 'Hạng mục', 'Nội dung', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Trạng thái']
    ];
    list.forEach(l => {
      const c = state.catById(l.categoryId);
      const f = p ? (p.folders || []).find(x => x.id === l.folderId) : null;
      rows.push([
        state.fmtDate(l.date),
        state.shortName(l.person),
        l.kind === 'nhan' ? 'Nhận' : 'Chi',
        c ? c.name : '',
        f ? f.name : '',
        l.content,
        l.unit || '',
        l.qty || '',
        l.price || '',
        (l.kind === 'nhan' ? 1 : -1) * (Number(l.amount) || 0),
        l.status || ''
      ]);
    });
    this.downloadCsv(rows, `thu-chi-${p ? p.name : 'du-an'}-${state.todayStr()}.csv`);
  }

  // 3. Labor & Attendance
  setLaborSubTab(sub) {
    moduleState.lsub = sub;
    renderProjectTabs();
  }
  setLaborMonth(m) {
    moduleState.lmonth = m;
    renderProjectTabs();
  }
  toggleAttMode() {
    moduleState.attMode = moduleState.attMode === 'day' ? 'ot' : 'day';
    renderProjectTabs();
  }
  cycleAttCell(laborId, dayNum) {
    const l = state.data.labor.find(x => x.id === laborId);
    if (!l) return;
    const isOtMode = moduleState.attMode === 'ot';

    if (isOtMode) {
      const otObj = Object.assign({}, l.ot || {});
      const cur = otObj[dayNum];
      let next = 0.5;
      if (cur === 0.5) next = 1;
      else if (cur === 1) next = 1.5;
      else if (cur === 1.5) next = 2;
      else if (cur === 2) next = null;

      if (next === null) delete otObj[dayNum];
      else otObj[dayNum] = next;

      state.commit('labor', { ...l, ot: otObj });
    } else {
      const daysObj = Object.assign({}, l.days || {});
      const cur = daysObj[dayNum];
      let next = 1;
      if (cur === 1) next = 0.5;
      else if (cur === 0.5) next = 0;
      else if (cur === 0) next = null;

      if (next === null) delete daysObj[dayNum];
      else daysObj[dayNum] = next;

      state.commit('labor', { ...l, days: daysObj });
    }
  }
  bulkFillDay(dayNum) {
    const curM = moduleState.lmonth || state.curMonth();
    const rows = state.data.labor.filter(l => l.projectId === state.curProject && l.month === curM);
    if (!rows.length) return;

    const allHaveDay = rows.every(l => (l.days || {})[dayNum] === 1);
    const updated = rows.map(l => {
      const daysObj = Object.assign({}, l.days || {});
      if (allHaveDay) delete daysObj[dayNum];
      else daysObj[dayNum] = 1;
      return { ...l, days: daysObj };
    });

    state.commitMany('labor', updated);
  }
  promptAddWorkerToLabor() {
    const curM = moduleState.lmonth || state.curMonth();
    const existingWorkerIds = new Set(
      state.data.labor.filter(l => l.projectId === state.curProject && l.month === curM).map(l => l.workerId)
    );
    const candidates = state.data.workers.filter(w => String(w.active) !== 'false' && !existingWorkerIds.has(w.id));

    if (!candidates.length) {
      this.openWorkerModal();
      return;
    }

    const workerNames = candidates.map((w, i) => `${i + 1}. ${w.name} (${w.team || 'Tự do'})`).join('\n');
    const input = prompt(`Chọn số thứ tự nhân công để thêm vào bảng tháng ${state.monthLabel(curM)}:\n\n${workerNames}\n\n(Nhập số 1 đến ${candidates.length}, hoặc huỷ để tạo người mới):`);
    if (!input) return;

    const idx = parseInt(input, 10) - 1;
    if (idx >= 0 && idx < candidates.length) {
      const target = candidates[idx];
      state.commit('labor', {
        id: state.uid(),
        projectId: state.curProject,
        month: curM,
        workerId: target.id,
        days: {},
        ot: {},
        rate: target.rate || 0,
        payType: target.payType || 'day',
        stdDays: 26,
        allowance: 0,
        bonus: 0,
        deduction: 0,
        createdAt: Date.now(),
        deleted: false
      });
    }
  }
  removeLaborRow(laborId) {
    const l = state.data.labor.find(x => x.id === laborId);
    if (!l || !confirm('Xoá dòng chấm công này của nhân công trong tháng?')) return;
    state.commit('labor', { ...l, deleted: true });
  }

  // 4. Worker Master
  openWorkerModal(id) { v8Modals.openWorkerModal(id); }
  closeWorkerModal() { closeModalEl('modalWorker'); }
  saveWorker() { v8Modals.saveWorker(); }
  deleteWorker() { v8Modals.deleteWorker(); }

  // 5. Advances
  openAdvanceModal(id, kind, refId) { v8Modals.openAdvanceModal(id, kind, refId); }
  closeAdvanceModal() { closeModalEl('modalAdvance'); }
  saveAdvance() { v8Modals.saveAdvance(); }
  deleteAdvance(id) { v8Modals.deleteAdvance(id); }

  // 6. Contracts
  openContractModal(id) { v8Modals.openContractModal(id); }
  closeContractModal() { closeModalEl('modalContract'); }
  saveContract() { v8Modals.saveContract(); }
  deleteContract() { v8Modals.deleteContract(); }
  addContractItem() {
    v8Modals.v8Edit.contractDraftItems.push({ name: '', unit: '', qty: 0, price: 0, accQty: 0, note: '' });
    v8Modals.renderContractItems();
  }
  updateContractItem(i, k, v) {
    if (!v8Modals.v8Edit.contractDraftItems[i]) return;
    if (k === 'price') v = parseFloat(String(v).replace(/[^\d]/g, '')) || 0;
    v8Modals.v8Edit.contractDraftItems[i][k] = v;
    v8Modals.renderContractItems();
  }
  removeContractItem(i) {
    v8Modals.v8Edit.contractDraftItems.splice(i, 1);
    v8Modals.renderContractItems();
  }
  exportContractCsv() {
    const p = state.projById(state.curProject);
    const list = state.data.contracts.filter(c => c.projectId === state.curProject);
    const rows = [
      ['Tổ đội', 'Tổ trưởng', 'SĐT', 'Hạng mục giao', 'ĐVT', 'KL giao', 'Đơn giá', 'Thành tiền giao', 'KL nghiệm thu', 'Giá trị NT', 'Ghi chú']
    ];
    list.forEach(c => {
      (c.items || []).forEach(it => {
        const v = (Number(it.qty) || 0) * (Number(it.price) || 0);
        const a = (Number(it.accQty) || 0) * (Number(it.price) || 0);
        rows.push([
          c.team, c.leader || '', c.phone || '', it.name || '', it.unit || '', it.qty || '', it.price || '',
          v, it.accQty || '', a, it.note || ''
        ]);
      });
    });
    this.downloadCsv(rows, `giao-khoan-${p ? p.name : 'du-an'}-${state.todayStr()}.csv`);
  }

  // 7. Devices & QR Print
  setDeviceFilter(k, v) {
    if (k === 'q') moduleState.devQ = v;
    else if (k === 'status') moduleState.devStatus = v;
    else if (k === 'cat') moduleState.devCat = v;
    else if (k === 'folder') moduleState.devFolder = v;
    else if (k === 'all') moduleState.devAll = v;
    renderProjectTabs();
  }
  openDeviceModal(id) { v8Modals.openDeviceModal(id); }
  closeDeviceModal() { closeModalEl('modalDevice'); }
  saveDevice(more) { v8Modals.saveDevice(more); }
  deleteDevice() { v8Modals.deleteDevice(); }
  printQR(id) { printDeviceQR(id); }

  // 8. QA Checks & Punch-list Issues
  setQASubTab(sub) {
    moduleState.qsub = sub;
    renderProjectTabs();
  }
  setIssueStatusFilter(st) {
    moduleState.issStatus = st;
    renderProjectTabs();
  }
  openCheckModal(id) { v8Modals.openCheckModal(id); }
  closeCheckModal() { closeModalEl('modalCheck'); }
  saveCheck() { v8Modals.saveCheck(); }
  deleteCheck() { v8Modals.deleteCheck(); }
  applyCheckTemplate(tpl) { v8Modals.applyCheckTemplate(tpl); }
  addCheckItem() {
    v8Modals.v8Edit.checkDraftItems.push({ text: '', result: 'ok', note: '' });
    v8Modals.renderCheckItems();
  }
  updateCheckItem(i, k, v) {
    if (!v8Modals.v8Edit.checkDraftItems[i]) return;
    v8Modals.v8Edit.checkDraftItems[i][k] = v;
  }
  removeCheckItem(i) {
    v8Modals.v8Edit.checkDraftItems.splice(i, 1);
    v8Modals.renderCheckItems();
  }

  openIssueModal(id) { v8Modals.openIssueModal(id); }
  closeIssueModal() { closeModalEl('modalIssue'); }
  saveIssue() { v8Modals.saveIssue(); }
  deleteIssue() { v8Modals.deleteIssue(); }

  // 9. Finance, Receipts & Guarantees
  updateProjectFinance(k, v) {
    const p = state.projById(state.curProject);
    if (!p) return;
    const val = k === 'retentionPct' ? parseFloat(v) : (parseFloat(String(v).replace(/[^\d]/g, '')) || 0);
    state.commit('project', { ...p, [k]: val });
  }
  updateBudgetLine(key, v) {
    const p = state.projById(state.curProject);
    if (!p) return;
    const budget = Object.assign({}, p.budget || {});
    const val = parseFloat(String(v).replace(/[^\d]/g, '')) || 0;
    if (val) budget[key] = val;
    else delete budget[key];
    state.commit('project', { ...p, budget });
  }
  openReceiptModal(id) { v8Modals.openReceiptModal(id); }
  closeReceiptModal() { closeModalEl('modalReceipt'); }
  saveReceipt() { v8Modals.saveReceipt(); }
  deleteReceipt() { v8Modals.deleteReceipt(); }

  openGuaranteeModal(id) { v8Modals.openGuaranteeModal(id); }
  closeGuaranteeModal() { closeModalEl('modalGuarantee'); }
  saveGuarantee() { v8Modals.saveGuarantee(); }
  deleteGuarantee() { v8Modals.deleteGuarantee(); }

  // Generic CSV Downloader
  downloadCsv(rows, filename) {
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '');
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

window.app = new App();

// Lắng nghe sự kiện thoát từ iframe NetLab để quay lại màn hình dự án
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'NETLAB_CLOSE') {
    if (window.app && typeof window.app.closeNetlab === 'function') {
      window.app.closeNetlab();
    }
  }
});
