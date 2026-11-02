import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Menu, Building2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'react-hot-toast';

import Login from './Login';
import realApi from './services/api';
import NotificationPanel from './components/NotificationPanel';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import HistoryPage from './components/HistoryPage';

const api = realApi;

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

  // Sidebar state
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const wsRef = useRef(null);
  const roomsRef = useRef([]);
  const activePageRef = useRef(activePage);

  // Keep refs in sync
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);
  useEffect(() => { activePageRef.current = activePage; }, [activePage]);

  // Load notifications from backend when user logs in
  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      const sorted = notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(sorted.slice(0, 100));
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  // Login / Logout
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('user');
    setUser(null);
    setRooms([]);
    setNotifications([]);
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  // ===== Socket Connection =====
  useEffect(() => {
    if (!user) return;

    // ---- Real Socket.IO ----
    const apiBase = window._env_?.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE;
    const socketBaseUrl = window._env_?.REACT_APP_SOCKET_URL || process.env.REACT_APP_SOCKET_URL || (apiBase ? apiBase.replace('/api', '') : 'http://localhost:3000');

    const socket = io(socketBaseUrl, {
      path: '/socket.io/',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✓ Socket.IO connected');
      setConnected(true);
    });

    socket.on('roomStateUpdate', (data) => {
      setRooms((prev) =>
        prev.map((room) => {
          const roomKey = room.room != null ? room.room.toString() : '';
          const remoteRoomState = data.roomStates
            ? data.roomStates[roomKey] || data.roomStates[room.room]
            : null;
          const remoteCoilState = data.coilStates
            ? data.coilStates[roomKey] || data.coilStates[room.room]
            : null;
          if (!remoteRoomState && !remoteCoilState) return room;
          return {
            ...room,
            state: remoteRoomState?.state ?? room.state,
            stateName: remoteRoomState?.stateName ?? room.stateName,
            x_input: typeof remoteRoomState?.x_input !== 'undefined' ? remoteRoomState.x_input : room.x_input,
            timestamp: remoteRoomState?.timestamp ?? room.timestamp,
            mainStatus: remoteRoomState?.y_output_main ?? (remoteCoilState?.y_output_main ?? room.mainStatus),
            subStatus: remoteRoomState?.y_output_sub ?? (remoteCoilState?.y_output_sub ?? room.subStatus),
          };
        })
      );
    });

    socket.on('state-changed', (notification) => {
      const displayMessage = notification.message || `Phòng ${notification.room}`;
      const room = roomsRef.current.find((r) => r.room === notification.room);
      const stateName = room?.stateName || notification.stateName || 'Không xác định';

      const newNotification = {
        id: notification.id ? notification.id.toString() : Date.now().toString(),
        room: notification.room,
        message: displayMessage,
        stateName,
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false,
      };

      // Backend đã tự động lưu thông báo vào SQLite Database,
      // Frontend không gọi api.saveNotification để tránh nhân bản dữ liệu khi nhiều tab mở.

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🏨 Thông báo trạng thái phòng', {
          body: displayMessage,
          icon: '🔔',
          tag: `room-${notification.room}`,
          requireInteraction: false,
        });
      }

      if (activePageRef.current === 'dashboard') {
        toast(displayMessage, { icon: '🔔', duration: 4000 });
      }

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== newNotification.id);
        const updated = [newNotification, ...filtered];
        return updated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setConnected(false);
    });

    socket.on('reconnect', () => {
      console.log('✓ Socket.IO reconnected');
      setConnected(true);
      loadRooms();
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    wsRef.current = socket;
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ===== Load danh sách phòng =====
  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getRoomStates();
      const filteredRooms = data
        .filter((r) => {
          const suffix = parseInt(r.room.toString().slice(-2));
          return suffix >= 1 && suffix <= 6;
        })
        .sort((a, b) => parseInt(a.room) - parseInt(b.room));
      setRooms(filteredRooms);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      toast.error('Lỗi khi tải dữ liệu phòng');
    } finally {
      setLoading(false);
    }
  };

  const toggleMainRelay = useCallback(async (roomNumber, newStatus) => {
    try {
      await api.setMainRelay([{ room: roomNumber.toString(), set: newStatus ? 'on' : 'off' }]);
    } catch (error) {
      toast.error('Bạn không có quyền thực hiện thao tác này');
      throw error;
    }
  }, []);

  const toggleSubRelay = useCallback(async (roomNumber, newStatus) => {
    try {
      await api.setSubRelay([{ room: roomNumber.toString(), set: newStatus ? 'on' : 'off' }]);
    } catch (error) {
      toast.error('Bạn phải in thẻ phòng ' + roomNumber + ' trước khi thực hiện thao tác này');
      throw error;
    }
  }, []);

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

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ===== Nhóm phòng theo tầng =====
  const floors = useMemo(() => {
    const result = {};
    rooms.forEach((room) => {
      const floorNum = parseInt(room.room.toString().charAt(0), 10);
      if (!result[floorNum]) result[floorNum] = [];
      result[floorNum].push(room);
    });
    Object.values(result).forEach((list) =>
      list.sort((a, b) => parseInt(a.room) - parseInt(b.room))
    );
    return result;
  }, [rooms]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // ===== Chưa đăng nhập =====
  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  // ===== Loading =====
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mb-4" />
        <div className="text-lg font-medium text-slate-600 animate-pulse">Đang tải dữ liệu phòng...</div>
      </div>
    );
  }

  // ========================= Giao diện chính =========================
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px', borderRadius: '10px' } }} />

      {/* ===== Sidebar ===== */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        connected={connected}
        onRefresh={handleManualRefresh}
        onLogout={handleLogout}
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        unreadCount={unreadCount}
      />

      {/* ===== Main area ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs font-bold text-slate-800 leading-tight uppercase tracking-wide whitespace-nowrap">Viet Phuong Center Hotel</h1>
            <p className="text-[11px] text-slate-400 whitespace-nowrap">Hệ thống điều khiển điện</p>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}
            title={connected ? 'Đã kết nối' : 'Mất kết nối'}
          />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          {activePage === 'dashboard' && (
            <DashboardPage
              rooms={rooms}
              floors={floors}
              onToggleMain={toggleMainRelay}
              onToggleSub={toggleSubRelay}
              onRefresh={handleManualRefresh}
            />
          )}

          {activePage === 'history' && (
            <HistoryPage rooms={rooms} />
          )}

          {activePage === 'notifications' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-hidden p-3 sm:p-4">
                <NotificationPanel
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onClearAll={clearAllNotifications}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
