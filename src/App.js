import React, { useState, useEffect, useRef } from 'react';
import { Bell, Power, Check, LogOut } from 'lucide-react';
import { io } from 'socket.io-client';
import Login from './Login';

// ========================= API Configuration =========================
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

const api = {
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
    };
  },

  handleAuthError() {
    // Auto logout on 401 Unauthorized
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
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
};

// ========================= Mapping trạng thái với màu sắc =========================
const STATE_COLORS = {
  'Trống': { 
    dashboard: 'bg-green-500', 
    notif: { bg: 'bg-green-50', border: 'border-green-500', dot: 'bg-green-500', text: 'text-green-900' },
    hex: '#22c55e'
  },
  'Check-in': { 
    dashboard: 'bg-blue-500', 
    notif: { bg: 'bg-blue-50', border: 'border-blue-500', dot: 'bg-blue-500', text: 'text-blue-900' },
    hex: '#3b82f6'
  },
  'Vào phòng': { 
    dashboard: 'bg-red-500', 
    notif: { bg: 'bg-red-50', border: 'border-red-500', dot: 'bg-red-500', text: 'text-red-900' },
    hex: '#ef4444'
  },
  'Dùng thẻ': { 
    dashboard: 'bg-yellow-500', 
    notif: { bg: 'bg-yellow-50', border: 'border-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-900' },
    hex: '#eab308'
  },
  'Sửa chữa': { 
    dashboard: 'bg-gray-500', 
    notif: { bg: 'bg-gray-50', border: 'border-gray-500', dot: 'bg-gray-500', text: 'text-gray-900' },
    hex: '#6b7280'
  },
};

const getStateColor = (stateName) => {
  return STATE_COLORS[stateName] || {
    dashboard: 'bg-gray-500',
    notif: { bg: 'bg-gray-50', border: 'border-gray-300', dot: 'bg-gray-400', text: 'text-gray-900' },
    hex: '#9ca3af'
  };
};

// ========================= Cấu hình mapping tên phòng =========================
const ROOM_NAMES = {
  1: '205', 2: '206', 3: '208', 4: '209',
  5: '305', 6: '306', 7: '308', 8: '309',
  9: '405', 10: '406', 11: '408', 12: '409',
  13: '505', 14: '506', 15: '508', 16: '509',
};

// ========================= Component RoomCard =========================
const RoomCard = ({ room, stateName, mainStatus, subStatus, onToggleMain, onToggleSub }) => {
  const displayName = ROOM_NAMES[room] || room;

  // Chọn màu sắc dựa trên stateName
  const getStateBackgroundColor = () => {
    return getStateColor(stateName).dashboard;
  };

  return (
    <div className={`relative h-40 rounded-lg shadow-lg transition-all duration-300 text-white cursor-pointer hover:shadow-xl flex flex-col justify-between ${getStateBackgroundColor()}`}>
      {/* Số phòng */}
      <div className="p-2 text-center flex items-center justify-center flex-1">
        <h3 className="text-3xl font-bold">{displayName}</h3>
      </div>

      {/* 2 Button Controls - dưới cùng */}
    <div className="p-2 flex gap-2">
  <button
    onClick={() => onToggleMain(room, !mainStatus)}
    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-base 
      ${mainStatus ? 'bg-white/60 shadow-white/70' : 'bg-white/20 shadow-white/30'}
      transition-all duration-200
      hover:scale-105 hover:shadow-lg hover:-translate-y-1
      active:scale-95
    `}
  >
    <Power className={`w-5 h-5 inline-block mr-2 ${mainStatus ? 'animate-pulse' : ''}`} />
    A
  </button>

  <button
    onClick={() => onToggleSub(room, !subStatus)}
    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-base 
      ${subStatus ? 'bg-white/60 shadow-white/70' : 'bg-white/20 shadow-white/30'}
      transition-all duration-200
      hover:scale-105 hover:shadow-lg hover:-translate-y-1
      active:scale-95
    `}
  >
    <Power className={`w-5 h-5 inline-block mr-2 ${subStatus ? 'animate-pulse' : ''}`} />
    B
  </button>
</div>


    </div>
  );
};

