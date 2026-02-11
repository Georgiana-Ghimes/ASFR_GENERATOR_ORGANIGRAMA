const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(email, password, role = 'viewer') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async me() {
    return this.request('/auth/me');
  }

  // Versions
  async listVersions() {
    return this.request('/versions');
  }

  async getVersion(id) {
    return this.request(`/versions/${id}`);
  }

  async createVersion(data) {
    return this.request('/versions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVersion(id, data) {
    return this.request(`/versions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVersion(id) {
    return this.request(`/versions/${id}`, {
      method: 'DELETE',
    });
  }

  // Units
  async listUnits(versionId) {
    const query = versionId ? `?version_id=${versionId}` : '';
    return this.request(`/units${query}`);
  }

  async getUnit(id) {
    return this.request(`/units/${id}`);
  }

  async createUnit(data) {
    return this.request('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUnit(id, data) {
    return this.request(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUnit(id) {
    return this.request(`/units/${id}`, {
      method: 'DELETE',
    });
  }

  // Positions
  async listPositions(versionId, unitId) {
    const params = new URLSearchParams();
    if (versionId) params.append('version_id', versionId);
    if (unitId) params.append('unit_id', unitId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/positions${query}`);
  }

  async createPosition(data) {
    return this.request('/positions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePosition(id, data) {
    return this.request(`/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePosition(id) {
    return this.request(`/positions/${id}`, {
      method: 'DELETE',
    });
  }

  // Employees
  async listEmployees() {
    return this.request('/employees');
  }

  async createEmployee(data) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id, data) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Assignments
  async listAssignments() {
    return this.request('/assignments');
  }

  async createAssignment(data) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(id, data) {
    return this.request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id) {
    return this.request(`/assignments/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
