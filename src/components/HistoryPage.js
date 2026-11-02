import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Building,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { getStateColor } from '../utils/constants';

const STATE_OPTIONS = [
  'Trống',
  'Check-in',
  'Vào phòng',
  'Dùng thẻ',
  'Sửa chữa'
];

const HistoryPage = ({ rooms = [] }) => {
  // Filter States
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data States
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });

  const fetchHistory = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: 15,
        room: selectedRoom !== 'all' ? selectedRoom : undefined,
        state: selectedState !== 'all' ? selectedState : undefined,
        startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined
      };

      const res = await api.getStateHistory(params);
      setHistoryList(res.data || []);
      setPagination(res.pagination || { page: targetPage, limit: 15, total: 0, totalPages: 1 });
      setPage(targetPage);
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
      setHistoryList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, selectedState, startDate, endDate]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const handleResetFilter = () => {
    setSelectedRoom('all');
    setSelectedState('all');
    setStartDate('');
    setEndDate('');
    // Trigger reset with page 1
    setTimeout(() => {
      fetchHistory(1);
    }, 0);
  };

  const roomOptions = [...new Set(rooms.map(r => r.room.toString()))].sort();

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">Lịch sử & Báo cáo</h2>
            <p className="text-xs text-slate-400">Theo dõi sự kiện và thay đổi trạng thái các phòng</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm flex-shrink-0">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
          {/* Lọc phòng */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Chọn phòng
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả các phòng</option>
              {roomOptions.map((rm) => (
                <option key={rm} value={rm}>Phòng {rm}</option>
              ))}
            </select>
          </div>

          {/* Lọc trạng thái mới */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Trạng thái đến
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              {STATE_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Từ ngày */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nút lọc & Đặt lại */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              Lọc
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm font-medium">Đang tải lịch sử chuyển đổi...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
              <History className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Không tìm thấy bản ghi lịch sử nào</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi điều kiện lọc hoặc thời gian tra cứu</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-3">Phòng</th>
                    <th className="py-3 px-3">Tầng</th>
                    <th className="py-3 px-4">Chuyển trạng thái</th>
                    <th className="py-3 px-4">Nội dung chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {historyList.map((item) => {
                    const prevColors = getStateColor(item.previous_state).notif;
                    const newColors = getStateColor(item.new_state).notif;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Thời gian */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                          {new Date(item.timestamp).toLocaleString('vi-VN')}
                        </td>

                        {/* Phòng */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {item.room}
                          </span>
                        </td>

                        {/* Tầng */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-medium">
                          Tầng {item.floor || item.room?.toString()?.charAt(0)}
                        </td>

                        {/* Chuyển đổi trạng thái */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] border ${prevColors.bg} ${prevColors.text} ${prevColors.border}`}>
                              {item.previous_state || 'Không xác định'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${newColors.bg} ${newColors.text} ${newColors.border}`}>
                              {item.new_state || 'Không xác định'}
                            </span>
                          </div>
                        </td>

                        {/* Nội dung thông báo */}
                        <td className="py-3 px-4 text-slate-600 font-medium break-words">
                          {item.message}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 flex-shrink-0">
            <div>
              Tổng số <span className="font-bold text-slate-800">{pagination.total}</span> sự kiện
              (Trang <span className="font-bold text-slate-800">{pagination.page}</span> / {pagination.totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchHistory(page - 1)}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Trước
              </button>

              <span className="px-3 py-1.5 font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
                {page}
              </span>

              <button
                onClick={() => fetchHistory(page + 1)}
                disabled={page >= pagination.totalPages || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
