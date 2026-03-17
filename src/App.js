import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'react-hot-toast';

import Login from './Login';
import api from './services/api';
import RoomCard from './components/RoomCard';
import NotificationPanel from './components/NotificationPanel';


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
      // Sort and limit initial load
      const sorted = notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(sorted.slice(0, 50));
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

  // Làm mới ứng dụng thủ công
  const handleManualRefresh = () => {
    window.location.reload();
  };

  // ===== Socket.IO Connection =====
  useEffect(() => {
    if (!user) return;

    const apiBase = window._env_?.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE;
    const socketBaseUrl = apiBase ? apiBase.replace('/api', '') : 'http://localhost:3000';

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
            // Update coil statuses preferring the actual polled output (remoteRoomState) to guarantee true feedback
            mainStatus: remoteRoomState?.y_output_main ?? (remoteCoilState?.y_output_main ?? room.mainStatus),
            subStatus: remoteRoomState?.y_output_sub ?? (remoteCoilState?.y_output_sub ?? room.subStatus)
          };
        });
        // Không filter ở đây — danh sách phòng đã được filter khi loadRooms()
        // Filter lại mỗi socket event sẽ loại bỏ phòng nếu dữ liệu thiếu
      });
    });

    // Listen for state change notifications (thay đổi trạng thái phòng)
    socket.on('state-changed', (notification) => {

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

      // Add to notification panel with status information, sort and limit
      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        return updated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
      });
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
      // Chỉ lấy phòng có đuôi 01-06 (201→206, 301→306, ..., 701→706)
      const filteredRooms = data
        .filter(r => {
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

  // useCallback để giữ nguyên reference — tránh React.memo trên RoomCard bị vô hiệu hóa
  const toggleMainRelay = useCallback(async (roomNumber, newStatus) => {
    try {
      await api.setMainRelay([{ room: roomNumber.toString(), set: newStatus ? 'on' : 'off' }]);
    } catch (error) {
      toast.error("Bạn không có quyền thực hiện thao tác này");
      throw error; // Re-throw để RoomCard có thể rollback optimistic state
    }
  }, []);

  const toggleSubRelay = useCallback(async (roomNumber, newStatus) => {
    try {
      await api.setSubRelay([{ room: roomNumber.toString(), set: newStatus ? 'on' : 'off' }]);
    } catch (error) {
      toast.error("Bạn phải in thẻ phòng " + roomNumber + " trước khi thực hiện thao tác này");
      throw error; // Re-throw để RoomCard có thể rollback optimistic state
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

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // ===== Nhóm phòng theo tầng =====
  // useMemo: chỉ tính lại khi danh sách phòng thay đổi
  // ⚠️ Phải đặt TRƯỚC conditional return để tuân thủ Rules of Hooks
  const floors = useMemo(() => {
    const result = {};
    rooms.forEach((room) => {
      // Backend key là số phòng thực (201, 301...) — lấy chữ số đầu làm số tầng
      const floorNum = parseInt(room.room.toString().charAt(0), 10);
      if (!result[floorNum]) result[floorNum] = [];
      result[floorNum].push(room);
    });
    // Sắp xếp phòng trong mỗi tầng theo số phòng
    Object.values(result).forEach(list =>
      list.sort((a, b) => parseInt(a.room) - parseInt(b.room))
    );
    return result;
  }, [rooms]);

  // Nếu chưa đăng nhập, hiển thị trang login
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mb-4"></div>
        <div className="text-xl font-medium text-gray-600 animate-pulse">Đang tải dữ liệu phòng...</div>
      </div>
    );
  }

  // ========================= Giao diện chính =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-2 sm:p-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-full mx-auto min-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">HỆ THỐNG ĐIỀU KHIỂN ĐIỆN KHÁCH SẠN VIET PHUONG CENTER</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-gray-600 text-sm">Quản lý và giám sát các phòng theo thời gian thực</p>
                {connected ? (
                  <span className="inline-flex items-center px-2 py-1 bg-green-50 rounded-full border border-green-200">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse mr-2"></span>
                    <span className="text-sm text-green-700 font-semibold tracking-wide">Đã kết nối</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-red-50 rounded-full border border-red-200">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-sm text-red-700 font-semibold tracking-wide">Mất kết nối</span>
                  </span>
                )}
                
                {/* Nút Tải lại đặt ở đây cho xa nút Đăng xuất */}
                <button
                  onClick={handleManualRefresh}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-sm gap-2"
                  title="Tải lại trang"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tải lại</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 items-center mt-3 sm:mt-0">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-gray-700 font-bold">👤 {user.username}</div>
                  <div className="text-xs text-blue-600 font-medium tracking-wide uppercase">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1 sm:gap-2 hover:shadow-sm"
              >
                <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
          {/* Phòng */}
          <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-lg p-2 sm:p-4 flex flex-col lg:h-[calc(100vh-8rem)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 flex-1">
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
            <div className="flex gap-8 justify-center flex-wrap text-sm p-4 border-t mt-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded shadow-sm"></div>
                <span className="font-medium text-gray-700">Trống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded shadow-sm"></div>
                <span className="font-medium text-gray-700">Đã cấp nguồn điện</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
                <span className="font-medium text-gray-700">Đang cắm thẻ phòng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded shadow-sm"></div>
                <span className="font-medium text-gray-700">Đang cắm thẻ điện</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded shadow-sm"></div>
                <span className="font-medium text-gray-700">Đang sửa chữa / kiểm tra</span>
              </div>
            </div>
          </div>

          {/* Thanh thông báo */}
          <div className="w-full lg:w-80 h-[400px] lg:h-[calc(100vh-8rem)] flex-shrink-0">
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
