import { apiBase } from '../config/runtime';

const API_BASE = apiBase;
const AUTH_BASE = `${API_BASE.replace(/\/api\/?$/, '')}/api/auth`;
const CSRF_HEADERS = {
  'Content-Type': 'application/json',
  'X-CSRF-Protection': '1',
};
let refreshRequest = null;
let accessToken = null;

const api = {
  getAccessToken() {
    return accessToken;
  },

  setAccessToken(token) {
    accessToken = token;
  },

  clearAccessToken() {
    accessToken = null;
  },

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    };
  },

  handleAuthError() {
    this.clearAccessToken();
    localStorage.removeItem('user');
    window.location.reload();
  },

  getAccessTokenExpirationTime() {
    const encodedPayload = accessToken?.split('.')[1];
    if (!encodedPayload) return null;
    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      return Number.isInteger(payload.exp) ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  },

  async refreshSession() {
    if (refreshRequest) return refreshRequest;
    refreshRequest = (async () => {
      try {
        const response = await fetch(`${AUTH_BASE}/refresh`, {
          method: 'POST',
          headers: CSRF_HEADERS,
          credentials: 'include',
        });
        if (response.status === 401) {
          this.clearAccessToken();
          return null;
        }
        const result = await response.json();
        if (!response.ok || !result.accessToken || !result.user?.username) {
          throw new Error(result.error || 'Không thể khôi phục phiên đăng nhập.');
        }
        this.setAccessToken(result.accessToken);
        return result;
      } finally {
        refreshRequest = null;
      }
    })();
    return refreshRequest;
  },

  async getRoomStates() {
    try {
      const response = await fetch(`${API_BASE}/monitor/rooms`, {
        headers: this.getHeaders(),
      });
      if (response.status === 401) {
        this.handleAuthError();
        return [];
      }
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async setMainRelay(roomData) {
    try {
      const response = await fetch(`${API_BASE}/relay/main/set`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(roomData),
      });
      if (response.status === 401) {
        this.handleAuthError();
        throw new Error('Unauthorized');
      }
      if (!response.ok) throw new Error('Failed to control room');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async setSubRelay(roomData) {
    try {
      const response = await fetch(`${API_BASE}/relay/sub/set`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(roomData),
      });
      if (response.status === 401) {
        this.handleAuthError();
        throw new Error('Unauthorized');
      }
      if (!response.ok) throw new Error('Failed to control room');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await fetch(`${AUTH_BASE}/logout`, {
        method: 'POST',
        headers: { ...this.getHeaders(), 'X-CSRF-Protection': '1' },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAccessToken();
    }
  },

  async verifyToken() {
    const expiresAt = this.getAccessTokenExpirationTime();
    if (expiresAt && expiresAt - Date.now() <= 2 * 60 * 1000) {
      const session = await this.refreshSession();
      if (!session) return { authenticated: false };
    }

    let response = await fetch(`${AUTH_BASE}/me`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (response.status === 401) {
      const session = await this.refreshSession();
      if (!session) return { authenticated: false };
      response = await fetch(`${AUTH_BASE}/me`, {
        headers: this.getHeaders(),
        credentials: 'include',
      });
      if (response.status === 401) return { authenticated: false };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Backend trả về phản hồi không hợp lệ (HTTP ${response.status}).`);
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Không thể xác thực token (HTTP ${response.status}).`);
    }
    if (!result.user?.username || !result.user?.role) {
      throw new Error('Backend trả về thông tin người dùng không hợp lệ.');
    }
    return { authenticated: true, user: result.user };
  },

  async recordActivity() {
    const expiresAt = this.getAccessTokenExpirationTime();
    if (expiresAt && expiresAt - Date.now() > 2 * 60 * 1000) return true;
    const session = await this.refreshSession();
    if (!session) return false;
    return true;
  },

  async logoutAll() {
    try {
      await fetch(`${AUTH_BASE}/logout-all`, {
        method: 'POST',
        headers: { ...this.getHeaders(), 'X-CSRF-Protection': '1' },
        credentials: 'include',
      });
    } finally {
      this.clearAccessToken();
    }
  },

  async getNotifications() {
    try {
      const response = await fetch(`${API_BASE}/notifications`, {
        headers: this.getHeaders(),
      });
      if (response.status === 401) {
        this.handleAuthError();
        return [];
      }
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async saveNotification(notification) {
    try {
      const response = await fetch(`${API_BASE}/notifications/save`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(notification),
      });
      if (response.status === 401) {
        this.handleAuthError();
        throw new Error('Unauthorized');
      }
      if (!response.ok) throw new Error('Failed to save notification');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async updateNotificationReadStatus(id, read) {
    try {
      const response = await fetch(`${API_BASE}/notifications/update-read`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ id, read }),
      });
      if (response.status === 401) {
        this.handleAuthError();
        throw new Error('Unauthorized');
      }
      if (!response.ok) throw new Error('Failed to update notification');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async clearAllNotifications() {
    try {
      const response = await fetch(`${API_BASE}/notifications/clear-all`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (response.status === 401) {
        this.handleAuthError();
        throw new Error('Unauthorized');
      }
      if (!response.ok) throw new Error('Failed to clear notifications');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getStateHistory(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.room && params.room !== 'all') query.append('room', params.room);
      if (params.search) query.append('search', params.search);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
      if (params.state && params.state !== 'all') query.append('state', params.state);
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);

      const url = `${API_BASE}/monitor/history?${query.toString()}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        this.handleAuthError();
        return { data: [], pagination: { total: 0, page: 1, totalPages: 1 } };
      }

      if (!response.ok) throw new Error('Failed to fetch history');
      return await response.json();
    } catch (error) {
      console.error('API Error (getStateHistory):', error);
      return { data: [], pagination: { total: 0, page: 1, totalPages: 1 } };
    }
  },

  async requestRoomConfig(path, { method = 'GET', body, csrf = false, credentials } = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...this.getHeaders(),
        ...(csrf ? { 'X-CSRF-Protection': '1' } : {}),
      },
      ...(credentials ? { credentials } : {}),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 401) {
      this.handleAuthError();
      throw new Error('Unauthorized');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (response.status === 404) {
        throw new Error('Backend chưa nhận API cấu hình mới. Hãy khởi động lại backend rồi tải lại trang.');
      }
      throw new Error(`Backend trả về phản hồi không hợp lệ (HTTP ${response.status}).`);
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update room configuration');
    }
    return result;
  },

  async getRoomsConfig() {
    return this.requestRoomConfig('/config/rooms');
  },

  async createRoom(room) {
    return this.requestRoomConfig('/config/rooms', { method: 'POST', body: room });
  },

  async updateRoom(roomNumber, room) {
    return this.requestRoomConfig(`/config/rooms/${encodeURIComponent(roomNumber)}`, {
      method: 'PUT',
      body: room,
    });
  },

  async deleteRoom(roomNumber) {
    return this.requestRoomConfig(`/config/rooms/${encodeURIComponent(roomNumber)}`, {
      method: 'DELETE',
    });
  },

  async getPlcsConfig() {
    return this.requestRoomConfig('/config/plcs');
  },

  async createPlc(plc) {
    return this.requestRoomConfig('/config/plcs', { method: 'POST', body: plc });
  },

  async updatePlc(floor, plc) {
    return this.requestRoomConfig('/config/plcs', {
      method: 'PUT',
      body: { ...plc, floor },
    });
  },

  async deletePlc(floor) {
    return this.requestRoomConfig(`/config/plcs/${encodeURIComponent(floor)}`, {
      method: 'DELETE',
    });
  },

  async getPlcStatus() {
    return this.requestRoomConfig('/monitor/plc-status');
  },

  async getSystemSettings() {
    return this.requestRoomConfig('/config/settings');
  },

  async updateSystemSettings(settings) {
    return this.requestRoomConfig('/config/settings', {
      method: 'PUT',
      body: settings,
    });
  },

  async testTelegram() {
    return this.requestRoomConfig('/config/test-telegram', { method: 'POST' });
  },

  async getUsers() {
    return this.requestRoomConfig('/users');
  },

  async createUser(user) {
    return this.requestRoomConfig('/users', { method: 'POST', body: user });
  },

  async updateUser(id, user) {
    return this.requestRoomConfig(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: user,
    });
  },

  async deleteUser(id) {
    return this.requestRoomConfig(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async changePassword(passwords) {
    return this.requestRoomConfig('/auth/change-password', {
      method: 'POST',
      body: passwords,
      csrf: true,
      credentials: 'include',
    });
  },
};

export default api;
