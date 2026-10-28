import { CONFIG } from './config.js';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('wm.token') || '';
    this.currentUser = null;
    try {
      const u = localStorage.getItem('wm.user');
      if (u) this.currentUser = JSON.parse(u);
    } catch (e) { }
  }

  setAuth(token, user) {
    this.token = token;
    this.currentUser = user;
    if (token) {
      localStorage.setItem('wm.token', token);
      localStorage.setItem('wm.user', JSON.stringify(user));
    } else {
      localStorage.removeItem('wm.token');
      localStorage.removeItem('wm.user');
    }
  }

  logout() {
    this.setAuth('', null);
  }

  get userEmail() {
    return this.currentUser?.email ? String(this.currentUser.email).toLowerCase() : '';
  }

  get username() {
    return this.currentUser?.username ? String(this.currentUser.username).toLowerCase() : '';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers
    };

    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const json = await response.json().catch(() => null);

      if (response.status === 401) {
        // If unauthorized, trigger re-login
        if (window.app && typeof window.app.showLoginModal === 'function') {
          window.app.showLoginModal();
        }
      }

      if (!response.ok) {
        const errorMsg = (json && json.message) || `HTTP error! status: ${response.status}`;
        const err = new Error(errorMsg);
        err.errors = json ? json.errors : null;
        err.status = response.status;
        throw err;
      }

      return json ? json.data : null;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
      throw err;
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { username, password }
    });
    if (data && data.token) {
      this.setAuth(data.token, data.user);
    }
    return data;
  }

  getMe() {
    return this.request('/auth/me');
  }

  changePassword(oldPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: { oldPassword, newPassword }
    });
  }

  // Health
  getHealth() {
    return this.request('/health');
  }

  // Sync
  getBootstrap() {
    return this.request('/sync/bootstrap');
  }

  syncBatch(ops) {
    return this.request('/sync', {
      method: 'POST',
      body: { ops }
    });
  }

  getAudit(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    const query = params.toString();
    return this.request(`/audit${query ? `?${query}` : ''}`);
  }

  getNotifications(unreadOnly = false) {
    return this.request(`/notifications?unreadOnly=${unreadOnly}`);
  }

  markNotificationsRead(ids) {
    return this.request('/notifications/read', { method: 'POST', body: { ids } });
  }

  heartbeatPresence(projectId = null) {
    return this.request('/realtime/presence', { method: 'POST', body: { projectId } });
  }

  getPresence(projectId = null) {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request(`/realtime/presence${query}`);
  }

  reportUrl(format) {
    return `${this.baseUrl}/exports/report.${format}?token=${encodeURIComponent(this.token)}`;
  }

  async downloadReport(format, projectId = '') {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const response = await fetch(`${this.baseUrl}/exports/report.${format}${query}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || `Không thể tạo báo cáo (${response.status})`);
    }
    return response.blob();
  }

  createBackup() { return this.request('/backup', { method: 'POST' }); }

  connectEvents(onEvent) {
    if (!this.token) return null;
    const source = new EventSource(`${this.baseUrl}/realtime/events?token=${encodeURIComponent(this.token)}`);
    ['comment', 'notification', 'presence'].forEach(type => source.addEventListener(type, event => onEvent(type, JSON.parse(event.data))));
    return source;
  }

  // Projects
  getProjects() {
    return this.request('/projects');
  }
  createProject(data) {
    return this.request('/projects', { method: 'POST', body: data });
  }
  updateProject(id, data) {
    return this.request(`/projects/${id}`, { method: 'PUT', body: data });
  }
  deleteProject(id) {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  // Project Permissions
  getProjectPermissions(projectId) {
    return this.request(`/projects/${projectId}/permissions`);
  }
  updateProjectPermissions(projectId, permissions) {
    return this.request(`/projects/${projectId}/permissions`, {
      method: 'PUT',
      body: { permissions }
    });
  }

  // Netlab Integration
  getNetlab(projectId) {
    return this.request(`/netlab/${projectId}`);
  }
  saveNetlab(projectId, data) {
    return this.request(`/netlab/${projectId}`, {
      method: 'PUT',
      body: { data }
    });
  }

  // Users (Admin RBAC)
  getUsers() {
    return this.request('/users');
  }
  createUser(data) {
    return this.request('/users', { method: 'POST', body: data });
  }
  updateUser(id, data) {
    return this.request(`/users/${id}`, { method: 'PUT', body: data });
  }
  deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Roles (Admin RBAC)
  getRoles() {
    return this.request('/roles');
  }
  getSystemPermissions() {
    return this.request('/roles/permissions');
  }
  createRole(data) {
    return this.request('/roles', { method: 'POST', body: data });
  }
  updateRole(id, data) {
    return this.request(`/roles/${id}`, { method: 'PUT', body: data });
  }
  deleteRole(id) {
    return this.request(`/roles/${id}`, { method: 'DELETE' });
  }

  // Tasks
  getTasks(projectId) {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request(`/tasks${q}`);
  }
  createTask(data) {
    return this.request('/tasks', { method: 'POST', body: data });
  }
  updateTask(id, data) {
    return this.request(`/tasks/${id}`, { method: 'PUT', body: data });
  }
  deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Members
  getMembers() {
    return this.request('/members');
  }
  createMember(data) {
    return this.request('/members', { method: 'POST', body: data });
  }
  updateMember(id, data) {
    return this.request(`/members/${id}`, { method: 'PUT', body: data });
  }
  deleteMember(id) {
    return this.request(`/members/${id}`, { method: 'DELETE' });
  }

  // Fields
  getFields() {
    return this.request('/fields');
  }
  createField(data) {
    return this.request('/fields', { method: 'POST', body: data });
  }
  updateField(id, data) {
    return this.request(`/fields/${id}`, { method: 'PUT', body: data });
  }
  deleteField(id) {
    return this.request(`/fields/${id}`, { method: 'DELETE' });
  }

  // Upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/upload', {
      method: 'POST',
      body: formData
    });
  }

  deleteUploadedFile(filename) {
    return this.request(`/upload/${filename}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient(CONFIG.API_BASE_URL);
