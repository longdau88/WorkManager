import { CONFIG } from './config.js';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('wm.token') || '';
    this.currentUser = null;
    try {
      const u = localStorage.getItem('wm.user');
      if (u) this.currentUser = JSON.parse(u);
    } catch (e) {}
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