// ========================= Component NotificationPanel =========================
const NotificationPanel = ({ notifications, onMarkAsRead, onClearAll }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Thông báo ({notifications.filter(n => !n.read).length})

        </h3>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="space-y-2 overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Chưa có thông báo</p>
        ) : (
          notifications.map((notif) => {
            const colors = getStateColor(notif.stateName).notif;
            const isRead = notif.read;
            return (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer ${
                  isRead
                    ? 'bg-gray-50 border-gray-300'
                    : `${colors.bg} ${colors.border} shadow-sm hover:shadow-md`
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm ${isRead ? 'text-gray-600' : `${colors.text} font-medium`}`}>
                      {notif.message}
                      {!isRead && (
                        <span className={`ml-2 inline-block w-2 h-2 rounded-full ${colors.dot}`}></span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {!isRead && (
                    <div className="flex-shrink-0">
                      <Check className="w-4 h-4" style={{ color: getStateColor(notif.stateName).hex }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ========================= Component chính =========================
function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const roomsRef = useRef([]);

  // Keep roomsRef in sync with rooms state
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Load notifications from CSV when user logs in
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  // Xử lý đăng nhập
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setRooms([]);
    setNotifications([]);
  };

  // ===== Socket.IO Connection =====
  useEffect(() => {
    if (!user) return;

    const socketBaseUrl = process.env.REACT_APP_API_BASE ? 
      process.env.REACT_APP_API_BASE.replace('/api', '') : 
      'http://localhost:3000';

    const socket = io(socketBaseUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✓ Socket.IO connected');
      setConnected(true);
    });
    

    // Listen for room state updates from backend
    socket.on('roomStateUpdate', (data) => {
      console.log('Room state update:', data);
      // Update both coil states and calculated room state when provided
      setRooms((prev) => {
        return prev.map((room) => {
          const roomKey = room.room != null ? room.room.toString() : '';
          const remoteRoomState = data.roomStates ? (data.roomStates[roomKey] || data.roomStates[room.room]) : null;
          const remoteCoilState = data.coilStates ? (data.coilStates[roomKey] || data.coilStates[room.room]) : null;

          // If no data for this room, keep as-is
          if (!remoteRoomState && !remoteCoilState) return room;

          return {
            ...room,
            // Update calculated state (name/number) from PLC-derived room state
            state: remoteRoomState?.state ?? room.state,
            stateName: remoteRoomState?.stateName ?? room.stateName,
            x_input: typeof remoteRoomState?.x_input !== 'undefined' ? remoteRoomState.x_input : room.x_input,
            timestamp: remoteRoomState?.timestamp ?? room.timestamp,
            // Update coil statuses preferring persisted coil state, fallback to PLC outputs
            mainStatus: remoteCoilState ? (remoteCoilState.y_output_main || false) : (remoteRoomState ? (remoteRoomState.y_output_main || false) : room.mainStatus),
            subStatus: remoteCoilState ? (remoteCoilState.y_output_sub || false) : (remoteRoomState ? (remoteRoomState.y_output_sub || false) : room.subStatus)
          };
        });
      });
    });

    // Listen for state change notifications (thay đổi trạng thái phòng)
    socket.on('state-changed', (notification) => {
      console.log('State changed notification:', notification);
      
      // Use message from backend (already formatted with emoji and room number)
      const displayMessage = notification.message || `Phòng ${notification.room}`;
      
      // Get the room's current status for color coding
      const room = roomsRef.current.find(r => r.room === notification.room);
      const stateName = room?.stateName || notification.stateName || 'Không xác định';
      
      // Create notification object
      const newNotification = {
        id: Date.now().toString(),
        room: notification.room,
        message: displayMessage,
        stateName: stateName,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Save to backend
      api.saveNotification(newNotification).catch(error => {
        console.error('Error saving notification to backend:', error);
      });
      
      // Trigger browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🏨 Thông báo trạng thái phòng', {
          body: displayMessage,
          icon: '🔔',
          tag: `room-${notification.room}`,
          requireInteraction: false
        });
      }
      
      // Add to notification panel with status information
      setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setConnected(false);
    });

    socket.on('reconnect', () => {
      console.log('✓ Socket.IO reconnected');
      setConnected(true);
      // Reload room data after reconnect
      loadRooms();
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    wsRef.current = socket;
    return () => socket.close();
  }, [user]);

  // ===== Load dữ liệu phòng =====
  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getRoomStates();
      setRooms(data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMainRelay = async (roomNumber, newStatus) => {
    try {
      await api.setMainRelay([{ room: roomNumber.toString(), set: newStatus ? 'on' : 'off' }]);
    } catch (error) {
      alert("Bạn không có quyền thực hiện thao tác này");
    }
  };

  const toggleSubRelay = async (roomNumber, newStatus) => {
    try {
      await api.setSubRelay([{ room: roomNumber.toString(), set: newStatus ? 'on' : 'off' }]);
    } catch (error) {
      alert("Bạn phải in thẻ phòng " + roomNumber + " trước khi thực hiện thao tác này");
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.updateNotificationReadStatus(id, true);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // Nếu chưa đăng nhập, hiển thị trang login
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // ===== Nhóm phòng theo tầng =====
  const groupRoomsByFloor = (rooms) => {
    const floors = {};
    rooms.forEach((room) => {
      const roomName = ROOM_NAMES[room.room] || room.room.toString();
      const floorNum = parseInt(roomName.toString().charAt(0), 10);
      if (!floors[floorNum]) floors[floorNum] = [];
      floors[floorNum].push(room);
    });
    Object.keys(floors).forEach((floor) =>
      floors[floor].sort((a, b) => {
        const ra = parseInt(ROOM_NAMES[a.room] || a.room);
        const rb = parseInt(ROOM_NAMES[b.room] || b.room);
        return ra - rb;
      })
    );
    return floors;
  };

  const floors = groupRoomsByFloor(rooms);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  // ========================= Giao diện chính =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-[1920px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">HỆ THỐNG ĐIỀU KHIỂN ĐIỆN KHÁCH SẠN VIET PHUONG CENTER</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-gray-600 text-sm">Quản lý và giám sát các phòng theo thời gian thực</p>
                {connected ? (
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                    <span className="text-sm text-green-600 font-medium">Đã kết nối</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                    <span className="text-sm text-red-600 font-medium">Mất kết nối</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-700 font-medium">👤 {user.username}</div>
                  <div className="text-xs text-gray-500">({user.role})</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Phòng */}
          <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-6 gap-2">
              {Object.keys(floors)
                .sort((a, b) => a - b)
                .flatMap((floorNum) => floors[floorNum])
                .map((room) => (
                  <RoomCard
                    key={room.room}
                    room={room.room}
                    stateName={room.stateName || 'Không xác định'}
                    mainStatus={room.mainStatus}
                    subStatus={room.subStatus}
                    onToggleMain={toggleMainRelay}
                    onToggleSub={toggleSubRelay}
                  />
                ))}
            </div>
            {/* Ghi chú màu */}
            <div className="flex gap-6 justify-center flex-wrap text-sm p-3 border-t mt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Trống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Đã cấp nguồn điện</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Đang cắm thẻ phòng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Đang cắm thẻ điện</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Đang sửa chữa / kiểm tra</span>
              </div>
            </div>
          </div>

          {/* Thanh thông báo */}
          <div className="w-80 flex-shrink-0">
            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onClearAll={clearAllNotifications}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
