import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    getRoomsConfig: jest.fn().mockResolvedValue([]),
    getPlcsConfig: jest.fn().mockResolvedValue([]),
    getSystemSettings: jest.fn(),
    createRoom: jest.fn(),
    deleteRoom: jest.fn(),
    createPlc: jest.fn(),
    updateRoom: jest.fn(),
    updatePlc: jest.fn(),
    deletePlc: jest.fn(),
    updateSystemSettings: jest.fn(),
  },
}));

beforeEach(() => {
  api.getRoomsConfig.mockResolvedValue([]);
  api.getPlcsConfig.mockResolvedValue([]);
});

test('allows an admin to add a PLC and refreshes the PLC list', async () => {
  api.createPlc.mockResolvedValue({ success: true });

  render(<SettingsPage onRoomsChanged={jest.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Quản lý PLC' }));
  fireEvent.click(screen.getByRole('button', { name: 'Thêm PLC' }));

  fireEvent.change(screen.getByRole('spinbutton', { name: 'Tầng' }), { target: { value: '8' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Địa chỉ IP' }), { target: { value: '192.168.1.8' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu và kết nối lại' }));

  await waitFor(() => {
    expect(api.createPlc).toHaveBeenCalledWith({
      floor: 8,
      ip: '192.168.1.8',
      port: 502,
      slave_id: 1,
      timeout: 3000,
      start_address: 100,
      register_count: 2,
    });
    expect(api.getPlcsConfig).toHaveBeenCalledTimes(2);
  });
});

test('deletes a PLC without rooms after confirmation', async () => {
  api.getPlcsConfig.mockResolvedValue([{
    floor: 8,
    ip: '192.168.1.8',
    port: 502,
    slave_id: 1,
    timeout: 3000,
    start_address: 100,
    register_count: 2,
  }]);
  api.deletePlc.mockResolvedValue({ success: true });
  jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(<SettingsPage onRoomsChanged={jest.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Quản lý PLC' }));
  fireEvent.click(await screen.findByTitle('Xóa cấu hình PLC'));

  await waitFor(() => {
    expect(api.deletePlc).toHaveBeenCalledWith(8);
    expect(api.getPlcsConfig).toHaveBeenCalledTimes(2);
  });
});

test('allows an admin to update an existing PLC', async () => {
  api.getPlcsConfig.mockResolvedValue([{
    floor: 8,
    ip: '192.168.1.8',
    port: 502,
    slave_id: 1,
    timeout: 3000,
    start_address: 100,
    register_count: 2,
  }]);
  api.updatePlc.mockResolvedValue({ success: true });

  render(<SettingsPage onRoomsChanged={jest.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Quản lý PLC' }));
  fireEvent.click(await screen.findByTitle('Chỉnh sửa cấu hình PLC'));
  fireEvent.change(screen.getByRole('textbox', { name: 'Địa chỉ IP' }), {
    target: { value: '192.168.1.18' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu và kết nối lại' }));

  await waitFor(() => {
    expect(api.updatePlc).toHaveBeenCalledWith(8, {
      floor: 8,
      ip: '192.168.1.18',
      port: 502,
      slave_id: 1,
      timeout: 3000,
      start_address: 100,
      register_count: 2,
    });
    expect(api.getPlcsConfig).toHaveBeenCalledTimes(2);
  });
});

test('allows an active API room to be hidden from the frontend', async () => {
  api.getRoomsConfig.mockResolvedValue([{
    room_number: '801',
    floor: 8,
    y_main_coil: 501,
    y_sub_coil: 509,
    x_input: 0,
    y_output_main: 0,
    y_output_sub: 8,
    is_active: 1,
    show_in_ui: 0,
  }]);

  render(<SettingsPage onRoomsChanged={jest.fn()} />);

  expect(await screen.findByText('Ẩn khỏi giao diện')).toBeVisible();
  fireEvent.click(screen.getByTitle('Chỉnh sửa'));

  expect(await screen.findByRole('checkbox', {
    name: 'Hiển thị phòng trên giao diện (bỏ chọn vẫn có thể điều khiển qua API)',
  })).not.toBeChecked();
});

test('copies a room configuration into a new room form', async () => {
  const templateRoom = {
    room_number: '801',
    floor: 8,
    y_main_coil: 501,
    y_sub_coil: 509,
    x_input: 2,
    y_output_main: 3,
    y_output_sub: 8,
    description: 'Phòng mẫu',
    is_active: 1,
    show_in_ui: 0,
  };
  api.getRoomsConfig.mockResolvedValue([templateRoom]);
  api.createRoom.mockResolvedValue({ success: true });

  render(<SettingsPage onRoomsChanged={jest.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sao chép cấu hình phòng 801' }));

  expect(screen.getByRole('heading', { name: 'Sao chép cấu hình phòng 801' })).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'Số phòng' })).toHaveValue('');
  expect(screen.getByRole('spinbutton', { name: 'Tầng' })).toHaveValue(8);
  expect(screen.getByRole('spinbutton', { name: 'Y Main (coil)' })).toHaveValue(501);
  expect(screen.getByRole('spinbutton', { name: 'Y Sub (coil)' })).toHaveValue(509);
  expect(screen.getByRole('spinbutton', { name: 'X Input (bit)' })).toHaveValue(2);
  expect(screen.getByRole('spinbutton', { name: 'Y Output Main (bit)' })).toHaveValue(3);
  expect(screen.getByRole('spinbutton', { name: 'Y Output Sub (bit)' })).toHaveValue(8);
  expect(screen.getByRole('textbox', { name: 'Mô tả' })).toHaveValue('Phòng mẫu');
  expect(screen.getByRole('checkbox', {
    name: 'Hiển thị phòng trên giao diện (bỏ chọn vẫn có thể điều khiển qua API)',
  })).not.toBeChecked();

  fireEvent.change(screen.getByRole('textbox', { name: 'Số phòng' }), {
    target: { value: '802' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình' }));

  await waitFor(() => {
    expect(api.createRoom).toHaveBeenCalledWith({
      ...templateRoom,
      room_number: '802',
      is_active: 1,
    });
  });
});

test('selects and deactivates multiple rooms', async () => {
  api.getRoomsConfig.mockResolvedValue([
    { room_number: '801', floor: 8, is_active: 1 },
    { room_number: '802', floor: 8, is_active: 1 },
    { room_number: '803', floor: 8, is_active: 0 },
  ]);
  api.deleteRoom.mockResolvedValue({ success: true });
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(<SettingsPage onRoomsChanged={jest.fn()} />);
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Chọn tất cả phòng đang bật' }));
  expect(screen.getByRole('checkbox', { name: 'Chọn phòng 801' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Chọn phòng 802' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Chọn phòng 803' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Vô hiệu hóa đã chọn (2)' }));

  await waitFor(() => {
    expect(confirmSpy).toHaveBeenCalledWith('Vô hiệu hóa 2 phòng đã chọn (801, 802)?');
    expect(api.deleteRoom).toHaveBeenNthCalledWith(1, '801');
    expect(api.deleteRoom).toHaveBeenNthCalledWith(2, '802');
  });
});

test('renders system settings independently from the PLC tab', async () => {
  api.getSystemSettings.mockResolvedValue({
    port: 3000,
    polling_interval: 500,
    interlock_enabled: false,
    write_relay_enabled: true,
    http_keep_alive_timeout: 60000,
    cors_origins: ['http://localhost:3001'],
    rate_limit_window_ms: 60000,
    rate_limit_max_requests: 100,
    reconnect_initial_delay: 2000,
    reconnect_max_delay: 30000,
    reconnect_backoff_multiplier: 1.5,
    telegram_enabled: false,
    telegram_token_configured: false,
    telegram_chat_id: '',
    email_enabled: false,
    email_service: 'gmail',
    email_user: '',
    email_password_configured: false,
    email_to: '',
    state_transitions: { 'Trống-Có khách': 'Thông báo' },
  });
  render(<SettingsPage onRoomsChanged={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: /Cấu hình chung/i }));

  expect(await screen.findByRole('heading', { name: 'Hệ thống' })).toBeVisible();
  await waitFor(() => expect(api.getSystemSettings).toHaveBeenCalled());
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: /HTTP keep-alive/ })).toHaveValue(60000);
    expect(screen.getByRole('spinbutton', { name: /Cửa sổ giới hạn request/ })).toHaveValue(60000);
    expect(screen.getByRole('textbox', { name: 'Dịch vụ' })).toHaveValue('gmail');
    expect(screen.getByText('Trống')).toBeVisible();
    expect(screen.getByText('Chờ khách')).toBeVisible();
    expect(screen.getByText('Có khách')).toBeVisible();
    expect(screen.getByText('Mở điện và phát hiện khách cùng lúc.')).toBeVisible();
    expect(screen.getByDisplayValue('Thông báo')).toBeVisible();
  });
  api.updateSystemSettings.mockResolvedValue({
    restartRequired: false,
    settings: { cors_origins: [] },
  });
  expect(screen.getByRole('textbox', { name: 'Chat ID' })).not.toBeRequired();
  expect(screen.getByRole('textbox', { name: 'Email gửi' })).not.toBeRequired();
  expect(screen.getByRole('textbox', { name: 'Email nhận' })).not.toBeRequired();
  expect(screen.getByLabelText('Bot Token')).not.toBeRequired();
  expect(screen.getByLabelText('Mật khẩu ứng dụng')).not.toBeRequired();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bật Telegram' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bật Email' }));
  expect(screen.getByRole('textbox', { name: 'Chat ID' })).toBeRequired();
  expect(screen.getByRole('textbox', { name: 'Email gửi' })).toBeRequired();
  expect(screen.getByRole('textbox', { name: 'Email nhận' })).toBeRequired();
  expect(screen.getByLabelText('Bot Token')).toBeRequired();
  expect(screen.getByLabelText('Mật khẩu ứng dụng')).toBeRequired();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bật Telegram' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bật Email' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình' }));
  await waitFor(() => {
    expect(api.updateSystemSettings).toHaveBeenCalledWith(expect.objectContaining({
      telegram_enabled: false,
      telegram_chat_id: '',
      email_enabled: false,
      email_user: '',
      email_to: '',
    }));
  });
  await waitFor(() => expect(api.getSystemSettings).toHaveBeenCalled());
});
