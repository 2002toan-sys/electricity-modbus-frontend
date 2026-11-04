import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Copy, Loader2, Pencil, Plus, Power, RefreshCw, Save, Send, Server, Settings, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import UserManagementPage from './UserManagementPage';
import { ROOM_STATES, STATE_TRANSITION_DESCRIPTIONS } from '../utils/constants';

const EMPTY_ROOM = {
  room_number: '',
  floor: '',
  y_main_coil: '',
  y_sub_coil: '',
  x_input: '',
  y_output_main: '',
  y_output_sub: '',
  description: '',
  is_active: 1,
  show_in_ui: 1,
};

const FIELD_CONFIG = [
  { name: 'floor', label: 'Tầng', min: 1, max: 99 },
  { name: 'y_main_coil', label: 'Y Main (coil)', min: 0, max: 65535 },
  { name: 'y_sub_coil', label: 'Y Sub (coil)', min: 0, max: 65535 },
  { name: 'x_input', label: 'X Input (bit)', min: 0, max: 15 },
  { name: 'y_output_main', label: 'Y Output Main (bit)', min: 0, max: 15 },
  { name: 'y_output_sub', label: 'Y Output Sub (bit)', min: 0, max: 15 },
];

const PLC_FIELDS = [
  { name: 'ip', label: 'Địa chỉ IP', type: 'text' },
  { name: 'port', label: 'Cổng kết nối', type: 'number', min: 1, max: 65535 },
  { name: 'slave_id', label: 'Mã thiết bị (Slave ID)', type: 'number', min: 1, max: 247 },
  { name: 'timeout', label: 'Thời gian chờ (ms)', type: 'number', min: 100, max: 60000 },
  { name: 'start_address', label: 'Địa chỉ bắt đầu', type: 'number', min: 0, max: 65535 },
  { name: 'register_count', label: 'Số thanh ghi', type: 'number', min: 1, max: 125 },
];

const EMPTY_PLC = {
  floor: '',
  ip: '',
  port: 502,
  slave_id: 1,
  timeout: 3000,
  start_address: 100,
  register_count: 2,
};

const EMPTY_SETTINGS = {
  port: '',
  polling_interval: '',
  interlock_enabled: false,
  write_relay_enabled: false,
  http_keep_alive_timeout: '',
  cors_origins: '',
  rate_limit_window_ms: '',
  rate_limit_max_requests: '',
  reconnect_initial_delay: '',
  reconnect_max_delay: '',
  reconnect_backoff_multiplier: '',
  telegram_enabled: false,
  telegram_bot_token: '',
  telegram_token_configured: false,
  telegram_chat_id: '',
  email_enabled: false,
  email_service: '',
  email_user: '',
  email_password: '',
  email_password_configured: false,
  email_to: '',
  state_transitions: {},
};

