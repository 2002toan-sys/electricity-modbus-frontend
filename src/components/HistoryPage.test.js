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
  render(<HistoryPage rooms={[{ room: 201 }]} />);

  const search = screen.getByRole('searchbox', { name: 'Tìm trong lịch sử' });
  fireEvent.change(search, { target: { value: 'phòng 201' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lọc' }));

  await waitFor(() => {
    expect(api.getStateHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'phòng 201', page: 1 })
    );
  });

  const stateFilter = screen.getByRole('combobox', { name: 'Trạng thái đến' });
  expect(stateFilter).toHaveTextContent('Chờ khách');
  expect(stateFilter).toHaveTextContent('Có khách');
  expect(stateFilter).not.toHaveTextContent('Check-in');
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
