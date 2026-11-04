import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import App from './App';
import api from './services/api';

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    verifyToken: jest.fn(),
    recordActivity: jest.fn(),
    getPlcStatus: jest.fn(),
    getNotifications: jest.fn(),
    getRoomStates: jest.fn(),
  },
}));

jest.mock('./Login', () => ({
  __esModule: true,
  default: () => <div>Login screen</div>,
}));

jest.mock('./components/Sidebar', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/DashboardPage', () => ({
  __esModule: true,
  default: ({ rooms = [] }) => (
    <div data-testid="dashboard-rooms">
      {rooms.map(({ room }) => <span key={room}>{room}</span>)}
    </div>
  ),
}));
jest.mock('./components/HistoryPage', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/SettingsPage', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/NotificationPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/ChangePasswordPage', () => ({ __esModule: true, default: () => null }));
jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  api.getRoomStates.mockResolvedValue([]);
  api.getNotifications.mockResolvedValue([]);
  api.getPlcStatus.mockResolvedValue({ data: {} });
  io.mockReturnValue({ on: jest.fn(), close: jest.fn() });
});

test('does not open protected pages before checking and logs out on an expired token', async () => {
  sessionStorage.setItem('accessToken', 'test-token');
  localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }));
  let resolveVerification;
  api.verifyToken.mockReturnValue(new Promise((resolve) => {
    resolveVerification = resolve;
  }));

  render(<App />);

  expect(screen.getByRole('status')).toHaveTextContent('Đang xác thực token đăng nhập');
  expect(api.getRoomStates).not.toHaveBeenCalled();
  expect(api.getNotifications).not.toHaveBeenCalled();
  resolveVerification({ authenticated: false });

  expect(await screen.findByText('Login screen')).toBeVisible();
  await waitFor(() => expect(localStorage.getItem('user')).toBeNull());
  expect(sessionStorage.getItem('accessToken')).toBeNull();
  expect(api.getRoomStates).not.toHaveBeenCalled();
  expect(api.getNotifications).not.toHaveBeenCalled();
});

test('logs out immediately when activity reports an expired idle token', async () => {
  sessionStorage.setItem('accessToken', 'test-token');
  localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }));
  api.verifyToken.mockResolvedValue({
    authenticated: true,
    user: { username: 'admin', role: 'admin' },
  });
  api.recordActivity.mockResolvedValue(false);

  render(<App />);
  await waitFor(() => expect(api.getRoomStates).toHaveBeenCalled());

  fireEvent.pointerDown(window);

  expect(await screen.findByText('Login screen')).toBeVisible();
  expect(localStorage.getItem('user')).toBeNull();
});

test('keeps API rooms hidden from the frontend while showing configured rooms', async () => {
  sessionStorage.setItem('accessToken', 'test-token');
  localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }));
  api.verifyToken.mockResolvedValue({
    authenticated: true,
    user: { username: 'admin', role: 'admin' },
  });
  api.getRoomStates.mockResolvedValue([
    { room: 801, floor: 8, show_in_ui: 0 },
    { room: 802, floor: 8, show_in_ui: 1 },
  ]);

  render(<App />);

  expect(await screen.findByTestId('dashboard-rooms')).toHaveTextContent('802');
  expect(screen.getByTestId('dashboard-rooms')).not.toHaveTextContent('801');
});
