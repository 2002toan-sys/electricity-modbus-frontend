import React from 'react';
import { Bell, Check } from 'lucide-react';
import { getStateColor } from '../utils/constants';

const NotificationPanel = ({ notifications, onMarkAsRead, onClearAll }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Thông báo ({notifications.filter(n => !n.read).length})
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="space-y-2 overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Chưa có thông báo</p>
        ) : (
          notifications.map((notif) => {
            const colors = getStateColor(notif.stateName).notif;
            const isRead = notif.read;
            return (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer ${
                  isRead
                    ? 'bg-gray-50 border-gray-300'
                    : `${colors.bg} ${colors.border} shadow-sm hover:shadow-md`
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm ${isRead ? 'text-gray-600' : `${colors.text} font-medium`}`}>
                      {notif.message}
                      {!isRead && (
                        <span className={`ml-2 inline-block w-2 h-2 rounded-full ${colors.dot}`}></span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {!isRead && (
                    <div className="flex-shrink-0">
                      <Check className="w-4 h-4" style={{ color: getStateColor(notif.stateName).hex }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
