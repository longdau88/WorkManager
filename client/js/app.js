import { state } from './state.js';
import { api } from './api.js';
import { CONFIG } from './config.js';
import { renderProjectsSidebar, renderProjectHeader } from './components/projects.js';
import { renderTasksMain } from './components/tasks.js';
import { renderStatsView, exportStatsCsv } from './components/stats.js';
import { modals, closeModalEl } from './components/modal.js';

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
        closeModalEl('modalTask');
        closeModalEl('modalProject');
        closeModalEl('modalSettings');
        closeModalEl('modalProjectPermissions');
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
      renderTasksMain();
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

  selProject(id) {
    state.curProject = id;
    state.view = 'tasks';
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!state.canModifyTask(t)) {
      this.notifyNotTaskOwner(id);
      return;
    }
    const isDone = t.status === 'done';
    const updated = {
      ...t,
      status: isDone ? 'doing' : 'done',
      progress: isDone ? 90 : 100
    };
    state.commit('task', updated);
  }

  notifyNotTaskOwner(id) {
    const t = state.taskById(id);
    const who = t && t.assignee ? state.shortName(t.assignee) : 'thành viên khác';
    alert(`🔒 Bạn không thể can thiệp vào công việc của người khác.\n\nCông việc này được giao cho "${who}". Chỉ người nhận việc mới có quyền cập nhật tiến độ và trạng thái.`);
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
  fillFolders(folderId) { modals.fillFolders(folderId); }
  onTaskProgressInput() { modals.onProgressInput(); }
  onTaskStatusChange() { modals.onStatusChange(); }
  handleTaskFileUpload(input) { modals.handleTaskFileUpload(input); }
  removeTaskFile(i) { modals.removeTaskFile(i); }

  openProjectModal(id) { modals.openProject(id); }
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

  exportStatsCsv() { exportStatsCsv(); }
}

window.app = new App();
