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
import SettingsPage from './components/SettingsPage';
import ChangePasswordPage from './components/ChangePasswordPage';

const api = realApi;

function getSavedUser() {
  try {
    if (!sessionStorage.getItem('accessToken')) {
      localStorage.removeItem('user');
      return null;
    }
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error('Unable to read saved user:', error);
    localStorage.removeItem('user');
    return null;
  }
}

// ========================= Component chính =========================
function App() {
  const [user, setUser] = useState(getSavedUser);
  const [authChecking, setAuthChecking] = useState(() => (
    Boolean(sessionStorage.getItem('accessToken') && localStorage.getItem('user'))
  ));
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [authCheckError, setAuthCheckError] = useState('');
  const [authRetry, setAuthRetry] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [plcStatuses, setPlcStatuses] = useState({});

  // Sidebar state
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const wsRef = useRef(null);
  const roomsRef = useRef([]);
  const activePageRef = useRef(activePage);
  const lastActivitySignalRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);
  useEffect(() => { activePageRef.current = activePage; }, [activePage]);

  useEffect(() => {
    if (!user) {
      setAuthChecking(false);
      setAuthCheckFailed(false);
      setAuthCheckError('');
      return undefined;
    }

    let active = true;
    let firstCheck = true;
    let verificationInProgress = false;

    const verifyToken = async () => {
      if (verificationInProgress) return;
      verificationInProgress = true;

      try {
        const result = await api.verifyToken();
        if (!active) return;

        if (!result.authenticated) {
          sessionStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
          return;
        }

        setUser((currentUser) => {
          const verifiedUser = result.user;
          if (currentUser?.username === verifiedUser.username &&
              currentUser?.role === verifiedUser.role) {
            return currentUser;
          }
          localStorage.setItem('user', JSON.stringify(verifiedUser));
          return verifiedUser;
        });
        setAuthCheckFailed(false);
        setAuthCheckError('');
      } catch (error) {
        if (!active) return;
        console.error('Token verification failed:', error);
        setAuthCheckError(error.message || 'Không thể xác thực token đăng nhập.');
        if (firstCheck) setAuthCheckFailed(true);
      } finally {
        verificationInProgress = false;
        if (active) {
          firstCheck = false;
          setAuthChecking(false);
        }
      }
    };

    const handleWindowFocus = () => {
      if (document.visibilityState === 'visible') verifyToken();
    };

    verifyToken();
    const intervalId = window.setInterval(verifyToken, 30000);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user, authRetry]);

  useEffect(() => {
    if (!user || authChecking || authCheckFailed) return undefined;

    const handleActivity = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastActivitySignalRef.current < 60000) return;
      lastActivitySignalRef.current = now;
      api.recordActivity().then((authenticated) => {
        if (!authenticated) {
          sessionStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
          setRooms([]);
          setNotifications([]);
          return;
        }
        if (wsRef.current) {
          wsRef.current.emit('auth-refresh', sessionStorage.getItem('accessToken'));
        }
      }).catch((error) => {
        console.error('Unable to record user activity:', error);
      });
    };

    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [user, authChecking, authCheckFailed]);

  const updatePlcStatuses = useCallback((statuses) => {
    const entries = Object.entries(statuses || {});
    setPlcStatuses(Object.fromEntries(entries.map(([key, status]) => {
      const floor = status?.floor ?? key.replace(/^floor_/, '');
      const isConnected = typeof status === 'boolean'
        ? status
        : Boolean(status?.connected ?? status?.tcpConnected);
      return [floor, isConnected];
    })));
  }, []);

  useEffect(() => {
    if (!user || authChecking || authCheckFailed) {
      setPlcStatuses({});
      return;
    }
    api.getPlcStatus()
      .then((result) => updatePlcStatuses(result.data))
      .catch((error) => console.error('Error loading PLC status:', error));
  }, [user, authChecking, authCheckFailed, updatePlcStatuses]);

  // Load notifications from backend when user logs in
  useEffect(() => {
    if (user && !authChecking && !authCheckFailed) loadNotifications();
  }, [user, authChecking, authCheckFailed]);

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
    setAuthChecking(true);
    setAuthCheckFailed(false);
    setAuthCheckError('');
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    setUser(null);
    setRooms([]);
    setNotifications([]);
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  // ===== Socket Connection =====
  useEffect(() => {
    if (!user || authChecking || authCheckFailed) return;

    // ---- Real Socket.IO ----
    const apiBase = window._env_?.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE;
    const socketBaseUrl = window._env_?.REACT_APP_SOCKET_URL || process.env.REACT_APP_SOCKET_URL || (apiBase ? apiBase.replace('/api', '') : 'http://localhost:3000');

    const socket = io(socketBaseUrl, {
      path: '/socket.io/',
      auth: (callback) => callback({ token: sessionStorage.getItem('accessToken') }),
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

    socket.on('plcStatus', (data) => {
      updatePlcStatuses(data?.statuses);
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
  }, [user, authChecking, authCheckFailed, updatePlcStatuses]);

  // ===== Load danh sách phòng =====
  useEffect(() => {
    if (user && !authChecking && !authCheckFailed) loadRooms();
  }, [user, authChecking, authCheckFailed]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getRoomStates();
      const sortedRooms = data
        .filter((room) => Number(room.show_in_ui ?? 1) === 1)
        .sort((a, b) => (
        Number(a.floor) - Number(b.floor) || Number(a.room) - Number(b.room)
      ));
      setRooms(sortedRooms);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      toast.error('Lỗi khi tải dữ liệu phòng');
    } finally {
      setLoading(false);
    }
  };

  const refreshRooms = async () => {
    const data = await api.getRoomStates();
    setRooms(data
      .filter((room) => Number(room.show_in_ui ?? 1) === 1)
      .sort((a, b) => (
      Number(a.floor) - Number(b.floor) || Number(a.room) - Number(b.room)
      )));
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
      const floorNum = room.floor;
      if (floorNum == null) return;
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
  const allPlcsConnected = Object.values(plcStatuses).length > 0 &&
    Object.values(plcStatuses).every(Boolean);

  // ===== Chưa đăng nhập =====
  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  if (authChecking || authCheckFailed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          {authChecking ? (
            <>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p role="status" className="text-sm text-slate-600">Đang xác thực token đăng nhập...</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-800">Không thể xác thực phiên</h2>
              <p role="alert" className="mt-2 text-sm text-red-600">
                {authCheckError}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setAuthRetry((retry) => retry + 1)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Thử lại
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

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

          {activePage === 'changePassword' && <ChangePasswordPage />}

          {activePage === 'settings' && user?.role === 'admin' && (
            <SettingsPage
              onRoomsChanged={refreshRooms}
              plcStatuses={plcStatuses}
              allPlcsConnected={allPlcsConnected}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
