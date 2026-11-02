const API_BASE = window._env_?.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

const api = {
  getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  },

  handleAuthError() {
    // Auto logout on 401 Unauthorized
    localStorage.removeItem('user');
    window.location.reload();
  },

  async getRoomStates() {
    try {
      const response = await fetch(`${API_BASE}/monitor/rooms`, {
        headers: this.getHeaders(),
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async getNotifications() {
    try {
      const response = await fetch(`${API_BASE}/notifications`, {
        headers: this.getHeaders(),
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
      if (params.state && params.state !== 'all') query.append('state', params.state);
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);

      const url = `${API_BASE}/monitor/history?${query.toString()}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
        credentials: 'include',
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
};

export default api;
