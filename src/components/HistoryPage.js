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
  ArrowRight,
  Search
} from 'lucide-react';
import api from '../services/api';
import { getStateColor, ROOM_STATES } from '../utils/constants';

const getPageItems = (currentPage, totalPages) => {
  const pages = new Set([1, totalPages]);
  for (let pageNumber = currentPage - 1; pageNumber <= currentPage + 1; pageNumber += 1) {
    if (pageNumber > 1 && pageNumber < totalPages) pages.add(pageNumber);
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  return sortedPages.flatMap((pageNumber, index) => {
    const previousPage = sortedPages[index - 1];
    if (index > 0 && pageNumber - previousPage > 1) {
      return [`ellipsis-${previousPage}-${pageNumber}`, pageNumber];
    }
    return [pageNumber];
  });
};

const HistoryPage = ({ rooms = [] }) => {
  // Filter States
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  const fetchHistory = useCallback(async (targetPage = 1, searchOverride = debouncedSearch) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: 15,
        room: selectedRoom !== 'all' ? selectedRoom : undefined,
        state: selectedState !== 'all' ? selectedState : undefined,
        search: searchOverride || undefined,
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
  }, [selectedRoom, selectedState, startDate, endDate, debouncedSearch]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setDebouncedSearch(search.trim());
    fetchHistory(1, search.trim());
  };

  const handleResetFilter = () => {
    setSelectedRoom('all');
    setSelectedState('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setDebouncedSearch('');
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
        <form onSubmit={handleApplyFilter}>
          <label className="mb-3 block text-xs font-semibold text-slate-600">
            Tìm trong lịch sử
            <span className="relative mt-1 block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm phòng, trạng thái, nội dung..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </span>
          </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
              {/* Lọc phòng */}
              <div>
                <label htmlFor="history-room-filter" className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Chọn phòng
                </label>
                <select
                  id="history-room-filter"
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
                <label htmlFor="history-state-filter" className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Trạng thái đến
                </label>
                <select
                  id="history-state-filter"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  {ROOM_STATES.map(({ name }) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Từ ngày */}
              <div>
                <label htmlFor="history-start-date" className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Từ ngày
                </label>
                <input
                  id="history-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Đến ngày */}
              <div>
                <label htmlFor="history-end-date" className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Đến ngày
                </label>
                <input
                  id="history-end-date"
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
                type="button"
                onClick={() => fetchHistory(page - 1)}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Trước
              </button>

              <div className="flex items-center gap-1">
                {getPageItems(page, pagination.totalPages).map((item) => (
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      aria-label={`Trang ${item}`}
                      aria-current={item === page ? 'page' : undefined}
                      onClick={() => fetchHistory(item)}
                      disabled={item === page || loading}
                      className={`min-w-8 rounded-lg border px-2.5 py-1.5 font-semibold transition-colors disabled:cursor-default ${
                        item === page
                          ? 'border-blue-200 bg-blue-50 text-blue-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40'
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} aria-hidden="true" className="px-1 text-slate-400">…</span>
                  )
                ))}
              </div>

              <button
                type="button"
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
