import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

const defaultProps = {
  activePage: 'dashboard',
  onNavigate: jest.fn(),
  connected: true,
  onRefresh: jest.fn(),
  onLogout: jest.fn(),
  user: { username: 'admin', role: 'admin' },
  collapsed: false,
  onToggleCollapse: jest.fn(),
  mobileOpen: false,
  onMobileClose: jest.fn(),
  unreadCount: 0,
};

test('opens change-password page when profile is clicked', () => {
  const onNavigate = jest.fn();
  render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);

  fireEvent.click(screen.getByRole('button', { name: /admin admin/i }));

  expect(onNavigate).toHaveBeenCalledWith('changePassword');
});

test('closes the mobile sidebar after opening the profile page', () => {
  const onNavigate = jest.fn();
  const onMobileClose = jest.fn();
  render(
    <Sidebar
      {...defaultProps}
      onNavigate={onNavigate}
      mobileOpen
      onMobileClose={onMobileClose}
    />
  );

  fireEvent.click(screen.getAllByRole('button', { name: /admin admin/i })[1]);

  expect(onNavigate).toHaveBeenCalledWith('changePassword');
  expect(onMobileClose).toHaveBeenCalled();
});
