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

test('shows the Vietnamese label for the room overview', () => {
  render(<Sidebar {...defaultProps} />);

  expect(screen.getByRole('button', { name: 'Sơ đồ' })).toBeInTheDocument();
});

test('opens the user guide when its navigation item is selected', () => {
  const onNavigate = jest.fn();
  render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);

  fireEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }));

  expect(onNavigate).toHaveBeenCalledWith('guide');
});

test('shows section links under the guide item and navigates to a selected section', () => {
  const onNavigate = jest.fn();
  render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);

  const guideItem = screen.getByRole('button', { name: 'Hướng dẫn' }).parentElement;
  const sectionNav = guideItem.querySelector('nav[aria-label="Điều hướng hướng dẫn"]');
  const sectionLink = document.querySelector('a[href="#1-2-y-nghia-mau-sac-va-trang-thai-phong"]');

  expect(sectionNav).toBeInTheDocument();
  expect(sectionNav.parentElement).toHaveClass('group-hover:grid-rows-[1fr]');
  expect(sectionNav.parentElement).not.toHaveClass('absolute');
  expect(sectionLink).toHaveTextContent('1.2. Trạng thái phòng');
  fireEvent.click(sectionLink);

  expect(onNavigate).toHaveBeenCalledWith('guide');
  expect(window.location.hash).toBe('#1-2-y-nghia-mau-sac-va-trang-thai-phong');
  window.history.replaceState(null, '', window.location.pathname);
});

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
