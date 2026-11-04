import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChangePasswordPage from './ChangePasswordPage';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    changePassword: jest.fn(),
  },
}));

test('submits the current and new password to the backend', async () => {
  api.changePassword.mockResolvedValue({ success: true });
  render(<ChangePasswordPage />);

  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'old-password' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'new-password-1' } });
  fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), { target: { value: 'new-password-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }));

  await waitFor(() => {
    expect(api.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      newPassword: 'new-password-1',
    });
  });
});

test('does not submit when confirmation does not match', async () => {
  render(<ChangePasswordPage />);

  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'old-password' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'new-password-1' } });
  fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), { target: { value: 'different-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu mới nhập lại không khớp.');
  expect(api.changePassword).not.toHaveBeenCalled();
});
