import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UserManagementPage from './UserManagementPage';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    getUsers: jest.fn().mockResolvedValue([]),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

test('creates a user through the admin user-management form', async () => {
  api.getUsers.mockResolvedValue([]);
  api.createUser.mockResolvedValue({});
  render(<UserManagementPage />);

  fireEvent.click(await screen.findByRole('button', { name: /Thêm người dùng/i }));
  fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'staff01' } });
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Nhân viên' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'staff-password-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu người dùng' }));

  await waitFor(() => {
    expect(api.createUser).toHaveBeenCalledWith({
      username: 'staff01',
      full_name: 'Nhân viên',
      role: 'user',
      password: 'staff-password-1',
    });
  });
});
