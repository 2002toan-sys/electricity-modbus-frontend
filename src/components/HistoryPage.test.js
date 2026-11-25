import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HistoryPage from './HistoryPage';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    getStateHistory: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.getStateHistory.mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 15, total: 0, totalPages: 1 },
  });
});

test('searches history records and uses the renamed states in the filter', async () => {
  render(<HistoryPage />);

  const search = screen.getByRole('searchbox', { name: 'Tìm trong lịch sử' });
  fireEvent.change(search, { target: { value: 'phòng 201' } });

  await waitFor(() => {
    expect(api.getStateHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'phòng 201', page: 1 })
    );
  });

  const stateFilter = screen.getByRole('combobox', { name: 'Trạng thái đến' });
  expect(stateFilter).toHaveTextContent('Chờ khách');
  expect(stateFilter).toHaveTextContent('Có khách');
  expect(stateFilter).not.toHaveTextContent('Check-in');
  expect(screen.queryByRole('button', { name: 'Lọc' })).not.toBeInTheDocument();
});

test('applies date, state and page-size filters immediately', async () => {
  render(<HistoryPage />);

  fireEvent.change(screen.getByLabelText('Từ ngày'), {
    target: { value: '2026-11-01' },
  });
  fireEvent.change(screen.getByLabelText('Đến ngày'), {
    target: { value: '2026-11-05' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Trạng thái đến' }), {
    target: { value: 'Có khách' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Số bản ghi' }), {
    target: { value: '50' },
  });

  await waitFor(() => {
    expect(api.getStateHistory).toHaveBeenLastCalledWith({
      page: 1,
      limit: 50,
      state: 'Có khách',
      search: undefined,
      startDate: '2026-11-01',
      endDate: '2026-11-05',
    });
  });
});

test('shows history date and time in separate columns without the floor column', async () => {
  api.getStateHistory.mockResolvedValue({
    data: [{
      id: 1,
      timestamp: '2026-11-05T05:30:00.000Z',
      room: '201',
      floor: 2,
      previous_state: 'Trống',
      new_state: 'Có khách',
      message: 'Khách vào phòng',
    }],
    pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
  });

  render(<HistoryPage />);

  expect(await screen.findByText('05/11/2026')).toBeInTheDocument();
  expect(screen.getByText('12:30:00')).toBeInTheDocument();
  expect(screen.getByText('Ngày')).toBeInTheDocument();
  expect(screen.getByText('Giờ')).toBeInTheDocument();
  expect(screen.queryByText('Tầng')).not.toBeInTheDocument();
});

test('shows direct page buttons and loads the selected history page', async () => {
  api.getStateHistory.mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 15, total: 45, totalPages: 3 },
  });
  render(<HistoryPage />);

  const pageButton = await screen.findByRole('button', { name: 'Trang 3' });
  fireEvent.click(pageButton);

  await waitFor(() => {
    expect(api.getStateHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 })
    );
  });
});