const SettingsPage = ({ onRoomsChanged, plcStatuses = {}, allPlcsConnected = false }) => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [rooms, setRooms] = useState([]);
  const [plcs, setPlcs] = useState([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plcLoading, setPlcLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPlc, setSavingPlc] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [error, setError] = useState('');
  const [plcError, setPlcError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [copyingRoom, setCopyingRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_ROOM);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [deletingRooms, setDeletingRooms] = useState(false);
  const [editingPlc, setEditingPlc] = useState(null);
  const [plcForm, setPlcForm] = useState(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRoomsConfig();
      setRooms(data);
      setSelectedRooms((current) => current.filter((roomNumber) => (
        data.some((room) => room.room_number === roomNumber && Number(room.is_active))
      )));
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải cấu hình phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlcs = useCallback(async () => {
    setPlcLoading(true);
    setPlcError('');
    try {
      setPlcs(await api.getPlcsConfig());
    } catch (loadError) {
      setPlcError(loadError.message || 'Không thể tải cấu hình PLC');
    } finally {
      setPlcLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const currentSettings = await api.getSystemSettings();
      setSettings({
        ...EMPTY_SETTINGS,
        ...currentSettings,
        cors_origins: (currentSettings.cors_origins || []).join('\n'),
        telegram_bot_token: '',
        email_password: '',
      });
      setSettingsLoaded(true);
    } catch (loadError) {
      setSettingsError(loadError.message || 'Không thể tải cấu hình hệ thống');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
    loadPlcs();
    loadSettings();
  }, [loadPlcs, loadRooms, loadSettings]);

  const openGeneralTab = () => {
    setActiveTab('general');
    if (!settingsLoaded && !settingsLoading) loadSettings();
  };

  const openCreateForm = (templateRoom = null) => {
    setEditingRoom(null);
    setCopyingRoom(templateRoom?.room_number ?? null);
    setForm(templateRoom
      ? {
        ...templateRoom,
        room_number: '',
        is_active: 1,
        show_in_ui: Number(templateRoom.show_in_ui ?? 1),
      }
      : { ...EMPTY_ROOM });
    setFormOpen(true);
  };

  const openEditForm = (room) => {
    setEditingRoom(room.room_number);
    setCopyingRoom(null);
    setFormOpen(true);
    setForm({
      ...room,
      room_number: room.room_number,
      is_active: Number(room.is_active),
      show_in_ui: Number(room.show_in_ui ?? 1),
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRoom(null);
    setCopyingRoom(null);
    setForm({ ...EMPTY_ROOM });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        floor: Number(form.floor),
        y_main_coil: Number(form.y_main_coil),
        y_sub_coil: Number(form.y_sub_coil),
        x_input: Number(form.x_input),
        y_output_main: Number(form.y_output_main),
        y_output_sub: Number(form.y_output_sub),
        is_active: Number(form.is_active),
        show_in_ui: Number(form.show_in_ui),
      };
      if (editingRoom) {
        await api.updateRoom(editingRoom, payload);
        toast.success(`Đã cập nhật phòng ${editingRoom}`);
      } else {
        await api.createRoom(payload);
        toast.success(`Đã thêm phòng ${payload.room_number}`);
      }
      closeForm();
      await loadRooms();
      await onRoomsChanged();
    } catch (saveError) {
      toast.error(saveError.message || 'Không thể lưu cấu hình phòng');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (room) => {
    const nextActive = Number(room.is_active) ? 0 : 1;
    try {
      await api.updateRoom(room.room_number, { ...room, is_active: nextActive });
      toast.success(nextActive ? `Đã bật phòng ${room.room_number}` : `Đã tắt phòng ${room.room_number}`);
      await loadRooms();
      await onRoomsChanged();
    } catch (updateError) {
      toast.error(updateError.message || 'Không thể cập nhật trạng thái phòng');
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Vô hiệu hóa phòng ${room.room_number}?`)) return;
    try {
      await api.deleteRoom(room.room_number);
      toast.success(`Đã vô hiệu hóa phòng ${room.room_number}`);
      await loadRooms();
      await onRoomsChanged();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Không thể vô hiệu hóa phòng');
    }
  };

  const activeRooms = rooms.filter((room) => Number(room.is_active));
  const selectedActiveRoomCount = activeRooms.filter((room) => (
    selectedRooms.includes(room.room_number)
  )).length;
  const allActiveRoomsSelected = activeRooms.length > 0 &&
    activeRooms.every((room) => selectedRooms.includes(room.room_number));

  const toggleRoomSelection = (roomNumber) => {
    setSelectedRooms((current) => (
      current.includes(roomNumber)
        ? current.filter((selected) => selected !== roomNumber)
        : [...current, roomNumber]
    ));
  };

  const toggleAllActiveRooms = (checked) => {
    setSelectedRooms((current) => {
      const activeRoomNumbers = activeRooms.map((room) => room.room_number);
      if (checked) {
        return [...new Set([...current, ...activeRoomNumbers])];
      }
      return current.filter((roomNumber) => !activeRoomNumbers.includes(roomNumber));
    });
  };

  const handleDeleteSelectedRooms = async () => {
    const roomNumbers = selectedRooms.filter((roomNumber) => (
      activeRooms.some((room) => room.room_number === roomNumber)
    ));
    if (roomNumbers.length === 0) return;
    if (!window.confirm(`Vô hiệu hóa ${roomNumbers.length} phòng đã chọn (${roomNumbers.join(', ')})?`)) return;

    setDeletingRooms(true);
    const failedRooms = [];
    let deletedCount = 0;
    try {
      for (const roomNumber of roomNumbers) {
        try {
          await api.deleteRoom(roomNumber);
          deletedCount += 1;
        } catch (deleteError) {
          failedRooms.push(`${roomNumber}: ${deleteError.message || 'Không thể vô hiệu hóa'}`);
        }
      }

      if (deletedCount > 0) {
        await loadRooms();
        await onRoomsChanged();
      }
      setSelectedRooms(failedRooms.length > 0
        ? roomNumbers.filter((roomNumber) => failedRooms.some((failure) => failure.startsWith(`${roomNumber}:`)))
        : []);

      if (failedRooms.length > 0) {
        toast.error(`Đã vô hiệu hóa ${deletedCount}/${roomNumbers.length} phòng. Lỗi: ${failedRooms.join('; ')}`);
      } else {
        toast.success(`Đã vô hiệu hóa ${deletedCount} phòng`);
      }
    } finally {
      setDeletingRooms(false);
    }
  };

  const openPlcForm = (plc) => {
    setEditingPlc(plc.floor);
    setPlcForm({
      floor: plc.floor,
      ip: plc.ip,
      port: plc.port,
      slave_id: plc.slave_id,
      timeout: plc.timeout,
      start_address: plc.start_address,
      register_count: plc.register_count,
    });
  };

  const openCreatePlcForm = () => {
    setEditingPlc(null);
    setPlcForm({ ...EMPTY_PLC });
  };

  const closePlcForm = () => {
    setEditingPlc(null);
    setPlcForm(null);
  };

  const handleSavePlc = async (event) => {
    event.preventDefault();
    setSavingPlc(true);
    try {
      const payload = {
        ...plcForm,
        floor: Number(plcForm.floor),
        port: Number(plcForm.port),
        slave_id: Number(plcForm.slave_id),
        timeout: Number(plcForm.timeout),
        start_address: Number(plcForm.start_address),
        register_count: Number(plcForm.register_count),
      };
      if (editingPlc === null) {
        await api.createPlc(payload);
        toast.success(`Đã thêm PLC tầng ${payload.floor}; đang kết nối`);
      } else {
        await api.updatePlc(editingPlc, payload);
        toast.success(`Đã lưu PLC tầng ${editingPlc}; đang kết nối lại`);
      }
      closePlcForm();
      await loadPlcs();
    } catch (saveError) {
      toast.error(saveError.message || 'Không thể lưu cấu hình PLC');
    } finally {
      setSavingPlc(false);
    }
  };

  const handleDeletePlc = async (plc) => {
    const hasRooms = rooms.some((room) => Number(room.floor) === Number(plc.floor));
    if (hasRooms) {
      toast.error(`Không thể xóa PLC tầng ${plc.floor} vì tầng này vẫn còn phòng`);
      return;
    }
    if (!window.confirm(`Xóa cấu hình PLC tầng ${plc.floor}?`)) return;

    setSavingPlc(true);
    try {
      await api.deletePlc(plc.floor);
      toast.success(`Đã xóa PLC tầng ${plc.floor}`);
      await loadPlcs();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Không thể xóa cấu hình PLC');
    } finally {
      setSavingPlc(false);
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        port: Number(settings.port),
        polling_interval: Number(settings.polling_interval),
        http_keep_alive_timeout: Number(settings.http_keep_alive_timeout),
        cors_origins: settings.cors_origins.split(/\r?\n/).map((origin) => origin.trim()).filter(Boolean),
        rate_limit_window_ms: Number(settings.rate_limit_window_ms),
        rate_limit_max_requests: Number(settings.rate_limit_max_requests),
        reconnect_initial_delay: Number(settings.reconnect_initial_delay),
        reconnect_max_delay: Number(settings.reconnect_max_delay),
        reconnect_backoff_multiplier: Number(settings.reconnect_backoff_multiplier),
        interlock_enabled: Boolean(settings.interlock_enabled),
        write_relay_enabled: Boolean(settings.write_relay_enabled),
        telegram_enabled: Boolean(settings.telegram_enabled),
        telegram_chat_id: settings.telegram_chat_id,
        email_enabled: Boolean(settings.email_enabled),
        email_service: settings.email_service,
        email_user: settings.email_user,
        email_to: settings.email_to,
        state_transitions: settings.state_transitions,
      };
      if (settings.telegram_bot_token.trim()) {
        payload.telegram_bot_token = settings.telegram_bot_token.trim();
      }
      if (settings.email_password.trim()) {
        payload.email_password = settings.email_password.trim();
      }

      const result = await api.updateSystemSettings(payload);
      setSettings({
        ...EMPTY_SETTINGS,
        ...result.settings,
        cors_origins: (result.settings.cors_origins || []).join('\n'),
        telegram_bot_token: '',
        email_password: '',
      });
      toast.success(result.restartRequired
        ? 'Đã lưu cấu hình. Cần khởi động lại backend để áp dụng cổng, keep-alive hoặc rate limit mới.'
        : 'Đã lưu cấu hình hệ thống');
    } catch (saveError) {
      toast.error(saveError.message || 'Không thể lưu cấu hình hệ thống');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const result = await api.testTelegram();
      toast.success(result.message || 'Đã gửi tin nhắn kiểm tra Telegram');
    } catch (testError) {
      toast.error(testError.message || 'Không thể gửi tin nhắn kiểm tra Telegram');
    } finally {
      setTestingTelegram(false);
    }
  };

  const refreshCurrentTab = {
    rooms: loadRooms,
    plcs: loadPlcs,
    general: loadSettings,
  }[activeTab];
  const currentTabLoading = {
    rooms: loading,
    plcs: plcLoading,
    general: settingsLoading,
  }[activeTab];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6">
      <div className="w-full">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cài đặt hệ thống</h2>
              <p className="text-sm text-slate-500">Quản lý cấu hình phòng và PLC Modbus</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab !== 'users' && (
              <button
                type="button"
                onClick={refreshCurrentTab}
                disabled={currentTabLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${currentTabLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            )}
            {activeTab === 'rooms' && (
              <>
                {selectedActiveRoomCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedRooms}
                    disabled={deletingRooms}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletingRooms
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                    Vô hiệu hóa đã chọn ({selectedActiveRoomCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Thêm phòng mới
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'rooms' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Quản lý phòng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plcs')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'plcs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="h-4 w-4" />
            Quản lý PLC
          </button>
          <button
            type="button"
            onClick={openGeneralTab}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'general' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell className="h-4 w-4" />
            Cấu hình chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'users' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Quản lý người dùng
          </button>
        </div>

        {activeTab === 'rooms' && error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'rooms' && <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải danh sách phòng...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Chọn tất cả phòng đang bật"
                        checked={allActiveRoomsSelected}
                        onChange={(event) => toggleAllActiveRooms(event.target.checked)}
                        disabled={activeRooms.length === 0 || deletingRooms}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3">Phòng</th>
                    <th className="px-4 py-3">Tầng</th>
                    <th className="px-4 py-3">Y Main</th>
                    <th className="px-4 py-3">Y Sub</th>
                    <th className="px-4 py-3">X Input</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Giao diện</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rooms.map((room) => (
                    <tr key={room.room_number} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn phòng ${room.room_number}`}
                          checked={selectedRooms.includes(room.room_number)}
                          onChange={() => toggleRoomSelection(room.room_number)}
                          disabled={!Number(room.is_active) || deletingRooms}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{room.room_number}</td>
                      <td className="px-4 py-3 text-slate-600">{room.floor}</td>
                      <td className="px-4 py-3 text-slate-600">{room.y_main_coil} / bit {room.y_output_main}</td>
                      <td className="px-4 py-3 text-slate-600">{room.y_sub_coil} / bit {room.y_output_sub}</td>
                      <td className="px-4 py-3 text-slate-600">{room.x_input}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          Number(room.is_active) ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {Number(room.is_active) ? 'Đang bật' : 'Đã tắt'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          Number(room.show_in_ui ?? 1) ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {Number(room.show_in_ui ?? 1) ? 'Đang hiển thị' : 'Ẩn khỏi giao diện'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => openEditForm(room)}
                            disabled={deletingRooms}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Sao chép cấu hình phòng"
                            aria-label={`Sao chép cấu hình phòng ${room.room_number}`}
                            onClick={() => openCreateForm(room)}
                            disabled={deletingRooms}
                            className="rounded-lg p-2 text-slate-500 hover:bg-green-50 hover:text-green-700 disabled:opacity-40"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={Number(room.is_active) ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            onClick={() => handleToggleActive(room)}
                            disabled={deletingRooms}
                            className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Vô hiệu hóa phòng"
                            onClick={() => handleDelete(room)}
                            disabled={deletingRooms || !Number(room.is_active)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rooms.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center text-slate-500">
                        Chưa có cấu hình phòng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>}

        {activeTab === 'plcs' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openCreatePlcForm}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thêm PLC
              </button>
            </div>
            <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
              allPlcsConnected
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              <span>{allPlcsConnected ? 'Tất cả PLC đang kết nối' : 'Có PLC đang mất kết nối hoặc chưa có trạng thái'}</span>
              <span>{Object.values(plcStatuses).filter(Boolean).length}/{plcs.length} kết nối</span>
            </div>
            {plcError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {plcError}
              </div>
            )}
            <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {plcLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang tải danh sách PLC...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Tầng</th>
                        <th className="px-4 py-3">Địa chỉ PLC</th>
                        <th className="px-4 py-3">Cổng</th>
                        <th className="px-4 py-3">Mã thiết bị</th>
                        <th className="px-4 py-3">Thời gian chờ</th>
                        <th className="px-4 py-3">Thanh ghi</th>
                        <th className="px-4 py-3">Kết nối</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plcs.map((plc) => {
                        const isConnected = Boolean(plcStatuses[plc.floor] ?? plc.connected);
                        return (
                          <tr key={plc.floor} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-800">{plc.floor}</td>
                            <td className="px-4 py-3 text-slate-600">{plc.ip}</td>
                            <td className="px-4 py-3 text-slate-600">{plc.port}</td>
                            <td className="px-4 py-3 text-slate-600">{plc.slave_id}</td>
                            <td className="px-4 py-3 text-slate-600">{plc.timeout} ms</td>
                            <td className="px-4 py-3 text-slate-600">{plc.start_address}–{plc.start_address + plc.register_count - 1}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                title="Chỉnh sửa cấu hình PLC"
                                onClick={() => openPlcForm(plc)}
                                disabled={savingPlc}
                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title={rooms.some((room) => Number(room.floor) === Number(plc.floor))
                                  ? 'Không thể xóa PLC đang có phòng'
                                  : 'Xóa cấu hình PLC'}
                                onClick={() => handleDeletePlc(plc)}
                                disabled={savingPlc || rooms.some((room) => Number(room.floor) === Number(plc.floor))}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {plcs.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-4 py-12 text-center text-slate-500">Chưa có cấu hình PLC nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  {settingsError && (
                    <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {settingsError}
                      <button
                        type="button"
                        onClick={loadSettings}
                        disabled={settingsLoading}
                        className="font-semibold underline disabled:opacity-50"
                      >
                        Thử tải lại
                      </button>
                    </div>
                  )}
                  {settingsLoading && (
                    <div role="status" className="mb-5 flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang tải cấu hình hệ thống...
                    </div>
                  )}
                  <form onSubmit={handleSaveSettings} className="space-y-7">
                    <fieldset disabled={!settingsLoaded || settingsLoading} className="w-full space-y-7 disabled:opacity-60">
                      <section>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Hệ thống</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="text-sm font-medium text-slate-700">
                            Cổng backend
                            <input
                              type="number"
                              required
                              min="1"
                              max="65535"
                              value={settings.port}
                              onChange={(event) => setSettings({ ...settings, port: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <span className="mt-1 block text-xs font-normal text-slate-500">
                              Thay đổi cổng cần khởi động lại backend.
                            </span>
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Chu kỳ đọc PLC (ms)
                            <input
                              type="number"
                              required
                              min="50"
                              max="60000"
                              value={settings.polling_interval}
                              onChange={(event) => setSettings({ ...settings, polling_interval: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <label className="text-sm font-medium text-slate-700">
                            HTTP keep-alive (ms)
                            <input
                              type="number"
                              required
                              min="1000"
                              max="300000"
                              value={settings.http_keep_alive_timeout}
                              onChange={(event) => setSettings({ ...settings, http_keep_alive_timeout: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <span className="mt-1 block text-xs font-normal text-slate-500">Cần khởi động lại backend để áp dụng.</span>
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Cửa sổ giới hạn request (ms)
                            <input
                              type="number"
                              required
                              min="1000"
                              max="3600000"
                              value={settings.rate_limit_window_ms}
                              onChange={(event) => setSettings({ ...settings, rate_limit_window_ms: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <span className="mt-1 block text-xs font-normal text-slate-500">Cần khởi động lại backend để áp dụng.</span>
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Request tối đa / cửa sổ
                            <input
                              type="number"
                              required
                              min="1"
                              max="100000"
                              value={settings.rate_limit_max_requests}
                              onChange={(event) => setSettings({ ...settings, rate_limit_max_requests: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <span className="mt-1 block text-xs font-normal text-slate-500">Cần khởi động lại backend để áp dụng.</span>
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Reconnect ban đầu (ms)
                            <input
                              type="number"
                              required
                              min="100"
                              max="300000"
                              value={settings.reconnect_initial_delay}
                              onChange={(event) => setSettings({ ...settings, reconnect_initial_delay: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Reconnect tối đa (ms)
                            <input
                              type="number"
                              required
                              min="100"
                              max="3600000"
                              value={settings.reconnect_max_delay}
                              onChange={(event) => setSettings({ ...settings, reconnect_max_delay: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Hệ số tăng reconnect
                            <input
                              type="number"
                              required
                              min="1"
                              max="10"
                              step="0.1"
                              value={settings.reconnect_backoff_multiplier}
                              onChange={(event) => setSettings({ ...settings, reconnect_backoff_multiplier: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                        </div>
                        <label className="mt-4 block text-sm font-medium text-slate-700">
                          CORS origins (mỗi dòng một origin)
                          <textarea
                            rows="3"
                            value={settings.cors_origins}
                            onChange={(event) => setSettings({ ...settings, cors_origins: event.target.value })}
                            placeholder="https://example.com"
                            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <span className="mt-1 block text-xs font-normal text-slate-500">Chỉ nhập scheme + hostname + port, không gồm path.</span>
                        </label>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(settings.interlock_enabled)}
                              onChange={(event) => setSettings({ ...settings, interlock_enabled: event.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Tự động tắt relay phụ khi relay chính tắt
                          </label>
                          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(settings.write_relay_enabled)}
                              onChange={(event) => setSettings({ ...settings, write_relay_enabled: event.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Cho phép ghi relay
                          </label>
                        </div>
                      </section>

                      <section className="border-t border-slate-100 pt-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Thông báo Telegram</h3>
                            <p className="mt-1 text-xs text-slate-500">Bot token được ẩn khi tải cấu hình.</p>
                          </div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(settings.telegram_enabled)}
                              onChange={(event) => setSettings({ ...settings, telegram_enabled: event.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Bật Telegram
                          </label>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="text-sm font-medium text-slate-700">
                            Bot Token
                            <input
                              type="password"
                              autoComplete="new-password"
                              required={Boolean(settings.telegram_enabled && !settings.telegram_token_configured)}
                              disabled={!settings.telegram_enabled}
                              value={settings.telegram_bot_token}
                              placeholder={settings.telegram_token_configured ? 'Đã cấu hình (để trống để giữ nguyên)' : 'Nhập token bot'}
                              onChange={(event) => setSettings({ ...settings, telegram_bot_token: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Chat ID
                            <input
                              type="text"
                              required={Boolean(settings.telegram_enabled)}
                              disabled={!settings.telegram_enabled}
                              value={settings.telegram_chat_id}
                              onChange={(event) => setSettings({ ...settings, telegram_chat_id: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                        </div>
                      </section>

                      <section className="border-t border-slate-100 pt-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Thông báo Email</h3>
                            <p className="mt-1 text-xs text-slate-500">Mật khẩu ứng dụng được ẩn khi tải cấu hình.</p>
                          </div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(settings.email_enabled)}
                              onChange={(event) => setSettings({ ...settings, email_enabled: event.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Bật Email
                          </label>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="text-sm font-medium text-slate-700">
                            Dịch vụ
                            <input
                              type="text"
                              required={Boolean(settings.email_enabled)}
                              disabled={!settings.email_enabled}
                              value={settings.email_service}
                              onChange={(event) => setSettings({ ...settings, email_service: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Email gửi
                            <input
                              type="email"
                              required={Boolean(settings.email_enabled)}
                              disabled={!settings.email_enabled}
                              value={settings.email_user}
                              onChange={(event) => setSettings({ ...settings, email_user: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Mật khẩu ứng dụng
                            <input
                              type="password"
                              autoComplete="new-password"
                              required={Boolean(settings.email_enabled && !settings.email_password_configured)}
                              disabled={!settings.email_enabled}
                              value={settings.email_password}
                              placeholder={settings.email_password_configured ? 'Đã cấu hình (để trống để giữ nguyên)' : 'Nhập mật khẩu ứng dụng'}
                              onChange={(event) => setSettings({ ...settings, email_password: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Email nhận
                            <input
                              type="email"
                              required={Boolean(settings.email_enabled)}
                              disabled={!settings.email_enabled}
                              value={settings.email_to}
                              onChange={(event) => setSettings({ ...settings, email_to: event.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </label>
                        </div>
                      </section>

                      <section className="border-t border-slate-100 pt-6">
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Các trạng thái phòng</h3>
                        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {ROOM_STATES.map(({ name, description }) => (
                            <div key={name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <p className="text-sm font-semibold text-slate-800">{name}</p>
                              <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
                            </div>
                          ))}
                        </div>
                        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Mô tả chuyển trạng thái</h3>
                        <p className="mb-4 text-xs text-slate-500">Mô tả giúp nhận biết sự kiện; có thể chỉnh nội dung thông báo gửi đi bên dưới.</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {Object.entries(settings.state_transitions || {}).map(([transition, message]) => (
                            <div key={transition} className="rounded-lg border border-slate-200 p-3">
                              <label className="block text-sm font-semibold text-slate-700" htmlFor={`transition-${encodeURIComponent(transition)}`}>
                                {transition.replace('-', ' → ')}
                              </label>
                              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                {STATE_TRANSITION_DESCRIPTIONS[transition] || 'Thay đổi tín hiệu làm phòng chuyển sang trạng thái mới.'}
                              </p>
                              <label className="mt-3 block text-xs font-medium text-slate-600" htmlFor={`transition-${encodeURIComponent(transition)}`}>
                                Nội dung thông báo
                              </label>
                              <textarea
                                id={`transition-${encodeURIComponent(transition)}`}
                                rows="2"
                                maxLength="500"
                                value={message}
                                onChange={(event) => setSettings({
                                  ...settings,
                                  state_transitions: {
                                    ...settings.state_transitions,
                                    [transition]: event.target.value,
                                  },
                                })}
                                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          ))}
                        </div>
                      </section>

                      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                        <button
                          type="button"
                          onClick={handleTestTelegram}
                          disabled={testingTelegram || !settings.telegram_token_configured}
                          className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {testingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Kiểm tra Telegram đã lưu
                        </button>
                        <button
                          type="submit"
                          disabled={savingSettings || !settingsLoaded || settingsLoading}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Lưu cấu hình
                        </button>
                      </div>
                    </fieldset>
                  </form>
          </div>
        )}
      </div>

      {activeTab === 'users' && <UserManagementPage />}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-800">{editingRoom ? `Sửa phòng ${editingRoom}` : copyingRoom ? `Sao chép cấu hình phòng ${copyingRoom}` : 'Thêm phòng mới'}</h3>
                <p className="mt-1 text-xs text-slate-500">Nhập số phòng, tầng và địa chỉ/bit Modbus</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Số phòng
                  <input
                    required
                    pattern="[1-9][0-9]{0,7}"
                    disabled={editingRoom !== null}
                    value={form.room_number}
                    onChange={(event) => setForm({ ...form, room_number: event.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </label>
                {FIELD_CONFIG.map(({ name, label, min, max }) => (
                  <label key={name} className="text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type="number"
                      required
                      min={min}
                      max={max}
                      step="1"
                      value={form[name]}
                      onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Mô tả
                  <input
                    maxLength="200"
                    value={form.description || ''}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={Number(form.is_active) === 1}
                    onChange={(event) => setForm({ ...form, is_active: event.target.checked ? 1 : 0 })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Kích hoạt phòng
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={Number(form.show_in_ui) === 1}
                    onChange={(event) => setForm({
                      ...form,
                      show_in_ui: event.target.checked ? 1 : 0
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Hiển thị phòng trên giao diện (bỏ chọn vẫn có thể điều khiển qua API)
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeForm} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {plcForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-800">{editingPlc === null ? 'Thêm PLC mới' : `Cấu hình PLC tầng ${editingPlc}`}</h3>
                <p className="mt-1 text-xs text-slate-500">Lưu cấu hình sẽ ngắt kết nối hiện tại và kết nối lại PLC</p>
              </div>
              <button type="button" onClick={closePlcForm} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSavePlc} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {editingPlc === null && (
                  <label className="text-sm font-medium text-slate-700">
                    Tầng
                    <input
                      type="number"
                      required
                      min="1"
                      max="99"
                      step="1"
                      value={plcForm.floor}
                      onChange={(event) => setPlcForm({ ...plcForm, floor: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                )}
                {PLC_FIELDS.map(({ name, label, type, min, max }) => (
                  <label key={name} className="text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type={type}
                      required
                      min={min}
                      max={max}
                      step={type === 'number' ? '1' : undefined}
                      value={plcForm[name]}
                      onChange={(event) => setPlcForm({ ...plcForm, [name]: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={closePlcForm} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingPlc}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingPlc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu và kết nối lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
