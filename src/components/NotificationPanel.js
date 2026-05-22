import React, { useState, useMemo } from 'react';
import { Bell, Check, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getStateColor } from '../utils/constants';

const PAGE_SIZE = 10;

const NotificationPanel = ({ notifications, onMarkAsRead, onClearAll }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter(
      (n) =>
        n.message?.toLowerCase().includes(q) ||
        n.room?.toString().includes(q) ||
        n.stateName?.toLowerCase().includes(q)
    );
  }, [notifications, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-bold flex items-center gap-2 text-slate-800">
          <Bell className="w-5 h-5 text-blue-500" />
          Thông báo
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={() => { onClearAll(); setPage(1); }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
            title="Xóa tất cả"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Tìm kiếm phòng, trạng thái..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {paginated.length === 0 ? (
          <p className="text-slate-400 text-center py-10 text-sm">
            {search ? 'Không tìm thấy thông báo phù hợp' : 'Chưa có thông báo'}
          </p>
        ) : (
          paginated.map((notif) => {
            const colors = getStateColor(notif.stateName).notif;
            const isRead = notif.read;
            return (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer select-none ${
                  isRead
                    ? 'bg-gray-50 border-gray-300'
                    : `${colors.bg} ${colors.border} shadow-sm hover:shadow-md`
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm break-words ${isRead ? 'text-gray-600' : `${colors.text} font-medium`}`}>
                      {notif.message}
                      {!isRead && (
                        <span className={`ml-2 inline-block w-2 h-2 rounded-full ${colors.dot}`} />
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {!isRead && (
                    <div className="flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" style={{ color: getStateColor(notif.stateName).hex }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {filtered.length} thông báo &middot; Trang {safePage}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
