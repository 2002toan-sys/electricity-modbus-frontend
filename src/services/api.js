const API_BASE = window._env_?.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

const api = {
  getHeaders() {
    const token = sessionStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  handleAuthError() {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.reload();
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
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      sessionStorage.removeItem('accessToken');
    }
  },

  async verifyToken() {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: this.getHeaders(),
    });

    if (response.status === 401) return { authenticated: false };

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
    const response = await fetch(`${API_BASE}/auth/activity`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (response.status === 401) return false;
    if (!response.ok) {
      throw new Error(`Không thể gia hạn token hoạt động (HTTP ${response.status}).`);
    }
    const result = await response.json();
    if (!result.accessToken) throw new Error('Backend không trả về access token mới.');
    sessionStorage.setItem('accessToken', result.accessToken);
    return true;
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

  async requestRoomConfig(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: this.getHeaders(),
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
    return this.requestRoomConfig('/auth/change-password', { method: 'POST', body: passwords });
  },
};

export default api;
